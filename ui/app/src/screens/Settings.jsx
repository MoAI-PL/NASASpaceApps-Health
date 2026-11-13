// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { SOURCES } from "../content/texts.js";
import { Panel, TapButton } from "../components/ui.jsx";

// ===== Settings: crew member, environment, about and sources =====
export default function Settings({ astronaut, onAstronaut, env, onEnv }) {
  return (
    <div className="grid gap-4">
      <Panel title="Crew member">
        <div className="flex flex-wrap gap-2">
          {META.crew.map((c) => (
            <TapButton key={c.id} active={c.id === astronaut} onClick={() => onAstronaut(c.id)}>{c.display_name}</TapButton>
          ))}
        </div>
      </Panel>
      <Panel title="Mission environment">
        <div className="flex flex-wrap gap-2">
          {Object.entries(META.environments).map(([id, e]) => (
            <TapButton key={id} active={id === env} onClick={() => onEnv(id)}>
              {e.name} <span className="text-ink-2 text-base">· {e.one_way_delay_text}</span>
            </TapButton>
          ))}
        </div>
      </Panel>
      <Panel title="About">
        <p className="text-lg">{META.disclaimer}</p>
        <p className="mt-2 text-ink-2">Not a medical device. Synthetic crew members only.</p>
      </Panel>
      <Panel title="Sources">
        <ul className="grid gap-2 list-disc ml-6">
          {Object.values(SOURCES).map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{s.title}</a></li>
          ))}
          <li>Space weather: {META.space_weather.source}</li>
        </ul>
      </Panel>
    </div>
  );
}
