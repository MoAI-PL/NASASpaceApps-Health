# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Personal normalisation and 7-day windows for the autoencoder.

Each astronaut is normalised against their OWN calibration period (days 1-21): the model therefore
sees deviations from that person's normal, not absolute values.
"""

# ===== Imports =====
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from src.common import AE_FEATURES, val

# ===== Data structures =====
@dataclass
class AstronautWindows:
    """Normalised data and 7-day windows for one astronaut."""

    astronaut: str
    days: np.ndarray          # mission day of every row (1..n)
    z: np.ndarray             # (n, 9) personal z-scores, 0 where missing
    mask: np.ndarray          # (n, 9) 1 = observed, 0 = missing
    window_days: np.ndarray   # mission day that ends each window (7..n)
    x: np.ndarray             # (n - w + 1, w * 9) flattened windows
    m: np.ndarray             # (n - w + 1, w * 9) flattened masks
    stats: dict               # feature -> (mean, sd) over the calibration period


# ===== Normalisation =====
def calibration_stats(frame: pd.DataFrame, sim_cfg: dict) -> dict[str, tuple[float, float]]:
    """Mean and sd of every AE feature over the calibration days.

    The sd is floored at half the configured within-person sd so that a very flat calibration
    period (e.g. identical mood scores) cannot produce exploding z-scores.
    """
    calib_days = int(val(sim_cfg["mission"]["calibration_days"]))
    calib = frame[frame["day"] <= calib_days]
    stats = {}
    for f in AE_FEATURES:
        series = calib[f].dropna()
        mean = float(series.mean()) if len(series) else float(sim_cfg["features"][f]["pop_mean"])
        sd = float(series.std(ddof=1)) if len(series) > 1 else 0.0
        floor = 0.5 * float(sim_cfg["features"][f]["day_sd"])
        stats[f] = (mean, max(sd, floor))
    return stats


def zscore_matrix(frame: pd.DataFrame, stats: dict[str, tuple[float, float]]) -> tuple[np.ndarray, np.ndarray]:
    """Personal z-scores (missing → 0) and the observation mask, ordered by day."""
    raw = frame[AE_FEATURES].to_numpy(dtype=float)
    mask = (~np.isnan(raw)).astype(np.float32)
    means = np.array([stats[f][0] for f in AE_FEATURES])
    sds = np.array([stats[f][1] for f in AE_FEATURES])
    z = np.nan_to_num((raw - means) / sds, nan=0.0).astype(np.float32)
    return z, mask


def make_windows(z: np.ndarray, mask: np.ndarray, window: int) -> tuple[np.ndarray, np.ndarray]:
    """Stack consecutive `window`-day blocks into flat vectors (day-major order)."""
    n = z.shape[0]
    idx = np.arange(window)[None, :] + np.arange(n - window + 1)[:, None]
    x = z[idx].reshape(len(idx), -1)
    m = mask[idx].reshape(len(idx), -1)
    return x, m


def astronaut_windows(frame: pd.DataFrame, sim_cfg: dict, window: int) -> AstronautWindows:
    """Full feature pipeline for one astronaut."""
    frame = frame.sort_values("day")
    stats = calibration_stats(frame, sim_cfg)
    z, mask = zscore_matrix(frame, stats)
    x, m = make_windows(z, mask, window)
    days = frame["day"].to_numpy()
    return AstronautWindows(str(frame["astronaut"].iloc[0]), days, z, mask, days[window - 1:], x, m, stats)


def crew_windows(crew: pd.DataFrame, sim_cfg: dict, window: int) -> list[AstronautWindows]:
    """Feature pipeline for every astronaut of a split (order of first appearance)."""
    return [astronaut_windows(frame, sim_cfg, window) for _, frame in crew.groupby("astronaut", sort=False)]


def normal_bands(stats: dict[str, tuple[float, float]], k: float = 2.0) -> dict[str, list[float]]:
    """Personal normal band (mean ± k sd) per feature, for the UI Trends screen."""
    return {f: [round(mean - k * sd, 2), round(mean + k * sd, 2)] for f, (mean, sd) in stats.items()}
