// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, driftZ } from "../data.js";
import { READINESS } from "../content/texts.js";
import { StatusIcon } from "./icons.jsx";
import { SourceLink } from "./ui.jsx";

// ===== Ready for critical tasks? Feeling versus measured performance =====
// Uses the same 7-day weighted drift as the model's summary (driftZ): reaction time in personal
// SDs (higher = slower) against the mood self-rating. A slower reaction while the mood rating
// stays as usual is the "blind spot" case. Thresholds below are team assumptions (READINESS.rule).
const SLOW_Z = 1.5;    // reaction time this many personal SDs above normal = slower
const AS_USUAL_Z = -0.5; // mood above this = rated as usual

/** One of: learning, noData, go, blindSpot, both — plus the drifts behind it. */
export function readiness(records, astronaut, day) {
  if (records.find((r) => r.day === day)?.calibrating) return { state: "learning", rt: null, mood: null };
  const rt = driftZ(records, astronaut, day, "reaction_ms");
  const mood = driftZ(records, astronaut, day, "mood");
  if (rt == null) return { state: "noData", rt, mood };
  if (rt < SLOW_Z) return { state: "go", rt, mood };
  return { state: mood == null || mood > AS_USUAL_Z ? "blindSpot" : "both", rt, mood };
}

/** One labelled row: what the person reports or what the test measured. */
function Row({ label, value, warn }) {
  return (
    <div className={`p-3 rounded-2xl bg-panel-2 border ${warn ? "border-warning" : "border-transparent"}`}>
      <p className="text-ink-2 text-base">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function Readiness({ records, astronaut, day }) {
  const { state, rt, mood } = readiness(records, astronaut, day);
  const band = META.normal_bands[astronaut].reaction_ms;
  const msSlower = rt == null ? null : Math.round(rt * ((band[1] - band[0]) / 4)); // z × personal SD
  const flagged = state === "blindSpot" || state === "both";
  const status = state === "go" ? "green" : flagged ? "yellow" : "info";

  return (
    <section className="panel p-5" aria-labelledby="readiness-title">
      <h2 id="readiness-title" className="text-ink-2 text-lg">{READINESS.title}</h2>
      <p className="mt-2 flex items-center gap-3 text-xl font-semibold">
        <StatusIcon status={status} size={28} /> {READINESS.verdict[state]}
      </p>
      <p className="mt-1 text-lg text-ink-2">{READINESS.body[state]}</p>

      {(state === "go" || flagged) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Row label="How you feel (mood, your rating)"
               value={mood == null ? "not rated" : mood > AS_USUAL_Z ? "As usual" : "Lower than usual"} />
          <Row label="How you react (reaction test)" warn={flagged}
               value={flagged ? `~${msSlower} ms slower than your usual` : "Within your normal"} />
        </div>
      )}

      {flagged && (
        <ul className="mt-4 ml-6 grid gap-1 list-disc text-lg">
          {READINESS.advice.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}
      <div className="mt-3"><SourceLink id={READINESS.source} /></div>
      <p className="mt-1 text-sm text-muted">{READINESS.rule}</p>
    </section>
  );
}
