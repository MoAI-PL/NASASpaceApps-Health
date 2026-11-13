# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Model-selection benchmark: every method compared at the SAME false-alarm budget.

Protocol (no hold-out data is touched):
1. Selection split `bench` (new seeds 4000-4129: 30 astronauts per scenario S1-S3 + 40 healthy),
   at scenario sizes × 0.5 and × 1.0.
2. For every method, the alarm threshold is set on the healthy days of `bench` so that the method
   produces at most `budget` false alarms per astronaut-week (budgets 0.05 and 0.10).
3. Primary metric: early-detection rate = share of scenario astronauts alarmed within 21 days of onset,
   averaged over S1-S3 and both sizes, at the 0.05 budget.
4. The winner is confirmed on the original dev split (independent seeds) with the thresholds frozen.

Usage:
    python -m src.benchmark                 # train variants (cached) and benchmark all methods
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import copy
import json
import time
from statistics import median

import numpy as np
import torch

from src.baselines import b1_alarm
from src.common import (AE_FEATURES, CONFIG_DIR, INDICATORS, MODELS_DIR, RESULTS_DIR, load_yaml, val,
                        write_json)
from src.features import crew_windows
from src.model import Autoencoder, load_model, masked_mse, save_model
from src.scoring import day_weights, latent_calibration, latent_codes, raw_components
from src.simulate import build_split, load_split
from src.train import stack, train_autoencoder

# ===== Constants =====
BENCH_DIR = MODELS_DIR / "bench"
BUDGETS = [0.05, 0.10]
EARLY_DAYS = 21
SCALES = [0.5, 1.0]
SCENARIOS = ["S1", "S2", "S3"]


# ===== Fast alarm logic =====
def fast_persistent(hit: np.ndarray, k: int) -> np.ndarray:
    """Vectorised persistence: True when `hit` held on the last k consecutive days."""
    out = hit.copy()
    for lag in range(1, k):
        shifted = np.zeros_like(hit)
        shifted[lag:] = hit[:-lag]
        out &= shifted
    return out


class Population:
    """Daily scores of one split for one method, plus the ground truth needed for metrics."""

    def __init__(self, crews: list[dict], scores: list[np.ndarray], calib_days: int) -> None:
        self.crews = crews
        self.scores = [np.nan_to_num(s, nan=-np.inf) for s in scores]
        self.calib = calib_days

    def alarms(self, thr: float, k: int) -> list[np.ndarray]:
        return [fast_persistent(s >= thr, k) for s in self.scores]

    def false_alarm_rate(self, flags: list[np.ndarray]) -> float:
        onsets, days = 0, 0
        for c, f in zip(self.crews, flags):
            d = c["days"]
            end = c["start"] if c["scenario"] != "none" else d.max() + 1
            keep = (d > self.calib) & (d < end)
            rising = f & ~np.concatenate([[False], f[:-1]])
            onsets += int((rising & keep).sum())
            days += int(keep.sum())
        return onsets / (days / 7.0)

    def detection(self, flags: list[np.ndarray]) -> dict:
        out = {}
        for s in sorted({c["scenario"] for c in self.crews} - {"none"}):
            delays = []
            for c, f in zip(self.crews, flags):
                if c["scenario"] != s:
                    continue
                hits = c["days"][(c["days"] >= c["start"]) & f]
                delays.append(int(hits[0] - c["start"]) if len(hits) else None)
            det = [x for x in delays if x is not None]
            out[s] = {"detected": round(len(det) / len(delays), 3),
                      "early": round(sum(x <= EARLY_DAYS for x in det) / len(delays), 3),
                      "median_delay": float(median(det)) if det else None}
        return out


def threshold_for_budget(pops: list[Population], k: int, budget: float) -> float:
    """Lowest threshold whose false-alarm rate (pooled over the given populations) is within budget."""
    healthy = np.concatenate([s[np.isfinite(s)] for p in pops for s in p.scores])
    candidates = np.unique(np.quantile(healthy, np.linspace(0.5, 0.99995, 400)))
    lo, hi = 0, len(candidates) - 1
    if pooled_fa(pops, candidates[hi], k) > budget:
        return float(candidates[hi] * 1.5 + 1e-9)
    while lo < hi:                         # FA is non-increasing in the threshold
        mid = (lo + hi) // 2
        if pooled_fa(pops, candidates[mid], k) <= budget:
            hi = mid
        else:
            lo = mid + 1
    return float(candidates[lo])


def pooled_fa(pops: list[Population], thr: float, k: int) -> float:
    """False-alarm rate pooled across populations (healthy days are identical across scales)."""
    return pops[0].false_alarm_rate(pops[0].alarms(thr, k))


# ===== Crew ground truth =====
def crew_truth(crew) -> list[dict]:
    out = []
    for _, frame in crew.groupby("astronaut", sort=False):
        frame = frame.sort_values("day")
        out.append({"astronaut": frame["astronaut"].iloc[0], "scenario": frame["scenario"].iloc[0],
                    "start": int(frame["scenario_start"].iloc[0]), "days": frame["day"].to_numpy(),
                    "frame": frame})
    return out


# ===== Score functions =====
def pad(values: np.ndarray, n: int, window: int) -> np.ndarray:
    out = np.full(n, np.nan)
    out[window - 1:] = values
    return out


def smooth(score: np.ndarray, days: int) -> np.ndarray:
    """Trailing mean over `days` (NaN-aware); days = 1 returns the score unchanged."""
    if days <= 1:
        return score
    out = np.full_like(score, np.nan)
    for t in range(len(score)):
        block = score[max(0, t - days + 1):t + 1]
        if np.isfinite(block).any():
            out[t] = np.nanmean(block)
    return out


def b2_score(windows) -> list[np.ndarray]:
    """Personal single-indicator score: max |z| over the 8 indicators (observed values only)."""
    idx = [AE_FEATURES.index(f) for f in INDICATORS]
    return [np.max(np.abs(aw.z[:, idx]) * (aw.mask[:, idx] > 0), axis=1) for aw in windows]


def mahalanobis_fit(x: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    mean = x.mean(axis=0)
    cov = np.cov(x, rowvar=False) + 1e-2 * np.eye(x.shape[1])
    return mean, np.linalg.inv(cov)


def mahalanobis(x: np.ndarray, fit) -> np.ndarray:
    d = x - fit[0]
    return np.einsum("ij,jk,ik->i", d, fit[1], d)


def window_mean(aw, weights: np.ndarray) -> np.ndarray:
    """Weighted 7-day mean of personal z-scores per feature (drift summary), shape (N, 9)."""
    x = aw.x.reshape(len(aw.x), len(weights), len(AE_FEATURES))
    return (x * weights[None, :, None]).sum(axis=1)


# ===== Autoencoder variants =====
def train_variant(name: str, model_cfg: dict, sim_cfg: dict, train_split: str, retrain: bool) -> tuple:
    """Train (or load from cache) one autoencoder variant; returns (model, calibration)."""
    path = BENCH_DIR / f"{name}.pt"
    window = int(model_cfg["window_days"])
    if path.exists() and not retrain:
        model, meta = load_model(path)
        return model, meta["calibration"]
    tr = crew_windows(load_split(train_split), sim_cfg, window)
    va = crew_windows(load_split("val"), sim_cfg, window)
    x_tr, m_tr = stack(tr)
    x_va, m_va = stack(va)
    t0 = time.time()
    model, log = train_autoencoder(x_tr, m_tr, x_va, m_va, model_cfg, torch.device("cpu"))
    w = day_weights(model_cfg)
    calibration = latent_calibration(latent_codes(model, x_tr))
    for comp, values in raw_components(model, x_tr, m_tr, w, calibration).items():
        calibration[f"{comp}_norm"] = float(values.mean())
    save_model(model, path, {"n_inputs": int(x_tr.shape[1]), **model_cfg["architecture"],
                             "calibration": calibration, "epochs": len(log), "seconds": round(time.time() - t0, 1)})
    print(f"  trained {name}: {len(x_tr)} windows, {len(log)} epochs, {time.time() - t0:.0f} s", flush=True)
    return model, calibration


def ae_components(model, calibration, windows, model_cfg) -> list[dict]:
    """Normalised reconstruction and latent components per astronaut (padded to mission days)."""
    w = day_weights(model_cfg)
    window = int(model_cfg["window_days"])
    out = []
    for aw in windows:
        comps = raw_components(model, aw.x, aw.m, w, calibration)
        out.append({c: pad(v / calibration[f"{c}_norm"], len(aw.days), window) for c, v in comps.items()})
    return out


def personal_finetune(model, aw, calib_days: int, window: int, epochs: int, lr: float) -> Autoencoder:
    """Fine-tune a copy of the population model on ONE astronaut's calibration windows."""
    personal = copy.deepcopy(model)
    keep = aw.window_days <= calib_days
    x = torch.from_numpy(aw.x[keep].astype(np.float32))
    m = torch.from_numpy(aw.m[keep].astype(np.float32))
    opt = torch.optim.Adam(personal.parameters(), lr=lr)
    torch.manual_seed(0)
    personal.train()
    for _ in range(epochs):
        opt.zero_grad()
        loss = masked_mse(personal(x), x, m)
        loss.backward()
        opt.step()
    personal.eval()
    return personal


# ===== Benchmark =====
def evaluate_method(name: str, score_fn, splits: dict, ks=(2, 3)) -> list[dict]:
    """Benchmark one score function at every budget and persistence; returns result rows."""
    pops = {scale: Population(splits[scale]["truth"], score_fn(splits[scale]), splits["calib"]) for scale in SCALES}
    rows = []
    for k in ks:
        for budget in BUDGETS:
            thr = threshold_for_budget([pops[1.0]], k, budget)
            per_scale = {}
            for scale in SCALES:
                flags = pops[scale].alarms(thr, k)
                per_scale[str(scale)] = pops[scale].detection(flags)
            fa = pops[1.0].false_alarm_rate(pops[1.0].alarms(thr, k))
            early = np.mean([per_scale[str(s)][sc]["early"] for s in SCALES for sc in SCENARIOS])
            det = np.mean([per_scale[str(s)][sc]["detected"] for s in SCALES for sc in SCENARIOS])
            delays = [per_scale[str(s)][sc]["median_delay"] for s in SCALES for sc in SCENARIOS]
            rows.append({"method": name, "persistence": k, "budget": budget, "threshold": thr,
                         "false_alarms_per_week": round(fa, 3), "early_detection": round(float(early), 3),
                         "detection": round(float(det), 3),
                         "mean_median_delay": round(float(np.mean([d for d in delays if d is not None])), 1),
                         "by_scale": per_scale})
    return rows


def b1_row(splits: dict) -> dict:
    """Fixed clinical thresholds: one operating point (no threshold to tune)."""
    rules = load_yaml(CONFIG_DIR / "rules.yaml")
    per_scale, fa = {}, None
    for scale in SCALES:
        truth = splits[scale]["truth"]
        flags = [b1_alarm(c["frame"], rules) for c in truth]
        pop = Population(truth, [np.zeros(len(c["days"])) for c in truth], splits["calib"])
        per_scale[str(scale)] = pop.detection(flags)
        if scale == 1.0:
            fa = pop.false_alarm_rate(flags)
    early = np.mean([per_scale[str(s)][sc]["early"] for s in SCALES for sc in SCENARIOS])
    det = np.mean([per_scale[str(s)][sc]["detected"] for s in SCALES for sc in SCENARIOS])
    delays = [per_scale[str(s)][sc]["median_delay"] for s in SCALES for sc in SCENARIOS]
    return {"method": "B1 fixed clinical thresholds", "persistence": "rule", "budget": "fixed", "threshold": None,
            "false_alarms_per_week": round(fa, 3), "early_detection": round(float(early), 3),
            "detection": round(float(det), 3),
            "mean_median_delay": round(float(np.mean([d for d in delays if d is not None])), 1), "by_scale": per_scale}


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark all methods at equal false-alarm budgets.")
    parser.add_argument("--retrain", action="store_true")
    args = parser.parse_args()

    sim_cfg = load_yaml(CONFIG_DIR / "simulation.yaml")
    base_cfg = load_yaml(CONFIG_DIR / "model.yaml")
    calib = int(val(sim_cfg["mission"]["calibration_days"]))
    BENCH_DIR.mkdir(parents=True, exist_ok=True)

    # --- Selection data (bench split at two scenario sizes) ---
    splits: dict = {"calib": calib}
    for scale in SCALES:
        crew, _ = build_split(sim_cfg, "bench", scale)
        splits[scale] = {"crew": crew, "truth": crew_truth(crew)}
    val_crew = load_split("val")

    # --- Autoencoder variants ---
    def cfg_with(window=7, bottleneck=8, hidden=32, seed=7, batch=64):
        c = copy.deepcopy(base_cfg)
        c["window_days"], c["architecture"]["bottleneck"], c["architecture"]["hidden"] = window, bottleneck, hidden
        c["training"]["seed"], c["training"]["batch_size"] = seed, batch
        c["scoring"]["day_weights"] = list(range(1, window + 1))
        return c

    variants = {
        "ae_w7_b8_train60": (cfg_with(), "train"),
        "ae_w7_b8_train300": (cfg_with(batch=128), "train_large"),
        "ae_w7_b4_train300": (cfg_with(bottleneck=4, batch=128), "train_large"),
        "ae_w7_b16_train300": (cfg_with(bottleneck=16, hidden=64, batch=128), "train_large"),
        "ae_w14_b8_train300": (cfg_with(window=14, hidden=64, batch=128), "train_large"),
    }
    for seed in [11, 23, 37, 51]:
        variants[f"ae_w7_b8_train300_seed{seed}"] = (cfg_with(seed=seed, batch=128), "train_large")

    trained = {}
    for name, (cfg, split) in variants.items():
        trained[name] = (train_variant(name, cfg, sim_cfg, split, args.retrain), cfg)

    # Windows per window length, per scale (cached).
    win_cache: dict = {}

    def windows(scale, window):
        key = (scale, window)
        if key not in win_cache:
            crew = splits[scale]["crew"] if scale != "val" else val_crew
            win_cache[key] = crew_windows(crew, sim_cfg, window)
        return win_cache[key]

    comp_cache: dict = {}

    def components(name, scale):
        key = (name, scale)
        if key not in comp_cache:
            (model, calibration), cfg = trained[name]
            comp_cache[key] = ae_components(model, calibration, windows(scale, int(cfg["window_days"])), cfg)
        return comp_cache[key]

    def ae_score(name, use=("reconstruction", "latent"), smooth_days=1):
        def fn(split_entry):
            scale = 1.0 if split_entry is splits[1.0] else 0.5
            return [smooth(sum(c[u] for u in use), smooth_days) for c in components(name, scale)]
        return fn

    def ensemble_score(names, smooth_days=1):
        def fn(split_entry):
            scale = 1.0 if split_entry is splits[1.0] else 0.5
            per_model = [[c["reconstruction"] + c["latent"] for c in components(n, scale)] for n in names]
            return [smooth(np.mean([pm[i] for pm in per_model], axis=0), smooth_days) for i in range(len(per_model[0]))]
        return fn

    def scale_of(split_entry):
        return 1.0 if split_entry is splits[1.0] else 0.5

    def b2_fn(smooth_days=1):
        return lambda e: [smooth(s, smooth_days) for s in b2_score(windows(scale_of(e), 7))]

    # Classical multivariate baselines fitted on healthy training windows.
    tr300_7 = crew_windows(load_split("train_large"), sim_cfg, 7)
    x300, _ = stack(tr300_7)
    w7 = np.arange(1, 8) / 28.0
    fit_window = mahalanobis_fit(x300)
    fit_mean = mahalanobis_fit(np.concatenate([window_mean(aw, w7) for aw in tr300_7]))

    tr300_14 = crew_windows(load_split("train_large"), sim_cfg, 14)
    w14 = np.arange(1, 15) / 105.0
    fit_mean14 = mahalanobis_fit(np.concatenate([window_mean(aw, w14) for aw in tr300_14]))

    def maha_mean14():
        return lambda e: [pad(mahalanobis(window_mean(aw, w14), fit_mean14), len(aw.days), 14)
                          for aw in windows(scale_of(e), 14)]

    def combined_maha_ae(names):
        """Sum of the drift statistic and the AE-ensemble score, each divided by its healthy-train mean."""
        maha_norm = float(mahalanobis(np.concatenate([window_mean(aw, w7) for aw in tr300_7]), fit_mean).mean())

        def fn(e):
            maha = maha_mean()(e)
            ae = ensemble_score(names)(e)
            return [m / maha_norm + a / 2.0 for m, a in zip(maha, ae)]
        return fn

    def maha_window(smooth_days=1):
        return lambda e: [smooth(pad(mahalanobis(aw.x, fit_window), len(aw.days), 7), smooth_days)
                          for aw in windows(scale_of(e), 7)]

    def maha_mean(smooth_days=1):
        return lambda e: [smooth(pad(mahalanobis(window_mean(aw, w7), fit_mean), len(aw.days), 7), smooth_days)
                          for aw in windows(scale_of(e), 7)]

    # Hybrid: max of the AE and B2 percentiles, both against healthy validation days.
    def percentile_map(scores_val: list[np.ndarray]):
        ref = np.sort(np.concatenate([s[np.isfinite(s)][calib:] for s in scores_val]))
        return lambda s: np.where(np.isfinite(s), np.searchsorted(ref, s, side="right") / len(ref), np.nan)

    def hybrid(name, smooth_days=1):
        (model, calibration), cfg = trained[name]
        val_ae = [c["reconstruction"] + c["latent"] for c in ae_components(model, calibration, windows("val", 7), cfg)]
        val_b2 = b2_score(windows("val", 7))
        map_ae, map_b2 = percentile_map([smooth(s, smooth_days) for s in val_ae]), percentile_map(val_b2)

        def fn(e):
            ae = ae_score(name, smooth_days=smooth_days)(e)
            b2 = b2_score(windows(scale_of(e), 7))
            return [np.fmax(map_ae(a), map_b2(b)) for a, b in zip(ae, b2)]
        return fn

    # Personal fine-tuning (population AE adapted to each astronaut's calibration windows).
    def finetuned(name, epochs=40, lr=3e-4):
        (model, calibration), cfg = trained[name]
        w = day_weights(cfg)
        cache: dict = {}

        def fn(e):
            scale = scale_of(e)
            if scale not in cache:
                out = []
                for aw in windows(scale, 7):
                    personal = personal_finetune(model, aw, calib, 7, epochs, lr)
                    rec = raw_components(personal, aw.x, aw.m, w, None)["reconstruction"] / calibration["reconstruction_norm"]
                    lat = raw_components(model, aw.x, aw.m, w, calibration)["latent"] / calibration["latent_norm"]
                    out.append(pad(rec + lat, len(aw.days), 7))
                cache[scale] = out
            return cache[scale]
        return fn

    best300 = "ae_w7_b8_train300"
    ens = [best300] + [f"{best300}_seed{s}" for s in [11, 23, 37, 51]]
    methods = {
        "B2 personal single-indicator (max |z|)": b2_fn(),
        "B2 personal single-indicator, 3-day smoothed": b2_fn(3),
        "Classical Mahalanobis, 7-day window": maha_window(),
        "Classical Mahalanobis, 7-day mean (drift)": maha_mean(),
        "Classical Mahalanobis, 7-day mean, 3-day smoothed": maha_mean(3),
        "AE v2 (current: w7 b8, 60 train)": ae_score("ae_w7_b8_train60"),
        "AE w7 b8, 300 train": ae_score(best300),
        "AE w7 b8, 300 train, reconstruction only": ae_score(best300, ("reconstruction",)),
        "AE w7 b8, 300 train, latent only": ae_score(best300, ("latent",)),
        "AE w7 b4, 300 train": ae_score("ae_w7_b4_train300"),
        "AE w7 b16, 300 train": ae_score("ae_w7_b16_train300"),
        "AE w14 b8, 300 train": ae_score("ae_w14_b8_train300"),
        "AE w7 b8, 300 train, 3-day smoothed": ae_score(best300, smooth_days=3),
        "AE w7 b8, 300 train, 5-day smoothed": ae_score(best300, smooth_days=5),
        "AE ensemble x5, 300 train": ensemble_score(ens),
        "AE ensemble x5, 300 train, 3-day smoothed": ensemble_score(ens, 3),
        "AE w7 b8, 300 train + personal fine-tuning": finetuned(best300),
        "Classical Mahalanobis, 14-day mean (drift)": maha_mean14(),
        "Combined: Mahalanobis 7-day mean + AE ensemble": combined_maha_ae(ens),
        "Hybrid: max(AE, B2) percentile": hybrid(best300),
        "Hybrid: max(AE 3-day smoothed, B2) percentile": hybrid(best300, 3),
    }

    all_rows = [b1_row(splits)]
    for name, fn in methods.items():
        t0 = time.time()
        all_rows += evaluate_method(name, fn, splits)
        print(f"  benchmarked {name} ({time.time() - t0:.0f} s)", flush=True)

    primary = [r for r in all_rows if r["budget"] == 0.05]
    primary.sort(key=lambda r: (-r["early_detection"], r["mean_median_delay"]))
    write_json(RESULTS_DIR / "benchmark.json", {"protocol": __doc__, "rows": all_rows})

    lines = ["| Rank | Method | Persistence | FA / astronaut-week | Early detection (≤21 d) | Detected | Mean of median delays (d) |",
             "|---|---|---|---|---|---|---|"]
    b1 = all_rows[0]
    lines.append(f"| – | {b1['method']} | rule | {b1['false_alarms_per_week']} | {b1['early_detection']:.0%} | "
                 f"{b1['detection']:.0%} | {b1['mean_median_delay']} |")
    for i, r in enumerate(primary, 1):
        if r["method"].startswith("B1"):
            continue
        lines.append(f"| {i} | {r['method']} | {r['persistence']} | {r['false_alarms_per_week']} | "
                     f"{r['early_detection']:.0%} | {r['detection']:.0%} | {r['mean_median_delay']} |")
    table = "\n".join(lines)
    (RESULTS_DIR / "benchmark.md").write_text(
        "### Benchmark at a false-alarm budget of 0.05 per astronaut-week (bench split, scenario sizes × 0.5 and × 1.0)\n\n"
        + table + "\n", encoding="utf-8")
    print(table)
