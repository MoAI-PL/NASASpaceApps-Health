// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useState } from "react";
import { EARTH_REPORTS, META, roundTripText } from "../data.js";
import { ESCALATION_TEXT, EVENT_TEXT, PROMPTS } from "../content/texts.js";
import { Glyph, StatusIcon } from "../components/icons.jsx";
import { Panel, SourceLink, TapButton } from "../components/ui.jsx";

// ===== Earth link: signal delay and reports queued for the next communication window =====
// Each report can be opened to see exactly what goes to the flight surgeons (a compact summary,
// not raw data), with the one-way delay and the earliest possible reply for this environment.

/** What one report contains, in plain words. */
function ReportBody({ report }) {
  const moved = Object.entries(report.top_contributions ?? {}).filter(([f]) => f !== "other");
  return (
    <dl className="grid gap-2 mt-3 text-lg">
      <dt className="text-ink-2">Index, last 7 days</dt>
      <dd>{report.sai_last_7_days.map((s) => s ?? "—").join(" · ")}</dd>
      <dt className="text-ink-2">What moved</dt>
      <dd>{moved.length ? moved.map(([f, s]) => `${META.features[f]?.name ?? f} ${Math.round(s * 100)}%`).join(", ") : "—"}</dd>
      <dt className="text-ink-2">Open actions</dt>
      <dd>{report.open_prompts?.length ? report.open_prompts.map((p) => PROMPTS[p]?.title ?? p).join("; ") : "none"}</dd>
      {report.events?.length > 0 && (<>
        <dt className="text-ink-2">Events</dt>
        <dd>{report.events.map((e) => EVENT_TEXT[e]?.title ?? e).join(", ")}</dd>
      </>)}
    </dl>
  );
}

/** A report built on board from today's record (the same fields as the automatic ones). */
function reportFromRecord(record, records) {
  const last7 = records.filter((r) => r.day > record.day - 7 && r.day <= record.day);
  return {
    astronaut: record.astronaut, day: record.day, level: record.level, escalation: record.escalation,
    sai_last_7_days: last7.map((r) => r.sai), top_contributions: record.contributions,
    open_prompts: record.prompts, events: record.events, manual: true,
  };
}

export default function EarthLink({ astronaut, day, env, record, records, queued, onQueue }) {
  const e = META.environments[env];
  const [open, setOpen] = useState(null);
  const auto = EARTH_REPORTS.filter((r) => r.astronaut === astronaut && r.day <= day);
  const manual = queued.filter((q) => q.astronaut === astronaut);
  const all = [...auto, ...manual].sort((a, b) => b.day - a.day);

  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="flex items-center gap-3 text-xl font-semibold"><Glyph name="distance" /> Earth link · {e.name}</h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-3 text-lg">
          <div className="p-3 rounded-xl bg-panel-2"><div className="text-ink-2 text-base">Report reaches Earth after</div>{e.one_way_delay_text}</div>
          <div className="p-3 rounded-xl bg-panel-2"><div className="text-ink-2 text-base">Earliest possible reply</div>{roundTripText(env)} round trip, plus review time</div>
        </div>
        <TapButton onClick={() => onQueue(reportFromRecord(record, records))} className="mt-4 bg-model! text-on-status font-semibold">
          Send today’s summary to Earth
        </TapButton>
        <p className="mt-3 text-ink-2">Reports are stored on board and sent in the next communication window. Act on board first; do not wait for a reply in an emergency.</p>
        <div className="mt-1"><SourceLink id={["hrp_distance", "cpr_microgravity"]} /></div>
      </Panel>

      <Panel title="Waiting to be sent to Earth">
        {all.length === 0 && <p className="text-lg">None yet.</p>}
        <ul className="grid gap-2">
          {all.map((r) => {
            const key = `${r.manual ? "m" : "a"}-${r.day}`, isOpen = open === key;
            return (
              <li key={key} className="rounded-xl bg-panel-2">
                <button type="button" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen}
                        className="tap w-full flex flex-wrap items-center gap-3 px-4 text-lg text-left">
                  <span aria-hidden="true">{isOpen ? "▼" : "▶"}</span>
                  <StatusIcon status={r.level} />
                  <span className="font-semibold">Day {r.day}</span>
                  <span>{ESCALATION_TEXT[r.escalation]}</span>
                  <span className="text-ink-2">{r.manual ? "added by you" : "automatic, after an escalation"}</span>
                </button>
                {isOpen && <div className="px-4 pb-4"><ReportBody report={r} /></div>}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
