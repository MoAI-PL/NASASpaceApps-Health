# CLAUDE.md — Baseline (NASA Space Apps 2026)

Read this file and `PLAN.md` before doing anything. `PLAN.md` is the source of truth for tasks,
order and acceptance criteria. Work milestone by milestone; do not start a milestone before the
previous one meets its acceptance criteria.

## What we are building

**Baseline** — health-monitoring software that lets astronauts assess their own health on long
missions. Challenge: "Create Health Monitoring Software for Astronauts on Space Missions"
(NASA Space Apps Challenge 2026, challenge author: Brazilian Space Agency).

Two paths:
- **Prevent** — one unsupervised model (dense autoencoder) learns each astronaut's personal normal
  from daily health indicators and flags multivariate drift before any single value crosses a limit.
- **Respond** — fixed critical thresholds and an emergency mode that work independently of the model.

The main number shown to the crew is the **Systemic Anomaly Index (SAI)**, 0–100. Every NASA HRP
hazard (radiation, isolation, distance, gravity, closed environment) is visible in the product
(`PLAN.md` section 0.1). The UI is React + Tailwind, offline-first (bundled JSON, no backend) and
language-agnostic (colour + icon + shape for every state, short English labels, large tap targets).
Earth spin-off: the same monitoring for isolated crews on Earth (e.g. Antarctic stations).

Hypothesis we test: *an unsupervised model of the personal normal detects health deterioration
earlier than fixed thresholds and per-feature personal thresholds, at a comparable false-alarm rate,
including for a scenario type it never saw during development (hold-out S5).*

## Team and ownership

- ML (this repo's `src/`, `config/`, `outputs/`): Jan.
- UI (`ui/`): two teammates. The ML side talks to the UI only through the JSON contract in
  `schemas/` and files in `outputs/ui/`. Never change the contract without updating the schema,
  `outputs/ui/sample.json` and the "Contract changes" log at the bottom of `PLAN.md`.

## Hard rules (competition compliance — breaking these can disqualify us)

1. **English everywhere**: code, comments, docstrings, README, commit messages, UI text, figures.
2. **No real people**: synthetic astronauts only, IDs `A1`–`A3`, display names "Crew Member Alpha / Bravo / Charlie"; no real astronaut names.
3. **Cite every source**: every number in `config/*.yaml` has a `source` (URL or reference) or
   `assumption: true`. Never invent a source. If you cannot verify a value, mark it as an assumption.
   Every external library, dataset, font, icon or text goes into `README.md` → References with its license.
4. **Open licenses only** for third-party material; our code is Apache-2.0 (`LICENSE`).
5. **AI disclosure**: this code is written with AI assistance. Every source file starts with the header
   below, and `README.md` has a "Use of AI" section describing what AI was used for.
6. **No NASA logos or branding** in any figure, image or UI asset we create.
7. **Hold-out discipline**: scenario S5 is the final test. Never look at S5 data, never tune on it,
   never run the test split more than once (see `PLAN.md`, M4). Report the result as it is.
8. **Honest labelling**: every figure and README result states "synthetic data calibrated on published
   sources — proof of concept, not clinical validation". Not a medical device.

File header (Python):

```python
# Baseline — NASA Space Apps Challenge 2026
# AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
```

## Code conventions

- Python 3.11, conda env `spaceapps` from `environment.yml`. Must run on Windows and Linux: use `pathlib`, no shell-specific paths.
- Scripts are run from the terminal from the repo root, e.g. `python -m src.simulate --config config/simulation.yaml`. No notebooks in the deliverable.
- Each script: sections separated by comment frames (`# ===== Section name =====`), all executable logic under `if __name__ == "__main__":`, arguments via `argparse`.
- Deterministic: every random step takes an explicit seed; the same command gives the same output.
- Small, single-purpose functions with docstrings; type hints on public functions.
- Data files: CSV for tabular data, JSON for UI output, YAML for configuration.
- Never delete `data/` or `outputs/` content you did not create in the current task; never overwrite `outputs/results/final_test.json`.
- After each milestone: run `pytest -q`, update `README.md` sections touched, and summarise what changed and what is next.

## Commands (keep this list up to date)

```bash
conda env create -f environment.yml && conda activate spaceapps
python -m src.donki --start 2024-05-01 --days 120          # cache real SEP events (M1)
python -m src.simulate --config config/simulation.yaml       # synthetic crews (M1)
python -m src.train --config config/model.yaml               # train the autoencoder (M2)
python -m src.evaluate --split dev --tune                    # tune P_yellow on dev only + evaluate (M2)
python -m src.export --sample                                # contract sample for the UI (M0)
python -m src.export --crew demo                             # JSON for the UI + ui/concept/data.js (M3)
python -m src.figures --all                                  # slide figures (M1/M3)
python -m src.report_sources > outputs/results/config_sources.md   # sourced vs assumption table
python -m src.run_all [--device cuda]                        # all of the above in order (no hold-out)
python -m src.evaluate --split test --final                  # ONE-TIME hold-out test (M4)
pytest -q
```
