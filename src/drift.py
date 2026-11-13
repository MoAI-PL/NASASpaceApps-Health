# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Multivariate personal-drift detector — the production model chosen by the benchmark.

For every day the detector summarises the last 7 days as a weighted mean of the astronaut's personal
z-scores (latest day heaviest), one value per feature. A Gaussian model of that 9-dimensional summary
is learned from healthy astronauts only (unsupervised: no illness labels). The anomaly score is the
squared Mahalanobis distance (Hotelling T²-type statistic) of today's summary from the healthy model.

It is exactly decomposable for explanations: T² = Σ_f d_f · (Σ⁻¹ d)_f, so each feature's term is its
contribution to the score.
"""

# ===== Imports =====
from __future__ import annotations

import numpy as np

from src.common import AE_FEATURES


# ===== Summary =====
def window_summary(x: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """Weighted mean over the days of each flattened window → (N, 9) drift summary."""
    blocks = x.reshape(len(x), len(weights), len(AE_FEATURES))
    return (blocks * weights[None, :, None]).sum(axis=1)


# ===== Fit and score =====
def fit_drift(summaries: np.ndarray, regularisation: float) -> dict:
    """Mean and regularised inverse covariance of healthy summaries, plus the healthy mean score."""
    mean = summaries.mean(axis=0)
    cov = np.cov(summaries, rowvar=False) + regularisation * np.eye(summaries.shape[1])
    model = {"mean": mean.tolist(), "inv_cov": np.linalg.inv(cov).tolist()}
    model["score_norm"] = float(drift_scores(summaries, model).mean())
    return model


def drift_terms(summaries: np.ndarray, model: dict) -> np.ndarray:
    """Per-feature terms d_f · (Σ⁻¹ d)_f, shape (N, 9); they sum to the Mahalanobis distance."""
    d = summaries - np.asarray(model["mean"])
    return d * (d @ np.asarray(model["inv_cov"]))


def drift_scores(summaries: np.ndarray, model: dict) -> np.ndarray:
    """Squared Mahalanobis distance of each summary from the healthy model."""
    return drift_terms(summaries, model).sum(axis=1)
