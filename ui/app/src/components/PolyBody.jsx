// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Holographic body figure: a glowing, rim-lit blue body with muscle definition and a polygonal
// wire mesh on top. Our own geometry, generated here in plain SVG: no 3D library, no third-party
// model or image. The body is built from anatomical cross-sections (about eight head-heights,
// relaxed pose, open hands). Each part is a low-poly tube: rings of points along a centre line,
// joined into triangles; columns crowd towards the outline, as a round body does in a front view.
// Layers, back to front: halo → outer bloom → body fill → inner rim light → muscle lines and soft
// highlights → wire mesh → scan line → status shapes. Parts take their body system's status:
// parts away from normal light up in the status colour and carry the status shape.

import { useId } from "react";
import { STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Geometry (viewBox 0 0 300 405, figure centred on x = 150) =====
const W = 300, H = 405, CX = 150;

// Stations: [x, y, half-width] along each part's centre line, top to bottom.
const HEAD = [
  [CX, 12, 2.5], [CX, 15, 8], [CX, 20, 13], [CX, 27, 16.5], [CX, 35, 18], [CX, 42, 17.5],
  [CX, 47, 16], [CX, 52, 14], [CX, 56, 11.5], [CX, 59.5, 7.5],
];
const NECK = [[CX, 54, 9.5], [CX, 63, 10.5], [CX, 71, 13]];
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
  [100, 6.6], [114, 5], [119, 6.2], [127, 8.6], [137, 9], [146, 7.6], [155, 5.6], [162, 3.6], [166, 1.4],
];
const SHOULDER = [CX - 40, 86], ARM_ANGLE = (62 * Math.PI) / 180; // relaxed: 62° below horizontal
const ARM = ARM_PROFILE.map(([t, w]) => [SHOULDER[0] - Math.cos(ARM_ANGLE) * t, SHOULDER[1] + Math.sin(ARM_ANGLE) * t, w]);

// Thigh → knee → calf → ankle → foot (front view, feet turned slightly out).
const LEG = [
  [CX - 20, 190, 20], [CX - 20.5, 208, 19.5], [CX - 21, 228, 17.5], [CX - 21.5, 248, 14.5],
  [CX - 22, 262, 11.8], [CX - 22, 271, 11.2], [CX - 22.5, 282, 12.4], [CX - 23, 296, 12.6],
  [CX - 23.5, 314, 10], [CX - 24, 334, 7.4], [CX - 24.5, 352, 6.2], [CX - 25, 362, 7.6],
  [CX - 26.5, 372, 10.2], [CX - 28.5, 380, 12.4], [CX - 30, 385, 10],
];
const mirror = (stations) => stations.map(([x, y, w]) => [2 * CX - x, y, w]);
const mirrorPath = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(2 * CX - +x).toFixed(1)} ${y}`);

/** Body parts (mesh + tap areas): geometry, columns across, the body system they show. */
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

/** Rim light outlines: whole torso in one piece; caps that join another part are left open. */
const RIMS = [
  { stations: HEAD, mode: "closed" },
  { stations: NECK, mode: "sides" },
  { stations: [...CHEST, ...BELLY.slice(1)], mode: "open-top" },
  { stations: ARM, mode: "open-top" },
  { stations: mirror(ARM), mode: "open-top" },
  { stations: LEG, mode: "open-top" },
  { stations: mirror(LEG), mode: "open-top" },
];

// Muscle definition (left half, mirrored): clavicle, pectoral, abdominal edge, iliac "V",
// deltoid, quadriceps, kneecap, calf; plus the centre line and the abdominal segments.
const MUSCLES_LEFT = [
  "M145 75 Q131 70 114 79",
  "M149 104 C140 118 121 119 110 101",
  "M133 122 Q129 150 136 183",
  "M117 168 Q128 190 145 205",
  "M121 82 Q111 90 109 110",
  "M120 206 Q125 232 129 258",
  "M121 262 Q128 271 135 262",
  "M136 285 Q138 300 134 318",
  "M135 132 Q142 135 149 133", "M135 147 Q142 150 149 148", "M136 162 Q142 165 149 163",
];
const MUSCLES = [
  ...MUSCLES_LEFT,
  ...MUSCLES_LEFT.map(mirrorPath),
  "M150 84 L150 128", "M150 136 L150 186",
];
// Soft highlights on the rounded forms: [cx, cy, rx, ry, opacity].
const SHEEN_LEFT = [[130, 101, 14, 8, 0.28], [112, 92, 7, 11, 0.3], [128, 226, 7, 20, 0.2], [143, 150, 5, 14, 0.14], [92, 132, 4, 12, 0.18]];
const SHEEN = [...SHEEN_LEFT, ...SHEEN_LEFT.map(([x, ...r]) => [2 * CX - x, ...r]), [146, 25, 8, 6, 0.3]];

/** Soft glow where an organ system sits, shown when it is away from normal: [cx, cy, rx, ry].
 *  Immune & temperature is whole-body, so its limbs are tinted instead. */
const ZONE_GLOW = { mind_sleep: [CX, 34, 17, 20], heart: [CX - 7, 104, 26, 22], metabolism: [CX, 168, 25, 24] };

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

const pt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** Triangulated mesh of one part: edge path, node path, outline polygon. */
function mesh(part, seed, step) {
  const R = rings(part.stations, part.cols, seed, step);
  const edges = new Set(), segs = [];
  const add = (a, b) => {
    const k = [pt(a), pt(b)].sort().join("|");
    if (!edges.has(k)) { edges.add(k); segs.push(`M${pt(a)}L${pt(b)}`); }
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
    nodes: R.flat().map((v) => `M${pt(v)}h0.01`).join(""),
    outline: [...left, ...right].map(pt).join(" "),
  };
}

/** Rim outline path of a part: closed, open at the top cap, or the two sides only. */
function rim({ stations, mode }) {
  const R = rings(stations, 2, 0, 4);
  const left = R.map((r) => r[0]), right = R.map((r) => r[1]);
  const line = (pts) => `M${pts.map(pt).join("L")}`;
  if (mode === "sides") return line(left) + line(right);
  const loop = [...left, ...right.reverse()];
  return mode === "closed" ? `${line(loop)}Z` : line(loop);
}

/** Meshes at two levels of detail: fine for the large figure, lighter for small ones. */
const MESHES = {
  fine: PARTS.map((part, i) => mesh(part, (i + 1) * 101, 6.5)),
  light: PARTS.map((part, i) => mesh({ ...part, cols: Math.max(5, part.cols - 4) }, (i + 1) * 101, 10)),
};
const RIM_PATH = RIMS.map(rim).join("");
const SILHOUETTE = MESHES.fine.map((m) => m.outline);

// ===== Component =====
/**
 * Holographic body. `systems`: status per body system; `selected`: highlighted system;
 * `onSelect(system)`: tap on a part; `width`: largest rendered width in px (scales down to fit).
 */
export default function PolyBody({ systems, selected = null, onSelect, width = 300, label }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ""); // unique ids if two figures share a page
  const id = (name) => `${name}-${uid}`;
  const url = (name) => `url(#${id(name)})`;
  const meshes = width >= 240 ? MESHES.fine : MESHES.light;
  const k = W / width; // viewBox units per screen pixel: keeps lines about the same on screen

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block mx-auto poly-body"
         style={{ width: "100%", maxWidth: width, height: "auto" }}>
      <defs>
        <radialGradient id={id("halo")} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="rgb(40 140 255 / 0.5)" />
          <stop offset="0.55" stopColor="rgb(30 90 220 / 0.16)" />
          <stop offset="1" stopColor="rgb(30 90 220 / 0)" />
        </radialGradient>
        {/* One body-wide gradient (user space), so parts join without seams. */}
        <radialGradient id={id("skin")} gradientUnits="userSpaceOnUse" cx={CX} cy="150" r="230">
          <stop offset="0" stopColor="#1650c4" />
          <stop offset="0.5" stopColor="#0d3591" />
          <stop offset="1" stopColor="#081f5c" />
        </radialGradient>
        <radialGradient id={id("platform")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(90 200 255 / 0.55)" />
          <stop offset="0.6" stopColor="rgb(90 200 255 / 0.1)" />
          <stop offset="1" stopColor="rgb(90 200 255 / 0)" />
        </radialGradient>
        <linearGradient id={id("scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(170 230 255 / 0)" />
          <stop offset="0.85" stopColor="rgb(170 230 255 / 0.18)" />
          <stop offset="1" stopColor="rgb(230 248 255 / 0.5)" />
        </linearGradient>
        <filter id={id("bloom")} x="-30%" y="-15%" width="160%" height="130%">
          <feGaussianBlur stdDeviation={7 * k} />
        </filter>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2.4 * k} />
        </filter>
        <filter id={id("hair")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={0.7 * k} />
        </filter>
        <clipPath id={id("clip")}>
          {SILHOUETTE.map((o, i) => <polygon key={i} points={o} />)}
        </clipPath>
      </defs>

      {/* Light behind the figure and the lit platform under the feet. */}
      <rect x="0" y="0" width={W} height={H} fill={url("halo")} />
      <ellipse cx={CX} cy="392" rx="92" ry="11" fill={url("platform")} />
      <ellipse cx={CX} cy="392" rx="62" ry="7" fill="none" stroke="rgb(120 210 255 / 0.45)" strokeWidth={0.8 * k} />
      <ellipse cx={CX} cy="392" rx="92" ry="11" fill="none" stroke="rgb(120 210 255 / 0.18)" strokeWidth={0.8 * k} />

      {/* Outer bloom: the silhouette, blurred, glowing into the background. */}
      <g filter={url("bloom")} opacity="0.65" pointerEvents="none">
        {SILHOUETTE.map((o, i) => <polygon key={i} points={o} fill="#2f8cff" />)}
      </g>

      {/* Body fill (also the tap areas, one per part); off-normal parts tinted in their status colour. */}
      {meshes.map((m) => (
        <g key={m.id} onClick={onSelect ? () => onSelect(m.system) : undefined} style={{ cursor: onSelect ? "pointer" : "default" }}>
          <polygon points={m.outline} fill={url("skin")} />
          {systems[m.system] !== "green" && !ZONE_GLOW[m.system] && (
            <polygon points={m.outline} fill={STATUS_COLOR[systems[m.system]]} fillOpacity="0.32" />
          )}
        </g>
      ))}

      {/* Inside the body only: rim light along the outline, muscle lines and soft highlights. */}
      <g clipPath={url("clip")} pointerEvents="none">
        <path d={RIM_PATH} fill="none" stroke="#7fd4ff" strokeWidth={9 * k} strokeLinejoin="round" filter={url("soft")} opacity="0.85" />
        <path d={RIM_PATH} fill="none" stroke="#c9f0ff" strokeWidth={1.6 * k} strokeLinejoin="round" opacity="0.9" />
        <path d={MUSCLES.join("")} fill="none" stroke="#8fdcff" strokeWidth={1.4 * k} strokeLinecap="round"
              filter={url("hair")} opacity="0.55" />
        <g filter={url("soft")}>
          {SHEEN.map(([x, y, rx, ry, o], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#bfeaff" opacity={o} />)}
        </g>
        {/* Organ glow in the status colour (heart, abdomen, head) when away from normal. */}
        <g filter={url("bloom")}>
          {Object.entries(ZONE_GLOW).map(([system, [x, y, rx, ry]]) => systems[system] !== "green" && (
            <ellipse key={system} cx={x} cy={y} rx={rx} ry={ry} fill={STATUS_COLOR[systems[system]]} opacity="0.9" />
          ))}
        </g>
      </g>

      {/* Polygonal wire mesh on top: faint on nominal parts, bright on selected and off-normal ones. */}
      <g pointerEvents="none">
        {meshes.map((m) => {
          const off = systems[m.system] !== "green", lit = off || selected === m.system;
          const colour = off ? STATUS_COLOR[systems[m.system]] : "var(--body-wire)";
          const fade = off && ZONE_GLOW[m.system] && selected !== m.system ? 0.6 : 1; // the organ glow carries it
          return (
            <g key={m.id} style={{ color: colour }}>
              <path d={m.path} fill="none" stroke="currentColor" strokeWidth={(lit ? 0.6 : 0.45) * k}
                    strokeOpacity={(lit ? 0.75 : 0.32) * fade} strokeLinejoin="round" />
              <path d={m.nodes} fill="none" stroke="currentColor" strokeWidth={(lit ? 1.6 : 1.2) * k}
                    strokeLinecap="round" strokeOpacity={(lit ? 0.9 : 0.45) * fade} />
              {selected === m.system && (
                <polygon points={m.outline} fill="none" stroke="var(--color-ink)" strokeWidth={1.4 * k} strokeOpacity="0.85" />
              )}
            </g>
          );
        })}
      </g>

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
