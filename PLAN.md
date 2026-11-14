# PLAN.md — Baseline: build plan for Claude Code

Event window: Sat 14 Nov 2026 09:00 → Sun 15 Nov 2026, submission target 22:00 (hard deadline 23:59 local).
Work in milestone order. Each milestone lists tasks, files, and acceptance criteria (AC).
A milestone is done only when all its AC pass. If a milestone overruns its timebox, cut COULD items, never AC.

---

## 0. Decisions already made (do not reopen)

| Topic | Decision |
|---|---|
| Model (updated after benchmark, 2026-11-13) | ONE unsupervised model: multivariate personal-drift model — Mahalanobis distance of the weighted 7-day mean of personal z-scores from a Gaussian fitted on 300 healthy astronauts (`src/drift.py`). It won the benchmark (`outputs/results/benchmark.md`) against 9 autoencoders, ensembles, fine-tuning and hybrids. The autoencoder stays available as `detector: autoencoder`. Persistence 3 days, P_yellow 92 tuned on the `bench` split |
| Anomaly score (updated in M2) | reconstruction error + latent Mahalanobis distance, each normalised by its healthy-training mean (v1 = reconstruction only missed 40 % of S2 on dev; see README → Results) |
| Explanation (updated in M2) | share of each indicator in the window's weighted squared personal z-score ("what moved"); the model decides whether the combination is anomalous |
| Why AE *(superseded by the drift model)* | Per-feature reconstruction error gives the explanation the UI needs (body-map colours, "what changed"); learns non-linear correlations between indicators; windows capture trends |
| Small-data fix *(autoencoder only — superseded)* | One AE trained on healthy windows pooled from many simulated astronauts; personalisation = each astronaut normalised against their OWN calibration period (days 1–21) |
| Baselines (not models) | B1 fixed clinical thresholds; B2 personal univariate thresholds (any feature \|z\| > 3). Both use the same 2-day persistence as the AE |
| Indicators | sys, dia (mmHg), hr (bpm, resting), glucose (mg/dL, fasting), temp (°C), sleep_h (h), mood (1–5), reaction_ms (ms) |
| Context inputs | exercise_min (fed to AE). radiation_mGy and cabin_co2_mmHg are hazard-exposure context for the UI and rules only, NOT fed to the AE (an exposure is not a physiological deviation) |
| Index name | Systemic Anomaly Index (SAI), 0–100, JSON key `sai` |
| Crew naming | IDs A1–A3, display names "Crew Member Alpha / Bravo / Charlie" |
| UI stack | React + Tailwind, offline-first: static JSON bundled with the app, no backend, works without network |
| Hazard map | Every NASA HRP hazard is visible in the product — see section 0.1 |
| Granularity | One record per astronaut per day, 120 mission days |
| Stack | Python 3.11, numpy, pandas, PyTorch (CPU), matplotlib, pyyaml, requests, jsonschema, pytest |

### 0.1 NASA HRP hazard coverage (used in README, UI and slides)

| NASA HRP hazard | How Baseline covers it | Data |
|---|---|---|
| Space radiation | daily and cumulative absorbed dose, alerts on solar particle events | real DONKI SEP events + assumed dose model |
| Isolation & confinement | mind_sleep system (sleep, mood, reaction time); AE detects joint drift (S2) | synthetic |
| Distance from Earth | escalation ladder and Earth-report queue depend on one-way communication delay | config per environment |
| Gravity fields | heart system (sys, dia, hr, exercise); cardiovascular deconditioning (S1) | synthetic |
| Hostile & closed environment | cabin CO2 context with limit alerts; infection onset (S5) via temp and hr | synthetic |

Bone loss is not measurable with daily self-measurements: state this in README → Limitations.

### 0.2 Considered and not adopted (do not reopen)

- **VAE instead of AE:** extra hyperparameters (KL weight), noisier sampling-based score, no clear gain on 63-dimensional daily data within 48 h.
- **High-frequency wearable streams (HRV, SpO2, respiratory rate):** the challenge names blood pressure, heart rate, blood sugar, temperature, sleep and mood; daily data matches what astronauts can self-measure. Possible future work.
- **FastAPI backend, PyTorch Mobile:** not needed for the demo; precomputed JSON plus an optional ONNX export (M6) shows edge readiness.
- **Real-time online learning:** daily batch scoring is enough and easier to validate.

---

## 1. Repository layout (create in M0)

```
baseline/
├── CLAUDE.md  PLAN.md  README.md  LICENSE (Apache-2.0)  environment.yml  .gitignore
├── config/
│   ├── simulation.yaml     # population ranges, noise, scenarios — each value with source or assumption
│   ├── model.yaml          # AE architecture, training, window, persistence
│   ├── rules.yaml          # B1 fixed thresholds + critical (red) limits — each with source
│   └── ui.yaml             # systems mapping, prompts, environments, escalation ladder
├── schemas/day_record.schema.json
├── src/
│   ├── donki.py   simulate.py   features.py   model.py   train.py
│   ├── baselines.py   scoring.py   evaluate.py   export.py   figures.py
│   └── __init__.py
├── data/
│   ├── raw/donki_sep.json          # cached API response
│   └── synthetic/<split>/*.csv     # generated, gitignored except demo
├── outputs/
│   ├── models/ae.pt  outputs/models/reference_scores.npy
│   ├── results/dev_metrics.json  results/final_test.json
│   ├── figures/*.png
│   └── ui/sample.json  ui/demo_crew.json  ui/meta.json
├── tests/ test_simulate.py  test_features.py  test_export.py
└── ui/   # owned by the UI team
```

---

## Status (2026-11-13, after benchmark)

Benchmark done; detector switched to the personal-drift model; confirmed on dev; **M4 hold-out run once** (S5: detected 100 %, median lead +7.5 d vs B2, +5 d vs B1; false alarms 0.071 per astronaut-week). Remaining: DONKI cache with internet, final UI, pitch.

## Status (2026-11-13 evening, superseded)

M0–M3 done and validated (`pytest -q`: 17 passed); M6 sensor-fault flag done; concept UI in `ui/concept/`.
Open items: run `python -m src.donki` with internet (DONKI was unreachable from the build sandbox),
then `python -m src.run_all`; M4 hold-out (once); M5 README review; UI team builds the final app.
Dev finding to discuss before M4: the model beats fixed thresholds (B1) but is only on par with
personal single-indicator thresholds (B2) — see README → Results.

## M0 — Scaffold and UI contract (Sat 09:00–10:00)

Tasks
1. Create the layout above, `environment.yml` (env name `spaceapps`), `.gitignore` (ignore `data/synthetic/**` except `demo/`, `outputs/models/`), `LICENSE` (Apache-2.0), README skeleton with sections: Overview, How it works, Data & sources, Results, Limitations, Use of AI, References, License, Disclaimer.
2. Write `schemas/day_record.schema.json` for the record below and a hand-made `outputs/ui/sample.json` with 3 astronauts × 30 days that validates against it. The UI team starts from this file immediately.
3. Write `outputs/ui/meta.json` skeleton: feature names, units, display names, systems mapping, environments.

Day record (one per astronaut per day):

```json
{
  "astronaut": "A2", "display_name": "Crew Member Bravo",
  "day": 57, "date": "2024-06-26", "env": "mars_transit",
  "values": {"sys": 124, "dia": 80, "hr": 71, "glucose": 93, "temp": 36.7,
             "sleep_h": 5.9, "mood": 3, "reaction_ms": 301, "exercise_min": 35},
  "context": {"radiation_mGy": 0.5, "radiation_cum_mGy": 28.4, "cabin_co2_mmHg": 2.6},
  "missing": [],
  "sai": 87, "level": "yellow",
  "rule_alert": false, "critical": false,
  "contributions": {"hr": 0.38, "sys": 0.27, "dia": 0.14, "sleep_h": 0.09, "other": 0.12},
  "systems": {"heart": "yellow", "metabolism": "green", "mind_sleep": "green", "immune_temp": "green"},
  "hazards": {"radiation": "green", "isolation": "green", "distance": "info",
              "gravity": "yellow", "closed_environment": "green"},
  "prompts": ["repeat_bp_hr_rest"],
  "escalation": "self_care",
  "events": ["sep_event"]
}
```

`level` and system / hazard statuses ∈ green | yellow | orange | red (`distance` is always `info`). `escalation` ∈ monitor | self_care | crew_medical_officer | flight_surgeon.

AC
- `conda env create -f environment.yml` works; `pytest -q` runs (even with placeholder tests).
- `sample.json` validates against the schema (test in `tests/test_export.py`).

---

## M1 — Data: real space-weather context + synthetic crews (Sat 10:00–13:00)

### M1.1 `src/donki.py`
- Fetch Solar Energetic Particle events from NASA DONKI: `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (queries ≤ 60 days each; chunk the window).
- Default mission window: start 2024-05-01, 120 days (covers the strong May 2024 solar activity). Mission day 1 = start date.
- Save the raw response to `data/raw/donki_sep.json`; if the network fails, load the cache.
- Output: list of mission days with an SEP event. Used for `radiation_mGy` spikes and `events` in the UI.

### M1.2 `config/simulation.yaml`
Every entry: `value`, `source` (URL/reference) or `assumption: true`. Starting values below are ASSUMPTIONS — keep them flagged unless a source is verified; do not invent sources.

| Feature | Population mean ± sd (between people) | Day-to-day sd (within person) |
|---|---|---|
| sys | 115 ± 10 | 5 |
| dia | 75 ± 7 | 4 |
| hr | 65 ± 8 | 3.5 |
| glucose | 90 ± 8 | 6 |
| temp | 36.6 ± 0.2 | 0.15 |
| sleep_h | 6.3 ± 0.5 | 0.6 |
| mood | 3.8 ± 0.4 | 0.5 |
| reaction_ms | 280 ± 30 | 15 |
| exercise_min | 120 ± 15 | 20 (rest day 1× per week) |
| radiation_mGy | 0.5 baseline/day (assumption), + spike on SEP days | — |
| cabin_co2_mmHg | 2.5 baseline (assumption); 2 episodes per mission of 1–3 days up to 5.0 (assumption); verify the limit with a NASA source | 0.3 |

Missing data: each value missing with p = 0.05.
Spaceflight adaptation effects: add only if a verified source gives direction and size; otherwise the baseline is stationary and this goes into README → Limitations.

### M1.3 `src/simulate.py`
- Each astronaut: personal means drawn from the population, personal day-to-day sd = config value × U(0.8, 1.2).
- Correlated day-to-day variation through two latent AR(1) processes (φ = 0.7):
  - `fatigue`: sleep_h ↓, mood ↓, reaction_ms ↑, hr ↑ (small)
  - `load`: exercise_min ↑ → next-day hr ↓ slightly, sleep_h ↑ slightly
  Loadings in config (assumption). Then add independent measurement noise. Round mood to 1–5 integers and clip all values to physiological ranges.
- Scenario injection, in units of the astronaut's personal day-to-day sd, with a linear ramp from start to full size over `ramp_days`, then held until day 120. Days 1–29 are always scenario-free.

| ID | Name | ramp_days | Shift at full size (personal sd) | Role |
|---|---|---|---|---|
| S1 | Cardiovascular deconditioning | 21 | hr +2.5, sys +2.0, dia +1.5, reaction +0.5; exercise −40 % | dev |
| S2 | Isolation & stress | 14 | sleep −2.0, mood −2.0, reaction +2.0, hr +1.0 | dev |
| S3 | Metabolic disturbance | 14 | glucose +2.5, sleep −1.0, mood −1.0 | dev |
| S4 | Sensor fault (COULD) | 0 | one feature +6 sd for 5 days, others unchanged | dev |
| S5 | Infection onset — HOLD-OUT | 5 | temp +2.5, hr +2.0, sleep −1.5, mood −1.5, reaction +1.0 | test only |

  Start day ~ U(30, 80). These sizes are fixed now, before any evaluation, and are documented in README.
- Ground-truth columns per row: `scenario` (none/S1…S5), `scenario_active` (bool), `scenario_start`.
- Splits (seeds must not overlap):

| Split | Seeds | Content |
|---|---|---|
| train | 1000–1059 | 60 astronauts, healthy only |
| val | 1500–1509 | 10 astronauts, healthy only (early stopping + reference scores) |
| dev | 2000–2039 | 10 × S1, 10 × S2, 10 × S3, 10 healthy (+ 10 × S4 if COULD) |
| test | 3000–3019 | 10 × S5, 10 healthy — generated in M1 but NEVER opened before M4 |
| demo | 42 | A1 healthy with SEP context, A2 S1 (cardio, ends with the chest-pain story), A3 S2 |

- Output: `data/synthetic/<split>/<astronaut>.csv` (+ `crew.csv` per split) and `data/synthetic/<split>/meta.json` with seeds and config hash.

AC
- Same seed → identical files (test). Days 1–29 contain no active scenario (test).
- `python -m src.figures --healthy-check` saves a plot of 3 healthy train astronauts: values within physiological ranges, visibly correlated sleep/mood/reaction.
- `README.md` → Data & sources lists every config value as sourced or assumption.

---

## M2 — Model, baselines, development evaluation (Sat 13:00–19:00)

### M2.1 `src/features.py`
- Personal normalisation: for each astronaut, mean and sd of each feature over days 1–21 (calibration). z = (x − mean) / sd. Store per-astronaut normal bands (mean ± 2 sd) for the UI Trends screen.
- Missing values: z = 0 and a mask; masked features contribute 0 to reconstruction error and contributions.
- Windows: for day t ≥ 7, input = z-scores of the 9 AE features (8 indicators + exercise_min) for days t−6…t, flattened → 63 values.

### M2.2 `src/model.py` + `src/train.py` (`config/model.yaml`) — *superseded: production uses `src/drift.py` (see section 0); the autoencoder remains as `detector: autoencoder` for the benchmark*
- Dense AE: 63 → 32 → 8 → 32 → 63, ReLU, dropout 0.1, MSE loss with the missing-value mask.
- Adam lr 1e-3, batch 64, max 200 epochs, early stopping (patience 10) on val loss. Fixed seed.
- Train on all train-split windows (healthy only). Save `outputs/models/ae.pt`.

### M2.3 `src/scoring.py` — *score definition superseded: SAI is now the percentile of the drift model's Mahalanobis distance; levels, persistence (3 days) and P_yellow (92) as in section 0*
- Day score = weighted reconstruction error over the window, weights 1…7 (latest day heaviest), normalised to sum 1.
- Per-feature contribution = that feature's weighted error / total (8 indicators; exercise folded into "other").
- Reference distribution = day scores of the val split → `outputs/models/reference_scores.npy`.
- Systemic Anomaly Index, SAI (0–100) = 100 × empirical CDF of the score within the reference distribution.
- Levels: yellow if SAI ≥ P_yellow for 2 consecutive days; orange if SAI ≥ P_orange for 2 consecutive days; red only from critical rules (M2.4). Defaults P_yellow = 95, P_orange = 99; tune ONLY on dev so that false alarms (yellow or above on healthy days) ≤ 0.5 per astronaut-week. Record the chosen values in `config/model.yaml`.
- System status = level of the day if the system holds the largest contribution share, else green unless its own features' share > 0.3 (then yellow).

### M2.4 `src/baselines.py` (`config/rules.yaml`)
- B1 fixed thresholds (alarm when exceeded 2 consecutive days). Candidate values — each MUST get a cited source or be marked assumption:
  temp ≥ 38.0 °C; resting hr > 100 bpm; sys ≥ 140 or dia ≥ 90 mmHg; fasting glucose ≥ 126 mg/dL or < 70 mg/dL; sleep_h < 5 for 3 days; mood ≤ 2 for 3 days.
- Critical / red (immediate, no persistence): temp ≥ 39.5 °C; sys ≥ 180 or dia ≥ 120 mmHg; glucose < 54 mg/dL; hr > 130 or < 40 bpm. Same sourcing rule.
- B2 personal univariate: alarm when any indicator has |z| > 3 for 2 consecutive days.

### M2.5 `src/evaluate.py --split dev`
Metrics per scenario and overall, mean ± sd across astronauts:
- Detection rate: share of scenario astronauts with an AE alarm (yellow+) while the scenario is active.
- Lead time vs B1 and vs B2: (first baseline alarm day − first AE alarm day). If the baseline never alarms, count "baseline missed" separately and report lead time to day 120 as a lower bound.
- Detection delay: first AE alarm day − scenario start.
- False alarms per astronaut-week on healthy astronauts and on pre-scenario days.
- Sensitivity: rerun dev with scenario sizes × 0.5, × 1.0, × 1.5 (regenerate dev with the same seeds) and report detection rate and lead time for each.
Save `outputs/results/dev_metrics.json` and a markdown table for README.

AC
- `pytest -q` green; training reproducible with the seed.
- Dev false alarms ≤ 0.5 per astronaut-week at the chosen thresholds.
- Dev results written (whatever they are). If the AE does not beat B2 on dev, STOP and report to Jan before tuning further — no silent changes to the scenarios.

---

## M3 — Export for the UI + figures (Sat 19:00–24:00)

### M3.1 `src/export.py --crew demo` (`config/ui.yaml`)
- Produce `outputs/ui/demo_crew.json` (list of day records for A1–A3, 120 days) validated against the schema, and update `meta.json` with personal normal bands per astronaut.
- Systems: heart = sys, dia, hr · metabolism = glucose · mind_sleep = sleep_h, mood, reaction_ms · immune_temp = temp.
- Prompts (model-driven): system at yellow+ → heart: `repeat_bp_hr_rest`; metabolism: `repeat_glucose_fasting`; mind_sleep: `reaction_test_mood_checkin`; immune_temp: `repeat_temperature_evening`. UI writes the How / Why / If-abnormal text for each prompt id.
- Environments in `ui.yaml`: `iss` (near real-time link), `lunar_base` (~1.3 s one-way), `mars_transit` (4–24 min one-way). Verify the delays with a source.
- Escalation ladder: green → monitor; yellow → self_care; orange, OR yellow ≥ 5 days, OR ≥ 2 systems yellow+ → crew_medical_officer; red → flight_surgeon (for mars_transit: onboard emergency protocol first, then an asynchronous report to Earth).
- `events`: `sep_event` on DONKI event days; `co2_high` when cabin CO2 is above the configured limit.
- `display_name` from config (Crew Member Alpha / Bravo / Charlie).
- `context`: radiation_mGy, radiation_cum_mGy (cumulative since day 1), cabin_co2_mmHg.
- `hazards`: radiation = yellow on SEP days · isolation = mind_sleep status · gravity = heart status · closed_environment = yellow when `co2_high` or immune_temp is yellow+ · distance = `info` (the UI shows the environment delay).
- Earth report (SHOULD): `outputs/ui/earth_reports/<id>_day<NNN>.json`, a compact summary (last 7 days of SAI, top contributions, open prompts, escalation) that the UI shows as "queued for downlink" with the environment delay.

### M3.2 `src/figures.py`
- `timeline_demo.png`: A2 index over 120 days with yellow/orange threshold lines, shaded scenario period, markers for first AE alarm, first B1 alarm, first B2 alarm. Footer text: "Synthetic data calibrated on published sources — proof of concept".
- `lead_time_dev.png`: lead time vs B1 and B2 per scenario (dev), with spread.
- No NASA logos; readable at slide size (1600 × 900 px).

AC
- `demo_crew.json` validates; the UI team confirms they can load it.
- Both figures saved; the A2 timeline shows the AE alarm before B1 (if it does not, report it — do not edit data to make it so).

---

## M4 — Final hold-out test, ONE run (Sun 08:00–10:00)

- `python -m src.evaluate --split test --final` runs once. The script refuses to run if `outputs/results/final_test.json` exists, and writes the timestamp, git commit hash and config hashes into it.
- Before running: freeze `config/model.yaml` and `config/rules.yaml` (commit "freeze before hold-out").
- Report S5 detection rate, detection delay, lead time vs B1 and B2, false alarms on test healthy astronauts. Same tables and figure style as dev (`lead_time_test.png`).

AC
- `final_test.json` exists with metadata; README → Results shows dev and test side by side with the sentence "S5 was never seen during development and was evaluated once."

---

## M5 — README and freeze (Sun 10:00–16:00)

README sections (English):
1. Overview — problem (author's "halfway to Mars" scenario), Prevent + Respond.
2. How it works — personal normalisation, AE on 7-day windows, SAI, levels, contributions, baselines; the NASA HRP hazard coverage table (section 0.1).
3. Architecture — Mermaid diagram: manual input / sensors → features → AE scoring → thresholds and rules → local JSON store (offline) → UI → delayed batch report to Earth.
4. Why unsupervised — no labelled astronaut illness data exists (few astronauts, rare events, private records); a model of each person's normal needs no labels.
5. Data & sources — DONKI (real), synthetic crews (every parameter sourced or flagged), NASA HRP resources, CSA radiation resource.
6. Results — dev + test tables, both figures.
7. Earth spin-off — the same offline, personal-baseline monitoring for isolated crews on Earth: Antarctic research stations, remote communities with limited access to care, long maritime deployments.
8. Limitations — synthetic data, assumptions list, no clinical validation, simplified physiology, daily granularity, bone loss not covered.
9. Use of AI — Claude (Anthropic) via Claude Code used to draft code and docs; all code reviewed and run by the team; what was AI-assisted.
10. References — every source and library with license.
11. License (Apache-2.0) and Disclaimer (prototype, not a medical device).

AC: a teammate can reproduce all results from a clean clone using the Commands section in CLAUDE.md.

---

## M6 — COULD (only if M0–M5 are done)

- S4 sensor-fault flag: a single feature with extreme z while the others stay normal → `events: ["possible_sensor_fault"]` instead of a health alarm.
- OSDR sanity check (timebox 90 min): find a public NASA OSDR human study with pre- and post-flight measurements (candidates to check: OSD-575, OSD-569). If tabular data are reachable, compute each crew member's pre-flight baseline and post-flight z-scores; report descriptively in README. Skip silently if access is not possible.
- Adaptive baseline with a CUSUM drift guard.
- Edge readiness: export the trained AE to ONNX (`src/export_onnx.py`), report model size (KB) and CPU inference time per day record in README.

---

## UI team brief (for their own Claude Code session in `ui/`)

- Stack: React + Tailwind. Offline-first: JSON files bundled with the app, no backend, no network needed at runtime. Deploy as a static site (public link, no login).
- Read data only from `outputs/ui/*.json`; start with `sample.json`, switch to `demo_crew.json` after M3.
- Screens: Today (SAI, coloured body figure, 5-hazard strip, today's prompts, streak) · Check-in (8 indicators, each with a How / Why / If-abnormal card) · Body map (click a system → status, what changed and since when, why it matters in space, actions, source link) · Trends (each indicator with personal normal band, AE / B1 / B2 alarm markers) · Emergency (always-visible button → symptom → steps, measurements, when to contact Earth given the environment delay) · Earth link (environment delay, queued Earth reports) · Settings (crew member, environment).
- Language-agnostic design: every state is shown by colour + icon + shape together, never colour alone (colour-blind safe palette, e.g. Okabe–Ito); high contrast (WCAG AA); short English labels; large tap targets (≥ 64 px) for gloves and microgravity; one SVG icon per hazard and per system.
- Body figure and icons: own SVG, no third-party images without an open license. All text in English. Visible disclaimer: "Prototype — synthetic data — not medical advice".
- Every medical instruction text cites its source (NASA HRP pages or other public guidance) in a sources list.

---

## Contract changes log

| Date/time | Change | By |
|---|---|---|
| 2026-11-13 | `index` renamed `sai`; `sai` is null on days 1–6 (no full 7-day window yet) | ML (Claude) |
| 2026-11-13 | new boolean `calibrating` (days 1–21, personal baseline being learned) | ML (Claude) |
| 2026-11-13 | new boolean `univariate_alert` (baseline B2) next to `rule_alert` (baseline B1) for the Trends alert rows | ML (Claude) |
| 2026-11-13 | `events` may contain `possible_sensor_fault` (one indicator \|z\| > 5, all others \|z\| < 2) | ML (Claude) |
| 2026-11-13 | system status: on a green day all systems are green (the M2.3 rule otherwise coloured systems on healthy days) | ML (Claude) |
| 2026-11-13 | `contributions` = share of deviation from the personal normal (top 4 indicators + `other`) | ML (Claude) |
| 2026-11-14 | `meta.json`: new `rules` {critical, b1} copied from `config/rules.yaml` (feature, op, value, persistence_days, source, assumption) — J1 | ML (Claude) |
| 2026-11-14 | `meta.crew[i].scenario` {id, name, start_day} or null (synthetic ground truth for the demo replay) — J2 | ML (Claude) |
| 2026-11-14 | `meta.space_weather.events` [{day, time, id, link}] from the cached NASA DONKI SEP events — J3 | ML (Claude) |
