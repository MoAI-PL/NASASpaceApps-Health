// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { STATUS_COLOR, StatusChip } from "./icons.jsx";

// ===== Systemic Anomaly Index gauge (0–100, null on days 1–6) =====
// The arc carries tick marks at the Watch and Act thresholds (meta.index), and one plain sentence
// says what the number means, so the index never stands alone.
const R = 90, CX = 110, CY = 110;
const ARC = "M20 110 A90 90 0 0 1 200 110";
const ARC_INNER = "M25 110 A85 85 0 0 1 195 110";

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
  return (
    <section className="panel p-5 flex flex-col items-center">
      <h2 className="text-ink-2 text-lg">{META.index.name}</h2>
      <svg width="256" height="140" viewBox="-18 -14 256 140" role="img"
           aria-label={`${META.index.short} ${sai ?? "not available yet"}; watch from ${p_yellow}, act from ${p_orange}`}>
        <defs>
          {/* Soft light under the arc, in the status colour (liquid-glass look). */}
          <filter id="gauge-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <linearGradient id="gauge-track" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(255 255 255 / 0.16)" />
            <stop offset="1" stopColor="rgb(255 255 255 / 0.05)" />
          </linearGradient>
        </defs>
        <path d={ARC} stroke="url(#gauge-track)" strokeWidth="18" fill="none" strokeLinecap="round" />
        {sai != null && sai > 0 && (
          <g style={{ color: STATUS_COLOR[level] }}>
            {/* Full arc drawn with pathLength 100, revealed by the dash: the value animates smoothly. */}
            <path d={ARC} pathLength="100" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round"
                  strokeDasharray={`${sai} 100`} filter="url(#gauge-glow)" opacity="0.55" className="gauge-arc" />
            <path d={ARC} pathLength="100" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round"
                  strokeDasharray={`${sai} 100`} className="gauge-arc" />
            {/* Thin bright line along the inner edge: the specular highlight of the glass. */}
            <path d={ARC_INNER} pathLength="100" stroke="rgb(255 255 255 / 0.4)" strokeWidth="2.5" fill="none" strokeLinecap="round"
                  strokeDasharray={`${sai} 100`} className="gauge-arc" />
          </g>
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
