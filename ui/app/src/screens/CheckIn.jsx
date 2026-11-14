// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useState } from "react";
import { INDICATORS, META, fmt } from "../data.js";
import { CHECKIN } from "../content/texts.js";
import { criticalBreaches, hasDraft, keepDraft, loadEntries, problem, storeEntries, versusNormal } from "../checkin.js";
import { StatusIcon } from "../components/icons.jsx";
import { Panel, SourceLink, TapButton, Text } from "../components/ui.jsx";
import GuidedCheckIn from "./GuidedCheckIn.jsx";

// ===== Check-in: the 8 daily self-measurements =====
// Two modes over the same entries: "Guided" (default) walks through one measurement at a time
// with timers, calculations and the reaction test; "Quick entry" is the plain form for someone
// who already has the numbers. Every entry is compared at once with the personal normal band.

/** The plain form: every indicator on one page, with How / Why / If abnormal on request. */
function QuickEntry({ record, entries, set }) {
  const [open, setOpen] = useState(null);
  return INDICATORS.map((f) => {
    const feat = META.features[f], card = CHECKIN[f], bad = problem(f, entries[f]);
    const cmp = !bad && versusNormal(record, f, entries[f]);
    return (
      <Panel key={f}>
        <div className="flex flex-wrap items-center gap-4">
          {/* A <label> only for a real input; the 1–5 scale is a labelled button group. */}
          {card.scale ? (
            <span id={`lbl-${f}`} className="text-xl font-semibold flex-1 min-w-48">
              {feat.name} <span className="text-muted text-base">({feat.unit})</span>
            </span>
          ) : (
            <label htmlFor={`in-${f}`} className="text-xl font-semibold flex-1 min-w-48">
              {feat.name} <span className="text-muted text-base">({feat.unit})</span>
            </label>
          )}
          {card.scale ? (
            <div className="flex gap-2" role="group" aria-labelledby={`lbl-${f}`}>
              {card.scale.map((v) => (
                <TapButton key={v} active={entries[f] === v} onClick={() => set(f, v)} className="text-center font-semibold">{v}</TapButton>
              ))}
            </div>
          ) : (
            <input id={`in-${f}`} type="number" inputMode="decimal" step={card.step} min={card.range?.[0]} max={card.range?.[1]}
                   value={entries[f] ?? ""} aria-invalid={bad ? true : undefined} aria-describedby={bad ? `err-${f}` : undefined}
                   onChange={(e) => set(f, e.target.value === "" ? undefined : +e.target.value)}
                   className={`tap w-40 px-4 rounded-xl bg-panel-2 border text-xl ${bad ? "border-critical border-2" : "border-line"}`} />
          )}
          <TapButton active={open === f} onClick={() => setOpen(open === f ? null : f)} aria-expanded={open === f}>How / Why</TapButton>
        </div>
        {bad && (
          <p id={`err-${f}`} role="alert" className="mt-2 flex items-center gap-2 text-lg">
            <StatusIcon status="red" size={22} /> {bad}
          </p>
        )}
        {cmp && (
          <p role="status" className="mt-2 flex items-center gap-2 text-lg">
            <StatusIcon status={cmp.status} size={22} /> {cmp.text}
          </p>
        )}
        <p className="mt-2 text-ink-2">
          Mission data (demo), day {record.day}: {fmt(f, record.values[f]) ?? "not recorded"}
          {record.values[f] != null && ` ${META.features[f].unit}`}
        </p>
        {open === f && (
          <dl className="mt-3 grid gap-2 text-lg">
            <dt className="text-ink-2">How</dt><dd><Text>{card.how}</Text></dd>
            <dt className="text-ink-2">Why</dt><dd><Text>{card.why}</Text></dd>
            <dt className="text-ink-2">If abnormal</dt><dd><Text>{card.ifAbnormal}</Text></dd>
            <dd><SourceLink id={card.source} /></dd>
          </dl>
        )}
      </Panel>
    );
  });
}

export default function CheckIn({ record, onEmergency }) {
  const [entries, setEntries] = useState(() => loadEntries(record));
  const [saved, setSaved] = useState(null); // null | "device" | "memory"
  const [mode, setMode] = useState("guided");

  // Another crew member or mission day: show its draft or what was saved for it.
  useEffect(() => { setEntries(loadEntries(record)); setSaved(null); }, [record.astronaut, record.day]);

  const setMany = (changes) => {
    const next = { ...entries, ...changes };
    keepDraft(record, next);
    setEntries(next);
    setSaved(null);
  };
  const set = (f, v) => setMany({ [f]: v });
  const count = INDICATORS.filter((f) => entries[f] != null).length;
  const canSave = count > 0 && INDICATORS.every((f) => !problem(f, entries[f]));
  const save = () => setSaved(storeEntries(record, entries) ? "device" : "memory");
  const breaches = criticalBreaches(entries);

  const saveStatus = (
    <p role="status" className="text-lg">
      {saved === "device" && "Saved on this device. (Demo: the index uses the precomputed mission data.)"}
      {saved === "memory" && "Kept until the app is closed: this browser does not allow saving."}
      {!saved && count === 0 && <span className="text-ink-2">Enter at least one measurement to save.</span>}
      {!saved && count > 0 && !canSave && <span className="text-ink-2">Fix the highlighted values to save.</span>}
      {!saved && hasDraft(record) && canSave && (
        <span className="text-ink-2">Not saved yet — your entries for day {record.day} are kept while the app is open.</span>
      )}
    </p>
  );

  return (
    <div className="grid gap-4">
      <div className="flex gap-2" role="group" aria-label="Check-in mode">
        <TapButton active={mode === "guided"} onClick={() => setMode("guided")}>Guided</TapButton>
        <TapButton active={mode === "quick"} onClick={() => setMode("quick")}>Quick entry</TapButton>
      </div>
      {/* Respond path: a critical value opens the way to Emergency at once, without the model. */}
      {breaches.length > 0 && (
        <section role="alert" className="panel p-5 border-critical! border-2">
          <h2 className="flex items-center gap-3 text-2xl font-bold"><StatusIcon status="red" size={34} /> Critical value</h2>
          <ul className="mt-3 grid gap-1 text-lg">
            {breaches.map((b) => (
              <li key={b.f}>
                {b.text}
                <span className="block text-ink-2 text-base">
                  {b.rule.source ? `Limit source: ${b.rule.source}` : "Limit: team assumption, not yet from a cited source."}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-lg">Measure again now. If the value is confirmed, or if anyone feels unwell, open Emergency and tell the crew medical officer.</p>
          <button type="button" onClick={onEmergency}
                  className="tap mt-4 w-full rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 bg-critical">
            <StatusIcon status="red" size={30} /> Open Emergency
          </button>
        </section>
      )}
      {mode === "guided" ? (
        <GuidedCheckIn record={record} entries={entries} set={set} setMany={setMany} save={save} saveStatus={saveStatus} />
      ) : (
        <>
          <QuickEntry record={record} entries={entries} set={set} />
          <TapButton onClick={save} disabled={!canSave}
                     className="bg-model! text-on-status font-semibold text-center disabled:opacity-40 disabled:cursor-not-allowed">
            Save check-in ({count} of {INDICATORS.length})
          </TapButton>
          {saveStatus}
        </>
      )}
    </div>
  );
}
