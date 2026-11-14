// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, fmt, fmtBand, offNormalSince } from "../data.js";
import { PROMPTS, STATUS_LABEL, SYSTEM_TEXT } from "../content/texts.js";
import { Glyph, StatusIcon } from "./icons.jsx";
import { SourceLink, Text } from "./ui.jsx";

// ===== One body system, essentials first =====
// Visible at once: status and since when, one card per value against the personal normal, and
// today's action. The explanations (what it does, why it matters in space, what helps) are
// folded into short sections the crew member opens when they want them.

/** One value card: name, value, personal normal, arrow when outside it. */
function ValueCard({ f, v, band }) {
  const [lo, hi] = band;
  const out = v == null ? null : v < lo ? "below" : v > hi ? "above" : null;
  return (
    <div className={`p-3 rounded-2xl bg-panel-2 border ${out ? "border-warning" : "border-transparent"}`}>
      <p className="text-ink-2 text-base">{META.features[f].name}</p>
      <p className="text-2xl font-semibold mt-1">
        {v == null ? <span className="text-ink-2 text-lg font-normal">not recorded</span> : (
          <>{fmt(f, v)} <span className="text-base text-muted font-normal">{f === "mood" ? "of 5" : META.features[f].unit}</span></>
        )}
      </p>
      <p className="text-base text-ink-2 mt-1">
        {out && <span className="font-semibold text-ink">{out === "above" ? "▲ above" : "▼ below"} · </span>}
        normal {fmtBand(f, lo)}–{fmtBand(f, hi)}
      </p>
    </div>
  );
}

/** A folded explanation: one line closed, the text when opened. */
function Fold({ title, children }) {
  return (
    <details className="group rounded-2xl bg-panel-2">
      <summary className="tap flex items-center gap-3 px-4 cursor-pointer text-lg list-none">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">▶</span> {title}
      </summary>
      <div className="px-4 pb-4 text-lg">{children}</div>
    </details>
  );
}

export default function SystemDetail({ record, records, system }) {
  const sys = META.systems[system];
  const bands = META.normal_bands[record.astronaut];
  const since = offNormalSince(records, record.day, system);
  const promptId = META.prompts && Object.keys(META.prompts).find((p) => META.prompts[p].system === system);
  const promptOpen = record.prompts.includes(promptId);
  const text = SYSTEM_TEXT[system];
  const status = record.systems[system];

  return (
    <section className="panel p-5 grid gap-4">
      <div>
        <h2 className="flex items-center gap-3 text-2xl font-semibold">
          <Glyph name={system} size={28} className="text-ink-2" /> {sys.name}
        </h2>
        <p className="mt-2 flex items-center gap-2 text-lg">
          <StatusIcon status={status} size={24} />
          <span className="font-semibold">{STATUS_LABEL[status]}</span>
          <span className="text-ink-2">
            {since == null ? "· within your normal" : `· away from your normal since day ${since} (${record.day - since + 1} days)`}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {sys.features.map((f) => <ValueCard key={f} f={f} v={record.values[f]} band={bands[f]} />)}
      </div>

      <div className={`p-4 rounded-2xl ${promptOpen ? "glass-active" : "bg-panel-2"}`}>
        <p className="text-ink-2 text-base">To do today</p>
        <p className="text-xl font-semibold mt-1">{promptOpen ? PROMPTS[promptId].title : "Routine measurements only"}</p>
      </div>

      <div className="grid gap-2">
        <Fold title="What it does"><Text>{text.function}</Text></Fold>
        <Fold title="Why it matters in space"><Text>{text.whyInSpace}</Text></Fold>
        <Fold title={`What helps · ${text.helps.length} tips`}>
          <ul className="grid gap-2 list-disc ml-6">{text.helps.map((h) => <li key={h}>{h}</li>)}</ul>
          <div className="mt-3"><SourceLink id={text.source} /></div>
        </Fold>
      </div>
    </section>
  );
}
