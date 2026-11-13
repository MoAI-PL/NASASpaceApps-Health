// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, checkinStreak } from "../data.js";
import { ESCALATION_TEXT, EVENT_TEXT, PROMPTS } from "../content/texts.js";
import Gauge from "../components/Gauge.jsx";
import BodyMap from "../components/BodyMap.jsx";
import HazardStrip from "../components/HazardStrip.jsx";
import { StatusIcon } from "../components/icons.jsx";
import { Panel, Text } from "../components/ui.jsx";

// ===== Today: SAI, body figure, what moved, actions, hazards, streak =====
export default function Today({ record, records, env, onOpenSystem }) {
  const moved = Object.entries(record.contributions).filter(([f]) => f !== "other");
  const streak = checkinStreak(records, record.day);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {record.events.length > 0 && (
        <div className="md:col-span-3 grid gap-2">
          {record.events.map((e) => (
            <div key={e} role="status" className="panel p-4 flex items-start gap-3 border-warning">
              <StatusIcon status="yellow" />
              <div>
                <div className="text-lg font-semibold">{EVENT_TEXT[e].title}</div>
                <Text className="text-ink-2">{EVENT_TEXT[e].body}</Text>
              </div>
            </div>
          ))}
        </div>
      )}

      <Gauge record={record} />
      <BodyMap record={record} selected={null} onSelect={onOpenSystem} />

      <Panel title="What moved away from your normal">
        {record.sai == null ? (
          <p className="text-muted">Not enough days yet.</p>
        ) : (
          moved.map(([f, share]) => (
            <div key={f} className="mb-2">
              <div className="flex justify-between text-lg">
                <span>{META.features[f]?.name ?? f}</span><span>{Math.round(share * 100)}%</span>
              </div>
              <div className="h-3 rounded bg-panel-2">
                <div className="h-3 rounded bg-model" style={{ width: `${share * 100}%` }} />
              </div>
            </div>
          ))
        )}
        <h3 className="mt-4 text-ink-2 text-lg">Today's actions</h3>
        {record.prompts.length === 0 ? (
          <p className="text-lg mt-1">Routine measurements only.</p>
        ) : (
          record.prompts.map((p) => (
            <div key={p} className="tap mt-2 flex items-center gap-3 px-4 rounded-xl bg-panel-2 text-lg">▶ {PROMPTS[p].title}</div>
          ))
        )}
        <div className="mt-4 flex items-center gap-3 text-lg">
          <StatusIcon status={record.level} /> {ESCALATION_TEXT[record.escalation]}
        </div>
        <p className="mt-4 text-ink-2">Check-in streak: <span className="font-semibold text-ink">{streak} days</span></p>
      </Panel>

      <div className="md:col-span-3"><HazardStrip record={record} env={env} /></div>
    </div>
  );
}
