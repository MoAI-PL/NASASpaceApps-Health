// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Small shared building blocks.

import { SOURCES } from "../content/texts.js";

/** Card container. */
export function Panel({ title, children, className = "" }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {title && <h2 className="text-ink-2 text-lg mb-3">{title}</h2>}
      {children}
    </section>
  );
}

/** A folded explanation: one line closed, the text when opened. `small` for "how this works"
 *  footnotes under a card (same look, smaller text). */
export function Fold({ title, small = false, children }) {
  return (
    <details className="group rounded-2xl bg-panel-2">
      <summary className={`tap flex items-center gap-3 px-4 cursor-pointer list-none ${small ? "text-base text-ink-2" : "text-lg"}`}>
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">▶</span> {title}
      </summary>
      <div className={`px-4 pb-4 ${small ? "text-base text-ink-2 grid gap-2" : "text-lg"}`}>{children}</div>
    </details>
  );
}

/** Big tappable button; `active` marks the selected one. */
export function TapButton({ active = false, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`tap px-5 rounded-2xl text-lg text-left glass-control ${active ? "glass-active" : "bg-panel-2"} ${className}`}
      aria-pressed={active}
      {...props}
    />
  );
}

/** Crew-facing text; strings starting with "TODO(UI)" render as a visible content gap. */
export function Text({ children, className = "" }) {
  if (typeof children === "string" && children.startsWith("TODO(UI)")) {
    return <span className={`italic text-muted border border-dashed border-line rounded px-2 ${className}`}>{children}</span>;
  }
  return <span className={className}>{children}</span>;
}

/** Link(s) to sources from content/texts.js SOURCES; `id` is one id or a list of ids. */
export function SourceLink({ id }) {
  const ids = (Array.isArray(id) ? id : [id]).filter(Boolean);
  if (ids.length === 0 || ids.some((i) => !SOURCES[i])) return <Text className="text-sm">TODO(UI): source</Text>;
  return (
    <span className="text-sm text-ink-2">
      {ids.length === 1 ? "Source: " : "Sources: "}
      {ids.map((i, n) => (
        <span key={i}>
          {n > 0 && " · "}
          <a href={SOURCES[i].url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{SOURCES[i].title}</a>
        </span>
      ))}
    </span>
  );
}
