# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Reference methods the autoencoder is compared against, plus the critical safety net.

B1: fixed clinical thresholds (config/rules.yaml), with persistence.
B2: personal univariate thresholds — any single indicator beyond 3 personal sd, with persistence.
Critical rules: immediate red alerts that never depend on the model.
"""

# ===== Imports =====
from __future__ import annotations

import numpy as np
import pandas as pd

from src.common import AE_FEATURES, INDICATORS

# ===== Helpers =====
OPS = {"ge": np.greater_equal, "gt": np.greater, "le": np.less_equal, "lt": np.less}


def persistent(flags: np.ndarray, k: int) -> np.ndarray:
    """True on day t when `flags` was True on days t-k+1 … t (consecutive)."""
    flags = np.asarray(flags, dtype=bool)
    if k <= 1:
        return flags.copy()
    out = np.zeros_like(flags)
    run = 0
    for t, flag in enumerate(flags):
        run = run + 1 if flag else 0
        out[t] = run >= k
    return out


def rule_hits(frame: pd.DataFrame, rule: dict) -> np.ndarray:
    """Days where one threshold rule is met (missing values never meet a rule)."""
    values = frame[rule["feature"]].to_numpy(dtype=float)
    with np.errstate(invalid="ignore"):
        hit = OPS[rule["op"]](values, float(rule["value"]))
    return hit & ~np.isnan(values)


# ===== Baselines =====
def b1_alarm(frame: pd.DataFrame, rules_cfg: dict) -> np.ndarray:
    """B1: any fixed clinical threshold met for its persistence period."""
    frame = frame.sort_values("day")
    alarm = np.zeros(len(frame), dtype=bool)
    for rule in rules_cfg["b1_rules"]:
        alarm |= persistent(rule_hits(frame, rule), int(rule.get("persistence_days", 1)))
    return alarm


def critical_alarm(frame: pd.DataFrame, rules_cfg: dict) -> tuple[np.ndarray, list[set[str]]]:
    """Immediate critical alerts and, per day, the features that triggered them."""
    frame = frame.sort_values("day")
    alarm = np.zeros(len(frame), dtype=bool)
    features: list[set[str]] = [set() for _ in range(len(frame))]
    for rule in rules_cfg["critical_rules"]:
        hit = rule_hits(frame, rule)
        alarm |= hit
        for t in np.flatnonzero(hit):
            features[t].add(rule["feature"])
    return alarm, features


def b2_alarm(z: np.ndarray, mask: np.ndarray, rules_cfg: dict) -> np.ndarray:
    """B2: any indicator with |z| above the threshold for k consecutive days (per indicator)."""
    thr = float(rules_cfg["b2"]["z_threshold"])
    k = int(rules_cfg["b2"]["persistence_days"])
    alarm = np.zeros(z.shape[0], dtype=bool)
    for f in INDICATORS:
        j = AE_FEATURES.index(f)
        hit = (np.abs(z[:, j]) > thr) & (mask[:, j] > 0)
        alarm |= persistent(hit, k)
    return alarm
