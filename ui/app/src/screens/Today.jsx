// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, checkinStreak, recentDirection } from "../data.js";
import { EVENT_TEXT } from "../content/texts.js";
import Gauge from "../components/Gauge.jsx";
import NextStep from "../components/NextStep.jsx";
import BodyMap from "../components/BodyMap.jsx";
import HazardStrip from "../components/HazardStrip.jsx";
import HabitatCheck from "../components/HabitatCheck.jsx";
import Readiness from "../components/Readiness.jsx";
import { StatusIcon } from "../components/icons.jsx";
import { Panel, SourceLink, Text } from "../components/ui.jsx";

// ===== Today: do-this-now card first, then index, body figure, what moved, hazards =====
export default function Today({ record, records, env, onOpenSystem, onOpenCheckin, onEmergency }) {
  const moved = Object.entries(record.contributions).filter(([f]) => f !== "other");
  const streak = checkinStreak(records, record.day);

  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-start">
      <NextStep record={record} records={records} onOpenCheckin={onOpenCheckin} onOpenSystem={onOpenSystem} onEmergency={onEmergency} />
      {record.events.length > 0 && (
        <div className="md:col-span-3 grid gap-2">
          {record.events.map((e) => (
            <div key={e} role="status" className="panel p-4 flex items-start gap-3 border-warning">
              <StatusIcon status="yellow" />
              <div>
                <div className="text-lg font-semibold">{EVENT_TEXT[e].title}</div>
                <Text className="text-ink-2">{EVENT_TEXT[e].body}</Text>
                {EVENT_TEXT[e].source && <div className="mt-1"><SourceLink id={EVENT_TEXT[e].source} /></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Gauge record={record}>
        <p className="mt-5 pt-4 border-t border-line w-full text-lg text-ink-2">
          Full check-ins in a row: <span className="font-semibold text-ink">{streak} days</span>
        </p>
      </Gauge>
      <BodyMap record={record} selected={null} onSelect={onOpenSystem} compact />

      <Panel title="What moved away from your normal">
        {record.sai == null ? (
          <p className="text-muted text-lg">The index starts on day 7, once a full week of check-ins exists.</p>
        ) : (
          <>
            {moved.map(([f, share]) => {
              const dir = recentDirection(records, record.astronaut, record.day, f);
              return (
                <div key={f} className="mb-3">
                  <div className="flex justify-between gap-3 text-lg">
                    <span>
                      <span aria-hidden="true">{dir > 0 ? "▲ " : dir < 0 ? "▼ " : ""}</span>
                      {META.features[f]?.name ?? f}
                      {dir !== 0 && <span className="text-ink-2"> — {dir > 0 ? "higher" : "lower"} than your normal</span>}
                    </span>
                    <span className="text-ink-2 whitespace-nowrap">{Math.round(share * 100)}%</span>
                  </div>
                  <div className="h-3 rounded bg-panel-2">
                    <div className="h-3 rounded bg-model" style={{ width: `${share * 100}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="text-ink-2 text-base">% = share of the deviation from your normal over the last 7 days.</p>
          </>
        )}
      </Panel>

      {/* Two short checks side by side: alertness (me) and shared drift (the habitat). */}
      <div className="md:col-span-3 grid gap-4 md:grid-cols-2 md:items-stretch">
        <Readiness records={records} astronaut={record.astronaut} day={record.day} />
        <HabitatCheck astronaut={record.astronaut} day={record.day} />
      </div>
      <div className="md:col-span-3"><HazardStrip record={record} env={env} /></div>
    </div>
  );
}
