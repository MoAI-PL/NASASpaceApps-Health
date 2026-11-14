// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useRef, useState } from "react";
import { META } from "../data.js";
import { Glyph, STATUS_COLOR } from "./icons.jsx";

// ===== Mission timeline: the demo's day control, with the mission's story drawn on it =====
// A status strip (one cell per day for the selected crew member) with the start of the
// simulated health change marked (meta.crew[].scenario, J2), markers for the real solar particle
// events from NASA DONKI (tap to jump; the event's DONKI page is linked, J3), a range input for
// keyboard and screen-reader use, ◀ ▶ one-day steps, and "Replay mission": the 120 days play in
// about 20 seconds and end on an honest summary of when each method raised its first alert.

const isModelAlert = (r) => r.level === "yellow" || r.level === "orange";
const METHODS = [
  { label: "Baseline model", color: "var(--color-model)", test: isModelAlert },
  { label: "Single-value limits", color: "var(--color-b2)", test: (r) => r.univariate_alert },
  { label: "Clinical limits", color: "var(--color-b1)", test: (r) => r.rule_alert },
];

/** First alert day of each method from `start` on, and alerts before it (false alarms). */
function story(records, start) {
  return METHODS.map((m) => ({
    ...m,
    first: records.find((r) => r.day >= start && m.test(r))?.day ?? null,
    early: records.filter((r) => r.day < start && m.test(r)).map((r) => r.day)
      .filter((d, i, a) => i === 0 || a[i - 1] !== d - 1), // first day of each run only
  }));
}

/** The end card of the replay: the scenario, each method's first alert, false alarms, limits. */
function ReplaySummary({ records, scenario, onClose }) {
  // No simulated change: every alert counts as a false alarm (start after the last day).
  const start = scenario?.start_day ?? META.mission.days + 1;
  const rows = story(records, start);
  const model = rows[0].first;
  return (
    <div role="status" className="mt-3 p-4 rounded-2xl bg-panel-2 border border-line">
      <p className="text-lg font-semibold">
        {scenario ? `Simulated ${scenario.name.toLowerCase()} from day ${start}` : "No health change was simulated for this crew member"}
      </p>
      <ul className="mt-2 grid gap-1 text-lg">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-wrap items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: r.color }} aria-hidden="true" />
            <span className="min-w-44">{r.label}</span>
            <span className="font-semibold">
              {scenario ? (r.first ? `day ${r.first}` : "no alert") : `${r.early.length} alert${r.early.length === 1 ? "" : "s"}`}
            </span>
            {scenario && model && r.first && r !== rows[0] && (
              <span className="text-ink-2">({r.first - model > 0 ? `Baseline ${r.first - model} days earlier` : r.first === model ? "same day" : `Baseline ${model - r.first} days later`})</span>
            )}
            {scenario && r.early.length > 0 && (
              <span className="text-ink-2 text-base">· false alarm before the change: day {r.early.join(", ")}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-ink-2 text-sm">Synthetic demo data — proof of concept, not clinical validation.</p>
      <button type="button" onClick={onClose} className="tap mt-2 px-4 rounded-xl bg-panel-2">Close summary</button>
    </div>
  );
}

export default function MissionTimeline({ records, day, onDay, astronaut, controls }) {
  const days = META.mission.days;
  const events = META.space_weather.events ?? [];
  const sep = META.space_weather.event_days ?? [];
  const scenario = META.crew.find((c) => c.id === astronaut)?.scenario ?? null;
  const at = (d) => `${((d - 0.5) / days) * 100}%`;
  const step = (n) => onDay(Math.min(days, Math.max(1, day + n)));
  const today = events.filter((e) => e.day === day);

  // ----- Replay: about 20 s for 120 days; instant for reduced-motion users -----
  const [playing, setPlaying] = useState(false);
  const [summary, setSummary] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  useEffect(() => { setSummary(false); }, [astronaut]);
  const replay = () => {
    clearInterval(timer.current);
    setSummary(false);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { onDay(days); setSummary(true); return; }
    let d = 1;
    onDay(d);
    setPlaying(true);
    timer.current = setInterval(() => {
      d += 1;
      onDay(d);
      if (d >= days) { clearInterval(timer.current); setPlaying(false); setSummary(true); }
    }, 165);
  };
  const stop = () => { clearInterval(timer.current); setPlaying(false); setSummary(true); };

  return (
    <div className="panel px-4 py-3 md:px-5 mb-3 md:mb-4">
      {/* Row 1: the day, one-day steps, replay. */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => step(-1)} aria-label="Previous day" className="tap px-3 rounded-xl bg-panel-2 text-lg">◀</button>
        <label htmlFor="day" className="flex-1 text-center">
          <span className="block text-sm text-ink-2 whitespace-nowrap">Mission day</span>
          <span className="whitespace-nowrap"><span className="text-3xl font-bold tabular-nums">{day}</span><span className="text-ink-2"> / {days}</span></span>
        </label>
        <button type="button" onClick={() => step(1)} aria-label="Next day" className="tap px-3 rounded-xl bg-panel-2 text-lg">▶</button>
        <button type="button" onClick={playing ? stop : replay} aria-pressed={playing}
                aria-label={playing ? "Stop replay" : "Replay the whole mission"}
                className="tap px-4 rounded-xl bg-model text-on-status font-semibold">
          {playing ? "■" : "▶"}<span className="hidden sm:inline">{playing ? " Stop" : " Replay"}</span>
        </button>
      </div>

      {/* Row 2: one track — status strip, slider on top, solar events above. */}
      <div className="relative mt-3 pt-5">
        {sep.map((d) => (
          <button key={d} type="button" onClick={() => onDay(d)} title={`Day ${d}: solar particle event (NASA DONKI)`}
                  aria-label={`Day ${d}: solar particle event`}
                  className="absolute top-0 -translate-x-1/2 text-warning hover:text-ink" style={{ left: at(d) }}>
            <Glyph name="radiation" size={16} className="" />
          </button>
        ))}
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex h-2.5 rounded-full overflow-hidden" aria-hidden="true">
            {records.map((r) => (
              <div key={r.day} className="flex-1"
                   style={{ background: r.level === "green" ? "var(--color-panel-2)" : STATUS_COLOR[r.level], opacity: r.day > day ? 0.35 : 1 }} />
            ))}
          </div>
          {scenario && (
            <span className="absolute top-0 h-8 border-l-2 border-dotted border-ink" style={{ left: at(scenario.start_day) }}
                  title={`Day ${scenario.start_day}: simulated change begins`} aria-hidden="true" />
          )}
          <input id="day" type="range" min="1" max={days} value={day} onChange={(e) => onDay(+e.target.value)}
                 className="track-range absolute inset-0 w-full h-8" />
        </div>
      </div>

      {/* Row 3: three-word legend, and the event of the day when there is one. */}
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm" style={{ background: STATUS_COLOR.orange }} />status</span>
        <span className="flex items-center gap-1"><Glyph name="radiation" size={12} className="text-warning" />solar event</span>
        {scenario && <span className="flex items-center gap-1"><span className="inline-block h-3 border-l-2 border-dotted border-ink" />change starts</span>}
        {today.length > 0 && (
          <a href={today[0].link} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-warning">
            Solar event today · NASA DONKI ↗
          </a>
        )}
      </p>
      {controls}
      {summary && !playing && <ReplaySummary records={records} scenario={scenario} onClose={() => setSummary(false)} />}
    </div>
  );
}
