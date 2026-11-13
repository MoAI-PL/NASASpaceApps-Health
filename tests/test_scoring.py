# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Alert logic: persistence, SAI mapping, system status."""

import numpy as np

from src.baselines import persistent
from src.scoring import ae_levels, sai_from_scores, system_status


def test_persistence_requires_consecutive_days():
    flags = np.array([1, 0, 1, 1, 0, 1, 1, 1], dtype=bool)
    assert persistent(flags, 2).tolist() == [0, 0, 0, 1, 0, 0, 1, 1]


def test_sai_is_monotonic_and_bounded():
    reference = np.sort(np.linspace(0, 10, 101))
    sai = sai_from_scores(np.array([-1.0, 0.0, 5.0, 10.0, 50.0]), reference)
    assert (np.diff(sai) >= 0).all()
    assert sai.min() >= 0 and sai.max() == 100


def test_levels_need_two_days_above_threshold():
    sai = np.array([np.nan, 95, 50, 95, 96, 99, 99])
    assert ae_levels(sai, 90, 99, 2) == ["green", "green", "green", "green", "yellow", "yellow", "orange"]


def test_green_day_keeps_all_systems_green():
    shares = {"hr": 0.6, "sys": 0.2, "sleep_h": 0.2}
    assert set(system_status("green", shares, 0.3).values()) == {"green"}
    status = system_status("yellow", shares, 0.3)
    assert status["heart"] == "yellow" and status["mind_sleep"] == "green"
