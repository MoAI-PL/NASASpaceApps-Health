// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { Glyph, StatusIcon } from "./icons.jsx";
import PolyBody from "./PolyBody.jsx";

// ===== Body map: polygonal figure + one labelled button per system =====
// Head = mind & sleep, chest = heart, abdomen = metabolism; immune & temperature is a whole-body
// system, so it is the neck and limbs. The figure is drawn in PolyBody.jsx (own geometry).
const ORDER = ["mind_sleep", "heart", "metabolism", "immune_temp"];

/** `compact`: narrow panel (Today) — smaller figure and labels, one column, no system glyph. */
export default function BodyMap({ record, selected, onSelect, compact = false }) {
  const st = record.systems;
  return (
    <section className="panel p-5">
      <h2 className="text-ink-2 text-lg mb-2">Body systems</h2>
      {/* Figure on top (arms out needs the width), the labelled system buttons below it. */}
      <PolyBody systems={st} selected={selected} onSelect={onSelect} width={compact ? 260 : 340}
                label={`Body map: ${ORDER.map((id) => `${META.systems[id].name} ${st[id]}`).join(", ")}`} />
      <div className={`grid gap-2 mt-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {ORDER.map((id) => (
          <button key={id} type="button" onClick={() => onSelect(id)} aria-pressed={selected === id}
                  className={`tap flex items-center gap-3 px-4 rounded-2xl text-left glass-control
                              ${compact ? "text-base leading-snug" : "text-lg"} ${selected === id ? "glass-active" : "bg-panel-2"}`}>
            <StatusIcon status={st[id]} />
            {!compact && <Glyph name={id} size={24} className="text-ink-2" />}
            {META.systems[id].name}
          </button>
        ))}
      </div>
    </section>
  );
}
