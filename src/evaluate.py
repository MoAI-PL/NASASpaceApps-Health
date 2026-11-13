# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Evaluate the autoencoder against baselines B1 (fixed thresholds) and B2 (personal univariate).

Usage:
    python -m src.evaluate --split dev --tune      # tune P_yellow on dev only, then evaluate dev
    python -m src.evaluate --split dev             # evaluate dev with the thresholds in config
    python -m src.evaluate --split test --final    # ONE-TIME hold-out test (refuses a second run)
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys
from statistics import median

import numpy as np
import pandas as pd

from src.baselines import b1_alarm, b2_alarm
from src.common import (CONFIG_DIR, DISCLAIMER, MODELS_DIR, RESULTS_DIR, config_hash, file_hash,
                        load_yaml, val, write_json)
from src.features import astronaut_windows
from src.scoring import Scorer, ae_alarm, load_scorer, score_astronaut
from src.simulate import build_split, load_split

# ===== Constants =====
METHODS = ["AE", "B1", "B2"]
YELLOW_GRID = [90, 92, 94, 95, 96, 97, 98, 99]   # SAI is an integer percentile
FINAL_PATH = RESULTS_DIR / "final_test.json"


# ===== Per-astronaut signals =====
def crew_signals(crew: pd.DataFrame, cfgs: dict, scorer: Scorer) -> list[dict]:
    """SAI and baseline alarms per astronaut (threshold-independent part, computed once)."""
    out = []
    window = int(cfgs["model"]["window_days"])
    for astronaut, frame in crew.groupby("astronaut", sort=False):
        frame = frame.sort_values("day")
        aw = astronaut_windows(frame, cfgs["sim"], window)
        scored = score_astronaut(scorer, aw)
        out.append({
            "astronaut": astronaut,
            "scenario": str(frame["scenario"].iloc[0]),
            "start": int(frame["scenario_start"].iloc[0]),
            "days": aw.days,
            "sai": scored["sai"],
            "B1": b1_alarm(frame, cfgs["rules"]),
            "B2": b2_alarm(aw.z, aw.mask, cfgs["rules"]),
        })
    return out


def first_day(flags: np.ndarray, days: np.ndarray, from_day: int) -> int | None:
    """First mission day on or after `from_day` with an alarm."""
    hits = days[(days >= from_day) & flags]
    return int(hits[0]) if len(hits) else None


def onsets(flags: np.ndarray, keep: np.ndarray) -> int:
    """Number of alarm episodes that START on a kept day."""
    rising = flags & ~np.concatenate([[False], flags[:-1]])
    return int((rising & keep).sum())


# ===== Metrics =====
def compute_metrics(signals: list[dict], p_yellow: float, k: int, calib_days: int) -> dict:
    """Detection, delay, lead time and false-alarm metrics for one threshold setting."""
    per_astronaut, fa_onsets, fa_days = [], {m: 0 for m in METHODS}, 0
    for s in signals:
        flags = {"AE": ae_alarm(s["sai"], p_yellow, k), "B1": s["B1"], "B2": s["B2"]}
        days = s["days"]
        healthy_end = s["start"] if s["scenario"] != "none" else int(days.max()) + 1
        keep = (days > calib_days) & (days < healthy_end)
        fa_days += int(keep.sum())
        for m in METHODS:
            fa_onsets[m] += onsets(flags[m], keep)
        row = {"astronaut": s["astronaut"], "scenario": s["scenario"], "start": s["start"]}
        if s["scenario"] != "none":
            for m in METHODS:
                row[f"first_{m}"] = first_day(flags[m], days, s["start"])
        per_astronaut.append(row)

    weeks = fa_days / 7.0
    metrics = {"p_yellow": p_yellow, "persistence_days": k,
               "false_alarms_per_astronaut_week": {m: round(fa_onsets[m] / weeks, 3) for m in METHODS},
               "healthy_weeks_observed": round(weeks, 1), "scenarios": {}}
    last_day = int(max(s["days"].max() for s in signals))
    for scenario in sorted({r["scenario"] for r in per_astronaut} - {"none"}):
        rows = [r for r in per_astronaut if r["scenario"] == scenario]
        block: dict = {"n": len(rows)}
        for m in METHODS:
            firsts = [r[f"first_{m}"] for r in rows]
            delays = [f - r["start"] for f, r in zip(firsts, rows) if f is not None]
            block[f"detection_rate_{m}"] = round(sum(f is not None for f in firsts) / len(rows), 3)
            block[f"median_delay_days_{m}"] = round(median(delays), 1) if delays else None
        for b in ["B1", "B2"]:
            both = [r[f"first_{b}"] - r["first_AE"] for r in rows
                    if r["first_AE"] is not None and r[f"first_{b}"] is not None]
            only_ae = [last_day + 1 - r["first_AE"] for r in rows
                       if r["first_AE"] is not None and r[f"first_{b}"] is None]
            block[f"lead_vs_{b}"] = {
                "both_detected": len(both),
                "median_days": round(median(both), 1) if both else None,
                "mean_days": round(float(np.mean(both)), 2) if both else None,
                "sd_days": round(float(np.std(both, ddof=1)), 2) if len(both) > 1 else None,
                "only_AE_detected": len(only_ae),
                "only_AE_lead_lower_bound_median": round(median(only_ae), 1) if only_ae else None,
                f"only_{b}_detected": sum(1 for r in rows if r["first_AE"] is None and r[f"first_{b}"] is not None),
                "values": both,
            }
        metrics["scenarios"][scenario] = block
    metrics["per_astronaut"] = per_astronaut
    return metrics


# ===== Tuning =====
def tune_p_yellow(signals: list[dict], k: int, calib_days: int, max_fa: float) -> tuple[float, list[dict]]:
    """Lowest P_yellow (most sensitive) whose AE false-alarm rate on dev is within the budget."""
    table, chosen = [], None
    for p in YELLOW_GRID:
        m = compute_metrics(signals, p, k, calib_days)
        fa = m["false_alarms_per_astronaut_week"]["AE"]
        det = {s: b["detection_rate_AE"] for s, b in m["scenarios"].items()}
        table.append({"p_yellow": p, "fa_per_week_AE": fa, "detection_rate_AE": det})
        if chosen is None and fa <= max_fa:
            chosen = p
    return (chosen if chosen is not None else YELLOW_GRID[-1]), table


def write_threshold(config_path, key: str, value: float) -> None:
    """Replace `key: <number>` in the YAML file while keeping its comments."""
    text = open(config_path, "r", encoding="utf-8").read()
    text = re.sub(rf"(^\s*{key}:\s*)[0-9.]+", rf"\g<1>{value:g}", text, count=1, flags=re.M)
    open(config_path, "w", encoding="utf-8").write(text)


# ===== Reporting =====
def markdown_table(metrics: dict, title: str) -> str:
    """Compact markdown summary for README."""
    fa = metrics["false_alarms_per_astronaut_week"]
    lines = [f"### {title}", "",
             f"P_yellow = {metrics['p_yellow']}, persistence = {metrics['persistence_days']} days. {DISCLAIMER}", "",
             "| Scenario | n | Detected AE / B1 / B2 | Median delay (days) AE / B1 / B2 | Lead vs B1: median (both detected) · only AE | Lead vs B2: median (both detected) · only AE |",
             "|---|---|---|---|---|---|"]
    for name, b in metrics["scenarios"].items():
        det = " / ".join(f"{b[f'detection_rate_{m}']:.0%}" for m in METHODS)
        dly = " / ".join("–" if b[f"median_delay_days_{m}"] is None else f"{b[f'median_delay_days_{m}']:g}" for m in METHODS)
        lead = []
        for x in ["B1", "B2"]:
            L = b[f"lead_vs_{x}"]
            med = "–" if L["median_days"] is None else f"{L['median_days']:+g} d (n={L['both_detected']})"
            lead.append(f"{med} · {L['only_AE_detected']}")
        lines.append(f"| {name} | {b['n']} | {det} | {dly} | {lead[0]} | {lead[1]} |")
    lines += ["", f"False alarms per astronaut-week (healthy days after calibration): "
                  f"AE {fa['AE']}, B1 {fa['B1']}, B2 {fa['B2']}.", ""]
    return "\n".join(lines).replace(" AE", " Model").replace("only AE", "only model")


def git_commit() -> str:
    """Current git commit hash, or 'unavailable'."""
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return "unavailable"


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate the autoencoder against B1 and B2.")
    parser.add_argument("--split", default="dev", choices=["bench", "dev", "dev_s4", "test"])
    parser.add_argument("--tune", action="store_true", help="Tune P_yellow on dev and write it to config/model.yaml.")
    parser.add_argument("--final", action="store_true", help="Required for the one-time hold-out test.")
    parser.add_argument("--no-sensitivity", action="store_true")
    args = parser.parse_args()

    if args.split == "test" and not args.final:
        sys.exit("The test split is the one-time hold-out. Run with --final, once, after freezing the configs.")
    if args.split == "test" and FINAL_PATH.exists():
        sys.exit(f"{FINAL_PATH} already exists: the hold-out test has been run. It must not be re-run.")
    if args.tune and args.split not in ("bench", "dev"):
        sys.exit("Tuning is allowed on the selection splits only (bench, dev).")

    model_path = CONFIG_DIR / "model.yaml"
    cfgs = {"model": load_yaml(model_path), "sim": load_yaml(CONFIG_DIR / "simulation.yaml"),
            "rules": load_yaml(CONFIG_DIR / "rules.yaml")}
    scorer = load_scorer(cfgs["model"])
    k = int(cfgs["model"]["scoring"]["persistence_days"])
    calib = int(val(cfgs["sim"]["mission"]["calibration_days"]))

    sigs = crew_signals(load_split(args.split), cfgs, scorer)

    if args.tune:
        p_y, tuning = tune_p_yellow(sigs, k, calib, float(cfgs["model"]["scoring"]["max_false_alarms_per_week"]))
        write_threshold(model_path, "p_yellow", p_y)
        cfgs["model"] = load_yaml(model_path)
        write_json(RESULTS_DIR / f"{args.split}_tuning.json", {"chosen_p_yellow": p_y, "grid": tuning})
        print(f"Tuned on {args.split}: P_yellow = {p_y} (written to config/model.yaml)")
        for row in tuning:
            print(f"  P_yellow {row['p_yellow']:>4}: FA/week {row['fa_per_week_AE']:.3f}  detection {row['detection_rate_AE']}")

    p_yellow = float(cfgs["model"]["scoring"]["p_yellow"])
    result = compute_metrics(sigs, p_yellow, k, calib)
    result["model_hash"] = file_hash(MODELS_DIR / "ae.pt")
    result["config_hashes"] = {name: config_hash(c) for name, c in cfgs.items()}

    if args.split == "test":
        result.update({"timestamp_utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                       "git_commit": git_commit(),
                       "note": "S5 was never seen during development and was evaluated once."})
        write_json(FINAL_PATH, result)
        write_json(RESULTS_DIR / "test_metrics.json", result)   # same content, name used by figures
        (RESULTS_DIR / "final_test.md").write_text(markdown_table(result, "Hold-out test (S5)"), encoding="utf-8")
        print(markdown_table(result, "Hold-out test (S5)"))
        sys.exit(0)

    extra_md = ""
    if args.split in ("dev", "bench") and not args.no_sensitivity:
        # Same seeds, scenario sizes × 0.5 / 1.0 / 1.5.
        scale_signals = {}
        for scale in [0.5, 1.0, 1.5]:
            crew_s, _ = build_split(cfgs["sim"], args.split, scale)
            scale_signals[scale] = crew_signals(crew_s, cfgs, scorer)

        def summary(metrics: dict) -> dict:
            return {s: {"detection_rate": {x: b[f"detection_rate_{x}"] for x in METHODS},
                        "median_delay_days": {x: b[f"median_delay_days_{x}"] for x in METHODS},
                        "median_lead_vs_B1": b["lead_vs_B1"]["median_days"],
                        "median_lead_vs_B2": b["lead_vs_B2"]["median_days"]}
                    for s, b in metrics["scenarios"].items()}

        result["sensitivity"] = {str(s): summary(compute_metrics(sig, p_yellow, k, calib))
                                 for s, sig in scale_signals.items()}

        # Fairness check: AE at the most sensitive threshold whose false-alarm rate does not exceed B2's.
        fa_b2 = result["false_alarms_per_astronaut_week"]["B2"]
        matched = next((p for p in YELLOW_GRID + [99.5]
                        if compute_metrics(sigs, p, k, calib)["false_alarms_per_astronaut_week"]["AE"] <= fa_b2), 99.5)
        result["fa_matched_vs_B2"] = {
            "p_yellow": matched,
            "false_alarms_per_astronaut_week": compute_metrics(sigs, matched, k, calib)["false_alarms_per_astronaut_week"],
            "by_scale": {str(s): summary(compute_metrics(sig, matched, k, calib)) for s, sig in scale_signals.items()},
        }
        lines = ["### Sensitivity to scenario size (detection rate AE / B1 / B2)", "",
                 "| Scale | " + " | ".join(result["scenarios"].keys()) + " |",
                 "|---|" + "---|" * len(result["scenarios"])]
        for s, block in result["sensitivity"].items():
            cells = [" / ".join(f"{v['detection_rate'][x]:.0%}" for x in METHODS) for v in block.values()]
            lines.append(f"| × {s} | " + " | ".join(cells) + " |")
        fm = result["fa_matched_vs_B2"]
        lines += ["", f"### False-alarm-matched comparison with B2 (model at P_yellow = {fm['p_yellow']:g}, "
                      f"AE {fm['false_alarms_per_astronaut_week']['AE']} vs B2 {fm['false_alarms_per_astronaut_week']['B2']} false alarms per astronaut-week)", "",
                  "| Scale | " + " | ".join(f"{s}: detected AE / B2" for s in result["scenarios"]) + " |",
                  "|---|" + "---|" * len(result["scenarios"])]
        for s, block in fm["by_scale"].items():
            cells = [f"{v['detection_rate']['AE']:.0%} / {v['detection_rate']['B2']:.0%}" for v in block.values()]
            lines.append(f"| × {s} | " + " | ".join(cells) + " |")
        extra_md = ("\n".join(lines) + "\n").replace(" AE", " Model")

    name = args.split
    write_json(RESULTS_DIR / f"{name}_metrics.json", result)
    titles = {"bench": "Selection split (bench)", "dev": "Confirmation split (dev, thresholds frozen)"}
    report = markdown_table(result, titles.get(name, name)) + "\n" + extra_md
    (RESULTS_DIR / f"{name}_metrics.md").write_text(report, encoding="utf-8")
    print(report)
