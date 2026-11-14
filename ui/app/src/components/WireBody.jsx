// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useRef, useState } from "react";
import { META } from "../data.js";
import { STATUS_COLOR } from "./icons.jsx";

// ===== Rotatable wireframe body: our own geometry, no 3D library, no third-party model =====
// The figure is a set of ellipsoids (head, chest, abdomen, limbs) drawn as latitude and
// longitude rings, rotated about the vertical axis and projected in plain SVG. Each part
// belongs to a body system: it takes that system's status colour and selects it on tap.
// Drag to turn it, or use the ◀ ▶ buttons (keyboard); no automatic motion.

// [x, y, z, rx, ry, rz, system] — y grows downwards, units are viewBox pixels.
const PARTS = [
  [0, -128, 0, 20, 24, 20, "mind_sleep"],
  [0, -64, 0, 36, 32, 20, "heart"],
  [0, -10, 0, 30, 24, 18, "metabolism"],
  [0, 26, 0, 30, 16, 18, "immune_temp"],
  ...[-1, 1].flatMap((s) => [
    [s * 50, -62, 0, 9, 30, 9, "immune_temp"],
    [s * 56, -2, 0, 8, 28, 8, "immune_temp"],
    [s * 16, 76, 0, 12, 38, 12, "immune_temp"],
    [s * 16, 150, 0, 9, 36, 9, "immune_temp"],
  ]),
];
const LATS = 5, LONS = 8, STEPS = 24;

/** Rings of one ellipsoid at rotation `a`, as SVG point strings. */
function rings([x, y, z, rx, ry, rz], a) {
  const c = Math.cos(a), s = Math.sin(a);
  const proj = (px, py, pz) => `${((x + px) * c + (z + pz) * s).toFixed(1)},${(y + py).toFixed(1)}`;
  const out = [];
  for (let i = 1; i <= LATS; i++) {
    const v = -Math.PI / 2 + (i * Math.PI) / (LATS + 1), r = Math.cos(v), h = Math.sin(v) * ry;
    out.push(Array.from({ length: STEPS + 1 }, (_, k) => {
      const u = (k / STEPS) * 2 * Math.PI;
      return proj(rx * r * Math.cos(u), h, rz * r * Math.sin(u));
    }).join(" "));
  }
  for (let j = 0; j < LONS; j++) {
    const u = (j / LONS) * 2 * Math.PI;
    out.push(Array.from({ length: STEPS + 1 }, (_, k) => {
      const v = -Math.PI / 2 + (k / STEPS) * Math.PI;
      return proj(rx * Math.cos(v) * Math.cos(u), Math.sin(v) * ry, rz * Math.cos(v) * Math.sin(u));
    }).join(" "));
  }
  return out;
}

export default function WireBody({ statuses, selected, onSelect }) {
  const [angle, setAngle] = useState(0.5);
  const drag = useRef(null);
  const turn = (d) => setAngle((a) => a + d);
  const color = (sys) => (statuses[sys] === "green" ? "var(--color-model)" : STATUS_COLOR[statuses[sys]]);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="-90 -165 180 360" className="w-44 h-80 touch-none cursor-grab" role="img"
           aria-label="Rotatable body figure; the colour of each part is its system status"
           onPointerDown={(e) => { drag.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
           onPointerMove={(e) => { if (drag.current != null) { turn((e.clientX - drag.current) / 60); drag.current = e.clientX; } }}
           onPointerUp={() => { drag.current = null; }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {PARTS.map((p, n) => {
          const sys = p[6], on = selected === sys, rx = Math.hypot(p[3] * Math.cos(angle), p[5] * Math.sin(angle));
          return (
            <g key={n} onClick={() => onSelect(sys)} style={{ cursor: "pointer" }}>
              <ellipse cx={(p[0] * Math.cos(angle) + p[2] * Math.sin(angle)).toFixed(1)} cy={p[1]} rx={rx} ry={p[4]}
                       fill={color(sys)} fillOpacity={on ? 0.22 : 0.06} />
              <g filter="url(#glow)" stroke={color(sys)} strokeWidth={on ? 1.1 : 0.6} strokeOpacity={on ? 1 : 0.75} fill="none">
                {rings(p, angle).map((pts, k) => <polyline key={k} points={pts} />)}
              </g>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-2">
        <button type="button" onClick={() => turn(-0.4)} aria-label="Turn figure left" className="tap px-3 rounded-xl bg-panel-2">◀</button>
        <button type="button" onClick={() => turn(0.4)} aria-label="Turn figure right" className="tap px-3 rounded-xl bg-panel-2">▶</button>
      </div>
      <span className="sr-only">{Object.entries(statuses).map(([s, v]) => `${META.systems[s]?.name}: ${v}`).join(", ")}</span>
    </div>
  );
}
