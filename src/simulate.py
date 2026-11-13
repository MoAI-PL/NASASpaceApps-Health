# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Generate synthetic astronaut crews with known, injected health scenarios.

Real astronaut health records are privacy-protected, so the model is developed on synthetic crews
whose parameters come from config/simulation.yaml (each value sourced or flagged as an assumption).
Space-weather context uses real NASA DONKI solar particle events when the cache exists.

Usage:
    python -m src.simulate --config config/simulation.yaml
    python -m src.simulate --splits dev --scale 0.5     # sensitivity analysis copy of dev
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

import numpy as np
import pandas as pd

from src.common import AE_FEATURES, CONFIG_DIR, INDICATORS, SYNTH_DIR, config_hash, load_yaml, val, write_json
from src.donki import sep_event_days

# ===== Constants =====
ROUNDING = {"sys": 0, "dia": 0, "hr": 0, "glucose": 0, "temp": 1, "sleep_h": 1,
            "mood": 0, "reaction_ms": 0, "exercise_min": 0}
ALL_SPLITS = ["train", "train_large", "val", "dev", "dev_s4", "bench", "test", "demo"]


# ===== Building blocks =====
def ar1(rng: np.random.Generator, n: int, phi: float) -> np.ndarray:
    """Stationary AR(1) series with unit variance."""
    out = np.empty(n)
    out[0] = rng.standard_normal()
    scale = np.sqrt(1.0 - phi ** 2)
    for t in range(1, n):
        out[t] = phi * out[t - 1] + scale * rng.standard_normal()
    return out


def scenario_ramp(days: np.ndarray, start: int, ramp_days: int) -> np.ndarray:
    """Linear ramp from 0 (before start) to 1 (after `ramp_days`), held afterwards."""
    if ramp_days <= 0:
        return (days >= start).astype(float)
    return np.clip((days - start + 1) / ramp_days, 0.0, 1.0) * (days >= start)


def cabin_co2_series(rng: np.random.Generator, n: int, cfg: dict) -> np.ndarray:
    """Daily cabin ppCO2 (mmHg) with a few elevated episodes."""
    co2 = val(cfg["baseline_mmHg"]) + val(cfg["day_sd"]) * rng.standard_normal(n)
    lo_len, hi_len = val(cfg["episode_days"])
    lo_lvl, hi_lvl = val(cfg["episode_level_mmHg"])
    for _ in range(int(val(cfg["episodes_per_mission"]))):
        start = int(rng.integers(5, n - 5))
        length = int(rng.integers(lo_len, hi_len + 1))
        level = rng.uniform(lo_lvl, hi_lvl)
        co2[start:start + length] = level + 0.1 * rng.standard_normal(min(length, n - start))
    return np.round(np.clip(co2, 0.5, 9.0), 2)


# ===== Astronaut simulation =====
def simulate_astronaut(cfg: dict, seed: int, astronaut: str, scenario: str = "none",
                       start_day: int | None = None, scale: float = 1.0,
                       sep_days: list[int] | None = None,
                       co2: np.ndarray | None = None) -> pd.DataFrame:
    """Simulate one astronaut's daily records for the whole mission.

    The random stream is consumed in the same order for every scenario and scale, so the same seed
    gives the same healthy baseline whatever scenario or scenario size is injected on top.
    """
    rng = np.random.default_rng(seed)
    mission, feats, latent = cfg["mission"], cfg["features"], cfg["latent"]
    n = int(val(mission["days"]))
    days = np.arange(1, n + 1)

    # Personal means and within-person variability.
    mu = {f: float(np.clip(feats[f]["pop_mean"] + feats[f]["pop_sd"] * rng.standard_normal(),
                           feats[f]["min"], feats[f]["max"])) for f in AE_FEATURES}
    sd = {f: float(feats[f]["day_sd"] * rng.uniform(0.8, 1.2)) for f in AE_FEATURES}

    # Latent day-to-day processes and independent noise.
    phi = float(val(latent["phi"]))
    fatigue = ar1(rng, n, phi)
    load = ar1(rng, n, phi)
    noise = rng.standard_normal((n, len(AE_FEATURES)))
    rest_values = rng.uniform(0, feats["exercise_min"]["rest_day_max"], n)
    missing = rng.random((n, len(INDICATORS))) < float(val(cfg["missing_prob"]))
    lo, hi = val(mission["scenario_start_range"])
    drawn_start = int(rng.integers(lo, hi + 1))
    fault_feature = INDICATORS[int(rng.integers(0, len(INDICATORS)))]
    rad_noise = rng.standard_normal(n)
    co2_own = cabin_co2_series(rng, n, cfg["cabin_co2"])

    # Exercise: driven by the training-load factor, with a weekly rest day.
    ex_cfg = feats["exercise_min"]
    a = float(val(latent["load_exercise_loading"]))
    ex_idx = AE_FEATURES.index("exercise_min")
    exercise = mu["exercise_min"] + sd["exercise_min"] * (a * load + np.sqrt(1 - a ** 2) * noise[:, ex_idx])
    rest = days % int(ex_cfg["rest_day_every"]) == 0
    exercise[rest] = rest_values[rest]

    # Indicators: personal mean + correlated variation + noise.
    load_prev = np.concatenate([[0.0], load[:-1]])
    f_load = val(latent["fatigue_loadings"])
    n_load = val(latent["load_next_day_loadings"])
    values: dict[str, np.ndarray] = {"exercise_min": exercise}
    for j, f in enumerate(INDICATORS):
        lf, ln = float(f_load.get(f, 0.0)), float(n_load.get(f, 0.0))
        resid = np.sqrt(max(1.0 - lf ** 2 - ln ** 2, 0.0))
        z = lf * fatigue + ln * load_prev + resid * noise[:, AE_FEATURES.index(f)]
        values[f] = mu[f] + sd[f] * z

    # Scenario injection (in units of the personal within-person sd).
    start = int(start_day) if start_day is not None else drawn_start
    active = np.zeros(n, dtype=bool)
    sensor_fault = ""
    if scenario != "none":
        spec = cfg["scenarios"][scenario]
        ramp = scenario_ramp(days, start, int(spec["ramp_days"]))
        if scenario == "S4":
            duration = int(spec["duration_days"])
            window = (days >= start) & (days < start + duration)
            values[fault_feature] = values[fault_feature] + scale * spec["sensor_shift_sd"] * sd[fault_feature] * window
            active = window
            sensor_fault = fault_feature
        else:
            for f, shift in spec["shifts"].items():
                values[f] = values[f] + scale * shift * sd[f] * ramp
            if "exercise_factor" in spec:
                values["exercise_min"] = values["exercise_min"] * (1 - scale * (1 - spec["exercise_factor"]) * ramp)
            active = days >= start

    # Clip to physiological bounds and round like real measurements.
    for f in AE_FEATURES:
        values[f] = np.round(np.clip(values[f], feats[f]["min"], feats[f]["max"]), ROUNDING[f])
    for j, f in enumerate(INDICATORS):
        values[f] = np.where(missing[:, j], np.nan, values[f])

    # Hazard-exposure context.
    rad_cfg = cfg["radiation"]
    radiation = val(rad_cfg["baseline_mGy_per_day"]) * (1 + val(rad_cfg["baseline_rel_noise"]) * rad_noise)
    sep_flag = np.isin(days, np.array(sep_days or [], dtype=int))
    radiation = np.round(radiation + sep_flag * val(rad_cfg["sep_spike_mGy"]), 3)
    cabin = co2 if co2 is not None else co2_own

    start_date = dt.date.fromisoformat(val(mission["start_date"]))
    frame = pd.DataFrame({
        "astronaut": astronaut,
        "seed": seed,
        "day": days,
        "date": [(start_date + dt.timedelta(days=int(d) - 1)).isoformat() for d in days],
        **{f: values[f] for f in AE_FEATURES},
        "radiation_mGy": radiation,
        "cabin_co2_mmHg": cabin,
        "sep_event": sep_flag,
        "scenario": scenario,
        "scenario_active": active,
        "scenario_start": start if scenario != "none" else -1,
        "sensor_fault_feature": sensor_fault,
    })
    return frame


# ===== Splits =====
def build_split(cfg: dict, split: str, scale: float = 1.0) -> tuple[pd.DataFrame, dict]:
    """Simulate every astronaut of a split; returns the crew table and its metadata."""
    mission = cfg["mission"]
    sep_days, sep_status = sep_event_days(val(mission["start_date"]), int(val(mission["days"])))
    spec = cfg["splits"][split]
    frames, roster = [], []
    if split == "demo":
        seed = int(spec["seed"])
        shared_co2 = cabin_co2_series(np.random.default_rng(seed), int(val(mission["days"])), cfg["cabin_co2"])
        for i, member in enumerate(spec["crew"]):
            frame = simulate_astronaut(cfg, seed + i, member["id"], member["scenario"],
                                       member.get("start_day"), scale, sep_days, shared_co2)
            frame.insert(1, "display_name", member["display_name"])
            frames.append(frame)
            roster.append({"astronaut": member["id"], "seed": seed + i, "scenario": member["scenario"]})
    else:
        seed = int(spec["first_seed"])
        for scenario, count in spec["composition"].items():
            for _ in range(int(count)):
                astronaut = f"{split}_{seed}"
                frames.append(simulate_astronaut(cfg, seed, astronaut, scenario, None, scale, sep_days))
                roster.append({"astronaut": astronaut, "seed": seed, "scenario": scenario})
                seed += 1
    crew = pd.concat(frames, ignore_index=True)
    meta = {"split": split, "scale": scale, "config_hash": config_hash(cfg),
            "sep_status": sep_status, "sep_days": sep_days, "astronauts": roster}
    return crew, meta


def split_dir(split: str, scale: float = 1.0) -> Path:
    """Folder for a split (sensitivity copies get a suffix)."""
    return SYNTH_DIR / (split if scale == 1.0 else f"{split}_scale{scale:g}")


def save_split(crew: pd.DataFrame, meta: dict, folder: Path) -> None:
    """Write crew.csv, one CSV per astronaut and meta.json."""
    folder.mkdir(parents=True, exist_ok=True)
    crew.to_csv(folder / "crew.csv", index=False)
    for astronaut, frame in crew.groupby("astronaut", sort=False):
        frame.to_csv(folder / f"{astronaut}.csv", index=False)
    write_json(folder / "meta.json", meta)


def load_split(split: str, scale: float = 1.0) -> pd.DataFrame:
    """Read a simulated split from disk."""
    path = split_dir(split, scale) / "crew.csv"
    if not path.exists():
        raise FileNotFoundError(f"{path} not found — run `python -m src.simulate` first.")
    return pd.read_csv(path, keep_default_na=True, na_values=[""],
                       dtype={"sensor_fault_feature": str}).fillna({"sensor_fault_feature": ""})


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate synthetic astronaut crews.")
    parser.add_argument("--config", default=str(CONFIG_DIR / "simulation.yaml"))
    parser.add_argument("--splits", nargs="+", default=ALL_SPLITS, choices=ALL_SPLITS)
    parser.add_argument("--scale", type=float, default=1.0, help="Scenario size multiplier (sensitivity).")
    args = parser.parse_args()

    config = load_yaml(args.config)
    for name in args.splits:
        crew_df, crew_meta = build_split(config, name, args.scale)
        save_split(crew_df, crew_meta, split_dir(name, args.scale))
        print(f"{name:7s} scale={args.scale:g}: {crew_df['astronaut'].nunique():3d} astronauts, "
              f"SEP data: {crew_meta['sep_status']}")
