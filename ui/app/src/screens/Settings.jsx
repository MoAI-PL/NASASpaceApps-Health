// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { SOURCES } from "../content/texts.js";
import { TapButton } from "../components/ui.jsx";

// ===== Former Settings screen, split so the app needs only four tabs =====
// DemoControls (crew member, mission environment) sits in the mission-timeline panel: it sets up
// the demo, it is not a daily task for the crew. SourcesList is shown in the "About" dialog.

/** Crew member and mission environment, folded away under one summary line. */
export function DemoControls({ astronaut, onAstronaut, env, onEnv }) {
  const crew = META.crew.find((c) => c.id === astronaut)?.display_name;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-ink-2 text-base py-2">
        Demo: {crew} · {META.environments[env].name} — change
      </summary>
      <div className="grid gap-3 pt-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Crew member">
          {META.crew.map((c) => (
            <TapButton key={c.id} active={c.id === astronaut} onClick={() => onAstronaut(c.id)}>{c.display_name}</TapButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Mission environment">
          {Object.entries(META.environments).map(([id, e]) => (
            <TapButton key={id} active={id === env} onClick={() => onEnv(id)}>
              {e.name} <span className="text-ink-2 text-base">· {e.one_way_delay_text}</span>
            </TapButton>
          ))}
        </div>
      </div>
    </details>
  );
}

/** Every source the app cites, with links. */
export function SourcesList() {
  return (
    <ul className="grid gap-2 list-disc ml-6">
      {Object.values(SOURCES).map((s) => (
        <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{s.title}</a></li>
      ))}
      <li>Space weather: {META.space_weather.source}</li>
    </ul>
  );
}
