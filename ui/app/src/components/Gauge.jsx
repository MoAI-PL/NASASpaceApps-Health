// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META } from "../data.js";
import { STATUS_COLOR, StatusChip } from "./icons.jsx";

// ===== Systemic Anomaly Index gauge (0–100, null on days 1–6) =====
export default function Gauge({ record, children }) {
  const { sai, level } = record;
  const angle = sai == null ? 0 : (sai / 100) * 180;
  const r = 90, cx = 110, cy = 110;
  const ex = cx - r * Math.cos((angle * Math.PI) / 180);
  const ey = cy - r * Math.sin((angle * Math.PI) / 180);
  return (
    <section className="panel p-5 flex flex-col items-center">
      <h2 className="text-ink-2 text-lg">{META.index.name}</h2>
      <svg width="220" height="130" viewBox="0 0 220 130" role="img" aria-label={`${META.index.short} ${sai ?? "not available yet"}`}>
        <path d="M20 110 A90 90 0 0 1 200 110" stroke="var(--color-line)" strokeWidth="18" fill="none" strokeLinecap="round" />
        {sai != null && (
          <path d={`M20 110 A90 90 0 0 1 ${ex} ${ey}`} stroke={STATUS_COLOR[level]} strokeWidth="18" fill="none" strokeLinecap="round" />
        )}
        <text x="110" y="100" textAnchor="middle" fontSize="44" fontWeight="700" fill="var(--color-ink)">{sai ?? "—"}</text>
      </svg>
      <StatusChip status={level} />
      {record.calibrating && (
        <p className="mt-3 text-ink-2 text-center">
          Learning your personal baseline · day {record.day} of {META.mission.calibration_days}
        </p>
      )}
      {children}
    </section>
  );
}
