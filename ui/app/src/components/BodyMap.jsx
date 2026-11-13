// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { Glyph, STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Body figure: one clickable zone per system (own SVG) =====
// TODO(UI): replace the placeholder figure with the final body drawing (own SVG).
const ZONES = {
  mind_sleep: <circle cx="100" cy="42" r="28" />,
  heart: <rect x="68" y="80" width="64" height="58" rx="18" />,
  metabolism: <rect x="72" y="142" width="56" height="50" rx="16" />,
  immune_temp: <g><rect x="34" y="84" width="26" height="100" rx="13" /><rect x="140" y="84" width="26" height="100" rx="13" /></g>,
};

export default function BodyMap({ record, selected, onSelect }) {
  return (
    <section className="panel p-5">
      <h2 className="text-ink-2 text-lg mb-2">Body systems</h2>
      <div className="flex flex-wrap gap-4 items-start">
        <svg width="160" height="240" viewBox="0 0 200 300" role="img" aria-label="Body map" className="shrink-0">
          <path d="M80 196 L74 290 H96 L100 210 L104 290 H126 L120 196 Z" fill="var(--color-panel-2)" />
          {Object.entries(ZONES).map(([id, shape]) => {
            const st = record.systems[id];
            return (
              <g key={id} onClick={() => onSelect(id)} style={{ cursor: "pointer" }}
                 fill={st === "green" ? "var(--color-panel-2)" : STATUS_COLOR[st]}
                 fillOpacity={st === "green" ? 1 : 0.35}
                 stroke={selected === id ? "var(--color-ink)" : STATUS_COLOR[st]}
                 strokeWidth={selected === id ? 4 : 2}>
                {shape}
              </g>
            );
          })}
        </svg>
        <div className="flex flex-col gap-2 flex-1 min-w-48">
          {Object.keys(ZONES).map((id) => (
            <button key={id} type="button" onClick={() => onSelect(id)} aria-pressed={selected === id}
                    className={`tap flex items-center gap-3 px-4 rounded-xl text-left text-lg ${selected === id ? "bg-line" : "bg-panel-2"}`}>
              <StatusIcon status={record.systems[id]} />
              <Glyph name={id} size={24} className="text-ink-2" />
              {META.systems[id].name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
