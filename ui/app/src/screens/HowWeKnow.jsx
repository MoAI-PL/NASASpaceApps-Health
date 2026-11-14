// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { EVIDENCE } from "../content/texts.js";
import { Panel } from "../components/ui.jsx";

// ===== How we know: what Baseline does and the evidence for it, limits included =====
// One honest page: method in plain words, then model selection → confirmation → one-time
// hold-out test, then what the results do not show. All text lives in content/texts.js.

/** Horizontal bars, one per method, directly labelled (value in text, never colour alone). */
function BenchmarkBars({ rows }) {
  return (
    <ul className="grid gap-3 mt-3" aria-label="Health changes caught within 21 days, by method">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-lg">
            <span>{r.label}</span><span className="font-semibold whitespace-nowrap">{r.value}%</span>
          </div>
          <div className="h-4 rounded bg-panel-2" title={`${r.label}: ${r.value}%`}>
            <div className="h-4 rounded"
                 style={{ width: `${r.value}%`, ...(r.outline ? { border: `2px solid ${r.color}` } : { background: r.color }) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function HowWeKnow() {
  const { steps, benchmark, confirmation, holdout, limits, label } = EVIDENCE;
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Panel title="How Baseline works" className="lg:col-span-2">
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map((s) => (
            <li key={s.title}>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={benchmark.title}>
        <p className="text-lg">{benchmark.note}</p>
        <BenchmarkBars rows={benchmark.rows} />
        <p className="mt-3 text-ink-2 text-base">{benchmark.footnote}</p>
      </Panel>

      <Panel title={confirmation.title}>
        <p className="text-lg">{confirmation.note}</p>
        <table className="w-full mt-3 text-lg">
          <thead>
            <tr className="text-ink-2 text-base text-left">
              {confirmation.head.map((h, i) => <th key={h} className={`py-1 font-normal ${i ? "text-right" : ""}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {confirmation.rows.map((row) => (
              <tr key={row[0]} className="border-t border-line">
                {row.map((c, i) => <td key={i} className={`py-2 ${i ? "text-right" : ""} ${i === 1 ? "font-semibold" : ""}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title={holdout.title}>
        <p className="text-lg">{holdout.note}</p>
        <dl className="mt-3 grid gap-3">
          {holdout.facts.map(([k, v]) => (
            <div key={k} className="p-3 rounded-xl bg-panel-2">
              <dt className="text-ink-2">{k}</dt>
              <dd className="text-xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title={limits.title}>
        <ul className="grid gap-2 list-disc ml-6 text-lg">
          {limits.items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Panel>

      <p className="lg:col-span-2 text-ink-2">{label}</p>
    </div>
  );
}
