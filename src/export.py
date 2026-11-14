# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Export day records for the UI (outputs/ui/*.json) following schemas/day_record.schema.json.

Usage:
    python -m src.export --crew demo          # demo_crew.json, meta.json, Earth reports, ui/concept/data.js
    python -m src.export --sample             # hand-made sample.json (no model needed, M0)
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import json

import numpy as np
import pandas as pd

from src.baselines import b1_alarm, b2_alarm, critical_alarm
from src.common import (AE_FEATURES, CONFIG_DIR, DISCLAIMER, INDICATORS, LEVELS, ROOT, SCHEMA_PATH,
                        SYSTEMS, UI_OUT_DIR, level_rank, load_yaml, read_json, schema_validator, val,
                        write_json)
from src.donki import sep_events
from src.features import astronaut_windows, normal_bands
from src.scoring import ae_levels, contribution_shares, system_status

# ===== Constants =====
HAZARD_OF_SYSTEM = {"mind_sleep": "isolation", "heart": "gravity"}
ESCALATION_ORDER = ["monitor", "self_care", "crew_medical_officer", "flight_surgeon"]


# ===== Helpers =====
def clean(value: float | None, digits: int = 2) -> float | None:
    """JSON-friendly number (NaN → None)."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    return round(float(value), digits)


def rule_out(rule: dict) -> dict:
    """One threshold rule for the UI: feature, operator, value, persistence and its provenance."""
    out = {"feature": rule["feature"], "op": rule["op"], "value": rule["value"]}
    if "persistence_days" in rule:
        out["persistence_days"] = rule["persistence_days"]
    out["source"] = rule.get("source")          # null when the value is an assumption
    out["assumption"] = bool(rule.get("assumption", False))
    return out


def crew_entry(frame: pd.DataFrame, sim_cfg: dict) -> dict:
    """Crew roster entry with the injected scenario (synthetic ground truth for the demo replay)."""
    scenario = str(frame["scenario"].iloc[0])
    entry = {"id": str(frame["astronaut"].iloc[0]), "display_name": str(frame["display_name"].iloc[0])}
    entry["scenario"] = None if scenario == "none" else {
        "id": scenario, "name": sim_cfg["scenarios"][scenario]["name"],
        "start_day": int(frame["scenario_start"].iloc[0])}
    return entry


def worst(*levels: str) -> str:
    """Most severe of several green/yellow/orange/red levels."""
    return max(levels, key=level_rank)


def top_contributions(shares: dict[str, float], top: int = 4) -> dict[str, float]:
    """Keep the `top` largest indicator shares and fold the rest into 'other'."""
    if not shares:
        return {}
    items = sorted(((f, s) for f, s in shares.items() if f != "other"), key=lambda kv: -kv[1])
    kept = dict(items[:top])
    kept["other"] = max(0.0, 1.0 - sum(kept.values()))
    return {f: round(s, 2) for f, s in kept.items()}


def sensor_fault_today(z_row: np.ndarray, mask_row: np.ndarray) -> bool:
    """One indicator far off (|z| > 5) while every other indicator looks normal (|z| < 2)."""
    idx = [AE_FEATURES.index(f) for f in INDICATORS]
    z = np.abs(z_row[idx]) * (mask_row[idx] > 0)
    extreme = z > 5
    return bool(extreme.sum() == 1 and (z[~extreme] < 2).all())


def escalation_level(level: str, yellow_run: int, systems: dict[str, str], esc_cfg: dict) -> str:
    """Escalation ladder: monitor → self_care → crew_medical_officer → flight_surgeon."""
    if level == "red":
        return "flight_surgeon"
    n_systems = sum(level_rank(s) >= 1 for s in systems.values())
    if (level == "orange" or yellow_run >= int(esc_cfg["orange_or_yellow_days"])
            or n_systems >= int(esc_cfg["multi_system_count"])):
        return "crew_medical_officer"
    return "self_care" if level == "yellow" else "monitor"


# ===== Record building =====
def build_records(frame: pd.DataFrame, signals: dict, cfgs: dict, env: str) -> list[dict]:
    """Day records for one astronaut from precomputed daily signals.

    `signals` holds per-day arrays: sai (float/NaN), ae_level (str), shares (dict per day),
    b1, b2, critical (bool) and critical_features (set per day), z and mask (personal z-scores).
    """
    frame = frame.sort_values("day").reset_index(drop=True)
    ui_cfg, model_cfg, sim_cfg = cfgs["ui"], cfgs["model"], cfgs["sim"]
    calib_days = int(val(sim_cfg["mission"]["calibration_days"]))
    co2_limit = float(val(sim_cfg["cabin_co2"]["limit_mmHg"]))
    secondary = float(model_cfg["scoring"]["system_secondary_share"])
    records, yellow_run, cum_rad = [], 0, 0.0

    for t, row in frame.iterrows():
        sai = signals["sai"][t]
        critical = bool(signals["critical"][t])
        ae_level = signals["ae_level"][t]
        level = "red" if critical else ae_level
        shares = signals["shares"][t]
        systems = system_status(ae_level, shares, secondary)
        for f in signals["critical_features"][t]:
            systems[cfgs["ui"]["features"][f]["system"]] = "red"
        yellow_run = yellow_run + 1 if level_rank(level) >= 1 else 0

        events = []
        if bool(row["sep_event"]):
            events.append("sep_event")
        if float(row["cabin_co2_mmHg"]) > co2_limit:
            events.append("co2_high")
        if sensor_fault_today(signals["z"][t], signals["mask"][t]):
            events.append("possible_sensor_fault")

        hazards = {
            "radiation": "yellow" if "sep_event" in events else "green",
            "isolation": systems["mind_sleep"],
            "distance": "info",
            "gravity": systems["heart"],
            "closed_environment": worst("yellow" if "co2_high" in events else "green", systems["immune_temp"]),
        }
        prompts = [ui_cfg["prompts"][s] for s in SYSTEMS if level_rank(systems[s]) >= 1]
        cum_rad += float(row["radiation_mGy"])

        records.append({
            "astronaut": str(row["astronaut"]),
            "display_name": str(row["display_name"]),
            "day": int(row["day"]),
            "date": str(row["date"]),
            "env": env,
            "values": {f: clean(row[f], 2) for f in AE_FEATURES},
            "context": {"radiation_mGy": round(float(row["radiation_mGy"]), 3),
                        "radiation_cum_mGy": round(cum_rad, 2),
                        "cabin_co2_mmHg": round(float(row["cabin_co2_mmHg"]), 2)},
            "missing": [f for f in INDICATORS if pd.isna(row[f])],
            "calibrating": int(row["day"]) <= calib_days,
            "sai": None if np.isnan(sai) else int(sai),
            "level": level,
            "rule_alert": bool(signals["b1"][t]),
            "univariate_alert": bool(signals["b2"][t]),
            "critical": critical,
            "contributions": top_contributions(shares) if not np.isnan(sai) else {},
            "systems": systems,
            "hazards": hazards,
            "prompts": prompts,
            "escalation": escalation_level(level, yellow_run, systems, ui_cfg["escalation"]),
            "events": events,
        })
    return records


def model_signals(frame: pd.DataFrame, cfgs: dict, scorer) -> tuple[dict, dict]:
    """Daily signals from the trained model and the baselines; also returns normal bands."""
    from src.scoring import score_astronaut  # torch is only needed when the model is used

    frame = frame.sort_values("day")
    aw = astronaut_windows(frame, cfgs["sim"], int(cfgs["model"]["window_days"]))
    scored = score_astronaut(scorer, aw)
    sc = cfgs["model"]["scoring"]
    levels = ae_levels(scored["sai"], float(sc["p_yellow"]), float(sc["p_orange"]), int(sc["persistence_days"]))
    crit, crit_feats = critical_alarm(frame, cfgs["rules"])
    shares = [contribution_shares(e) if not np.isnan(e).any() else {} for e in scored["deviation"]]
    signals = {"sai": scored["sai"], "ae_level": levels, "shares": shares,
               "b1": b1_alarm(frame, cfgs["rules"]), "b2": b2_alarm(aw.z, aw.mask, cfgs["rules"]),
               "critical": crit, "critical_features": crit_feats, "z": aw.z, "mask": aw.mask}
    return signals, normal_bands(aw.stats)


# ===== Meta and reports =====
def build_meta(cfgs: dict, crew: list[dict], bands: dict, split_meta: dict, sample: bool) -> dict:
    """Static information the UI needs: features, systems, hazards, environments, crew, bands."""
    ui_cfg, sim_cfg, sc = cfgs["ui"], cfgs["sim"], cfgs["model"]["scoring"]
    return {
        "product": "Baseline",
        "sample": sample,
        "disclaimer": "Prototype — synthetic data — not medical advice. " + DISCLAIMER,
        "mission": {"start_date": val(sim_cfg["mission"]["start_date"]),
                    "days": int(val(sim_cfg["mission"]["days"])),
                    "calibration_days": int(val(sim_cfg["mission"]["calibration_days"]))},
        "index": {"name": "Systemic Anomaly Index", "short": "SAI", "range": [0, 100],
                  "p_yellow": sc["p_yellow"], "p_orange": sc["p_orange"],
                  "persistence_days": sc["persistence_days"]},
        "features": ui_cfg["features"],
        "systems": ui_cfg["systems"],
        "hazards": ui_cfg["hazards"],
        "prompts": {pid: {"system": s} for s, pid in ui_cfg["prompts"].items()},
        "environments": {k: {kk: vv for kk, vv in v.items() if kk != "assumption"}
                         for k, v in ui_cfg["environments"].items()},
        "default_environment": ui_cfg["default_environment"],
        "levels": LEVELS,
        "crew": crew,
        "normal_bands": bands,
        "cabin_co2_limit_mmHg": float(val(sim_cfg["cabin_co2"]["limit_mmHg"])),
        "space_weather": {"source": "NASA DONKI SEP events", "status": split_meta.get("sep_status", "missing"),
                          "event_days": split_meta.get("sep_days", []),
                          "events": sep_events(val(sim_cfg["mission"]["start_date"]),
                                               int(val(sim_cfg["mission"]["days"])))},
        "rules": {"critical": [rule_out(r) for r in cfgs["rules"]["critical_rules"]],
                  "b1": [rule_out(r) for r in cfgs["rules"]["b1_rules"]]},
    }


def earth_reports(records: list[dict]) -> list[dict]:
    """Compact downlink summaries: at each escalation to the crew medical officer or higher, and the last day."""
    reports, prev = [], "monitor"
    for i, r in enumerate(records):
        esc = r["escalation"]
        is_onset = ESCALATION_ORDER.index(esc) >= 2 and ESCALATION_ORDER.index(prev) < ESCALATION_ORDER.index(esc)
        if is_onset or i == len(records) - 1:
            last7 = records[max(0, i - 6):i + 1]
            reports.append({
                "astronaut": r["astronaut"], "display_name": r["display_name"], "day": r["day"], "date": r["date"],
                "env": r["env"], "status": "queued_for_downlink",
                "level": r["level"], "escalation": esc, "sai_last_7_days": [x["sai"] for x in last7],
                "top_contributions": r["contributions"], "open_prompts": r["prompts"], "events": r["events"],
                "note": "Synthetic demonstration data. Not medical advice.",
            })
        prev = esc
    return reports


def validate(records: list[dict]) -> None:
    """Validate every record against the JSON schema (raises on the first error)."""
    schema = read_json(SCHEMA_PATH)
    validator = schema_validator(schema)
    for r in records:
        validator.validate(r)


def write_concept_data(meta: dict, records: list[dict]) -> None:
    """Embed the data as a script for the no-build concept UI (works when opened from disk)."""
    path = ROOT / "ui" / "concept" / "data.js"
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"meta": meta, "records": records}, ensure_ascii=False, separators=(",", ":"))
    path.write_text("// Generated by `python -m src.export --crew demo`. Do not edit by hand.\n"
                    "// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0\n"
                    f"window.BASELINE_DATA = {payload};\n", encoding="utf-8")


# ===== Sample (M0, no model) =====
def sample_signals(frame: pd.DataFrame, cfgs: dict, story: str) -> tuple[dict, dict]:
    """Hand-made signals for the M0 contract sample: calm days, plus a short yellow episode for 'rising'."""
    frame = frame.sort_values("day")
    aw = astronaut_windows(frame, cfgs["sim"], 7)
    n = len(frame)
    days = frame["day"].to_numpy()
    sai = np.where(days < 7, np.nan, 40 + 10 * np.sin(days / 3.0))
    if story == "rising":
        sai = np.where(days >= 24, np.minimum(99, 60 + 6 * (days - 23)), sai)
    levels = ["yellow" if (not np.isnan(s) and s >= 90) else "green" for s in sai]
    shares = [{} if np.isnan(s) else ({"hr": 0.4, "sys": 0.25, "dia": 0.15, "sleep_h": 0.1, "other": 0.1}
                                      if story == "rising" else {"sleep_h": 0.3, "mood": 0.25, "hr": 0.2, "other": 0.25})
              for s in sai]
    crit, crit_feats = critical_alarm(frame, cfgs["rules"])
    signals = {"sai": sai, "ae_level": levels, "shares": shares, "b1": np.zeros(n, bool), "b2": np.zeros(n, bool),
               "critical": crit, "critical_features": crit_feats, "z": aw.z, "mask": aw.mask}
    return signals, normal_bands(aw.stats)


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export UI data files.")
    parser.add_argument("--crew", default="demo", choices=["demo"])
    parser.add_argument("--sample", action="store_true", help="Write the M0 contract sample (no model).")
    parser.add_argument("--env", default=None, help="iss | lunar_base | mars_transit (default from config/ui.yaml)")
    args = parser.parse_args()

    from src.simulate import build_split, load_split, split_dir

    configs = {"ui": load_yaml(CONFIG_DIR / "ui.yaml"), "model": load_yaml(CONFIG_DIR / "model.yaml"),
               "sim": load_yaml(CONFIG_DIR / "simulation.yaml"), "rules": load_yaml(CONFIG_DIR / "rules.yaml")}
    environment = args.env or configs["ui"]["default_environment"]

    if args.sample:
        crew_df, demo_meta = build_split(configs["sim"], "demo")
        crew_df = crew_df[crew_df["day"] <= 30]
        all_records, all_bands, roster = [], {}, []
        for (astro, frame), story in zip(crew_df.groupby("astronaut", sort=False), ["calm", "rising", "calm"]):
            sig, bands = sample_signals(frame, configs, story)
            all_records += build_records(frame, sig, configs, environment)
            all_bands[astro] = bands
            roster.append(crew_entry(frame, configs["sim"]))
        validate(all_records)
        write_json(UI_OUT_DIR / "sample.json", {"meta": build_meta(configs, roster, all_bands, demo_meta, True),
                                                "records": all_records})
        print(f"Wrote outputs/ui/sample.json ({len(all_records)} records, schema-valid).")
    else:
        from src.scoring import load_scorer

        scorer_obj = load_scorer(configs["model"])
        crew_df = load_split("demo")
        demo_meta = read_json(split_dir("demo") / "meta.json")
        all_records, all_bands, roster, reports = [], {}, [], []
        for astro, frame in crew_df.groupby("astronaut", sort=False):
            sig, bands = model_signals(frame, configs, scorer_obj)
            recs = build_records(frame, sig, configs, environment)
            all_records += recs
            reports += earth_reports(recs)
            all_bands[astro] = bands
            roster.append(crew_entry(frame, configs["sim"]))
        validate(all_records)
        meta_out = build_meta(configs, roster, all_bands, demo_meta, False)
        write_json(UI_OUT_DIR / "demo_crew.json", all_records)
        write_json(UI_OUT_DIR / "meta.json", meta_out)
        for rep in reports:
            write_json(UI_OUT_DIR / "earth_reports" / f"{rep['astronaut']}_day{rep['day']:03d}.json", rep)
        write_concept_data(meta_out, all_records)
        print(f"Wrote demo_crew.json ({len(all_records)} schema-valid records), meta.json, "
              f"{len(reports)} Earth reports and ui/concept/data.js.")
