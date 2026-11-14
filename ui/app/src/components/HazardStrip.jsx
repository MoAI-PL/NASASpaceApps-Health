// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, fmt } from "../data.js";
import { STATUS_LABEL } from "../content/texts.js";
import { Glyph, StatusIcon } from "./icons.jsx";

// ===== The five NASA HRP hazards, always visible (PLAN.md section 0.1) =====
export default function HazardStrip({ record, env }) {
  const delay = META.environments[env].one_way_delay_text;
  const detail = (id, st) =>
    id === "radiation" ? `${fmt("radiation_cum_mGy", record.context.radiation_cum_mGy)} mGy total` :
    id === "closed_environment" ? `CO₂ ${fmt("cabin_co2_mmHg", record.context.cabin_co2_mmHg)} mmHg` :
    id === "distance" ? `Earth: ${delay}` : STATUS_LABEL[st];
  return (
    <section className="panel p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" aria-label="Spaceflight hazards">
      {Object.entries(META.hazards).map(([id, h]) => {
        const st = record.hazards[id];
        return (
          <div key={id} className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2">
              <Glyph name={id} />
              <StatusIcon status={st} size={22} />
            </div>
            <div className="text-base">{h.name}</div>
            <div className="text-sm text-ink-2">{detail(id, st)}</div>
          </div>
        );
      })}
    </section>
  );
}
