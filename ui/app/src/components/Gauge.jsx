// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { STATUS_COLOR, StatusChip } from "./icons.jsx";

// ===== Systemic Anomaly Index gauge (0–100, null on days 1–6) =====
// The arc carries tick marks at the Watch and Act thresholds (meta.index), and one plain sentence
// says what the number means, so the index never stands alone.
const R = 90, CX = 110, CY = 110;

/** Point on the arc for an index value (0 = left end, 100 = right end). */
function point(value, radius = R) {
  const a = (value / 100) * Math.PI;
  return [CX - radius * Math.cos(a), CY - radius * Math.sin(a)];
}

/** Tick across the arc with a small label outside it. */
function Tick({ value, label }) {
  const [x1, y1] = point(value, R - 14), [x2, y2] = point(value, R + 14), [tx, ty] = point(value, R + 26);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-ink)" strokeWidth="3" />
      <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12" fill="var(--color-ink-2)">{label}</text>
    </g>
  );
}

export default function Gauge({ record, children }) {
  const { sai, level } = record;
  const { p_yellow, p_orange, persistence_days } = META.index;
  const [ex, ey] = point(sai ?? 0);
  return (
    <section className="panel p-5 flex flex-col items-center">
      <h2 className="text-ink-2 text-lg">{META.index.name}</h2>
      <svg width="240" height="140" viewBox="-10 -14 240 140" role="img"
           aria-label={`${META.index.short} ${sai ?? "not available yet"}; watch from ${p_yellow}, act from ${p_orange}`}>
        <path d="M20 110 A90 90 0 0 1 200 110" stroke="var(--color-line)" strokeWidth="18" fill="none" strokeLinecap="round" />
        {sai != null && sai > 0 && (
          <path d={`M20 110 A90 90 0 0 1 ${ex} ${ey}`} stroke={STATUS_COLOR[level]} strokeWidth="18" fill="none" strokeLinecap="round" />
        )}
        <Tick value={p_yellow} label={p_yellow} />
        <Tick value={p_orange} label={p_orange} />
        <text x="110" y="100" textAnchor="middle" fontSize="44" fontWeight="700" fill="var(--color-ink)">{sai ?? "—"}</text>
      </svg>
      <StatusChip status={level} />
      <p className="mt-3 text-ink-2 text-center">
        How unusual your last 7 days are for you, compared with healthy days.
        Watch from {p_yellow}, act from {p_orange} — each held for {persistence_days} days.
      </p>
      {record.calibrating && (
        <p className="mt-2 text-ink-2 text-center">
          Learning your personal baseline · day {record.day} of {META.mission.calibration_days}
        </p>
      )}
      {children}
    </section>
  );
}
