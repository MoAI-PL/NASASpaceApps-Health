# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Simulator: reproducibility, scenario-free calibration period, physiological bounds."""

import numpy as np
import pandas as pd

from src.common import CONFIG_DIR, INDICATORS, load_yaml
from src.simulate import build_split, simulate_astronaut

CFG = load_yaml(CONFIG_DIR / "simulation.yaml")


def test_same_seed_gives_identical_data():
    a = simulate_astronaut(CFG, 2001, "x", "S1")
    b = simulate_astronaut(CFG, 2001, "x", "S1")
    pd.testing.assert_frame_equal(a, b)


def test_scenario_size_does_not_change_healthy_baseline():
    a = simulate_astronaut(CFG, 2001, "x", "S1", scale=0.5)
    b = simulate_astronaut(CFG, 2001, "x", "S1", scale=1.5)
    start = int(a["scenario_start"].iloc[0])
    pre_a, pre_b = a[a["day"] < start], b[b["day"] < start]
    pd.testing.assert_frame_equal(pre_a[INDICATORS], pre_b[INDICATORS])


def test_no_active_scenario_before_day_30():
    crew, _ = build_split(CFG, "dev")
    assert not crew.loc[crew["day"] < 30, "scenario_active"].any()


def test_values_within_physiological_bounds():
    crew, _ = build_split(CFG, "dev")
    for f in INDICATORS:
        values = crew[f].dropna()
        assert values.min() >= CFG["features"][f]["min"]
        assert values.max() <= CFG["features"][f]["max"]


def test_seeds_do_not_overlap_between_splits():
    seen = set()
    for split in ["train", "val", "dev", "dev_s4", "test"]:
        _, meta = build_split(CFG, split)
        seeds = {a["seed"] for a in meta["astronauts"]}
        assert not (seeds & seen)
        seen |= seeds


def test_missing_share_close_to_config():
    crew, _ = build_split(CFG, "train")
    share = crew[INDICATORS].isna().to_numpy().mean()
    assert abs(share - 0.05) < 0.01
    assert np.isfinite(crew["exercise_min"]).all()
