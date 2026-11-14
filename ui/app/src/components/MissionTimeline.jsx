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
      <p className="mt-2 text-ink-2 text-base">
        One synthetic crew member. Across the one-time test on an unseen change (infection onset), Baseline was a median
        5 days earlier than clinical limits and 7.5 days earlier than single-value limits, with more false alarms.
        Proof of concept, not clinical validation.
      </p>
      <button type="button" onClick={onClose} className="tap mt-2 px-4 rounded-xl bg-panel-2">Close summary</button>
    </div>
  );
}

export default function MissionTimeline({ records, day, onDay, astronaut }) {
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
    <div className="panel px-4 py-2 md:p-4 mb-3 md:mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="day" className="text-base md:text-lg whitespace-nowrap">
          Mission day <span className="font-bold text-2xl tabular-nums">{day}</span>
          <span className="text-muted text-sm ml-1">/ {days}</span>
        </label>
        <span className="text-muted text-sm hidden sm:inline">synthetic demo mission</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={playing ? stop : replay} aria-pressed={playing}
                  className="tap px-4 rounded-xl bg-model text-on-status font-semibold">
            {playing ? "■ Stop" : "▶ Replay mission"}
          </button>
          <button type="button" onClick={() => step(-1)} aria-label="Previous day"
                  className="tap px-3 rounded-xl bg-panel-2 text-lg">◀</button>
          <button type="button" onClick={() => step(1)} aria-label="Next day"
                  className="tap px-3 rounded-xl bg-panel-2 text-lg">▶</button>
        </div>
      </div>

      <div className="relative mt-2">
        {/* Solar particle events (NASA DONKI): tap to jump to the day. */}
        <div className="relative h-7" aria-label="Solar particle events from NASA DONKI">
          {sep.map((d) => (
            <button key={d} type="button" onClick={() => onDay(d)} title={`Day ${d}: solar particle event (NASA DONKI)`}
                    aria-label={`Day ${d}: solar particle event`}
                    className="absolute top-0 -translate-x-1/2 text-warning hover:text-ink" style={{ left: at(d) }}>
              <Glyph name="radiation" size={20} className="" />
            </button>
          ))}
        </div>
        {/* Daily status of this crew member (shape + word are on the Today screen). */}
        <div className="relative">
          <div className="flex h-3 rounded overflow-hidden" aria-hidden="true">
            {records.map((r) => (
              <div key={r.day} className="flex-1"
                   style={{ background: r.level === "green" ? "var(--color-panel-2)" : STATUS_COLOR[r.level], opacity: r.day > day ? 0.35 : 1 }} />
            ))}
          </div>
          {scenario && (
            <span className="absolute -top-1 h-5 border-l-2 border-dashed border-ink" style={{ left: at(scenario.start_day) }}
                  title={`Day ${scenario.start_day}: simulated ${scenario.name.toLowerCase()} begins`} aria-hidden="true" />
          )}
        </div>
        <input id="day" type="range" min="1" max={days} value={day} onChange={(e) => onDay(+e.target.value)}
               className="w-full mt-1" />
      </div>

      {today.length > 0 && (
        <p className="text-sm text-ink-2">
          <Glyph name="radiation" size={14} className="inline text-warning" /> Day {day}:{" "}
          {today.length === 1 ? "solar particle event" : `${today.length} solar particle event records`},{" "}
          {today[0].time.slice(0, 10)} from {today[0].time.slice(11, 16)} UTC ·{" "}
          <a href={today[0].link} target="_blank" rel="noreferrer" className="underline underline-offset-2">NASA DONKI record</a>
        </p>
      )}
      <p className="text-muted text-sm hidden md:block">
        Strip: this crew member’s daily status (grey = nominal){scenario && <> · dashed line: simulated change begins (day {scenario.start_day})</>} ·{" "}
        <Glyph name="radiation" size={14} className="inline text-warning" /> real solar particle events from NASA DONKI ({META.mission.start_date} onward).
      </p>
      {summary && !playing && <ReplaySummary records={records} scenario={scenario} onClose={() => setSummary(false)} />}
    </div>
  );
}
