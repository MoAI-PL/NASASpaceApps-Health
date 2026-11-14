// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { Glyph, STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Body figure (own SVG, viewBox 200 × 320) =====
// Immune & temperature is a whole-body system, so it is the silhouette itself; the other
// systems are zones drawn on top of it: head = mind & sleep, chest = heart, abdomen = metabolism.
const SILHOUETTE = (
  <g>
    <rect x="91" y="54" width="18" height="18" rx="6" />
    <rect x="60" y="66" width="80" height="126" rx="28" />
    <rect x="36" y="72" width="22" height="112" rx="11" transform="rotate(7 47 72)" />
    <rect x="142" y="72" width="22" height="112" rx="11" transform="rotate(-7 153 72)" />
    <rect x="64" y="182" width="32" height="128" rx="15" />
    <rect x="104" y="182" width="32" height="128" rx="15" />
  </g>
);
const ZONES = {
  mind_sleep: { shape: <circle cx="100" cy="32" r="26" />, at: [100, 32] },
  heart: { shape: <rect x="72" y="78" width="56" height="54" rx="18" />, at: [100, 105] },
  metabolism: { shape: <rect x="74" y="138" width="52" height="46" rx="16" />, at: [100, 161] },
};
const IMMUNE_AT = [80, 250]; // status marker on the silhouette (left leg)
const ORDER = ["mind_sleep", "heart", "metabolism", "immune_temp"];

/** Fill, stroke and stroke width of one system's shape. */
function paint(status, isSelected) {
  const off = status !== "green";
  return {
    fill: off ? STATUS_COLOR[status] : "var(--color-panel-2)",
    stroke: isSelected ? "var(--color-ink)" : off ? STATUS_COLOR[status] : "var(--color-good)",
    strokeWidth: isSelected ? 4 : 2,
  };
}

/** Status shape at a point, only when the system is away from normal (colour is never alone). */
function Marker({ status, at: [x, y] }) {
  if (status === "green") return null;
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r="19" fill="var(--color-panel)" />
      <g transform={`translate(${x - 14} ${y - 14})`}><StatusIcon status={status} size={28} /></g>
    </g>
  );
}

/** `compact`: narrow panel (Today) — smaller labels, no system glyph, so names never overflow. */
export default function BodyMap({ record, selected, onSelect, compact = false }) {
  const st = record.systems;
  return (
    <section className="panel p-5">
      <h2 className="text-ink-2 text-lg mb-2">Body systems</h2>
      <div className="flex flex-wrap gap-4 items-start">
        <svg width="150" height="240" viewBox="0 0 200 320" role="img" className="shrink-0 mx-auto"
             aria-label={`Body map: ${ORDER.map((id) => `${META.systems[id].name} ${st[id]}`).join(", ")}`}>
          <g onClick={() => onSelect("immune_temp")} style={{ cursor: "pointer" }} {...paint(st.immune_temp, selected === "immune_temp")}>
            {SILHOUETTE}
          </g>
          {Object.entries(ZONES).map(([id, z]) => (
            <g key={id} onClick={() => onSelect(id)} style={{ cursor: "pointer" }} {...paint(st[id], selected === id)}>
              {z.shape}
            </g>
          ))}
          {Object.entries(ZONES).map(([id, z]) => <Marker key={id} status={st[id]} at={z.at} />)}
          <Marker status={st.immune_temp} at={IMMUNE_AT} />
        </svg>
        <div className={`flex flex-col gap-2 flex-1 ${compact ? "min-w-36" : "min-w-48"}`}>
          {ORDER.map((id) => (
            <button key={id} type="button" onClick={() => onSelect(id)} aria-pressed={selected === id}
                    className={`tap flex items-center gap-3 px-4 rounded-xl text-left ${compact ? "text-base leading-snug" : "text-lg"} ${selected === id ? "bg-line" : "bg-panel-2"}`}>
              <StatusIcon status={st[id]} />
              {!compact && <Glyph name={id} size={24} className="text-ink-2" />}
              {META.systems[id].name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
