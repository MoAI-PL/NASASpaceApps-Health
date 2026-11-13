// Baseline — NASA Space Apps Challenge 2026
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

/** Big tappable button; `active` marks the selected one. */
export function TapButton({ active = false, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`tap px-5 rounded-xl text-lg text-left ${active ? "bg-line" : "bg-panel-2"} ${className}`}
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

/** Link to a source from content/texts.js SOURCES. */
export function SourceLink({ id }) {
  const s = SOURCES[id];
  if (!s) return <Text className="text-sm">TODO(UI): source</Text>;
  return (
    <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-ink-2 underline underline-offset-2">
      Source: {s.title}
    </a>
  );
}
