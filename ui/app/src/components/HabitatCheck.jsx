// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, crewSystemsOnDay } from "../data.js";
import { HABITAT } from "../content/texts.js";
import { Glyph } from "./icons.jsx";
import { SourceLink } from "./ui.jsx";

// ===== Is it me or the habitat? =====
// Compares today's body-system statuses across the crew. The same system away from normal in
// 2+ crew members points to a shared cause in the closed habitat (air, food, schedule, germs,
// radiation); a change in one person only points to a personal one. Crewmates are counted,
// never named, so no one's health is shown to the others.
const SHARED_MIN = 2; // team assumption (see HABITAT.rule)

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
    <section className="panel p-5" aria-labelledby="habitat-title">
      <h2 id="habitat-title" className="text-ink-2 text-lg">{HABITAT.title}</h2>
      <p className="mt-2 flex items-center gap-3 text-xl font-semibold">
        <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-2xl ${verdict === "shared" ? "glass-active text-warning" : "bg-panel-2 text-ink"}`}>
          <Glyph name={verdict === "shared" ? "closed_environment" : verdict === "personal" ? "nav_body" : "isolation"} size={24} />
        </span>
        {HABITAT.verdict[verdict]}
      </p>

      {/* Per-system count across the crew: same order and icons as the body figure. */}
      <ul className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {systems.map((s) => (
          <li key={s} className={`p-3 rounded-2xl bg-panel-2 border ${shared.includes(s) ? "border-warning" : "border-transparent"}`}>
            <p className="flex items-center gap-2 text-base">
              <Glyph name={s} size={18} className="text-ink-2" /> {META.systems[s].name}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-2">
              <Dots off={counts[s].off} crew={counts[s].crew} />
              <span>{counts[s].off} of {counts[s].crew} away from normal</span>
            </p>
          </li>
        ))}
      </ul>

      {verdict === "shared" ? (
        <div className="mt-4 grid gap-3">
          {shared.map((s) => (
            <div key={s}>
              <p className="text-lg">Check first for <span className="font-semibold">{META.systems[s].name.toLowerCase()}</span>:</p>
              <ul className="mt-1 ml-6 list-disc text-lg">{HABITAT.checks[s].items.map((t) => <li key={t}>{t}</li>)}</ul>
              <div className="mt-1"><SourceLink id={HABITAT.checks[s].source} /></div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-lg text-ink-2">{verdict === "personal" ? HABITAT.personalBody : HABITAT.clearBody}</p>
      )}
      <p className="mt-3 text-sm text-muted">{HABITAT.rule}</p>
    </section>
  );
}
