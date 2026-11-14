// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { EVIDENCE } from "../content/texts.js";
import { SourcesList } from "./Settings.jsx";

// ===== How we know: what Baseline does and the evidence for it, limits included =====
// Reads top-down: the answer in four numbers, how it works in four steps, the limits (always
// visible), then the details folded (contest, confirmation, one-time test, sources).

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

/** A folded section: one line closed, details when opened. */
function Fold({ title, children }) {
  return (
    <details className="group panel">
      <summary className="tap flex items-center gap-3 px-5 cursor-pointer text-lg list-none">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">▶</span> {title}
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

export default function HowWeKnow() {
  const { question, answer, headline, steps, benchmark, confirmation, holdout, limits, label } = EVIDENCE;
  return (
    <div className="grid gap-4">
      {/* 1. The answer in four numbers. */}
      <section className="panel p-5">
        <h2 className="text-3xl font-bold">{question}</h2>
        <p className="mt-2 text-lg text-ink-2 max-w-3xl">{answer}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {headline.map((h) => (
            <div key={h.value} className="p-4 rounded-2xl glass-active">
              <p className="text-4xl font-bold text-model">{h.value}</p>
              <p className="mt-2 text-base">{h.caption}</p>
              <p className="mt-1 text-sm text-ink-2">{h.compare}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-2">{label}</p>
      </section>

      {/* 2. How it works in four short steps. */}
      <section className="panel p-5">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-3">
          {steps.map((s, n) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full glass-active text-lg font-bold" aria-hidden="true">
                {n < 3 ? n + 1 : "!"}
              </span>
              <span>
                <span className="block text-lg font-semibold">{s.title.replace(/^\d\.\s*/, "")}</span>
                <span className="block mt-1 text-ink-2">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Honest limits, always visible. */}
      <section className="panel p-5">
        <h2 className="text-xl font-semibold">{limits.title}</h2>
        <ul className="grid gap-2 list-disc ml-6 text-lg mt-2">
          {limits.items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      {/* 4. The details, folded. */}
      <Fold title={benchmark.title}>
        <p className="text-lg">{benchmark.note}</p>
        <BenchmarkBars rows={benchmark.rows} />
        <p className="mt-3 text-ink-2 text-base">{benchmark.footnote}</p>
      </Fold>
      <Fold title={confirmation.title}>
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
      </Fold>
      <Fold title={holdout.title}>
        <p className="text-lg">{holdout.note}</p>
        <dl className="mt-3 grid gap-3">
          {holdout.facts.map(([k, v]) => (
            <div key={k} className="p-3 rounded-xl bg-panel-2">
              <dt className="text-ink-2">{k}</dt>
              <dd className="text-xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Fold>
      <Fold title="Sources">
        <SourcesList />
      </Fold>
    </div>
  );
}
