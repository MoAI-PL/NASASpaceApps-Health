# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Personal normalisation and windowing."""

import numpy as np

from src.common import AE_FEATURES, CONFIG_DIR, load_yaml
from src.features import astronaut_windows, make_windows
from src.simulate import simulate_astronaut

CFG = load_yaml(CONFIG_DIR / "simulation.yaml")


def test_window_shape_is_7_days_by_9_features():
    aw = astronaut_windows(simulate_astronaut(CFG, 1000, "x"), CFG, 7)
    assert aw.x.shape == (120 - 6, 63)
    assert aw.m.shape == aw.x.shape
    assert aw.window_days[0] == 7 and aw.window_days[-1] == 120


def test_calibration_period_is_centred():
    aw = astronaut_windows(simulate_astronaut(CFG, 1000, "x"), CFG, 7)
    calib = aw.z[:21][aw.mask[:21] > 0]
    assert abs(calib.mean()) < 0.2


def test_missing_values_are_masked_and_zeroed():
    aw = astronaut_windows(simulate_astronaut(CFG, 1000, "x"), CFG, 7)
    assert (aw.z[aw.mask == 0] == 0).all()
    assert (aw.mask == 0).any()


def test_windows_are_day_major():
    z = np.arange(10 * len(AE_FEATURES), dtype=float).reshape(10, len(AE_FEATURES))
    x, _ = make_windows(z, np.ones_like(z), 7)
    np.testing.assert_array_equal(x[0][: len(AE_FEATURES)], z[0])
    np.testing.assert_array_equal(x[1][-len(AE_FEATURES):], z[7])
