# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Fit the configured detector on healthy astronauts and build the healthy reference distribution.

detector: drift        → multivariate personal-drift model (production; src/drift.py)
detector: autoencoder  → dense autoencoder (alternative kept for the benchmark)

Usage:
    python -m src.train --config config/model.yaml            # device from config (auto)
    python -m src.train --device cuda                          # force GPU
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import random
import time

import numpy as np

from src.common import (CONFIG_DIR, MODELS_DIR, RESULTS_DIR, config_hash, load_yaml, val, write_json)
from src.features import crew_windows
from src.drift import drift_scores, fit_drift, window_summary
from src.scoring import combined_score, day_weights, latent_calibration, latent_codes, raw_components
from src.simulate import load_split


# ===== Reproducibility =====
def set_seed(seed: int) -> None:
    """Seed every random generator used during training."""
    import torch

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


# ===== Training =====
def stack(windows: list, min_day: int = 0) -> tuple[np.ndarray, np.ndarray]:
    """Concatenate windows of many astronauts, keeping windows that end on or after `min_day`."""
    xs, ms = [], []
    for aw in windows:
        keep = aw.window_days >= min_day
        xs.append(aw.x[keep])
        ms.append(aw.m[keep])
    return np.concatenate(xs).astype(np.float32), np.concatenate(ms).astype(np.float32)


def train_autoencoder(x_tr: np.ndarray, m_tr: np.ndarray, x_va: np.ndarray, m_va: np.ndarray,
                      model_cfg: dict, device) -> tuple:
    """Mini-batch Adam training with early stopping on the validation loss (needs PyTorch)."""
    import torch

    from src.model import Autoencoder, masked_mse
    arch, tr = model_cfg["architecture"], model_cfg["training"]
    set_seed(int(tr["seed"]))
    model = Autoencoder(x_tr.shape[1], arch["hidden"], arch["bottleneck"], arch["dropout"]).to(device)
    optimiser = torch.optim.Adam(model.parameters(), lr=float(tr["lr"]))
    xt, mt = torch.from_numpy(x_tr).to(device), torch.from_numpy(m_tr).to(device)
    xv, mv = torch.from_numpy(x_va).to(device), torch.from_numpy(m_va).to(device)
    generator = torch.Generator().manual_seed(int(tr["seed"]))
    batch, history = int(tr["batch_size"]), []
    best_loss, best_state, waited = float("inf"), None, 0

    for epoch in range(1, int(tr["max_epochs"]) + 1):
        model.train()
        order = torch.randperm(len(xt), generator=generator).to(device)
        total = 0.0
        for start in range(0, len(order), batch):
            idx = order[start:start + batch]
            optimiser.zero_grad()
            loss = masked_mse(model(xt[idx]), xt[idx], mt[idx])
            loss.backward()
            optimiser.step()
            total += loss.item() * len(idx)
        model.eval()
        with torch.no_grad():
            val_loss = float(masked_mse(model(xv), xv, mv))
        history.append({"epoch": epoch, "train_loss": total / len(xt), "val_loss": val_loss})
        if val_loss < best_loss - 1e-6:
            best_loss, waited = val_loss, 0
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        else:
            waited += 1
            if waited >= int(tr["patience"]):
                break

    model.load_state_dict(best_state)
    return model.cpu().eval(), history


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the Astrobalance autoencoder.")
    parser.add_argument("--config", default=str(CONFIG_DIR / "model.yaml"))
    parser.add_argument("--sim-config", default=str(CONFIG_DIR / "simulation.yaml"))
    parser.add_argument("--device", default=None, help="auto | cpu | cuda (overrides the config).")
    args = parser.parse_args()

    model_cfg = load_yaml(args.config)
    sim_cfg = load_yaml(args.sim_config)
    window = int(model_cfg["window_days"])
    calib = int(val(sim_cfg["mission"]["calibration_days"]))
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if model_cfg.get("detector") == "drift":
        drift_cfg = model_cfg["drift"]
        weights = day_weights(model_cfg)
        train_w = crew_windows(load_split(drift_cfg["train_split"]), sim_cfg, window)
        x_tr, _ = stack(train_w)
        drift_model = fit_drift(window_summary(x_tr, weights), float(drift_cfg["regularisation"]))
        drift_model.update({"model_config_hash": config_hash(model_cfg), "sim_config_hash": config_hash(sim_cfg),
                            "train_split": drift_cfg["train_split"], "train_windows": int(len(x_tr))})
        write_json(MODELS_DIR / "drift_model.json", drift_model)
        x_ref, _ = stack(crew_windows(load_split("val"), sim_cfg, window), min_day=calib + 1)
        ref_scores = drift_scores(window_summary(x_ref, weights), drift_model)
        np.save(MODELS_DIR / "reference_scores.npy", np.sort(ref_scores))
        write_json(RESULTS_DIR / "training_log.json", {"detector": "drift", "train_windows": int(len(x_tr)),
                                                       "reference_windows": int(len(ref_scores))})
        print(f"Fitted drift detector on {len(x_tr)} healthy windows ({drift_cfg['train_split']}); "
              f"reference = {len(ref_scores)} validation windows.")
        raise SystemExit(0)

    # ----- Alternative detector: autoencoder (PyTorch) -----
    from src.model import pick_device, save_model

    device = pick_device(args.device or model_cfg["training"].get("device", "auto"))

    train_w = crew_windows(load_split("train"), sim_cfg, window)
    val_w = crew_windows(load_split("val"), sim_cfg, window)
    x_tr, m_tr = stack(train_w)
    x_va, m_va = stack(val_w)

    t0 = time.time()
    ae, log = train_autoencoder(x_tr, m_tr, x_va, m_va, model_cfg, device)
    seconds = time.time() - t0

    # Score calibration on healthy TRAINING windows: latent distribution and component normalisers.
    weights = day_weights(model_cfg)
    calibration = latent_calibration(latent_codes(ae, x_tr))
    train_comps = raw_components(ae, x_tr, m_tr, weights, calibration)
    for name, values in train_comps.items():
        calibration[f"{name}_norm"] = float(values.mean())
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(MODELS_DIR / "score_calibration.json", calibration)

    # Healthy reference distribution: validation windows after the calibration period
    # (out-of-sample for the personal normalisation, like real monitoring days).
    x_ref, m_ref = stack(val_w, min_day=calib + 1)
    ref_scores = combined_score(raw_components(ae, x_ref, m_ref, weights, calibration),
                                calibration, model_cfg["scoring"]["components"])
    np.save(MODELS_DIR / "reference_scores.npy", np.sort(ref_scores))

    meta = {"n_inputs": int(x_tr.shape[1]), **model_cfg["architecture"],
            "model_config_hash": config_hash(model_cfg), "sim_config_hash": config_hash(sim_cfg)}
    save_model(ae, MODELS_DIR / "ae.pt", meta)
    write_json(RESULTS_DIR / "training_log.json", {
        "device": str(device), "seconds": round(seconds, 2), "train_windows": int(len(x_tr)),
        "val_windows": int(len(x_va)), "reference_windows": int(len(ref_scores)),
        "epochs_run": len(log), "best_val_loss": min(h["val_loss"] for h in log), "history": log})
    print(f"Trained on {len(x_tr)} windows ({device}, {seconds:.1f} s, {len(log)} epochs); "
          f"best val loss {min(h['val_loss'] for h in log):.4f}; reference = {len(ref_scores)} windows.")
