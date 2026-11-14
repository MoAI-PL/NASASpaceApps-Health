// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useState } from "react";
import { META, checkinStreak } from "../data.js";
import { ESCALATION_TEXT, EVENT_TEXT, PROMPTS } from "../content/texts.js";
import Gauge from "../components/Gauge.jsx";
import BodyMap from "../components/BodyMap.jsx";
import HazardStrip from "../components/HazardStrip.jsx";
import { StatusIcon } from "../components/icons.jsx";
import { Panel, SourceLink, Text } from "../components/ui.jsx";

// ===== Today: SAI, body figure, what moved, actions, hazards, streak =====
export default function Today({ record, records, env, onOpenSystem }) {
  const moved = Object.entries(record.contributions).filter(([f]) => f !== "other");
  const streak = checkinStreak(records, record.day);
  const [openPrompt, setOpenPrompt] = useState(null);

  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-start">
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

      <Gauge record={record}>
        <div className="mt-5 pt-4 border-t border-line w-full grid gap-3 text-lg">
          <div className="flex items-center gap-3">
            <StatusIcon status={record.level} /> {ESCALATION_TEXT[record.escalation]}
          </div>
          <p className="text-ink-2">Check-in streak: <span className="font-semibold text-ink">{streak} days</span></p>
        </div>
      </Gauge>
      <BodyMap record={record} selected={null} onSelect={onOpenSystem} compact />

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
          record.prompts.map((p) => {
            const prompt = PROMPTS[p], open = openPrompt === p;
            return (
              <div key={p} className="mt-2 rounded-xl bg-panel-2">
                <button type="button" onClick={() => setOpenPrompt(open ? null : p)} aria-expanded={open}
                        className="tap w-full flex items-center gap-3 px-4 rounded-xl text-lg text-left">
                  <span aria-hidden="true">{open ? "▼" : "▶"}</span> {prompt.title}
                </button>
                {open && (
                  <dl className="px-4 pb-4 grid gap-2 text-lg">
                    <dt className="text-ink-2">How</dt><dd><Text>{prompt.how}</Text></dd>
                    <dt className="text-ink-2">Why</dt><dd><Text>{prompt.why}</Text></dd>
                    <dt className="text-ink-2">If abnormal</dt><dd><Text>{prompt.ifAbnormal}</Text></dd>
                    <dd><SourceLink id={prompt.source} /></dd>
                  </dl>
                )}
              </div>
            );
          })
        )}
      </Panel>

      <div className="md:col-span-3"><HazardStrip record={record} env={env} /></div>
    </div>
  );
}
