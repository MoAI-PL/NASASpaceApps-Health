# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
"""Run the whole development pipeline in order (never the one-time hold-out test).

Usage:
    python -m src.run_all              # simulate → fit → tune on bench → confirm on dev → export → figures
    python -m src.run_all --benchmark  # also rerun the model-selection benchmark
    python -m src.run_all --device cuda
"""

# ===== Imports =====
from __future__ import annotations

import argparse
import subprocess
import sys

# ===== Steps =====
STEPS = [
    ["-m", "src.donki", "--start", "2024-05-01", "--days", "120"],
    ["-m", "src.simulate"],
    ["-m", "src.export", "--sample"],
    ["-m", "src.train"],
    ["-m", "src.evaluate", "--split", "bench", "--tune"],   # threshold tuned on the selection split only
    ["-m", "src.evaluate", "--split", "dev"],               # confirmation with frozen thresholds
    ["-m", "src.export", "--crew", "demo"],
    ["-m", "src.figures", "--all"],
]
BENCHMARK = ["-m", "src.benchmark"]

# ===== Main =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the development pipeline.")
    parser.add_argument("--device", default=None, help="Passed to training: auto | cpu | cuda.")
    parser.add_argument("--benchmark", action="store_true", help="Also rerun the model-selection benchmark (~5 min).")
    args = parser.parse_args()
    steps = STEPS[:4] + ([BENCHMARK] if args.benchmark else []) + STEPS[4:]
    for step in steps:
        cmd = [sys.executable, *step]
        if step[1] == "src.train" and args.device:
            cmd += ["--device", args.device]
        print("\n$ python " + " ".join(step), flush=True)
        result = subprocess.run(cmd)
        if result.returncode != 0 and step[1] != "src.donki":   # DONKI may fail offline; cache fallback
            sys.exit(result.returncode)
    print("\nDone. Hold-out test NOT run (python -m src.evaluate --split test --final, once).")
