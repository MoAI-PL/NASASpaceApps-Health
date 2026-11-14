// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// App shell: header, demo mission-day control, screen navigation, always-visible Emergency
// button and disclaimer. Screens live in src/screens/, crew-facing text in src/content/texts.js.

import { useMemo, useState } from "react";
import { META, recordsFor } from "./data.js";
import { StatusIcon } from "./components/icons.jsx";
import Today from "./screens/Today.jsx";
import CheckIn from "./screens/CheckIn.jsx";
import Body from "./screens/Body.jsx";
import Trends from "./screens/Trends.jsx";
import EarthLink from "./screens/EarthLink.jsx";
import Emergency from "./screens/Emergency.jsx";
import Settings from "./screens/Settings.jsx";
import HowWeKnow from "./screens/HowWeKnow.jsx";
import MissionTimeline from "./components/MissionTimeline.jsx";

// ===== Screens (order = navigation order) =====
const SCREENS = [
  { id: "today", label: "Today" },
  { id: "checkin", label: "Check-in" },
  { id: "body", label: "Body" },
  { id: "trends", label: "Trends" },
  { id: "earth", label: "Earth link" },
  { id: "how", label: "How we know" },
  { id: "settings", label: "Settings" },
];

// ===== Per-viewer settings remembered on this device (optional; app works without) =====
function usePersisted(key, fallback, valid) {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(`baseline.${key}`);
      return v != null && valid(v) ? v : fallback;
    } catch { return fallback; }
  });
  const set = (v) => {
    setValue(v);
    try { localStorage.setItem(`baseline.${key}`, v); } catch { /* storage unavailable: keep in memory */ }
  };
  return [value, set];
}

// ===== App =====
export default function App() {
  const [astronaut, setAstronaut] = usePersisted("astronaut", "A2", (v) => META.crew.some((c) => c.id === v));
  const [env, setEnv] = usePersisted("env", META.default_environment, (v) => v in META.environments);
  const [day, setDay] = useState(80); // demo story: Bravo — model alert day 58, fixed thresholds day 76
  const [screen, setScreen] = useState("today");
  const [system, setSystem] = useState("heart");
  const [emergency, setEmergency] = useState(false);
  const [queued, setQueued] = useState([]);

  const records = useMemo(() => recordsFor(astronaut), [astronaut]);
  const record = records.find((r) => r.day === day) ?? records[records.length - 1];
  const crewName = META.crew.find((c) => c.id === astronaut)?.display_name;
  const openSystem = (id) => { setSystem(id); setScreen("body"); };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Sticky header: the Emergency button is always visible and never covers content. */}
      <header className="sticky top-0 z-40 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-4 bg-bg/95 backdrop-blur border-b border-line
                         flex items-center gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">Baseline</h1>
          <span className="text-sm md:text-lg text-ink-2">
            {crewName}<span className="hidden sm:inline"> · {META.environments[env].name}</span>
          </span>
        </div>
        <button type="button" onClick={() => setEmergency(true)}
                className="tap shrink-0 px-5 md:px-8 rounded-2xl text-xl font-bold text-white flex items-center gap-3 bg-critical">
          <StatusIcon status="red" size={30} /> Emergency
        </button>
      </header>

      {/* Demo control: scrub through the precomputed 120-day mission. */}
      <MissionTimeline records={records} day={record.day} onDay={setDay} />

      {/* Phones: one row that scrolls sideways inside the bar (the page itself never does);
          wider screens: the buttons wrap. Review finding 3. */}
      <nav className="flex gap-2 mb-4 overflow-x-auto md:flex-wrap md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0" aria-label="Screens">
        {SCREENS.map((s) => (
          <button key={s.id} type="button" onClick={() => setScreen(s.id)} aria-current={s.id === screen ? "page" : undefined}
                  className={`tap shrink-0 px-4 md:px-5 rounded-xl text-base md:text-lg whitespace-nowrap ${s.id === screen ? "bg-line font-semibold" : "bg-panel"}`}>
            {s.label}
          </button>
        ))}
      </nav>

      <main>
        {screen === "today" && <Today record={record} records={records} env={env} onOpenSystem={openSystem} />}
        {screen === "checkin" && <CheckIn record={record} />}
        {screen === "body" && <Body record={record} records={records} system={system} onSelect={setSystem} />}
        {screen === "trends" && <Trends records={records} day={record.day} astronaut={astronaut} />}
        {screen === "earth" && (
          <EarthLink astronaut={astronaut} day={record.day} env={env} queued={queued}
                     onQueue={() => setQueued([...queued, { astronaut, day: record.day }])} />
        )}
        {screen === "how" && <HowWeKnow />}
        {screen === "settings" && <Settings astronaut={astronaut} onAstronaut={setAstronaut} env={env} onEnv={setEnv} />}
      </main>

      <footer className="mt-8 mb-8 text-sm text-muted">{META.disclaimer}</footer>
      {emergency && <Emergency env={env} record={record} onClose={() => setEmergency(false)} />}
    </div>
  );
}
