# Baseline UI

Owned by the UI team. Read `../PLAN.md` → "UI team brief" first.

## Concept (start here)

`concept/index.html` is a **clickable concept**, not the final app: one file, React + Tailwind loaded
from CDNs, no build step. It reads `concept/data.js`, which `python -m src.export --crew demo`
generates from the real model output.

Open `concept/index.html` in a browser (internet needed for the CDNs). It shows:

- **Today** — Systemic Anomaly Index gauge, clickable body map (4 systems), "what moved away from your
  normal", today's prompts, escalation, the 5-hazard strip, system detail with personal normal ranges.
- **Trends** — any indicator with the personal normal band and three alert rows: model, fixed
  thresholds (B1), personal single-indicator thresholds (B2).
- **Earth link** — environment delay, automatic reports at escalations, manual "queue for downlink".
- **Emergency** — always-visible button → symptom → steps. The steps are DRAFT placeholders.
- Mission-day slider, crew selector (Crew Member Alpha / Bravo / Charlie), environment selector.

Demo story: Crew Member Bravo, scrub from day 45 to day 80 — the model turns yellow on day 60,
fixed clinical thresholds only on day 76.

## What the final app needs (TODO for the UI team)

- Vite + React + Tailwind build that **bundles everything** (no CDNs at runtime: offline-first).
- Load `outputs/ui/demo_crew.json` and `outputs/ui/meta.json` (or `sample.json`) at build time.
- Every state shown by colour + icon + shape + word (already in the concept: circle / triangle /
  diamond / octagon). Tap targets ≥ 64 px. WCAG AA contrast. English labels only.
- Check-in screen (8 indicators) with How / Why / If-abnormal cards — write the texts from cited
  NASA HRP pages and list the sources.
- Replace every `TODO(UI)` and the DRAFT emergency steps with sourced content.
- Visible disclaimer: "Prototype — synthetic data — not medical advice".
- No NASA logos or branding; no third-party images without an open license.
