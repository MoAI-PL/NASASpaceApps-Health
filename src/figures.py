# Astrobalance — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Slide-ready figures (1600 × 900 px). No logos; every figure carries the synthetic-data footer.

Usage:
    python -m src.figures --healthy-check     # M1: plausibility of healthy synthetic astronauts
    python -m src.figures --timeline-demo     # M3: Crew Member Bravo, model vs baselines
    python -m src.figures --lead-time         # M3/M4: lead time vs B1 / B2 (dev, and test once it exists)
    python -m src.figures --benchmark         # model-selection benchmark
    python -m src.figures --all
"""

# ===== Imports =====
from __future__ import annotations

import argparse

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from src.common import (CONFIG_DIR, DISCLAIMER, FIGURES_DIR, INDICATORS, RESULTS_DIR, UI_OUT_DIR,  # noqa: E402
                        load_yaml, read_json)

# ===== Style (validated categorical slots 1-3, light surface) =====
SURFACE, INK, INK_2, MUTED, GRID, AXIS = "#fcfcfb", "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7"
SERIES = ["#2a78d6", "#eb6834", "#1baf7a"]
TINT = "#f0efec"
plt.rcParams.update({
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
    "font.family": "sans-serif", "font.sans-serif": ["Segoe UI", "DejaVu Sans", "Arial"],
    "axes.edgecolor": AXIS, "axes.labelcolor": INK_2, "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8, "axes.spines.top": False,
    "axes.spines.right": False, "font.size": 15,
})
LABELS = {"sys": "Systolic BP (mmHg)", "dia": "Diastolic BP (mmHg)", "hr": "Resting HR (bpm)",
          "glucose": "Glucose (mg/dL)", "temp": "Temperature (°C)", "sleep_h": "Sleep (h)",
          "mood": "Mood (1–5)", "reaction_ms": "Reaction time (ms)"}


def footer(fig) -> None:
    """Honest-labelling footer required on every figure."""
    fig.text(0.01, 0.012, DISCLAIMER, color=MUTED, fontsize=12, ha="left", va="bottom")


# ===== Figures =====
def healthy_check() -> None:
    """Three healthy training astronauts across all eight indicators."""
    from src.simulate import load_split

    crew = load_split("train")
    ids = list(crew["astronaut"].unique()[:3])
    fig, axes = plt.subplots(2, 4, figsize=(16, 9), dpi=100, sharex=True)
    for ax, f in zip(axes.ravel(), INDICATORS):
        for color, astro in zip(SERIES, ids):
            d = crew[crew["astronaut"] == astro]
            ax.plot(d["day"], d[f], color=color, linewidth=1.6, label=astro)
        ax.set_title(LABELS[f], fontsize=14, color=INK, loc="left")
    for ax in axes[1]:
        ax.set_xlabel("Mission day")
    axes[0, 0].legend(frameon=False, fontsize=12, loc="upper left")
    fig.suptitle("Healthy synthetic astronauts stay within physiological ranges", x=0.01, ha="left",
                 fontsize=20, color=INK, fontweight="bold")
    footer(fig)
    fig.tight_layout(rect=(0, 0.03, 1, 0.95))
    fig.savefig(FIGURES_DIR / "healthy_check.png")
    plt.close(fig)


def first_on_or_after(days: list[int], flags: list[bool], start: int) -> int | None:
    """First alarm day on or after the scenario start."""
    return next((d for d, f in zip(days, flags) if f and d >= start), None)


def timeline_demo(astronaut: str = "A2") -> None:
    """SAI of one demo crew member with the scenario period and the first alarm of each method."""
    records = [r for r in read_json(UI_OUT_DIR / "demo_crew.json") if r["astronaut"] == astronaut]
    sim = load_yaml(CONFIG_DIR / "simulation.yaml")
    model_cfg = load_yaml(CONFIG_DIR / "model.yaml")["scoring"]
    member = next(m for m in sim["splits"]["demo"]["crew"] if m["id"] == astronaut)
    start, name = int(member.get("start_day", 0)), member["display_name"]
    scen_name = sim["scenarios"][member["scenario"]]["name"] if member["scenario"] != "none" else "none"
    days = [r["day"] for r in records]
    sai = [np.nan if r["sai"] is None else r["sai"] for r in records]
    first = {
        "Model (SAI)": first_on_or_after(days, [r["level"] != "green" for r in records], start),
        "Fixed clinical thresholds": first_on_or_after(days, [r["rule_alert"] for r in records], start),
        "Personal single-indicator thresholds": first_on_or_after(days, [r["univariate_alert"] for r in records], start),
    }

    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    ax.axvspan(start, max(days) + 0.5, color=TINT, zorder=0)
    ax.text(start + 1, 103, f"{scen_name} injected (ramps up from day {start})", color=INK_2, fontsize=13, va="bottom")
    for p, label in [(model_cfg["p_yellow"], "Yellow"), (model_cfg["p_orange"], "Orange")]:
        ax.axhline(p, color=MUTED, linewidth=1, linestyle=(0, (4, 4)))
        ax.text(1, p + 0.8, f"{label} threshold (P{p:g})", color=INK_2, fontsize=12)
    ax.plot(days, sai, color=SERIES[0], linewidth=2)
    for i, (label, day) in reversed(list(enumerate(first.items()))):
        if day is None:
            ax.text(2, 18 - 7 * i, f"{label}: no alarm by day {max(days)}", color=INK_2, fontsize=13)
            continue
        ax.axvline(day, color=SERIES[i], linewidth=2.5 if i == 0 else 2,
                   linestyle="-" if i == 0 else (0, (6, 3)), zorder=3 - i)
        ax.text(day + 0.6, 30 - 9 * i, f"{label}\nfirst alarm: day {day}", color=INK, fontsize=13, va="top",
                bbox={"facecolor": SURFACE, "edgecolor": SERIES[i], "boxstyle": "round,pad=0.3"})
    pre = [d for d, r, prev in zip(days, records, [None] + records[:-1])
           if d < start and r["level"] != "green" and (prev is None or prev["level"] == "green")]
    for d in pre:
        ax.annotate(f"false alarm\n(day {d})", xy=(d, 97), xytext=(d - 9, 104), fontsize=12, color=INK_2,
                    arrowprops={"arrowstyle": "-", "color": MUTED})
    ax.set_xlim(1, max(days))
    ax.set_ylim(0, 112)
    ax.set_xlabel("Mission day")
    ax.set_ylabel("Systemic Anomaly Index (SAI, 0–100)")
    m, b1 = first["Model (SAI)"], first["Fixed clinical thresholds"]
    title = f"{name}: model alarm on day {m}" if m else f"{name}: no model alarm"
    if m and b1:
        title += f", {b1 - m} days before fixed clinical thresholds"
    ax.set_title(title, loc="left", fontsize=18, color=INK, fontweight="bold", pad=28)
    footer(fig)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(FIGURES_DIR / "timeline_demo.png")
    plt.close(fig)


def lead_time(split: str = "dev") -> None:
    """Per-astronaut lead time of the model over B1 and B2 (positive = model earlier)."""
    metrics = read_json(RESULTS_DIR / f"{split}_metrics.json")
    scenarios = list(metrics["scenarios"].keys())
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    rng = np.random.default_rng(0)
    for j, (base, color, label) in enumerate([("B1", SERIES[1], "vs fixed clinical thresholds (B1)"),
                                              ("B2", SERIES[2], "vs personal single-indicator thresholds (B2)")]):
        for i, s in enumerate(scenarios):
            values = metrics["scenarios"][s][f"lead_vs_{base}"]["values"]
            x = i + (j - 0.5) * 0.36
            if values:
                ax.scatter(x + rng.uniform(-0.07, 0.07, len(values)), values, s=70, color=color,
                           edgecolor=SURFACE, linewidth=1.5, zorder=3, label=label if i == 0 else None)
                med = float(np.median(values))
                ax.plot([x - 0.13, x + 0.13], [med, med], color=INK, linewidth=2.5, zorder=4)
                ax.text(x + 0.15, med, f"median {med:+g} d", color=INK, fontsize=12, va="center")
            only_ae = metrics["scenarios"][s][f"lead_vs_{base}"]["only_AE_detected"]
            if only_ae:
                ax.text(x, ax.get_ylim()[0] if False else -26, f"+{only_ae} found\nonly by model",
                        color=INK_2, fontsize=11, ha="center", va="top")
    ax.axhline(0, color=AXIS, linewidth=1.5)
    names = load_yaml(CONFIG_DIR / "simulation.yaml")["scenarios"]
    ax.set_xticks(range(len(scenarios)), [f"{s}\n{names[s]['name']}" for s in scenarios])
    ax.set_ylabel("Days the model alarms earlier (positive) or later (negative)")
    ax.set_ylim(-32, max(32, ax.get_ylim()[1]))
    ax.legend(frameon=False, loc="upper right", fontsize=13)
    fa = metrics["false_alarms_per_astronaut_week"]
    meds = {b: [metrics["scenarios"][s][f"lead_vs_{b}"]["median_days"] for s in scenarios] for b in ["B1", "B2"]}
    titles = {"dev": "Confirmation split (thresholds frozen)", "test": "Hold-out test (never seen in development)"}
    lead_b2 = ", ".join(f"{s} {m:+g} d" for s, m in zip(scenarios, meds["B2"]) if m is not None)
    ax.set_title(f"{titles.get(split, split)}: median lead vs personal thresholds {lead_b2}",
                 loc="left", fontsize=16, color=INK, fontweight="bold", pad=34)
    n = metrics["scenarios"][scenarios[0]]["n"]
    ax.text(0, 1.02, f"{n} astronauts per scenario. False alarms per astronaut-week: "
                     f"model {fa['AE']}, B1 {fa['B1']}, B2 {fa['B2']}.", transform=ax.transAxes,
            color=INK_2, fontsize=13)
    footer(fig)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(FIGURES_DIR / f"lead_time_{split}.png")
    plt.close(fig)


def benchmark_chart() -> None:
    """Early-detection rate at an equal false-alarm budget: best variant of each method family."""
    rows = read_json(RESULTS_DIR / "benchmark.json")["rows"]
    families = [
        ("Fixed clinical thresholds (B1)*", lambda m: m.startswith("B1")),
        ("Personal single-indicator thresholds (B2)", lambda m: m.startswith("B2")),
        ("Autoencoder, single model", lambda m: m.startswith("AE w") and "fine-tuning" not in m),
        ("Autoencoder + personal fine-tuning", lambda m: "fine-tuning" in m),
        ("Autoencoder ensemble ×5", lambda m: m.startswith("AE ensemble")),
        ("Multivariate personal-drift model (chosen)", lambda m: m == "Classical Mahalanobis, 7-day mean (drift)"),
    ]
    best = []
    for label, match in families:
        cand = [r for r in rows if match(r["method"]) and r["budget"] in (0.05, "fixed")]
        top = max(cand, key=lambda r: r["early_detection"])
        best.append((label, top["early_detection"], top["false_alarms_per_week"]))
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    y = np.arange(len(best))
    colors = [MUTED] * (len(best) - 1) + [SERIES[0]]
    ax.barh(y, [b[1] * 100 for b in best], color=colors, height=0.55)
    for i, (label, early, fa) in enumerate(best):
        ax.text(early * 100 + 1, i, f"{early:.0%}", va="center", fontsize=15, color=INK, fontweight="bold")
    ax.set_yticks(y, [b[0] for b in best], fontsize=14)
    ax.set_xlim(0, 100)
    ax.set_xlabel("Scenarios detected within 21 days of onset (%), S1–S3 at sizes × 0.5 and × 1.0")
    ax.grid(axis="y", visible=False)
    fig.suptitle("Same false-alarm budget: the personal-drift model catches the most changes early",
                 x=0.01, ha="left", fontsize=18, color=INK, fontweight="bold")
    fig.text(0.01, 0.905, "Selection split: 120 scenario + 40 healthy astronauts. Every method tuned to ≤ 0.05 false alarms "
                          "per astronaut-week (*B1 has fixed thresholds: 0.084).", color=INK_2, fontsize=13)
    footer(fig)
    fig.tight_layout(rect=(0, 0.03, 1, 0.89))
    fig.savefig(FIGURES_DIR / "benchmark.png")
    plt.close(fig)


# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Render slide-ready figures.")
    parser.add_argument("--healthy-check", action="store_true")
    parser.add_argument("--timeline-demo", action="store_true")
    parser.add_argument("--lead-time", action="store_true")
    parser.add_argument("--benchmark", action="store_true")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    if args.healthy_check or args.all:
        healthy_check()
    if args.timeline_demo or args.all:
        timeline_demo()
    if args.lead_time or args.all:
        lead_time("dev")
        if (RESULTS_DIR / "test_metrics.json").exists():
            lead_time("test")
    if args.benchmark or args.all:
        if (RESULTS_DIR / "benchmark.json").exists():
            benchmark_chart()
    print(f"Figures written to {FIGURES_DIR}")
