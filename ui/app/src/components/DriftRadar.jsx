// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { INDICATORS, driftZ } from "../data.js";

// ===== Drift radar: the shape of the last 7 days against the personal normal =====
// One axis per indicator. The middle ring is this person's normal; the shaded ring is the
// normal range (±2 personal standard deviations). Outward = higher than normal, inward =
// lower. The solid shape is the last 7 days, the dashed one the 7 days before, so a shape
// that drifts as a whole is visible even when no single point leaves the shaded ring —
// the idea behind the model (personal z-scores, same 7-day weighting).

const SHORT = {
  sys: "Systolic", dia: "Diastolic", hr: "Heart rate", glucose: "Glucose",
  temp: "Temperature", sleep_h: "Sleep", mood: "Mood", reaction_ms: "Reaction time",
};
const SIZE = 340, C = SIZE / 2, R0 = 78, K = 18, ZMAX = 4; // R0 = normal ring, K px per sd

const angle = (i) => -Math.PI / 2 + (i / INDICATORS.length) * 2 * Math.PI;
const radius = (z) => R0 + Math.max(-ZMAX, Math.min(ZMAX, z ?? 0)) * K;
const pt = (i, r) => [C + r * Math.cos(angle(i)), C + r * Math.sin(angle(i))];
const polygon = (zs) => zs.map((z, i) => pt(i, radius(z)).join(",")).join(" ");

/** Circle path for a ring at personal z = `z`. */
function Ring({ z, ...props }) {
  return <circle cx={C} cy={C} r={radius(z)} fill="none" {...props} />;
}

export default function DriftRadar({ records, record }) {
  const now = INDICATORS.map((f) => driftZ(records, record.astronaut, record.day, f));
  const before = INDICATORS.map((f) => driftZ(records, record.astronaut, record.day - 7, f));
  const hasBefore = record.day > 14 && before.some((z) => z != null);
  const outside = INDICATORS.filter((_, i) => Math.abs(now[i] ?? 0) > 2);

  return (
    <section className="panel p-5">
      <h2 className="text-ink-2 text-lg">Your shape against your normal</h2>
      <div className="flex flex-wrap gap-6 items-center mt-2">
        <svg viewBox={`-80 -26 ${SIZE + 160} ${SIZE + 52}`} className="w-full max-w-lg mx-auto" role="img"
             aria-label={`Drift radar, last 7 days: ${INDICATORS.map((f, i) => `${SHORT[f]} ${now[i] == null ? "no data" : now[i].toFixed(1)}`).join(", ")} personal standard deviations`}>
          {/* Normal range (±2 sd) as a shaded ring, the personal normal as a solid ring. */}
          <circle cx={C} cy={C} r={(radius(2) + radius(-2)) / 2} fill="none"
                  stroke="var(--color-line)" strokeOpacity="0.6" strokeWidth={radius(2) - radius(-2)} />
          <Ring z={0} stroke="var(--color-ink-2)" strokeWidth="1.5" />
          <Ring z={4} stroke="var(--color-line)" strokeDasharray="2 4" />
          {INDICATORS.map((f, i) => {
            const [x, y] = pt(i, radius(ZMAX) + 4), [lx, ly] = pt(i, radius(ZMAX) + 22);
            const anchor = Math.abs(lx - C) < 8 ? "middle" : lx > C ? "start" : "end";
            return (
              <g key={f}>
                <line x1={C} y1={C} x2={x} y2={y} stroke="var(--color-line)" />
                <text x={lx} y={ly + 5} textAnchor={anchor} fontSize="16" fill="var(--color-ink-2)">{SHORT[f]}</text>
              </g>
            );
          })}
          {hasBefore && (
            <polygon points={polygon(before)} fill="none" stroke="var(--color-ink-2)" strokeWidth="2" strokeDasharray="5 4" />
          )}
          <polygon points={polygon(now)} fill="var(--color-model)" fillOpacity="0.18" stroke="var(--color-model)" strokeWidth="2.5" />
          {now.map((z, i) => z != null && (
            <circle key={INDICATORS[i]} cx={pt(i, radius(z))[0]} cy={pt(i, radius(z))[1]} r="5"
                    fill="var(--color-model)" stroke="var(--color-panel)" strokeWidth="2">
              <title>{`${SHORT[INDICATORS[i]]}: ${z > 0 ? "+" : ""}${z.toFixed(1)} personal standard deviations`}</title>
            </circle>
          ))}
        </svg>
        <div className="flex-1 min-w-56 grid gap-3 text-lg">
          <p className="flex items-center gap-3">
            <svg width="36" height="12" aria-hidden="true"><line x1="0" y1="6" x2="36" y2="6" stroke="var(--color-model)" strokeWidth="3" /></svg>
            Last 7 days
          </p>
          {hasBefore && (
            <p className="flex items-center gap-3">
              <svg width="36" height="12" aria-hidden="true"><line x1="0" y1="6" x2="36" y2="6" stroke="var(--color-ink-2)" strokeWidth="2" strokeDasharray="5 4" /></svg>
              The 7 days before
            </p>
          )}
          <p className="flex items-center gap-3">
            <svg width="36" height="16" aria-hidden="true"><rect x="0" y="2" width="36" height="12" fill="var(--color-line)" /></svg>
            Your normal range
          </p>
          <p className="text-ink-2 text-base">
            Outward = higher than your normal, inward = lower.{" "}
            {record.sai == null
              ? "The shape appears once 7 days are recorded."
              : outside.length === 0
                ? "No single indicator has left your normal range — the model watches how the whole shape moves."
                : `Outside your normal range: ${outside.map((f) => SHORT[f]).join(", ")}.`}
          </p>
        </div>
      </div>
    </section>
  );
}
