// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Polygonal "blueprint" body figure. Our own geometry, generated here in plain SVG: no 3D library,
// no third-party model or image. The body is built from anatomical cross-sections (about eight
// head-heights tall, arms out to the sides). Each part is a low-poly tube: rings of points along a
// centre line, joined into triangles. Columns crowd towards the outline (as a round body does in
// a front view), so the flat drawing reads as a 3D volume. Edges become glowing lines, vertices
// become nodes. Parts take their body system's status: nominal parts stay wire teal, parts away
// from normal light up in the status colour and carry the status shape (never colour alone).

import { useId } from "react";
import { STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Geometry (viewBox 0 0 360 405, figure centred on x = 180) =====
const W = 360, H = 405, CX = 180;

// Stations: [x, y, half-width] along each part's centre line, top to bottom.
const HEAD = [
  [CX, 12, 2.5], [CX, 15, 8], [CX, 20, 13], [CX, 27, 16.5], [CX, 35, 18], [CX, 42, 17.5],
  [CX, 47, 16], [CX, 52, 14], [CX, 56, 11.5], [CX, 59.5, 7.5],
];
const NECK = [[CX, 54, 9.5], [CX, 64, 10.5], [CX, 73, 13]];
// Trapezius slope → shoulders → chest; the heart zone ends below the ribs.
const CHEST = [
  [CX, 70, 13], [CX, 74, 22], [CX, 78, 31], [CX, 83, 37.5], [CX, 90, 41], [CX, 98, 42.5],
  [CX, 106, 42], [CX, 116, 40], [CX, 127, 37.5], [CX, 138, 35.5],
];
// Waist → hips → crotch.
const BELLY = [
  [CX, 138, 35.5], [CX, 150, 33.5], [CX, 160, 34], [CX, 171, 36.5], [CX, 182, 39], [CX, 192, 39.5],
  [CX, 200, 35], [CX, 206, 24],
];

/** Arm stations from the shoulder joint along a straight line: [distance, half-width]. */
const ARM_PROFILE = [
  [-4, 9], [2, 13.5], [10, 14], [22, 12], [38, 10.5], [52, 9.5], [64, 7.8], [72, 8.6], [84, 8.2],
  [100, 6.6], [114, 5], [119, 5.6], [127, 7.4], [137, 7.6], [146, 6.4], [155, 5], [162, 3.4], [166, 1.4],
];
const SHOULDER = [CX - 40, 86], ARM_ANGLE = (36 * Math.PI) / 180; // 36° below horizontal
const ARM = ARM_PROFILE.map(([t, w]) => [SHOULDER[0] - Math.cos(ARM_ANGLE) * t, SHOULDER[1] + Math.sin(ARM_ANGLE) * t, w]);

// Thigh → knee → calf → ankle → foot (front view, feet turned slightly out).
const LEG = [
  [CX - 20, 190, 20], [CX - 20.5, 208, 19.5], [CX - 21, 228, 17.5], [CX - 21.5, 248, 14.5],
  [CX - 22, 262, 11.8], [CX - 22, 271, 11.2], [CX - 22.5, 282, 12.4], [CX - 23, 296, 12.6],
  [CX - 23.5, 314, 10], [CX - 24, 334, 7.4], [CX - 24.5, 352, 6.2], [CX - 25, 362, 7.6],
  [CX - 26.5, 372, 10.2], [CX - 28.5, 380, 12.4], [CX - 30, 385, 10],
];
const mirror = (stations) => stations.map(([x, y, w]) => [2 * CX - x, y, w]);

/** Body parts: geometry, columns across, and the body system whose status they show. */
const PARTS = [
  { id: "arm_l", system: "immune_temp", stations: ARM, cols: 7 },
  { id: "arm_r", system: "immune_temp", stations: mirror(ARM), cols: 7 },
  { id: "leg_l", system: "immune_temp", stations: LEG, cols: 8 },
  { id: "leg_r", system: "immune_temp", stations: mirror(LEG), cols: 8 },
  { id: "neck", system: "immune_temp", stations: NECK, cols: 7 },
  { id: "belly", system: "metabolism", stations: BELLY, cols: 13 },
  { id: "chest", system: "heart", stations: CHEST, cols: 13 },
  { id: "head", system: "mind_sleep", stations: HEAD, cols: 9 },
];

/** Where each system's status shape sits when it is away from normal. */
const MARKER_AT = { mind_sleep: [CX, 36], heart: [CX, 106], metabolism: [CX, 172], immune_temp: [CX - 23, 300] };

/** Deterministic pseudo-random number in [0, 1) for vertex jitter (same figure every render). */
function rand(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Insert stations so no two rings are more than `step` apart. */
function densify(stations, step) {
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

/** Rings of points across a part, perpendicular to the centre line, crowded towards the edges. */
function rings(stations, cols, seed, step) {
  const s = densify(stations, step);
  return s.map(([x, y, w], i) => {
    const [xa, ya] = s[Math.max(0, i - 1)], [xb, yb] = s[Math.min(s.length - 1, i + 1)];
    const len = Math.hypot(xb - xa, yb - ya) || 1;
    const nx = (yb - ya) / len, ny = -(xb - xa) / len; // normal to the centre line
    return Array.from({ length: cols }, (_, j) => {
      const u = -Math.cos((Math.PI * j) / (cols - 1)); // projection of a cylinder: dense at the rim
      const inner = j > 0 && j < cols - 1 && i > 0 && i < s.length - 1;
      const jx = inner ? (rand(seed + i * 31 + j * 7) - 0.5) * 1.6 : 0;
      const jy = inner ? (rand(seed + i * 17 + j * 13) - 0.5) * 1.6 : 0;
      return [x + nx * w * u + jx, y + ny * w * u + jy];
    });
  });
}

/** Triangulated mesh of one part: edge path, node path, outline polygon. */
function mesh(part, seed, step) {
  const R = rings(part.stations, part.cols, seed, step);
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
    // Nodes as zero-length round-capped segments: one path element instead of hundreds of circles.
    nodes: R.flat().map((v) => `M${p(v)}h0.01`).join(""),
    outline: [...left, ...right].map(p).join(" "),
  };
}

/** Meshes at two levels of detail: fine for the large figure, lighter for small ones. */
const MESHES = {
  fine: PARTS.map((part, i) => mesh(part, (i + 1) * 101, 6.5)),
  light: PARTS.map((part, i) => mesh({ ...part, cols: Math.max(5, part.cols - 4) }, (i + 1) * 101, 10)),
};

// ===== Component =====
/**
 * Polygonal body. `systems`: status per body system; `selected`: highlighted system;
 * `onSelect(system)`: tap on a part; `width`: rendered width in px (height follows the viewBox).
 */
export default function PolyBody({ systems, selected = null, onSelect, width = 300, label }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ""); // unique ids if two figures share a page
  const id = (name) => `${name}-${uid}`;
  const url = (name) => `url(#${id(name)})`;
  const colour = (system) => (systems[system] === "green" ? "var(--body-wire)" : STATUS_COLOR[systems[system]]);
  const meshes = width >= 240 ? MESHES.fine : MESHES.light;
  const k = W / width; // viewBox units per screen pixel: keeps lines about the same on screen

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block mx-auto poly-body"
         style={{ width: "100%", maxWidth: width, height: "auto" }}>
      <defs>
        <pattern id={id("grid")} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgb(120 220 230 / 0.06)" strokeWidth="1" />
        </pattern>
        <radialGradient id={id("halo")} cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor="rgb(70 120 190 / 0.32)" />
          <stop offset="1" stopColor="rgb(70 120 190 / 0)" />
        </radialGradient>
        <radialGradient id={id("platform")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(70 214 224 / 0.5)" />
          <stop offset="0.6" stopColor="rgb(70 214 224 / 0.1)" />
          <stop offset="1" stopColor="rgb(70 214 224 / 0)" />
        </radialGradient>
        <linearGradient id={id("scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(150 240 245 / 0)" />
          <stop offset="0.85" stopColor="rgb(150 240 245 / 0.2)" />
          <stop offset="1" stopColor="rgb(220 255 255 / 0.55)" />
        </linearGradient>
        <filter id={id("glow")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={1.6 * k} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={id("clip")}>
          {meshes.map((m) => <polygon key={m.id} points={m.outline} />)}
        </clipPath>
      </defs>

      {/* Soft halo, blueprint grid and the lit platform under the feet. */}
      <rect x="0" y="0" width={W} height={H} fill={url("halo")} />
      <rect x="0" y="0" width={W} height={H} fill={url("grid")} />
      <ellipse cx={CX} cy="392" rx="96" ry="11" fill={url("platform")} />
      <ellipse cx={CX} cy="392" rx="66" ry="7" fill="none" stroke="rgb(110 225 235 / 0.45)" strokeWidth={0.8 * k} />
      <ellipse cx={CX} cy="392" rx="96" ry="11" fill="none" stroke="rgb(110 225 235 / 0.18)" strokeWidth={0.8 * k} />

      {/* Parts: tinted surface (also the tap area), glowing wire edges, nodes and a bright outline. */}
      {meshes.map((m) => {
        const off = systems[m.system] !== "green", isSel = selected === m.system, lit = off || isSel;
        return (
          <g key={m.id} onClick={onSelect ? () => onSelect(m.system) : undefined}
             style={{ cursor: onSelect ? "pointer" : "default", color: colour(m.system) }}>
            <polygon points={m.outline} fill="currentColor" fillOpacity={off ? 0.09 : 0.035} stroke="none" />
            <path d={m.path} fill="none" stroke="currentColor" strokeWidth={(lit ? 0.75 : 0.55) * k}
                  strokeOpacity={lit ? 0.95 : 0.62} strokeLinejoin="round" filter={url("glow")} />
            <path d={m.nodes} fill="none" stroke="currentColor" strokeWidth={(lit ? 1.9 : 1.5) * k}
                  strokeLinecap="round" strokeOpacity={lit ? 1 : 0.85} />
            <polygon points={m.outline} fill="none" stroke="currentColor" strokeWidth={(isSel ? 1.6 : 0.9) * k}
                     strokeOpacity={lit ? 1 : 0.8} strokeLinejoin="round" />
          </g>
        );
      })}

      {/* A slow scan line moves down the body (off when the system asks for reduced motion). */}
      <g clipPath={url("clip")} pointerEvents="none">
        <rect className="poly-body-scan" x="0" y="-60" width={W} height="60" fill={url("scan")} />
      </g>

      {/* Status shapes on the parts that are away from normal (same on-screen size at any width). */}
      {Object.entries(MARKER_AT).map(([system, [x, y]]) => systems[system] !== "green" && (
        <g key={system} pointerEvents="none" transform={`translate(${x} ${y}) scale(${k}) translate(-14 -14)`}>
          <circle cx="14" cy="14" r="18" fill="var(--color-panel)" fillOpacity="0.85" />
          <StatusIcon status={systems[system]} size={28} />
        </g>
      ))}
    </svg>
  );
}
