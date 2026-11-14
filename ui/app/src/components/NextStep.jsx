// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useState } from "react";
import { INDICATORS, META, offNormalSince, recentDirection } from "../data.js";
import { PROMPTS, STATUS_LABEL } from "../content/texts.js";
import { Glyph, STATUS_COLOR, StatusIcon } from "./icons.jsx";
import { SourceLink, Text } from "./ui.jsx";

// ===== "Do this now": the first thing on Today =====
// Answers three questions in order: How am I? · What do I do now? · Why?
// Everything comes from the day record (level, prompts, escalation, missing values, contributions);
// nothing here is computed by the UI except which system holds the largest share.

const HEADLINE = {
  green: "Within your normal",
  yellow: "Drifting away from your normal",
  orange: "Clearly away from your normal",
  red: "A critical limit was crossed",
};

const RANK = { green: 0, yellow: 1, orange: 2, red: 3 };

/** The system the model flags most strongly today (record.systems — the same one the body figure
 *  highlights); ties go to the larger share of today's deviation. Null on a green day. */
function topSystem(record) {
  const share = (id) => META.systems[id].features.reduce((s, f) => s + (record.contributions[f] ?? 0), 0);
  const off = Object.keys(META.systems).filter((id) => record.systems[id] !== "green");
  if (off.length === 0) return null;
  return off.sort((a, b) => RANK[record.systems[b]] - RANK[record.systems[a]] || share(b) - share(a))[0];
}

/** Largest listed indicator inside one system, or null if none of them is in today's top list. */
function topFeature(contributions, system) {
  const listed = META.systems[system].features.filter((f) => (contributions[f] ?? 0) > 0);
  return listed.length ? listed.reduce((a, b) => (contributions[b] > contributions[a] ? b : a)) : null;
}

/** One numbered step: a big tappable row, optionally expanding into How / Why / If abnormal. */
function Step({ n, icon, title, detail, onClick, prompt, tone = "ink" }) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(prompt);
  const handle = expandable ? () => setOpen(!open) : onClick;
  const Tag = handle ? "button" : "div";
  return (
    <li className="rounded-2xl bg-panel-2 glass-control">
      <Tag {...(handle ? { type: "button", onClick: handle, "aria-expanded": expandable ? open : undefined } : {})}
           className="tap w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full border-2 border-line text-lg font-bold" aria-hidden="true">{n}</span>
        <span className="hidden sm:inline-flex">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className={`block text-lg md:text-xl font-semibold ${tone === "critical" ? "text-white" : "text-ink"}`}>{title}</span>
          {detail && <span className="block text-base text-ink-2">{detail}</span>}
        </span>
        {handle && <span aria-hidden="true" className="text-2xl text-ink-2">{expandable ? (open ? "▾" : "▸") : "›"}</span>}
      </Tag>
      {open && prompt && (
        <dl className="px-5 pb-4 grid gap-2 text-lg">
          <dt className="text-ink-2">How</dt><dd><Text>{prompt.how}</Text></dd>
          <dt className="text-ink-2">Why</dt><dd><Text>{prompt.why}</Text></dd>
          <dt className="text-ink-2">If abnormal</dt><dd><Text>{prompt.ifAbnormal}</Text></dd>
          <dd><SourceLink id={prompt.source} /></dd>
        </dl>
      )}
    </li>
  );
}

export default function NextStep({ record, records, onOpenCheckin, onOpenSystem, onEmergency }) {
  const missing = INDICATORS.filter((f) => record.values[f] == null);
  const calDays = META.mission.calibration_days;
  const level = record.critical ? "red" : record.level;
  const calibrating = record.calibrating && level === "green";

  // ----- Steps, most urgent first (at most three) -----
  const steps = [];
  if (level === "red") {
    steps.push({ key: "em", title: "Open the emergency guide", detail: "Step-by-step help for you or a crew mate.", onClick: onEmergency,
                 icon: <StatusIcon status="red" size={30} />, tone: "critical" });
  }
  for (const p of record.prompts) {
    if (PROMPTS[p]) steps.push({ key: p, title: PROMPTS[p].title, detail: "Tap for how, why and what to do if it is abnormal.", prompt: PROMPTS[p],
                                 icon: <Glyph name="nav_checkin" size={28} className="text-model" /> });
  }
  if (record.escalation === "crew_medical_officer" || record.escalation === "flight_surgeon") {
    steps.push({ key: "cmo", title: "Tell your crew medical officer today", detail: "Show them this screen and the Body page.",
                 icon: <StatusIcon status="orange" size={30} /> });
  }
  if (missing.length > 0) {
    steps.push({ key: "ci", title: calibrating ? "Do today’s check-in" : `Finish today’s check-in (${missing.length} left)`,
                 detail: missing.map((f) => META.features[f].name).join(", "), onClick: onOpenCheckin,
                 icon: <Glyph name="nav_checkin" size={28} className="text-ink-2" /> });
  }
  if (steps.length === 0) {
    steps.push({ key: "ok", title: "Nothing else today", detail: "See you at tomorrow’s check-in.",
                 icon: <StatusIcon status="green" size={30} /> });
  }

  // ----- Why: the system that moved most, and how -----
  const sys = level === "green" ? null : topSystem(record);
  const feat = sys && topFeature(record.contributions, sys);
  const dir = feat ? recentDirection(records, record.astronaut, record.day, feat) : 0;
  const since = sys ? offNormalSince(records, record.day, sys) : null;

  const status = calibrating ? "info" : level;
  return (
    <section className="panel p-5 md:p-6 md:col-span-3" aria-labelledby="next-title"
             style={{ boxShadow: status !== "info" && status !== "green" ? `inset 4px 0 0 ${STATUS_COLOR[status]}` : undefined }}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        {/* 1 · How am I? */}
        <div>
          <p className="text-ink-2 text-lg">How you are today</p>
          <h2 id="next-title" className="mt-1 flex items-center gap-3 text-3xl md:text-4xl font-bold tracking-tight">
            <StatusIcon status={status} size={44} />
            {calibrating ? "Learning your normal" : STATUS_LABEL[level]}
          </h2>
          {calibrating ? (
            <div className="mt-3">
              <p className="text-xl">Day {Math.min(record.day, calDays)} of {calDays}</p>
              <div className="mt-2 h-3 rounded-full bg-panel-2 overflow-hidden" role="progressbar" aria-valuemin={0}
                   aria-valuemax={calDays} aria-valuenow={Math.min(record.day, calDays)} aria-label="Learning your normal">
                <div className="h-3 rounded-full bg-model" style={{ width: `${(100 * Math.min(record.day, calDays)) / calDays}%` }} />
              </div>
              <p className="mt-2 text-base text-ink-2">
                Check in every day. Baseline is learning what is normal for <em>you</em>. Critical limits protect you from day 1.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xl">{HEADLINE[level]}{since ? ` · since day ${since}` : ""}</p>
          )}

          {/* 3 · Why? */}
          {sys && (
            <button type="button" onClick={() => onOpenSystem(sys)}
                    className="tap mt-4 w-full flex items-center gap-3 px-4 rounded-2xl bg-panel-2 glass-control text-left">
              <Glyph name={sys} size={26} className="text-ink-2" />
              <span className="flex-1 text-lg">
                <span className="text-ink-2">Why: </span>mostly <span className="font-semibold">{META.systems[sys].name}</span>
                {feat && dir !== 0 && <> — {META.features[feat].name.toLowerCase()} {dir > 0 ? "higher" : "lower"} than your normal</>}
              </span>
              <span aria-hidden="true" className="text-2xl text-ink-2">›</span>
            </button>
          )}
        </div>

        {/* 2 · What do I do now? */}
        <div>
          <p className="text-ink-2 text-lg">Do this now</p>
          <ol className="mt-2 grid gap-2">
            {steps.slice(0, 3).map((s, i) => <Step key={s.key} n={i + 1} {...s} />)}
          </ol>
        </div>
      </div>
    </section>
  );
}
