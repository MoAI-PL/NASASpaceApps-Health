// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { Glyph, STATUS_COLOR } from "./icons.jsx";

// ===== Mission timeline: the demo's day control, with the mission's story drawn on it =====
// A status strip (one cell per day for the selected crew member), markers for the real solar
// particle events from NASA DONKI (tap one to jump to that day), a range input for keyboard and
// screen-reader use, and ◀ ▶ buttons for one-day steps.

export default function MissionTimeline({ records, day, onDay }) {
  const days = META.mission.days;
  const sep = META.space_weather.event_days ?? [];
  const at = (d) => `${((d - 0.5) / days) * 100}%`;
  const step = (n) => onDay(Math.min(days, Math.max(1, day + n)));

  return (
    <div className="panel px-4 py-2 md:p-4 mb-3 md:mb-4">
      <div className="flex items-center gap-3">
        <label htmlFor="day" className="text-base md:text-lg whitespace-nowrap">
          Mission day <span className="font-bold text-2xl">{day}</span>
          <span className="text-muted text-sm ml-1">/ {days}</span>
        </label>
        <span className="text-muted text-sm hidden sm:inline">synthetic demo mission</span>
        <div className="ml-auto flex gap-2">
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
        <div className="flex h-3 rounded overflow-hidden" aria-hidden="true">
          {records.map((r) => (
            <div key={r.day} className="flex-1"
                 style={{ background: r.level === "green" ? "var(--color-panel-2)" : STATUS_COLOR[r.level], opacity: r.day > day ? 0.35 : 1 }} />
          ))}
        </div>
        <input id="day" type="range" min="1" max={days} value={day} onChange={(e) => onDay(+e.target.value)}
               className="w-full mt-1" />
      </div>
      <p className="text-muted text-sm hidden md:block">
        Strip: this crew member’s daily status (grey = nominal) · <Glyph name="radiation" size={14} className="inline text-warning" /> real
        solar particle events from NASA DONKI in the mission window ({META.mission.start_date} onward).
      </p>
    </div>
  );
}
