// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { EARTH_REPORTS, META } from "../data.js";
import { ESCALATION_TEXT } from "../content/texts.js";
import { Glyph, StatusIcon } from "../components/icons.jsx";
import { Panel, TapButton } from "../components/ui.jsx";

// ===== Earth link: signal delay and reports queued for the next communication window =====
export default function EarthLink({ astronaut, day, env, queued, onQueue }) {
  const e = META.environments[env];
  const reports = EARTH_REPORTS.filter((r) => r.astronaut === astronaut && r.day <= day);
  const manual = queued.filter((q) => q.astronaut === astronaut);

  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="flex items-center gap-3 text-xl font-semibold"><Glyph name="distance" /> Earth link · {e.name}</h2>
        <p className="text-lg text-ink-2 mt-1">One-way signal delay: {e.one_way_delay_text}</p>
        <TapButton onClick={onQueue} className="mt-4 bg-model! text-on-status font-semibold">Queue health report for downlink</TapButton>
        <p className="mt-3 text-lg">Manually queued: {manual.length ? manual.map((q) => `day ${q.day}`).join(", ") : "none"}</p>
      </Panel>

      <Panel title="Automatic reports (escalations)">
        {reports.length === 0 && <p className="text-lg">None yet.</p>}
        <ul className="grid gap-2">
          {reports.map((r) => (
            <li key={r.day} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-panel-2 text-lg">
              <StatusIcon status={r.level} />
              <span className="font-semibold">Day {r.day}</span>
              <span>{ESCALATION_TEXT[r.escalation]}</span>
              <span className="text-ink-2">SAI last 7 days: {r.sai_last_7_days.map((s) => s ?? "—").join(" · ")}</span>
              <span className="text-ink-2">Queued for downlink · arrives after {e.one_way_delay_text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Reports are stored on board and sent in the next communication window.</p>
      </Panel>
    </div>
  );
}
