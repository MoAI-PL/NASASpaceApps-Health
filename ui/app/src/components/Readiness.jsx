// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, driftZ } from "../data.js";
import { READINESS } from "../content/texts.js";
import { StatusIcon } from "./icons.jsx";
import { Fold, SourceLink } from "./ui.jsx";

// ===== Ready for critical tasks? Feeling versus measured performance =====
// Uses the same 7-day weighted drift as the model's summary (driftZ): reaction time in personal
// SDs (higher = slower) against the mood self-rating. A slower reaction while the mood rating
// stays as usual is the "blind spot" case. At a glance: the verdict, and when flagged the two
// facts behind it and one action; the method and thresholds are folded (READINESS.how).
const SLOW_Z = 1.5;      // reaction time this many personal SDs above normal = slower (assumption)
const AS_USUAL_Z = -0.5; // mood above this = rated as usual (assumption)

/** One of: learning, noData, go, blindSpot, both — plus the drifts behind it. */
export function readiness(records, astronaut, day) {
  if (records.find((r) => r.day === day)?.calibrating) return { state: "learning", rt: null, mood: null };
  const rt = driftZ(records, astronaut, day, "reaction_ms");
  const mood = driftZ(records, astronaut, day, "mood");
  if (rt == null) return { state: "noData", rt, mood };
  if (rt < SLOW_Z) return { state: "go", rt, mood };
  return { state: mood == null || mood > AS_USUAL_Z ? "blindSpot" : "both", rt, mood };
}

/** Small fact chip: label above, value below. */
function Fact({ label, value, warn }) {
  return (
    <div className={`px-3 py-2 rounded-2xl bg-panel-2 border ${warn ? "border-warning" : "border-transparent"}`}>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function Readiness({ records, astronaut, day }) {
  const { state, rt } = readiness(records, astronaut, day);
  const band = META.normal_bands[astronaut].reaction_ms;
  const flagged = state === "blindSpot" || state === "both";
  const status = state === "go" ? "green" : flagged ? "yellow" : "info";

  return (
    <section className="panel p-5 grid gap-3 content-start" aria-labelledby="readiness-title">
      <h2 id="readiness-title" className="text-ink-2 text-lg">{READINESS.title}</h2>
      <p className="flex items-center gap-3 text-xl font-semibold">
        <StatusIcon status={status} size={28} /> {READINESS.verdict[state]}
      </p>
      {flagged && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Fact label="You feel" value={state === "blindSpot" ? "As usual" : "Lower"} />
            <Fact label="You react" value={`~${Math.round(rt * ((band[1] - band[0]) / 4))} ms slower`} warn />
          </div>
          <p className="text-lg">{READINESS.advice}</p>
        </>
      )}
      <Fold title="How this works" small>
        {READINESS.how.map((t) => <p key={t}>{t}</p>)}
        <SourceLink id={READINESS.source} />
      </Fold>
    </section>
  );
}
