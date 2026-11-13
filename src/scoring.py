# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Turn detector outputs into the Systemic Anomaly Index (SAI), alert levels and explanations.

Production detector (config/model.yaml → detector: drift): the multivariate personal-drift model in
src/drift.py, chosen by the benchmark (outputs/results/benchmark.md).

Alternative detector (detector: autoencoder), kept for reproducibility of the benchmark.
Autoencoder anomaly score (config/model.yaml → scoring.components):
- reconstruction: weighted reconstruction error — catches combinations the model cannot reproduce;
- latent: Mahalanobis distance of the window's latent code from the healthy latent distribution —
  catches large shifts along directions the model reproduces well (e.g. sleep, mood and reaction
  time moving together, which also happens on healthy days, but never this far).
Each component is divided by its mean on healthy training windows and the two are summed.
The SAI is the percentile of that score among healthy validation windows.
"""

# ===== Imports =====
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch

from src.baselines import persistent
from src.common import AE_FEATURES, INDICATORS, MODELS_DIR, SYSTEM_OF, SYSTEMS, read_json
from src.drift import drift_terms, window_summary
from src.features import AstronautWindows
from src.model import Autoencoder, load_model


# ===== Scorer =====
@dataclass
class Scorer:
    """Everything needed to score windows: detector, calibration constants and healthy reference."""

    model: Autoencoder | None
    model_cfg: dict
    calibration: dict          # drift model, or AE latent statistics and component normalisers
    reference_sorted: np.ndarray
    kind: str = "drift"


def load_scorer(model_cfg: dict) -> Scorer:
    """Load the configured detector, its calibration and the healthy reference distribution."""
    kind = model_cfg.get("detector", "autoencoder")
    reference = np.load(MODELS_DIR / "reference_scores.npy")
    if kind == "drift":
        return Scorer(None, model_cfg, read_json(MODELS_DIR / "drift_model.json"), reference, "drift")
    model, _ = load_model(MODELS_DIR / "ae.pt")
    return Scorer(model, model_cfg, read_json(MODELS_DIR / "score_calibration.json"), reference, "autoencoder")


def day_weights(model_cfg: dict) -> np.ndarray:
    """Normalised weights of the days inside a window (latest day heaviest)."""
    w = np.asarray(model_cfg["scoring"]["day_weights"], dtype=float)
    return w / w.sum()


# ===== Score components =====
def reconstruction_errors(model: Autoencoder, x: np.ndarray, m: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """Weighted per-feature squared reconstruction error, shape (N, 9); missing cells count 0."""
    model.eval()
    with torch.no_grad():
        recon = model(torch.from_numpy(x.astype(np.float32))).numpy()
    err = (m * (recon - x) ** 2).reshape(len(x), len(weights), len(AE_FEATURES))
    return (err * weights[None, :, None]).sum(axis=1)


def latent_codes(model: Autoencoder, x: np.ndarray) -> np.ndarray:
    """Bottleneck codes of the windows, shape (N, bottleneck)."""
    model.eval()
    with torch.no_grad():
        return model.encode(torch.from_numpy(x.astype(np.float32))).numpy()


def latent_calibration(codes: np.ndarray) -> dict:
    """Mean and regularised inverse covariance of healthy latent codes."""
    mean = codes.mean(axis=0)
    cov = np.cov(codes, rowvar=False) + 1e-3 * np.eye(codes.shape[1])
    return {"latent_mean": mean.tolist(), "latent_inv_cov": np.linalg.inv(cov).tolist()}


def latent_distance(codes: np.ndarray, calibration: dict) -> np.ndarray:
    """Squared Mahalanobis distance of each latent code from the healthy distribution."""
    diff = codes - np.asarray(calibration["latent_mean"])
    return np.einsum("ij,jk,ik->i", diff, np.asarray(calibration["latent_inv_cov"]), diff)


def raw_components(model: Autoencoder, x: np.ndarray, m: np.ndarray, weights: np.ndarray,
                   calibration: dict | None) -> dict[str, np.ndarray]:
    """Unnormalised score components for windows."""
    out = {"reconstruction": reconstruction_errors(model, x, m, weights).sum(axis=1)}
    if calibration is not None and "latent_mean" in calibration:
        out["latent"] = latent_distance(latent_codes(model, x), calibration)
    return out


def combined_score(components: dict[str, np.ndarray], calibration: dict, use: list[str]) -> np.ndarray:
    """Sum of the selected components, each divided by its healthy training mean."""
    total = np.zeros_like(next(iter(components.values())))
    for name in use:
        total = total + components[name] / float(calibration[f"{name}_norm"])
    return total


# ===== Index and levels =====
def sai_from_scores(scores: np.ndarray, reference_sorted: np.ndarray) -> np.ndarray:
    """SAI = 100 × empirical CDF of the score within the healthy reference distribution."""
    ranks = np.searchsorted(reference_sorted, scores, side="right")
    return np.floor(100.0 * ranks / len(reference_sorted)).astype(int)


def ae_alarm(sai: np.ndarray, p_yellow: float, k: int) -> np.ndarray:
    """Yellow-or-worse alarm: SAI at or above P_yellow for k consecutive days (NaN never alarms)."""
    hit = np.nan_to_num(np.asarray(sai, dtype=float), nan=-1) >= p_yellow
    return persistent(hit, k)


def ae_levels(sai: np.ndarray, p_yellow: float, p_orange: float, k: int) -> list[str]:
    """Daily model level: green / yellow / orange (red comes only from critical rules)."""
    yellow = ae_alarm(sai, p_yellow, k)
    orange = ae_alarm(sai, p_orange, k)
    return ["orange" if o else "yellow" if y else "green" for y, o in zip(yellow, orange)]


# ===== Explanations =====
def deviation_energy(x: np.ndarray, m: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """Weighted squared personal z-score per feature over each window, shape (N, 9).

    Used to explain WHICH indicators moved away from the personal normal; the model decides
    WHETHER the combination is anomalous.
    """
    sq = (m * x ** 2).reshape(len(x), len(weights), len(AE_FEATURES))
    return (sq * weights[None, :, None]).sum(axis=1)


def contribution_shares(energy: np.ndarray) -> dict[str, float]:
    """Share of one day's deviation per indicator; exercise is folded into 'other'."""
    total = float(energy.sum())
    if total <= 0:
        return {}
    shares = {f: float(energy[AE_FEATURES.index(f)]) / total for f in INDICATORS}
    shares["other"] = float(energy[AE_FEATURES.index("exercise_min")]) / total
    return shares


def system_shares(shares: dict[str, float]) -> dict[str, float]:
    """Aggregate feature shares into body systems."""
    out = {s: 0.0 for s in SYSTEMS}
    for f, share in shares.items():
        if f in SYSTEM_OF:
            out[SYSTEM_OF[f]] += share
    return out


def system_status(level: str, shares: dict[str, float], secondary_share: float) -> dict[str, str]:
    """Status per body system for one day.

    On a green day every system is green. Otherwise the system holding the largest share takes the
    day's level, and any other system whose share exceeds `secondary_share` is yellow.
    """
    status = {s: "green" for s in SYSTEMS}
    if level == "green" or not shares:
        return status
    sys_share = system_shares(shares)
    top = max(sys_share, key=sys_share.get)
    status[top] = level
    for s, share in sys_share.items():
        if s != top and share > secondary_share:
            status[s] = "yellow"
    return status


# ===== Astronaut scoring =====
def window_scores(scorer: Scorer, x: np.ndarray, m: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Anomaly score and per-feature explanation weights for flattened windows."""
    weights = day_weights(scorer.model_cfg)
    if scorer.kind == "drift":
        summaries = window_summary(x, weights)
        terms = drift_terms(summaries, scorer.calibration)
        return terms.sum(axis=1), np.clip(terms, 0.0, None)
    comps = raw_components(scorer.model, x, m, weights, scorer.calibration)
    scores = combined_score(comps, scorer.calibration, scorer.model_cfg["scoring"]["components"])
    return scores, deviation_energy(x, m, weights)


def score_astronaut(scorer: Scorer, aw: AstronautWindows) -> dict:
    """Daily SAI (NaN before the first full window) and per-feature explanation for one astronaut."""
    n = len(aw.days)
    window = int(scorer.model_cfg["window_days"])
    scores, explain = window_scores(scorer, aw.x, aw.m)
    sai = np.full(n, np.nan)
    sai[window - 1:] = sai_from_scores(scores, scorer.reference_sorted)
    energy = np.full((n, len(AE_FEATURES)), np.nan)
    energy[window - 1:] = explain
    score = np.full(n, np.nan)
    score[window - 1:] = scores
    return {"days": aw.days, "sai": sai, "score": score, "deviation": energy}
