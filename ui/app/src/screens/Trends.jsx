// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useState } from "react";
import { INDICATORS, META } from "../data.js";
import { TapButton } from "../components/ui.jsx";

// ===== Trends: one series with the personal normal band and three alert rows =====
// Row 1 = model (Prevent path), row 2 = fixed clinical thresholds (B1), row 3 = personal
// single-indicator thresholds (B2). This is where the demo shows the model alerting earlier.
const ALERT_ROWS = [
  { label: "Model", color: "var(--color-model)", test: (r) => r.level === "yellow" || r.level === "orange" },
  { label: "Fixed thresholds", color: "var(--color-b1)", test: (r) => r.rule_alert },
  { label: "Personal single-indicator", color: "var(--color-b2)", test: (r) => r.univariate_alert },
];

export default function Trends({ records, day, astronaut }) {
  const [series, setSeries] = useState("sai");
  const W = 900, H = 340, P = 44, top = 44;
  const isSai = series === "sai";
  const value = (r) => (isSai ? r.sai : r.values[series]);
  const vals = records.map(value).filter((v) => v != null);
  const [lo, hi] = isSai ? [META.index.p_yellow, 100] : META.normal_bands[astronaut][series];
  const ymin = isSai ? 0 : Math.min(lo, ...vals), ymax = isSai ? 100 : Math.max(hi, ...vals);
  const X = (d) => P + ((d - 1) / (META.mission.days - 1)) * (W - 2 * P);
  const Y = (v) => H - P - ((v - ymin) / (ymax - ymin || 1)) * (H - P - top);
  const line = records.filter((r) => value(r) != null && r.day <= day).map((r) => `${X(r.day)},${Y(value(r))}`).join(" ");
  const name = isSai ? META.index.name : META.features[series].name;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap gap-2 mb-3">
        <TapButton active={isSai} onClick={() => setSeries("sai")}>{META.index.short}</TapButton>
        {INDICATORS.map((f) => (
          <TapButton key={f} active={f === series} onClick={() => setSeries(f)} className="text-base">{META.features[f].name}</TapButton>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} trend up to day ${day}`}>
        <rect x={P} y={Y(hi)} width={W - 2 * P} height={Math.max(0, Y(lo) - Y(hi))} fill="var(--color-panel-2)" />
        <text x={P + 6} y={Y(hi) + 18} fill="var(--color-ink-2)" fontSize="14">{isSai ? "Watch zone" : "Your normal range"}</text>
        <polyline points={line} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
        {ALERT_ROWS.map((row, i) =>
          records.filter((r) => r.day <= day && row.test(r)).map((r) => (
            <rect key={row.label + r.day} x={X(r.day) - 2} y={6 + i * 12} width="4" height="9" fill={row.color} />
          ))
        )}
        <line x1={X(day)} x2={X(day)} y1={top - 6} y2={H - P} stroke="var(--color-muted)" strokeDasharray="4 4" />
        <text x={P} y={H - 12} fill="var(--color-muted)" fontSize="13">Day 1</text>
        <text x={W - P} y={H - 12} fill="var(--color-muted)" fontSize="13" textAnchor="end">Day {META.mission.days}</text>
      </svg>
      <div className="flex flex-wrap gap-5 mt-2 text-base text-ink-2">
        {ALERT_ROWS.map((row, i) => (
          <span key={row.label} className="flex items-center gap-2">
            <span style={{ background: row.color }} className="inline-block w-3 h-3" />Row {i + 1}: {row.label} alert
          </span>
        ))}
      </div>
    </section>
  );
}
