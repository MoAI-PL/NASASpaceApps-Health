# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Personal-drift detector: decomposition and sensitivity to a sustained shift."""

import numpy as np

from src.drift import drift_scores, drift_terms, fit_drift, window_summary


def test_terms_sum_to_score():
    rng = np.random.default_rng(0)
    model = fit_drift(rng.standard_normal((500, 9)), 0.01)
    x = rng.standard_normal((20, 9))
    np.testing.assert_allclose(drift_terms(x, model).sum(axis=1), drift_scores(x, model))


def test_sustained_shift_scores_higher_than_healthy():
    rng = np.random.default_rng(1)
    model = fit_drift(rng.standard_normal((500, 9)), 0.01)
    healthy = drift_scores(rng.standard_normal((200, 9)), model).mean()
    shifted = drift_scores(rng.standard_normal((200, 9)) + 1.5, model).mean()
    assert shifted > 3 * healthy


def test_window_summary_weights_latest_day_most():
    x = np.zeros((1, 7 * 9))
    x[0, 6 * 9] = 1.0          # feature 0 on the latest day
    w = np.arange(1, 8) / 28.0
    assert np.isclose(window_summary(x, w)[0, 0], 7 / 28)
