// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useMemo, useRef, useState } from "react";
import { META } from "../data.js";
import { STATUS_COLOR } from "./icons.jsx";

// ===== Rotatable low-poly wireframe body: our own generated mesh, no 3D library or model =====
// The body is built from cross-sections: each part is a list of stations [x, y, z, rx, rz]
// (centre and elliptical radii) joined into a triangulated tube. The mesh turns about the
// vertical axis and is projected in plain SVG; edges facing away are dimmed (depth cue) and
// front vertices get small nodes, for a blueprint / hologram look. Each part belongs to a body
// system, takes its status colour and selects it on tap. Drag or ◀ ▶ to turn; no auto-motion.

const SIDES = 12;
const head = [[-172, 1], [-168, 8], [-161, 13], [-152, 15], [-142, 15], [-133, 13], [-125, 9]].map(([y, r]) => [0, y, 1, r, r * 1.1]);
const neck = [[-125, 7], [-114, 8]].map(([y, r]) => [0, y, 0, r, r]);
const chest = [[-114, 12], [-108, 30], [-100, 37], [-88, 36], [-74, 33], [-60, 30], [-50, 28]].map(([y, r]) => [0, y, 1, r, r * 0.55]);
const belly = [[-50, 28], [-36, 26], [-22, 27], [-10, 29]].map(([y, r]) => [0, y, 2, r, r * 0.6]);
const pelvis = [[-10, 29], [4, 31], [18, 29], [26, 24]].map(([y, r]) => [0, y, 0, r, r * 0.62]);
const limb = (pts) => pts.map(([x, y, r]) => [x, y, 0, r, r]);
const arm = (s) => limb([[s * 38, -102, 10], [s * 44, -78, 8.5], [s * 49, -52, 7], [s * 53, -26, 6], [s * 56, 0, 4.5], [s * 58, 10, 5.5], [s * 58, 22, 3]]);
const leg = (s) => limb([[s * 15, 22, 14], [s * 16, 58, 12], [s * 17, 94, 8.5], [s * 17, 128, 7.5], [s * 16, 160, 4.5], [s * 16, 168, 5], [s * 16, 172, 2]]);

const PARTS = [
  [head, "mind_sleep"], [neck, "immune_temp"], [chest, "heart"], [belly, "metabolism"], [pelvis, "immune_temp"],
  [arm(-1), "immune_temp"], [arm(1), "immune_temp"], [leg(-1), "immune_temp"], [leg(1), "immune_temp"],
];

/** Vertices of one tube: rows (stations) × SIDES points, in body coordinates. */
function vertices(stations) {
  return stations.map(([x, y, z, rx, rz]) =>
    Array.from({ length: SIDES }, (_, k) => {
      const u = (k / SIDES) * 2 * Math.PI;
      return [x + rx * Math.cos(u), y, z + rz * Math.sin(u)];
    }));
}

/** Edges of a tube: rings, lengthwise lines and one diagonal per quad (triangles). */
function edges(rows) {
  const out = [];
  rows.forEach((row, i) => row.forEach((p, k) => {
    const n = row[(k + 1) % SIDES];
    out.push([p, n]);
    if (i + 1 < rows.length) { out.push([p, rows[i + 1][k]]); out.push([p, rows[i + 1][(k + 1) % SIDES]]); }
  }));
  return out;
}

export default function WireBody({ statuses, selected, onSelect }) {
  const [angle, setAngle] = useState(0.45);
  const drag = useRef(null);
  const turn = (d) => setAngle((a) => a + d);
  const color = (sys) => (statuses[sys] === "green" ? "var(--color-model)" : STATUS_COLOR[statuses[sys]]);
  const mesh = useMemo(() => PARTS.map(([st, sys]) => { const rows = vertices(st); return { sys, rows, edges: edges(rows) }; }), []);

  const c = Math.cos(angle), s = Math.sin(angle);
  const X = ([x, , z]) => x * c + z * s, Z = ([x, , z]) => -x * s + z * c;
  const shade = (z) => 0.12 + 0.88 * Math.min(1, Math.max(0, (z + 30) / 60)); // back edges dim

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="-80 -182 160 372" className="w-56 h-[26rem] touch-none cursor-grab select-none" role="img"
           aria-label="Rotatable wireframe body; each part shows its system status colour"
           onPointerDown={(e) => { drag.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
           onPointerMove={(e) => { if (drag.current != null) { turn((e.clientX - drag.current) / 70); drag.current = e.clientX; } }}
           onPointerUp={() => { drag.current = null; }}>
        <defs>
          <filter id="wb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="wb-floor"><stop offset="0" stopColor="var(--color-model)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--color-model)" stopOpacity="0" /></radialGradient>
        </defs>
        {/* Platform under the feet. */}
        <ellipse cx="0" cy="176" rx="62" ry="10" fill="url(#wb-floor)" />
        <ellipse cx="0" cy="176" rx="46" ry="6" fill="none" stroke="var(--color-model)" strokeOpacity="0.5" strokeWidth="0.6" />

        {mesh.map(({ sys, rows, edges: es }, n) => {
          const on = selected === sys, col = color(sys);
          const xs = rows.flat().map(X), ys = rows.flat().map((p) => p[1]);
          return (
            <g key={n} onClick={() => onSelect(sys)} style={{ cursor: "pointer" }}>
              {/* Tap target: the part's projected bounding box. */}
              <rect x={Math.min(...xs) - 2} y={Math.min(...ys) - 2} width={Math.max(...xs) - Math.min(...xs) + 4}
                    height={Math.max(...ys) - Math.min(...ys) + 4} fill={col} fillOpacity={on ? 0.08 : 0} rx="6" />
              <g filter="url(#wb-glow)" stroke={col} strokeWidth={on ? 0.75 : 0.5} strokeLinecap="round">
                {es.map(([a, b], k) => (
                  <line key={k} x1={X(a)} y1={a[1]} x2={X(b)} y2={b[1]} strokeOpacity={shade((Z(a) + Z(b)) / 2) * (on ? 1 : 0.8)} />
                ))}
              </g>
              <g fill={col}>
                {rows.flat().filter((p) => Z(p) > 2).map((p, k) => <circle key={k} cx={X(p)} cy={p[1]} r={on ? 0.9 : 0.6} />)}
              </g>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-2">
        <button type="button" onClick={() => turn(-0.4)} aria-label="Turn figure left" className="tap px-3 rounded-xl bg-panel-2">◀</button>
        <button type="button" onClick={() => turn(0.4)} aria-label="Turn figure right" className="tap px-3 rounded-xl bg-panel-2">▶</button>
      </div>
      <span className="sr-only">{Object.entries(statuses).map(([k, v]) => `${META.systems[k]?.name}: ${v}`).join(", ")}</span>
    </div>
  );
}
