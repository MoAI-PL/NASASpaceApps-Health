// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useRef, useState } from "react";
import { INDICATORS, META, fmt } from "../data.js";
import { TapButton } from "../components/ui.jsx";

// ===== Trends: one series with the personal normal band and three alert rows =====
// Row 1 = model (Prevent path), row 2 = fixed clinical thresholds (B1), row 3 = personal
// single-indicator thresholds (B2). This is where the demo shows the model alerting earlier.
const ALERT_ROWS = [
  { label: "Baseline model", color: "var(--color-model)", test: (r) => r.level === "yellow" || r.level === "orange" },
  { label: "Clinical limits", color: "var(--color-b1)", test: (r) => r.rule_alert },
  { label: "Single-value limits", color: "var(--color-b2)", test: (r) => r.univariate_alert },
];

// ===== Chart geometry =====
// The SVG is drawn in real pixels at the measured container width, so text keeps its size on a
// phone and the page never scrolls sideways (review finding 2). Narrow screens get fewer ticks.
// Wide: lane labels sit left of the lanes. Narrow: labels sit above full-width lanes.
const ROW_H = 12, RIGHT = 16;

/** Width of an element in CSS pixels, updated when it resizes. */
function useWidth(fallback = 900) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Round axis values (about `count` steps) whose range covers [lo, hi]. */
function niceTicks(lo, hi, count = 4) {
  const raw = (hi - lo) / count || 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  const ticks = [];
  for (let v = Math.floor(lo / step) * step; v < hi + step - 1e-9; v += step) ticks.push(+v.toFixed(6));
  return ticks;
}

export default function Trends({ records, day, astronaut }) {
  const [series, setSeries] = useState("sai");
  const [boxRef, boxWidth] = useWidth();
  const narrow = boxWidth < 600;
  const W = Math.max(280, boxWidth), H = narrow ? 380 : 390;
  const LEFT = narrow ? 44 : 150, BOTTOM = H - 40;
  const ROW_Y = narrow ? 16 : 10, ROW_GAP = narrow ? 30 : 18;
  const TOP = ROW_Y + ALERT_ROWS.length * ROW_GAP + 18;
  const dayTicks = narrow ? [1, 40, 80, 120] : [1, 20, 40, 60, 80, 100, 120];

  const isSai = series === "sai";
  const value = (r) => (isSai ? r.sai : r.values[series]);
  const vals = records.map(value).filter((v) => v != null);
  const [lo, hi] = isSai ? [META.index.p_yellow, 100] : META.normal_bands[astronaut][series];
  const yTicks = isSai ? [0, 25, 50, 75, 100] : niceTicks(Math.min(lo, ...vals), Math.max(hi, ...vals));
  const ymin = yTicks[0], ymax = yTicks[yTicks.length - 1];
  const X = (d) => LEFT + ((d - 1) / (META.mission.days - 1)) * (W - LEFT - RIGHT);
  const Y = (v) => BOTTOM - ((v - ymin) / (ymax - ymin || 1)) * (BOTTOM - TOP);
  const line = records.filter((r) => value(r) != null && r.day <= day).map((r) => `${X(r.day)},${Y(value(r))}`).join(" ");
  const name = isSai ? META.index.name : META.features[series].name;
  const unit = isSai ? "" : META.features[series].unit;

  return (
    <section className="panel p-5">
      <div className="flex gap-2 mb-3 overflow-x-auto md:flex-wrap md:overflow-visible" role="group" aria-label="Series">
        <TapButton active={isSai} onClick={() => setSeries("sai")} className="shrink-0">Index</TapButton>
        {INDICATORS.map((f) => (
          <TapButton key={f} active={f === series} onClick={() => setSeries(f)} className="text-base shrink-0 whitespace-nowrap">
            {META.features[f].name}
          </TapButton>
        ))}
      </div>
      <h2 className="text-xl font-semibold">{name}{unit && <span className="text-ink-2 font-normal"> ({unit})</span>}</h2>
      <div ref={boxRef} className="mt-2 w-full">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img"
             aria-label={`${name} trend up to day ${day}`}>
          {/* Alert rows: one labelled lane per method, a mark on each alert day. */}
          {ALERT_ROWS.map((row, i) => {
            const y = ROW_Y + i * ROW_GAP;
            return (
              <g key={row.label}>
                <rect x={narrow ? LEFT : 0} y={narrow ? y - 13 : y + 1} width={10} height={10} fill={row.color} />
                <text x={narrow ? LEFT + 16 : 16} y={narrow ? y - 4 : y + 10} fill="var(--color-ink-2)" fontSize="13">{row.label}</text>
                <rect x={LEFT} y={y} width={W - LEFT - RIGHT} height={ROW_H} fill="var(--color-panel-2)" />
                {records.filter((r) => r.day <= day && row.test(r)).map((r) => (
                  <rect key={r.day} x={X(r.day) - 1.5} y={y} width="3" height={ROW_H} fill={row.color} />
                ))}
              </g>
            );
          })}
          {/* Y axis: gridlines and values. */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={LEFT} x2={W - RIGHT} y1={Y(t)} y2={Y(t)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={LEFT - 8} y={Y(t) + 4} textAnchor="end" fill="var(--color-ink-2)" fontSize="13">{fmt(series, t)}</text>
            </g>
          ))}
          {/* Personal normal band (or the SAI watch zone). */}
          <rect x={LEFT} y={Y(hi)} width={W - LEFT - RIGHT} height={Math.max(0, Y(lo) - Y(hi))} fill="var(--color-line)" fillOpacity="0.55" />
          <text x={LEFT + 8} y={Math.max(Y(hi), TOP) + 16} fill="var(--color-ink-2)" fontSize="13">
            {isSai ? "Watch zone" : "Your normal range"}
          </text>
          <polyline points={line} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
          {/* X axis: mission days and today's marker. */}
          {dayTicks.map((d, i) => (
            <text key={d} x={X(d)} y={H - 14} fill="var(--color-ink-2)" fontSize="13"
                  textAnchor={i === 0 ? "start" : i === dayTicks.length - 1 ? "end" : "middle"}>Day {d}</text>
          ))}
          <line x1={X(day)} x2={X(day)} y1={ROW_Y} y2={BOTTOM} stroke="var(--color-ink-2)" strokeDasharray="4 4" />
        </svg>
      </div>
      <p className="mt-3 text-base text-ink-2">Each mark is a day on which that method raised an alert.</p>
    </section>
  );
}
