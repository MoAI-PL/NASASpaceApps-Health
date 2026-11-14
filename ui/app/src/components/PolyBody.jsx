// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Polygonal "blueprint" body figure. Our own geometry, generated here in plain SVG: no 3D library,
// no third-party model or image. Each body part is a low-poly tube (rings of points along a
// centre line, joined into triangles); edges become glowing lines and vertices become nodes.
// Parts take their body system's status: nominal parts stay blueprint blue, parts away from normal
// light up in the status colour and carry the status shape (never colour alone).

import { useId } from "react";
import { STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Geometry (viewBox 0 0 200 400, figure centred on x = 100) =====
// Stations: [x, y, half-width] along each part's centre line, top to bottom.
const HEAD = [[100, 10, 2], [100, 17, 10], [100, 27, 15.5], [100, 39, 17], [100, 51, 15], [100, 61, 10.5], [100, 68, 5]];
const NECK = [[100, 64, 7.5], [100, 82, 10]];
const CHEST = [[100, 78, 18], [100, 88, 42], [100, 104, 38], [100, 121, 33], [100, 138, 30]];
const BELLY = [[100, 138, 30], [100, 152, 28.5], [100, 166, 31.5], [100, 180, 33], [100, 193, 25]];
const ARM = [[59, 90, 9.5], [53, 118, 8.5], [49, 146, 7], [45, 172, 6], [42, 196, 5.5], [41, 202, 7], [40, 214, 6.5], [40, 225, 3]];
const LEG = [[84, 186, 15.5], [82, 222, 13.5], [82, 258, 10], [83, 272, 9], [84, 312, 7.5], [85, 352, 5.5], [85, 362, 6.5], [86, 377, 9]];
const mirror = (stations) => stations.map(([x, y, w]) => [200 - x, y, w]);

/** Body parts: geometry, columns across, and the system whose status they show. */
const PARTS = [
  { id: "arm_l", system: "immune_temp", stations: ARM, cols: 3 },
  { id: "arm_r", system: "immune_temp", stations: mirror(ARM), cols: 3 },
  { id: "leg_l", system: "immune_temp", stations: LEG, cols: 4 },
  { id: "leg_r", system: "immune_temp", stations: mirror(LEG), cols: 4 },
  { id: "neck", system: "immune_temp", stations: NECK, cols: 3 },
  { id: "belly", system: "metabolism", stations: BELLY, cols: 7 },
  { id: "chest", system: "heart", stations: CHEST, cols: 7 },
  { id: "head", system: "mind_sleep", stations: HEAD, cols: 5 },
];

/** Where each system's status shape sits when it is away from normal. */
const MARKER_AT = { mind_sleep: [100, 40], heart: [100, 108], metabolism: [100, 164], immune_temp: [82, 292] };

/** Deterministic pseudo-random number in [0, 1) for vertex jitter (same figure every render). */
function rand(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Insert stations so no two rings are more than `step` apart (more triangles on long limbs). */
function densify(stations, step = 16) {
  const out = [stations[0]];
  for (let i = 1; i < stations.length; i++) {
    const [x0, y0, w0] = stations[i - 1], [x1, y1, w1] = stations[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w0 + (w1 - w0) * t]);
    }
  }
  return out;
}

/** Rings of points across a part: each ring is perpendicular to the centre line. */
function rings(stations, cols, seed) {
  const s = densify(stations);
  return s.map(([x, y, w], i) => {
    const [xa, ya] = s[Math.max(0, i - 1)], [xb, yb] = s[Math.min(s.length - 1, i + 1)];
    const len = Math.hypot(xb - xa, yb - ya) || 1;
    const nx = (yb - ya) / len, ny = -(xb - xa) / len; // normal to the centre line
    return Array.from({ length: cols }, (_, j) => {
      const u = cols === 1 ? 0 : -1 + (2 * j) / (cols - 1);
      const inner = j > 0 && j < cols - 1 && i > 0 && i < s.length - 1;
      const jx = inner ? (rand(seed + i * 31 + j * 7) - 0.5) * 3.2 : 0;
      const jy = inner ? (rand(seed + i * 17 + j * 13) - 0.5) * 2.4 : 0;
      return [x + nx * w * u + jx, y + ny * w * u + jy];
    });
  });
}

/** Triangulated mesh of one part: edge path, vertex list and outline polygon. */
function mesh(part, seed) {
  const R = rings(part.stations, part.cols, seed);
  const edges = new Set(), segs = [];
  const p = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const add = (a, b) => {
    const k = [p(a), p(b)].sort().join("|");
    if (!edges.has(k)) { edges.add(k); segs.push(`M${p(a)}L${p(b)}`); }
  };
  R.forEach((ring, i) => {
    ring.forEach((v, j) => {
      if (j < ring.length - 1) add(v, ring[j + 1]);            // across
      if (i < R.length - 1) {
        add(v, R[i + 1][j]);                                    // along
        if (j < ring.length - 1) {                              // alternating diagonal
          (i + j) % 2 ? add(v, R[i + 1][j + 1]) : add(ring[j + 1], R[i + 1][j]);
        }
      }
    });
  });
  const left = R.map((r) => r[0]), right = R.map((r) => r[r.length - 1]).reverse();
  return {
    ...part,
    path: segs.join(""),
    nodes: R.flat(),
    outline: [...left, ...right].map(p).join(" "),
  };
}

const MESHES = PARTS.map((part, i) => mesh(part, (i + 1) * 101));

// ===== Component =====
/**
 * Polygonal body. `systems`: status per body system; `selected`: highlighted system;
 * `onSelect(system)`: tap on a part; `width`: rendered width in px (height = 2 × width).
 */
export default function PolyBody({ systems, selected = null, onSelect, width = 160, label }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ""); // unique ids if two figures share a page
  const id = (name) => `${name}-${uid}`;
  const colour = (system) => (systems[system] === "green" ? "var(--body-wire)" : STATUS_COLOR[systems[system]]);
  return (
    <svg width={width} height={width * 2} viewBox="0 0 200 400" role="img" aria-label={label} className="shrink-0 mx-auto poly-body">
      <defs>
        <pattern id={id("pb-grid")} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgb(140 200 255 / 0.07)" strokeWidth="1" />
        </pattern>
        <radialGradient id={id("pb-platform")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(86 180 233 / 0.55)" />
          <stop offset="0.6" stopColor="rgb(86 180 233 / 0.12)" />
          <stop offset="1" stopColor="rgb(86 180 233 / 0)" />
        </radialGradient>
        <linearGradient id={id("pb-scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(160 220 255 / 0)" />
          <stop offset="0.85" stopColor="rgb(160 220 255 / 0.22)" />
          <stop offset="1" stopColor="rgb(220 240 255 / 0.55)" />
        </linearGradient>
        <filter id={id("pb-glow")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={id("pb-clip")}>
          {MESHES.map((m) => <polygon key={m.id} points={m.outline} />)}
        </clipPath>
      </defs>

      {/* Blueprint grid and the glowing platform under the feet. */}
      <rect x="0" y="0" width="200" height="400" fill={`url(#${id("pb-grid")})`} />
      <ellipse cx="100" cy="384" rx="70" ry="11" fill={`url(#${id("pb-platform")})`} />
      <ellipse cx="100" cy="384" rx="52" ry="7.5" fill="none" stroke="rgb(140 210 255 / 0.45)" strokeWidth="1" />
      <ellipse cx="100" cy="384" rx="70" ry="11" fill="none" stroke="rgb(140 210 255 / 0.18)" strokeWidth="1" />

      {/* Parts: tinted surface (also the tap area), glowing wire edges and vertex nodes. */}
      {MESHES.map((m) => {
        const st = systems[m.system], off = st !== "green", isSel = selected === m.system;
        return (
          <g key={m.id} onClick={onSelect ? () => onSelect(m.system) : undefined}
             style={{ cursor: onSelect ? "pointer" : "default", color: colour(m.system) }}>
            <polygon points={m.outline} fill="currentColor" fillOpacity={off ? 0.2 : 0.05} stroke="none" />
            <path d={m.path} fill="none" stroke="currentColor" strokeWidth={isSel ? 1.4 : 0.9}
                  strokeOpacity={off || isSel ? 0.95 : 0.6} strokeLinejoin="round" filter={`url(#${id("pb-glow")})`} />
            {m.nodes.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={off || isSel ? 1.5 : 1.15} fill="currentColor" fillOpacity={off || isSel ? 1 : 0.8} />
            ))}
          </g>
        );
      })}

      {/* A slow scan line moves down the body (off when the system asks for reduced motion). */}
      <g clipPath={`url(#${id("pb-clip")})`} pointerEvents="none">
        <rect className="poly-body-scan" x="0" y="-60" width="200" height="60" fill={`url(#${id("pb-scan")})`} />
      </g>

      {/* Status shapes on the parts that are away from normal. */}
      {Object.entries(MARKER_AT).map(([system, [x, y]]) => systems[system] !== "green" && (
        <g key={system} pointerEvents="none" transform={`translate(${x - 14} ${y - 14})`}>
          <circle cx="14" cy="14" r="18" fill="var(--color-panel)" fillOpacity="0.85" />
          <StatusIcon status={systems[system]} size={28} />
        </g>
      ))}
    </svg>
  );
}
