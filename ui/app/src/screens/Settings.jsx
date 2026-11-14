// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { SOURCES } from "../content/texts.js";
import { TapButton } from "../components/ui.jsx";

// ===== Former Settings screen, split so the app needs only four tabs =====
// DemoControls (crew member, mission environment) sits in the mission-timeline panel: it sets up
// the demo, it is not a daily task for the crew. SourcesList is shown in the "About" dialog.

// Short names and own line icons for the environments (no third-party artwork).
const ENV_SHORT = { iss: "Space station", lunar_base: "Moon base", mars_transit: "Mars transit", mars_rover: "Mars rover" };
const ENV_PATHS = {
  iss: <g><rect x="12" y="13" width="8" height="6" rx="1" /><path d="M4 9 H12 M4 23 H12 M20 9 H28 M20 23 H28 M8 9 V23 M24 9 V23" /></g>,
  lunar_base: <g><path d="M3 24 H29" /><path d="M8 24 A8 8 0 0 1 24 24" /><circle cx="25" cy="8" r="3" /></g>,
  mars_transit: <g><path d="M6 22 L14 14 L22 10 L18 18 Z" /><path d="M10 22 L6 26 M14 18 L9 23" /><circle cx="26" cy="7" r="2.5" /></g>,
  mars_rover: <g><rect x="7" y="12" width="18" height="7" rx="2" /><circle cx="10" cy="22" r="2.5" /><circle cx="22" cy="22" r="2.5" /><path d="M3 26 H29 M20 12 V8 H24" /></g>,
};
export function EnvIcon({ id, size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ENV_PATHS[id] ?? <circle cx="16" cy="16" r="9" />}
    </svg>
  );
}

/** Crew member (one tap to switch between the three demo cases) and mission environment. On wide
 *  screens the crew switch lives in the sidebar's bottom-left corner, so this row hides there. */
export function DemoControls({ astronaut, onAstronaut, env, onEnv }) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-3 gap-2 lg:hidden" role="group" aria-label="Crew member">
        {META.crew.map((c) => (
          <TapButton key={c.id} active={c.id === astronaut} onClick={() => onAstronaut(c.id)} className="text-center! px-2!">
            <span className="hidden sm:inline">{c.display_name}</span>
            <span className="sm:hidden">{c.display_name.replace(/^Crew Member /, "")}</span>
          </TapButton>
        ))}
      </div>
      {/* Mission environment, always visible: it sets the signal delay everywhere in the app
          (hazard strip, Earth link, Emergency). The challenge lists spacecraft, space station,
          rover and planetary base; a fourth option appears as soon as meta.json carries it. */}
      <p className="mt-3 text-sm text-ink-2">Where is the crew?</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1" role="group" aria-label="Mission environment">
        {Object.entries(META.environments).map(([id, e]) => (
          <TapButton key={id} active={id === env} onClick={() => onEnv(id)} className="text-center! px-2! py-2 flex flex-col items-center justify-center gap-1">
            <EnvIcon id={id} />
            <span className="text-base leading-tight">{ENV_SHORT[id] ?? e.name}</span>
            <span className="text-xs text-ink-2 leading-tight">Earth {e.one_way_delay_text}</span>
          </TapButton>
        ))}
      </div>
    </div>
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
