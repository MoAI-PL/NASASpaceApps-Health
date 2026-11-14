// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useState } from "react";
import { META, fmt } from "../data.js";
import { CHECKIN, GUIDE, MOOD_WORDS } from "../content/texts.js";
import { problem, versusNormal } from "../checkin.js";
import { StatusIcon } from "../components/icons.jsx";
import Stepper from "../components/Stepper.jsx";
import { BpTool, PulseTool, ReactionTest } from "../components/MeasureTools.jsx";
import { SourceLink, TapButton, Text } from "../components/ui.jsx";

// ===== Guided check-in: one measurement at a time, the app times and calculates =====
// Steps follow a morning routine (content/texts.js GUIDE). Each step shows its short how-to
// first, a large input or a measuring helper, the comparison with the personal normal and, on
// request, why it matters and what to do if abnormal. The last step summarises and saves.

/** Centre of the personal normal band, rounded to the input step (start value for − / +). */
function usual(record, f, step = 1) {
  const band = META.normal_bands[record.astronaut]?.[f];
  if (!band) return undefined;
  const mid = (band[0] + band[1]) / 2;
  return +(Math.round(mid / step) * step).toFixed(String(step).split(".")[1]?.length ?? 0);
}

/** The input for a step without a special measuring helper. */
function PlainInput({ f, record, value, set }) {
  const card = CHECKIN[f], feat = META.features[f];
  if (f === "mood") {
    return (
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="Mood, 1 to 5">
        {card.scale.map((v) => (
          <TapButton key={v} active={value === v} onClick={() => set(f, v)} className="px-1! text-center! py-2">
            <span className="block text-3xl font-bold">{v}</span>
            <span className="block text-sm sm:text-base leading-tight">{MOOD_WORDS[v]}</span>
          </TapButton>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {f === "sleep_h" && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick choice, hours of sleep">
          {[4, 5, 6, 7, 8, 9].map((h) => (
            <TapButton key={h} active={value === h} onClick={() => set(f, h)} className="text-center text-xl">{h} h</TapButton>
          ))}
        </div>
      )}
      <Stepper id={`g-${f}`} label={feat.name} unit={feat.unit} value={value} onChange={(v) => set(f, v)}
               step={f === "sleep_h" ? 0.25 : card.step} start={usual(record, f, card.step)}
               min={card.range?.[0]} max={card.range?.[1]} invalid={!!problem(f, value)} />
    </div>
  );
}

/** Feedback for one field: plausibility problem, or where it sits against the normal. */
function Feedback({ f, record, value }) {
  const bad = problem(f, value);
  if (bad) return <p role="alert" className="flex items-center gap-2 text-lg"><StatusIcon status="red" size={22} /> {bad}</p>;
  const cmp = versusNormal(record, f, value);
  if (!cmp) return null;
  return (
    <p role="status" className="flex items-center gap-2 text-lg">
      <StatusIcon status={cmp.status} size={22} />
      {fields(f)} {cmp.text}
    </p>
  );
}
const fields = (f) => (f === "sys" ? "Upper:" : f === "dia" ? "Lower:" : "");

export default function GuidedCheckIn({ record, entries, set, setMany, save, saveStatus }) {
  const [i, setI] = useState(0);
  const [why, setWhy] = useState(false);
  const total = GUIDE.length;
  const go = (n) => { setI(Math.max(0, Math.min(total, n))); setWhy(false); window.scrollTo({ top: 0 }); };

  // ----- Summary (after the last step) -----
  if (i === total) {
    const all = GUIDE.flatMap((g) => g.fields);
    const done = all.filter((f) => entries[f] != null);
    const bad = all.some((f) => problem(f, entries[f]));
    return (
      <section className="panel p-5 grid gap-4">
        <h2 className="text-2xl font-bold">Today’s check-in · {done.length} of {all.length}</h2>
        <ul className="grid gap-2">
          {all.map((f) => {
            const v = entries[f], cmp = versusNormal(record, f, v);
            return (
              <li key={f} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-panel-2 text-lg">
                <StatusIcon status={v == null ? "info" : problem(f, v) ? "red" : cmp?.status ?? "info"} size={24} />
                <span className="flex-1 min-w-40">{META.features[f].name}</span>
                <span className="font-semibold">{v == null ? "skipped" : `${f === "mood" ? `${v} · ${MOOD_WORDS[v]}` : fmt(f, v)} ${f === "mood" ? "" : META.features[f].unit}`}</span>
                {cmp && cmp.status !== "green" && <span className="w-full text-ink-2 text-base">{cmp.text}</span>}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-3">
          <TapButton onClick={() => go(total - 1)}>◀ Back</TapButton>
          <TapButton onClick={save} disabled={done.length === 0 || bad}
                     className="bg-model! text-on-status font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex-1 text-center">
            Save check-in
          </TapButton>
        </div>
        {saveStatus}
      </section>
    );
  }

  // ----- One step -----
  const g = GUIDE[i];
  const card = CHECKIN[g.fields[0]];
  return (
    <section className="panel p-5 grid gap-5">
      {/* Progress: step number plus one segment per step (filled = has a value). */}
      <div>
        <p className="text-ink-2 text-lg">Step {i + 1} of {total}</p>
        <div className="flex gap-1 mt-2" aria-hidden="true">
          {GUIDE.map((s, k) => (
            <span key={s.id} className={`h-2 flex-1 rounded ${k === i ? "bg-ink" : s.fields.every((f) => entries[f] != null) ? "bg-model" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <h2 className="text-3xl font-bold">{g.title}</h2>
      {g.steps.length === 1 ? (
        <p className="text-xl">{g.steps[0]}</p>
      ) : (
        <ol className="grid gap-2 text-xl list-decimal ml-7">
          {g.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      )}

      {g.tool === "pulse" && <PulseTool value={entries.hr} onChange={(v) => set("hr", v)} start={usual(record, "hr")} />}
      {g.tool === "bp" && (
        <BpTool sys={entries.sys} dia={entries.dia} onChange={(s, d) => setMany({ sys: s, dia: d })}
                start={{ sys: usual(record, "sys"), dia: usual(record, "dia") }} />
      )}
      {g.tool === "reaction" && <ReactionTest value={entries.reaction_ms} onChange={(v) => set("reaction_ms", v)} />}
      {!g.tool && <PlainInput f={g.fields[0]} record={record} value={entries[g.fields[0]]} set={set} />}

      <div className="grid gap-1">
        {g.fields.map((f) => <Feedback key={f} f={f} record={record} value={entries[f]} />)}
      </div>

      <div>
        <TapButton onClick={() => setWhy(!why)} aria-expanded={why}>{why ? "▼" : "▶"} Why it matters · if abnormal</TapButton>
        {why && (
          <dl className="mt-3 grid gap-2 text-lg">
            <dt className="text-ink-2">Why it matters in space</dt><dd><Text>{card.why}</Text></dd>
            <dt className="text-ink-2">If abnormal</dt><dd><Text>{card.ifAbnormal}</Text></dd>
            <dd><SourceLink id={card.source} /></dd>
          </dl>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {i > 0 && <TapButton onClick={() => go(i - 1)}>◀ Back</TapButton>}
        <TapButton onClick={() => go(i + 1)} className="ml-auto">Skip</TapButton>
        <TapButton onClick={() => go(i + 1)} disabled={g.fields.some((f) => entries[f] == null || problem(f, entries[f]))}
                   className="bg-model! text-on-status font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
          {i === total - 1 ? "Review ▶" : "Next ▶"}
        </TapButton>
      </div>
    </section>
  );
}
