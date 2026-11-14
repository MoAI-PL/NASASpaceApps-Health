// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useState } from "react";
import { INDICATORS, META, fmt } from "../data.js";
import { CHECKIN } from "../content/texts.js";
import { StatusIcon } from "../components/icons.jsx";
import { Panel, SourceLink, TapButton, Text } from "../components/ui.jsx";

// ===== Check-in: the 8 daily self-measurements, each with How / Why / If abnormal =====
// Each entry is compared at once with the crew member's personal normal band, so the check-in
// gives feedback without the model.
// The demo runs on precomputed model output, so entries do not change the SAI. They are kept on
// this device (localStorage, per crew member and mission day) when the browser allows it.

// ===== Storage (optional: the screen works without it) =====
const storageKey = (record) => `baseline.checkin.${record.astronaut}.${record.day}`;

function loadEntries(record) {
  try { return JSON.parse(localStorage.getItem(storageKey(record))) ?? {}; } catch { return {}; }
}

/** True when the entries were written to this device. */
function storeEntries(record, entries) {
  try { localStorage.setItem(storageKey(record), JSON.stringify(entries)); return true; } catch { return false; }
}

// ===== Validation =====
/** Message when a typed value is outside the plausible input range, otherwise null. */
function problem(f, v) {
  const range = CHECKIN[f].range;
  if (v == null || !range) return null;
  if (!Number.isFinite(v)) return "Enter a number.";
  const [lo, hi] = range;
  return v < lo || v > hi ? `Check the value: expected ${lo}–${hi} ${META.features[f].unit}.` : null;
}

// ===== Comparison with the personal normal =====
/** Where a valid entry sits against this crew member's normal band (meta.normal_bands). */
function versusNormal(record, f, v) {
  const band = META.normal_bands[record.astronaut]?.[f];
  if (v == null || !band) return null;
  const [lo, hi] = band;
  const range = `your normal ${fmt(f, lo)}–${fmt(f, hi)} ${META.features[f].unit}`;
  if (v < lo) return { status: "yellow", text: `▼ Below your normal (${range})` };
  if (v > hi) return { status: "yellow", text: `▲ Above your normal (${range})` };
  return { status: "green", text: `Within your normal (${range})` };
}

export default function CheckIn({ record }) {
  const [entries, setEntries] = useState(() => loadEntries(record));
  const [open, setOpen] = useState(null);
  const [saved, setSaved] = useState(null); // null | "device" | "memory"

  // Another crew member or mission day: show what was saved for it.
  useEffect(() => { setEntries(loadEntries(record)); setSaved(null); }, [record.astronaut, record.day]);

  const set = (f, v) => { setEntries({ ...entries, [f]: v }); setSaved(null); };
  const problems = Object.fromEntries(INDICATORS.map((f) => [f, problem(f, entries[f])]));
  const count = INDICATORS.filter((f) => entries[f] != null).length;
  const canSave = count > 0 && INDICATORS.every((f) => !problems[f]);
  const save = () => setSaved(storeEntries(record, entries) ? "device" : "memory");

  return (
    <div className="grid gap-4">
      {INDICATORS.map((f) => {
        const feat = META.features[f], card = CHECKIN[f], bad = problems[f];
        return (
          <Panel key={f}>
            <div className="flex flex-wrap items-center gap-4">
              <label htmlFor={`in-${f}`} className="text-xl font-semibold flex-1 min-w-48">
                {feat.name} <span className="text-muted text-base">({feat.unit})</span>
              </label>
              {card.scale ? (
                <div className="flex gap-2" role="group" aria-label={feat.name}>
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
            {!bad && (() => {
              const cmp = versusNormal(record, f, entries[f]);
              return cmp && (
                <p role="status" className="mt-2 flex items-center gap-2 text-lg">
                  <StatusIcon status={cmp.status} size={22} /> {cmp.text}
                </p>
              );
            })()}
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
      })}
      <TapButton onClick={save} disabled={!canSave}
                 className="bg-model! text-on-status font-semibold text-center disabled:opacity-40 disabled:cursor-not-allowed">
        Save check-in ({count} of {INDICATORS.length})
      </TapButton>
      <p role="status" className="text-lg">
        {saved === "device" && "Saved on this device. (Demo: the index uses the precomputed mission data.)"}
        {saved === "memory" && "Kept until the app is closed: this browser does not allow saving."}
        {!saved && count === 0 && <span className="text-ink-2">Enter at least one measurement to save.</span>}
        {!saved && count > 0 && !canSave && <span className="text-ink-2">Fix the highlighted values to save.</span>}
      </p>
    </div>
  );
}
