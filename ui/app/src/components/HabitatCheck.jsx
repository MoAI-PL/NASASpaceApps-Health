// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, crewSystemsOnDay } from "../data.js";
import { HABITAT } from "../content/texts.js";
import { Glyph } from "./icons.jsx";
import { Fold, SourceLink } from "./ui.jsx";

// ===== Is it me or the habitat? =====
// Compares today's body-system statuses across the crew. The same system away from normal in
// 2+ crew members points to a shared cause in the closed habitat (air, food, schedule, germs,
// radiation); a change in one person only points to a personal one. Crewmates are counted,
// never named. At a glance: the verdict, and when shared, which system and what to check.
const SHARED_MIN = 2; // team assumption (see HABITAT.how)

/** Filled dot per crew member away from normal in this system, empty dot for the rest. */
function Dots({ off, crew }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: crew }, (_, i) => (
        <span key={i} className={`w-3 h-3 rounded-full border-2 ${i < off ? "bg-warning border-warning" : "border-line"}`} />
      ))}
    </span>
  );
}

export default function HabitatCheck({ astronaut, day }) {
  const counts = crewSystemsOnDay(astronaut, day);
  const systems = Object.keys(counts);
  const shared = systems.filter((s) => counts[s].off >= SHARED_MIN);
  const mine = systems.filter((s) => counts[s].you);
  const verdict = shared.length > 0 ? "shared" : mine.length > 0 ? "personal" : "clear";

  return (
    <section className="panel p-5 grid gap-3 content-start" aria-labelledby="habitat-title">
      <h2 id="habitat-title" className="text-ink-2 text-lg">{HABITAT.title}</h2>
      <p className="flex items-center gap-3 text-xl font-semibold">
        <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-xl ${verdict === "shared" ? "glass-active text-warning" : "bg-panel-2 text-ink-2"}`}>
          <Glyph name={verdict === "shared" ? "closed_environment" : verdict === "personal" ? "nav_body" : "isolation"} size={22} />
        </span>
        {HABITAT.verdict[verdict]}
      </p>

      {shared.map((s) => (
        <div key={s} className="px-3 py-2 rounded-2xl bg-panel-2 border border-warning">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-semibold">
            <span className="flex items-center gap-2"><Glyph name={s} size={18} className="text-ink-2" /> {META.systems[s].name}</span>
            <span className="flex items-center gap-2 text-sm font-normal text-ink-2">
              <Dots off={counts[s].off} crew={counts[s].crew} /> {counts[s].off} of {counts[s].crew} crew
            </span>
          </p>
          <p className="mt-1 text-lg">Check: {HABITAT.checks[s].items.join(" · ")}</p>
        </div>
      ))}

      <Fold title="How this works" small>
        {HABITAT.how.map((t) => <p key={t}>{t}</p>)}
        {shared.map((s) => <SourceLink key={s} id={HABITAT.checks[s].source} />)}
      </Fold>
    </section>
  );
}
