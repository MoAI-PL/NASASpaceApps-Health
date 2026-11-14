# Team handoff — status and next steps (2026-11-14, evening)

Branch `zuzia` (PR #2 → `main`). Deadline: **Sunday 15 Nov, 23:59 local time** (team target: submit at 22:00).
Rules checked against the official 2026 Project Submission Guide, Judging & Awards Guide and Participant
Terms (pages dated Nov 2026) and the challenge author's video (https://www.youtube.com/watch?v=RERG3gEmdC8).

## 1. What the UI does now (`ui/app`, all on `zuzia`)

- **Emergency** — step-by-step flow for a crew mate (responsive? breathing? → CPR / unresponsive but breathing /
  chest pain / breathing difficulty), written for weightlessness and for gravity on the Moon or Mars. Sources:
  MedlinePlus, American Heart Association, DGLRM/ESAM guideline for CPR in microgravity (Hinkelbein 2020). Shows the
  signal delay and round trip to Earth and, for breathing problems, the cabin CO₂.
- **Guided check-in** — one measurement at a time after the sleep period: 30-second pulse timer (app does × 2),
  blood pressure with 5-minute rest and two readings averaged, in-app reaction test (median of 5), large −/+ inputs,
  mood words, sleep quick choice; every value compared with the personal normal; summary + save. "Quick entry" keeps
  the one-page form.
- **All crew texts sourced** (no TODO left): How / Why / If abnormal, "What it does" and "What helps" per body
  system, SEP and CO₂ banners. Sources listed in `ui/app/src/content/texts.js` → `SOURCES` and README → References.
- **Today** — index gauge with Watch/Act marks and a one-line explanation, "What moved" with direction in words,
  today's measurements still to do, hazards strip.
- **Mission timeline** — daily status strip + real NASA DONKI solar particle events (tap to jump).
- **Body** — status figure, system detail, **drift radar** (shape of the last 7 days vs the personal normal; on
  Bravo's day 58 no single value is out of range but the shape has moved).
- **Trends** — phone-friendly chart with the three methods' alert rows (Astrobalance model / Clinical limits /
  Single-value limits).
- **Earth link** — what each report contains, one-way delay, earliest reply; queue today's summary.
- **How we know** — method in plain words, benchmark → confirmation → one-time hold-out, and the limits.
- **"?" Help** — status legend (shape + word + colour), what the index means, hazard icons.
- Accessibility: shape + word + colour for every state, Okabe–Ito palette with WCAG AA contrast, tap targets ≥ 64 px,
  no sideways scrolling at 375 px, keyboard-usable controls.

## 2. Jan — tasks (two block the UI)

After each contract change: add a row to "Contract changes log" in `PLAN.md`, run `python -m src.export --sample`,
`python -m src.export --crew demo`, `pytest -q`, commit, tell Zuza the branch. All changes are additive to `meta.json`.

| # | Task | Why | Time |
|---|---|---|---|
| **J1 (blocks UI)** | In `src/export.py` → `build_meta()`, add `"rules": {"critical": [...], "b1": [...]}` copied from `config/rules.yaml` (feature, op, value, persistence_days, source or null, assumption) | Red "critical value → open Emergency" banner in the check-in; shows Respond works without the model | ~20 min |
| **J2 (blocks UI)** | Add to each `meta.crew[i]`: `"scenario": {"id": "S1", "name": "Cardiovascular deconditioning", "start_day": 50}` (A2), S2 from day 70 (A3), `null` for A1 — from `data/synthetic/demo/A*.csv` | Mission Replay end card: start day 50 · model 58 · single-value 60 · clinical 76 | ~15 min |
| J3 | In `meta.space_weather` add `"events": [{"day", "time", "id", "link"}]` from `data/raw/donki_sep.json` | Timeline links each solar event to NASA DONKI (Relevance criterion) | ~15 min |
| J4 | GitHub repo "About" description in English (now "wajbkodyn'"), e.g. *Astrobalance — offline personal-baseline health monitoring for deep-space crews (NASA Space Apps 2026). Synthetic data, not a medical device.* | All linked material must be in English | 1 min |
| J5 | `config/rules.yaml`: sources for `assumption: true` values — fever ≥ 38.0 °C → MedlinePlus Body temperature norms (001982); resting HR > 100 → AHA Target Heart Rates. Others (glucose ≥ 126, 39.5 °C, HR > 130 / < 40) stay assumptions unless a source is found. Add the AI header line to the generated `ui/concept/data.js`. Mark the autoencoder sections of `PLAN.md` as superseded. | Validity; compliance | ~20 min |
| J6 (optional) | "Antarctic station" and "rover" environments in `config/ui.yaml` (delay only with a source or `assumption: true`); OSDR descriptive check (PLAN M6, ≤ 90 min, no tuning) — the challenge video recommends OSDR | Earth spin-off; NASA data as a core component | 30–90 min |

## 3. Kamila — tasks

- Review PR #2 again (new: guided check-in, emergency flow, How we know, drift radar, timeline, help dialog).
- **Try the reaction test with a real finger on a phone** (automated test could not measure real taps).
- Demo material (after the app is final): **video ≤ 30 s with English subtitles OR ≤ 7 slides incl. title**
  (exceeding = no Global judging). Slides must show team name, member names and the challenge. Suggested video timing
  from the guide: 0:00 team · 0:02 challenge (quote the author's scenario from the video) · 0:05 name + tagline ·
  0:10 how it works (timeline + Body + Emergency) · 0:20–0:30 future (Earth spin-off). Any AI-generated image/video
  needs a visible watermark; no NASA logos.

## 4. Zuza — next UI steps

1. After J1: critical-value banner in the check-in → Emergency.
2. After J2: Mission Replay (120 days in ~20 s, honest end card with all three methods and the false alarms).
3. Optional: first-run welcome (3 screens), small CSS animations with reduced-motion.
4. Deploy `ui/app/dist` as a public static site (GitHub Pages), test in a private window and on a phone, add the link
   to README.

## 5. Project page (team, Sunday) — fields and what goes in

- Name + tagline: "Astrobalance — early warning from your personal normal".
- Summary / Description: Prevent (personal multivariate drift, SAI) + Respond (emergency mode and critical limits
  without the model); offline; Earth spin-off.
- **NASA Data**: NASA DONKI solar particle events; NASA HRP Hazards, Risks and risk pages; NASA OCHMO TB-004 (CO₂);
  NASA ASCEND (communication delay); NASA Human Research Roadmap (reaction self-test); OSDR if J6 is done.
- **Space Agency Partner & other data**: CSA "Monitoring Radiation for Astronaut Health"; AEB challenge video;
  AHA, ADA, MedlinePlus, NHLBI, Hinkelbein 2020, Tobin 2002, Barger 2014; all software with licenses (README).
- **Use of SI (AI)**: Claude (Anthropic) via Claude Code drafted code, texts and docs and helped find and check
  sources; the idea, decisions and review are the team's; AI header in every source file; no AI images.
- Always state: *synthetic data calibrated on published sources — proof of concept, not clinical validation; not a
  medical device*.

## 6. Submission checklist (from the official guides)

- [ ] All required fields filled, everything in English (including linked pages and the repo description).
- [ ] Demo link public, no login: video ≤ 30 s (English subtitles) or ≤ 7 slides.
- [ ] Final project link public (deployed app and/or repo), tested in a private window.
- [ ] Every source and library cited with its license (References field + README).
- [ ] No NASA logos/branding, no PII, no people under 18, no commercial promotion.
- [ ] All team members in the same Local Event; both checkboxes ticked; "Submit for Judging" before 23:59.

## 7. Honest limits to say out loud

- Data are synthetic; the simulator is linear-Gaussian, which may favour the drift model.
- More false alarms than the simple methods (~1 per crew member every 14 weeks).
- For isolation & stress (Charlie) the model is not earlier — show Bravo in the demo, never claim it predicts a
  heart attack.
