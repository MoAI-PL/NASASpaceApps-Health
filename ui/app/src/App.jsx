// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// App shell: header, demo mission-day control, screen navigation, always-visible Emergency
// button and disclaimer. Screens live in src/screens/, crew-facing text in src/content/texts.js.

import { useMemo, useState } from "react";
import { META, recordsFor } from "./data.js";
import { Glyph, StatusIcon } from "./components/icons.jsx";
import Today from "./screens/Today.jsx";
import CheckIn from "./screens/CheckIn.jsx";
import Body from "./screens/Body.jsx";
import Trends from "./screens/Trends.jsx";
import EarthLink from "./screens/EarthLink.jsx";
import Emergency from "./screens/Emergency.jsx";
import { DemoControls, EnvIcon } from "./screens/Settings.jsx";
import { TapButton } from "./components/ui.jsx";
import HowWeKnow from "./screens/HowWeKnow.jsx";
import MissionTimeline from "./components/MissionTimeline.jsx";
import HelpDialog from "./components/HelpDialog.jsx";
import Welcome from "./components/Welcome.jsx";

// ===== Screens (order = navigation order) =====
const SCREENS = [
  { id: "today", label: "Today", icon: "nav_today" },
  { id: "checkin", label: "Check-in", icon: "nav_checkin" },
  { id: "body", label: "Body", icon: "nav_body" },
  { id: "trends", label: "Trends", icon: "nav_trends" },
  { id: "how", label: "How we know", short: "Evidence", icon: "nav_how" },
];

// ===== Navigation =====
/** One screen button: icon + word, glass pill; `vertical` = sidebar layout. In the top bar the
 *  icon sits above the word on phones, so all four tabs fit side by side without scrolling. */
function NavButton({ screen, active, onClick, vertical = false }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined}
            className={`tap shrink-0 flex items-center rounded-2xl whitespace-nowrap glass-control
                        ${vertical ? "w-full gap-3 px-4 text-lg" : "flex-col sm:flex-row justify-center gap-1 sm:gap-3 px-1 sm:px-4 text-sm sm:text-base"}
                        ${active ? "glass-active font-semibold text-ink" : "border-transparent! shadow-none! text-ink-2"}`}>
      <Glyph name={screen.icon} size={vertical ? 26 : 22} className={active ? "text-model drop-shadow-[0_0_6px_rgb(86_180_233/0.85)]" : "text-ink-2"} />
      {/* Phones: a short word so five tabs fit side by side. */}
      {screen.short && !vertical ? (<><span className="sm:hidden">{screen.short}</span><span className="hidden sm:inline">{screen.label}</span></>) : screen.label}
    </button>
  );
}

/** Floating glass sidebar for wide screens (like a native app's source list). */
function Sidebar({ screen, onScreen, onHelp, astronaut, onAstronaut, env }) {
  const where = META.environments[env];
  return (
    <aside className="panel hidden lg:flex flex-col gap-1 p-3 w-64 shrink-0 sticky top-4 h-[calc(100vh-2rem)] ml-4 my-4"
           aria-label="Baseline">
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <span className="grid place-items-center w-12 h-12 rounded-2xl glass-active">
          <Glyph name="logo" size={30} className="text-ink" />
        </span>
        <span>
          <span className="block text-2xl font-bold tracking-tight">Baseline</span>
          <span className="block text-sm text-ink-2">Your personal normal</span>
        </span>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Screens">
        {SCREENS.map((s) => (
          <NavButton key={s.id} screen={s} active={s.id === screen} onClick={() => onScreen(s.id)} vertical />
        ))}
      </nav>
      <div className="mt-auto pt-3 border-t border-line flex flex-col gap-2">
        <NavButton screen={{ label: "Help", icon: "nav_help" }} active={false} onClick={onHelp} vertical />
        {/* Crew switch in the bottom-left corner, with where the selected member is. */}
        <div className="px-1">
          <p className="px-1 text-sm text-ink-2">Crew member</p>
          <div className="grid grid-cols-3 gap-1 mt-1" role="group" aria-label="Crew member">
            {META.crew.map((c) => (
              <TapButton key={c.id} active={c.id === astronaut} onClick={() => onAstronaut(c.id)}
                         title={c.display_name} className="text-center! px-1! text-base!">
                {c.display_name.replace(/^Crew Member /, "")}
              </TapButton>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-2 px-1 text-sm text-ink-2" aria-live="polite">
            <span className="text-ink"><EnvIcon id={env} size={24} /></span>
            <span>
              <span className="block text-ink font-semibold">{where.name}</span>
              Earth {where.one_way_delay_text} one way
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}

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
  const [help, setHelp] = useState(false);
  const [welcomed, setWelcomed] = usePersisted("intro", "show", (v) => v === "show" || v === "seen");
  const [queued, setQueued] = useState([]);

  const records = useMemo(() => recordsFor(astronaut), [astronaut]);
  const record = records.find((r) => r.day === day) ?? records[records.length - 1];
  const crewName = META.crew.find((c) => c.id === astronaut)?.display_name;
  const openSystem = (id) => { setSystem(id); setScreen("body"); };

  const current = SCREENS.find((s) => s.id === screen);

  return (
    <div className="lg:flex lg:items-start">
      <Sidebar screen={screen} onScreen={setScreen} onHelp={() => setHelp(true)} astronaut={astronaut} onAstronaut={setAstronaut} env={env} />

      <div className="flex-1 min-w-0 max-w-7xl mx-auto p-4 md:p-6">
      {/* Floating glass header: the Emergency button is always visible and never covers content. */}
      <header className="panel sticky top-3 z-40 px-3 md:px-5 py-2 mb-4 flex items-center gap-2 md:gap-4">
        <span className="hidden sm:grid lg:hidden place-items-center w-11 h-11 shrink-0 rounded-2xl glass-active" aria-hidden="true">
          <Glyph name="logo" size={26} className="text-ink" />
        </span>
        <div className="flex-1 min-w-0">
          {/* Phones: brand + call sign; wide screens (brand is in the sidebar): screen title + crew. */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
            <span className="lg:hidden">Baseline</span>
            <span className="hidden lg:inline">{current?.label}</span>
          </h1>
          <p className="text-sm md:text-base text-ink-2 truncate">
            <span className="sm:hidden">{crewName?.replace(/^Crew Member /, "")}</span>
            <span className="hidden sm:inline">{crewName} · {META.environments[env].name} · mission day {record.day}</span>
          </p>
        </div>
        <button type="button" onClick={() => setHelp(true)} aria-label="Help: how to read Baseline"
                className="tap shrink-0 rounded-2xl bg-panel-2 glass-control text-2xl font-bold lg:hidden">?</button>
        <button type="button" onClick={() => setEmergency(true)}
                className="tap shrink-0 px-3 md:px-7 rounded-2xl text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2 md:gap-3 bg-critical
                           shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_30px_-8px_rgb(208_59_59/0.7)]">
          <StatusIcon status="red" size={26} /> Emergency
        </button>
      </header>

      {/* Demo control: scrub through the precomputed 120-day mission. */}
      <MissionTimeline records={records} day={record.day} onDay={setDay} astronaut={astronaut}
                       controls={<DemoControls astronaut={astronaut} onAstronaut={setAstronaut} env={env} onEnv={setEnv} />} />

      {/* Phones and tablets: one row of glass pills that scrolls sideways inside the bar (the page
          itself never does). Wide screens use the sidebar instead. */}
      <nav className="lg:hidden grid grid-cols-5 gap-1 sm:gap-2 mb-4" aria-label="Screens">
        {SCREENS.map((s) => (
          <NavButton key={s.id} screen={s} active={s.id === screen} onClick={() => setScreen(s.id)} />
        ))}
      </nav>

      <main>
        {/* Five tabs. Earth link lives on Today; How we know (with the sources) opens from "?" and from
            Trends; crew member and environment are demo controls in the timeline panel. */}
        {screen === "today" && (
          <div className="grid gap-4">
            <Today record={record} records={records} env={env} onOpenSystem={openSystem} onOpenCheckin={() => setScreen("checkin")}
                   onEmergency={() => setEmergency(true)} />
            <EarthLink astronaut={astronaut} day={record.day} env={env} record={record} records={records} queued={queued}
                       onQueue={(report) => setQueued([...queued.filter((q) => !(q.astronaut === report.astronaut && q.day === report.day)), report])} />
          </div>
        )}
        {screen === "checkin" && <CheckIn record={record} onEmergency={() => setEmergency(true)} />}
        {screen === "body" && <Body record={record} records={records} system={system} onSelect={setSystem} />}
        {screen === "trends" && <Trends records={records} day={record.day} astronaut={astronaut} onAbout={() => setScreen("how")} />}
        {screen === "how" && <HowWeKnow />}
      </main>

      <footer className="mt-8 mb-8 text-sm text-muted">{META.disclaimer}</footer>
      </div>
      {help && <HelpDialog onClose={() => setHelp(false)} onIntro={() => { setHelp(false); setWelcomed("show"); }}
                            onAbout={() => { setHelp(false); setScreen("how"); }} />}
      {welcomed === "show" && !emergency && <Welcome onClose={() => setWelcomed("seen")} />}
      {emergency && <Emergency env={env} record={record} onClose={() => setEmergency(false)} />}
    </div>
  );
}
