# Baseline UI

Owned by the UI team. Read `../PLAN.md` → "UI team brief" first.

## The app (`app/`) — this is what we ship

Vite + React 18 + Tailwind 4. Offline-first: the ML output in `../outputs/ui/` is bundled at build
time, so the built site needs no backend and no network.

```bash
cd ui/app
npm install
npm run dev      # http://localhost:5173, reloads on save
npm run build    # static site in ui/app/dist/ (relative paths: works on any static host)
npm run preview  # serve the built dist/ locally
```

Layout:

| Path | What it is |
|---|---|
| `src/data.js` | The only file that reads ML output (`demo_crew.json`, `meta.json`, `earth_reports/`) + helpers |
| `src/content/texts.js` | All crew-facing text: prompts, check-in cards, systems, events, emergency steps, sources |
| `src/components/` | Status icons (colour + shape + glyph + word), hazard/system icons, gauge, body map, hazard strip, system detail |
| `src/screens/` | Today · Check-in · Body · Trends · Earth link · Emergency · Settings |
| `src/styles.css` | Design tokens (all colours in one `@theme` block) and shared utilities (`panel`, `tap`) |

Any text starting with `TODO(UI)` shows up in the app as a dashed "content gap", so missing
content is visible in the demo until it is written.

### TODO for the UI team

- [ ] Write every `TODO(UI)` text in `src/content/texts.js` from cited sources (NASA HRP pages or
      other public guidance) and add each source to `SOURCES`.
- [ ] Emergency steps: replace the DRAFT steps with a protocol from cited sources, set `draft: false`.
- [ ] Final body figure (own SVG) in `src/components/BodyMap.jsx`.
- [ ] Check contrast (WCAG AA) and colour-blind safety of the palette in `src/styles.css`
      (option: Okabe–Ito). Shapes + words already carry every state.
- [ ] Deploy `dist/` as a public static site (no login) and put the link in the main README.
- [ ] Keep the disclaimer visible: "Prototype — synthetic data — not medical advice".
- [ ] No NASA logos or branding; no third-party images without an open license.

Data contract: `../schemas/day_record.schema.json`. Never edit files in `../outputs/ui/` by hand;
if the UI needs a new field, ask the ML side (contract changes are logged in `../PLAN.md`).

## Concept (`concept/`) — reference only

`concept/index.html` is the earlier clickable concept: one page with React and a prebuilt
stylesheet bundled in `concept/vendor/`, no build step, works offline when opened directly in a
browser. It reads `concept/data.js`, which `python -m src.export --crew demo` generates.

Demo story: Crew Member Bravo, scrub from day 45 to day 80 — the model turns yellow on day 60,
fixed clinical thresholds only on day 76.
