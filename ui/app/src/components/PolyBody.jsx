// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Holographic human figure: a glowing, rim-lit blue body with a face, hands and muscle definition,
// and a polygonal wire mesh on top. Our own geometry, drawn here in plain SVG: no 3D library, no
// third-party model or image.
//
// Anatomy: about eight head-heights, relaxed standing pose, arms along the body. The neck, torso,
// arms and legs are ONE continuous outline (smooth curves through landmark points), so shoulders
// and arms join the body without seams; the head, ears and hands are drawn on top.
// Layers, back to front: halo → outer bloom → body (fill, rim light, muscles, shading) → head
// (ears, fill, rim, face) → hands (palm, thumb, fingers) → wire mesh → organ glow → scan line →
// status shapes. Parts take their body system's status (colour + status shape, never colour alone).

import { useId } from "react";
import { STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Coordinates (viewBox 0 0 260 420, figure centred on x = 130) =====
const W = 260, H = 420, CX = 130;
const mx = (x) => 2 * CX - x;
const f = (n) => n.toFixed(1);

/** Smooth path through points (Catmull–Rom → cubic Bézier). */
function smooth(pts, closed = false) {
  const n = pts.length, at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} `
       + `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}
const mirrorPts = (pts) => pts.map(([x, y]) => [mx(x), y]);
const mirrorPath = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f(mx(+x))} ${y}`);

// ===== Body outline (left half, from under the jaw down to the crotch) =====
const BODY_LEFT = [
  [120, 53], [119.2, 63], [117, 71.5],                                    // neck
  [109, 75.5], [98, 79.5], [89, 82.5],                                    // trapezius
  [82.5, 86.5], [78.2, 93.5], [76.3, 103], [75.4, 115],                   // shoulder, deltoid
  [75.6, 128], [75.1, 142], [74, 155],                                    // upper arm, elbow
  [72.4, 166], [72, 179], [73.4, 192], [74.6, 202.5],                     // forearm, wrist
  [73.4, 210.5], [72.5, 219], [72.9, 226.6], [76.4, 228.4], [80, 228.9],  // palm (outer side,
  [84, 228.3], [87.5, 226.8], [88, 219], [87.1, 211.5], [84.8, 204],      //   knuckles, inner side)
  [85.2, 192], [86.2, 178], [87.2, 166], [88.2, 156],                     // inner forearm, elbow
  [89.4, 143], [89.9, 129], [90.4, 117], [91.6, 107.5], [94, 103.5],      // inner upper arm, armpit
  [95.6, 109], [96.6, 119], [98.4, 131], [100.2, 143], [100.8, 153],      // lats, ribs, waist
  [100.2, 163], [98.8, 174], [97.2, 186], [96.3, 198], [96.4, 211],       // hip
  [97.3, 225], [99, 241], [101, 258], [103, 274], [104, 287],             // outer thigh, knee
  [104.2, 299], [102.8, 313], [104.6, 330], [106.8, 347], [108.8, 363],   // calf
  [110, 375], [108.6, 384], [104.6, 392], [105.6, 398.5], [115, 400.5],   // ankle, foot
  [123.6, 397.5], [124.4, 388], [122.4, 377],                             // big toe, inner ankle
  [123.2, 363], [124.6, 346], [125.6, 330], [124.6, 314], [124.8, 300],   // inner calf
  [124.2, 288], [124.8, 275], [125.6, 261], [126.4, 245], [127.4, 229],   // inner knee, thigh
  [128.4, 216], [130, 209],                                               // crotch
];
const BODY = smooth([...BODY_LEFT, ...mirrorPts(BODY_LEFT).reverse().slice(1)], true);

// ===== Head, ears, neck details =====
const HEAD_LEFT = [[130, 9.5], [122, 11], [115.6, 15.2], [112.4, 22], [111.4, 30], [111.9, 38], [113.4, 45], [116.6, 51], [121.6, 55.8], [126.4, 58.4]];
const HEAD = smooth([...HEAD_LEFT, [130, 59.2], ...mirrorPts(HEAD_LEFT).reverse().slice(0, -1)], true);
const EAR_LEFT = smooth([[112.2, 31], [109.2, 30.4], [107.7, 34.2], [108.2, 40], [110, 44.4], [112.6, 45]], true);
const EARS = [EAR_LEFT, mirrorPath(EAR_LEFT)];
const EAR_INNER = ["M110.2 33.6 Q109.4 38 111.2 42.2", mirrorPath("M110.2 33.6 Q109.4 38 111.2 42.2")];

// Face (left half where symmetric, then mirrored): brows, lids, nose, lips, chin.
const FACE_LINES_LEFT = [
  "M117.4 28.4 Q121.6 25.8 127 27.8",          // eyebrow
  "M118.2 31.4 Q122.4 28.8 126.9 31.6",         // upper eyelid crease
  "M127.6 33.4 Q126.4 40.4 125.3 44",           // side of the nose
  "M120.2 41 Q123 44.6 124.4 49.4",             // nasolabial fold
  "M121.4 56 Q124.6 66 127.8 74",               // neck muscle (sternocleidomastoid)
];
const FACE_LINES = [
  ...FACE_LINES_LEFT, ...FACE_LINES_LEFT.map(mirrorPath),
  "M126 45.4 Q128 47 130 46 Q132 47 134 45.4",  // nostrils
  "M125.2 50.6 Q130 51.6 134.8 50.6",           // lips line
  "M128.6 47.4 L128.8 49.2 M131.4 47.4 L131.2 49.2", // philtrum
];
const EYE_LEFT = "M118.4 33 Q122.5 30.4 126.6 33 Q122.5 35.2 118.4 33Z";
const EYES = [EYE_LEFT, mirrorPath(EYE_LEFT)];
const IRISES = [[122.5, 32.9], [mx(122.5), 32.9]];
const LIPS = [
  "M124.6 50.4 Q127.4 48.6 130 49.4 Q132.6 48.6 135.4 50.4 Q130 51.4 124.6 50.4Z",
  "M125.2 50.8 Q130 55 134.8 50.8 Q130 52 125.2 50.8Z",
];

// ===== Hands (left hand; palm turned slightly forward, thumb on the outside) =====
// The palm is part of the body outline; thumb and fingers are drawn on top of it.
// Fingers: [x0, y0, x1, y1, width at base, width at tip] (thumb first).
const FINGERS_LEFT = [
  [76.4, 208.6, 71.2, 222.8, 2.7, 1.7],      // thumb (base inside the palm)
  [74.9, 224.5, 75.5, 239.6, 1.95, 1.55],    // index
  [78.7, 225.5, 78.9, 242.4, 2.05, 1.6],     // middle
  [82.5, 225.2, 82.2, 241, 1.95, 1.5],       // ring
  [85.9, 224.2, 85.1, 236.4, 1.7, 1.3],      // little
];

/** Tapered finger with a rounded tip and a rounded base (the base sits inside the palm).
 *  `edge`: open path along the sides and the tip only, for the bright outline. */
function finger([x0, y0, x1, y1, w0, w1], edge = false) {
  const len = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / len, dy = (y1 - y0) / len, nx = -dy, ny = dx;
  const P = (x, y, w, s) => `${f(x + nx * w * s)} ${f(y + ny * w * s)}`;
  const sides = `M${P(x0, y0, w0, 1)}L${P(x1, y1, w1, 1)}Q${f(x1 + dx * w1 * 1.7)} ${f(y1 + dy * w1 * 1.7)} ${P(x1, y1, w1, -1)}L${P(x0, y0, w0, -1)}`;
  return edge ? sides : `${sides}Q${f(x0 - dx * w0 * 1.6)} ${f(y0 - dy * w0 * 1.6)} ${P(x0, y0, w0, 1)}Z`;
}
const mirrorFinger = ([x0, y0, x1, y1, w0, w1]) => [mx(x0), y0, mx(x1), y1, w0, w1];
const FINGER_DATA = [...FINGERS_LEFT, ...FINGERS_LEFT.map(mirrorFinger)];
const FINGERS = FINGER_DATA.map((d) => finger(d));
const FINGER_EDGES = FINGER_DATA.map((d) => finger(d, true)).join("");
// Knuckle creases across the fingers.
const KNUCKLES = [...FINGERS_LEFT.slice(1), ...FINGERS_LEFT.slice(1).map(mirrorFinger)].map(([x0, y0, x1, y1, w0]) => {
  const t = 0.45, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
  return `M${f(x - w0 * 0.8)} ${f(y)}L${f(x + w0 * 0.8)} ${f(y)}`;
}).join("");

// ===== Muscle definition, shading and highlights =====
const MUSCLES_LEFT = [
  "M127 76 Q115 72.6 99 79.6",                  // clavicle
  "M129 106 C121 118 104.6 119 95.6 104",        // lower edge of the pectoral
  "M99 82 Q91.6 91.6 93.2 103.4",                // deltoid / pectoral
  "M84.4 110 Q86.6 127 85.2 146",                // biceps
  "M79 162 Q76.6 178 78.6 197",                  // forearm
  "M117.6 124.4 Q123.4 126.6 129.4 124.8",       // abdominal segments
  "M117.4 138.4 Q123.4 140.6 129.4 138.8",
  "M118 152.4 Q123.6 154.6 129.4 152.8",
  "M115.6 116 Q111.8 146 116.6 180",             // outer edge of the abdominals
  "M104 158 Q113.6 183 127 200",                 // iliac "V"
  "M104.6 212 Q109.4 241 113 272",               // quadriceps
  "M122 261 Q124.6 274 118.6 284",               // inner knee muscle
  "M107.4 285 Q113.4 293 120 285",               // kneecap
  "M106 301 Q102.6 318 107.6 341",               // calf, outer
  "M123.8 301 Q126 318 122.4 337",               // calf, inner
];
const MUSCLES = [...MUSCLES_LEFT, ...MUSCLES_LEFT.map(mirrorPath), "M130 82 L130 110", "M130 114 L130 186"];
const SHADOWS_LEFT = [
  "M128 109 C121 121.6 104 122.6 96 107",       // under the pectoral
  "M93.6 104 Q96 116 97 128",                    // armpit to the side
  "M127.6 202 Q122 225 125 262",                 // between the thighs
];
const SHADOWS = [...SHADOWS_LEFT, ...SHADOWS_LEFT.map(mirrorPath)];
// Soft highlights on rounded forms: [cx, cy, rx, ry, opacity].
const SHEEN_LEFT = [
  [114, 97, 12, 7, 0.3], [81.6, 96, 5, 9, 0.32], [81.6, 126, 3.4, 9, 0.22], [77.4, 178, 3, 10, 0.2],
  [123.6, 139, 4, 14, 0.15], [110, 236, 7, 22, 0.22], [113, 286, 5, 6, 0.2], [106, 318, 3, 11, 0.18],
  [120, 39.5, 4, 2.4, 0.3], [80.4, 216, 4, 6, 0.18],
];
const SHEEN = [...SHEEN_LEFT, ...SHEEN_LEFT.map(([x, ...r]) => [mx(x), ...r]), [130, 18.5, 9, 5, 0.32], [130, 43.4, 2, 1.6, 0.4], [130, 55.4, 3.6, 2, 0.28], [130, 65, 2, 2.6, 0.2]];

// ===== Wire mesh: low-poly tubes (rings across centre lines), clipped to the body =====
const TUBES = [
  { id: "arm_l", system: "immune_temp", cols: 7, stations: [[88, 86, 7], [85, 96, 8], [83.5, 104, 7.6], [82.5, 116, 7.6], [82.8, 130, 7.4], [82.3, 144, 7.4], [81, 156, 7.1], [80, 166, 7.4], [79, 178, 7.2], [79.2, 192, 6.1], [79.5, 204, 4.8]] },
  { id: "leg_l", system: "immune_temp", cols: 8, stations: [[112, 206, 16.5], [112.3, 224, 15.4], [112.8, 240, 13.9], [113, 258, 12.2], [113.5, 274, 10.7], [114, 288, 10.2], [114.3, 300, 10.4], [113.6, 314, 10.8], [115, 330, 10.2], [115.6, 348, 8.7], [116, 364, 7.2], [116.2, 376, 6.2], [114.6, 388, 9.6], [115, 398, 9]] },
  { id: "neck", system: "immune_temp", cols: 7, stations: [[CX, 54, 10.4], [CX, 64, 11], [CX, 73, 13.4]] },
  { id: "belly", system: "metabolism", cols: 13, stations: [[CX, 140, 30.6], [CX, 150, 29.6], [CX, 162, 30], [CX, 174, 31.6], [CX, 186, 33.4], [CX, 198, 34], [CX, 207, 30]] },
  { id: "chest", system: "heart", cols: 13, stations: [[CX, 72, 13], [CX, 76, 22], [CX, 80, 32], [CX, 86, 38.6], [CX, 96, 38], [CX, 106, 36.6], [CX, 118, 34.6], [CX, 130, 32.6], [CX, 140, 30.6]] },
  { id: "head", system: "mind_sleep", cols: 9, stations: [[CX, 10, 2], [CX, 14, 10], [CX, 20, 14.5], [CX, 28, 17.6], [CX, 36, 18.2], [CX, 44, 16.6], [CX, 50, 13], [CX, 55, 8.6], [CX, 58.6, 3]] },
];
const mirrorStations = (s) => s.map(([x, y, w]) => [mx(x), y, w]);
const PARTS = [
  ...TUBES,
  { ...TUBES[0], id: "arm_r", stations: mirrorStations(TUBES[0].stations) },
  { ...TUBES[1], id: "leg_r", stations: mirrorStations(TUBES[1].stations) },
];

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

/** Triangulated tube: rings perpendicular to the centre line, columns crowded at the rim. */
function mesh(part, seed, step) {
  const s = densify(part.stations, step);
  const R = s.map(([x, y, w], i) => {
    const [xa, ya] = s[Math.max(0, i - 1)], [xb, yb] = s[Math.min(s.length - 1, i + 1)];
    const len = Math.hypot(xb - xa, yb - ya) || 1, nx = (yb - ya) / len, ny = -(xb - xa) / len;
    return Array.from({ length: part.cols }, (_, j) => {
      const u = -Math.cos((Math.PI * j) / (part.cols - 1));
      const inner = j > 0 && j < part.cols - 1 && i > 0 && i < s.length - 1;
      const jx = inner ? (rand(seed + i * 31 + j * 7) - 0.5) * 1.4 : 0, jy = inner ? (rand(seed + i * 17 + j * 13) - 0.5) * 1.4 : 0;
      return [x + nx * w * u + jx, y + ny * w * u + jy];
    });
  });
  const p = ([x, y]) => `${f(x)} ${f(y)}`, seen = new Set(), segs = [];
  const add = (a, b) => { const k = [p(a), p(b)].sort().join("|"); if (!seen.has(k)) { seen.add(k); segs.push(`M${p(a)}L${p(b)}`); } };
  R.forEach((ring, i) => ring.forEach((v, j) => {
    if (j < ring.length - 1) add(v, ring[j + 1]);
    if (i < R.length - 1) {
      add(v, R[i + 1][j]);
      if (j < ring.length - 1) (i + j) % 2 ? add(v, R[i + 1][j + 1]) : add(ring[j + 1], R[i + 1][j]);
    }
  }));
  const left = R.map((r) => r[0]), right = R.map((r) => r[r.length - 1]).reverse();
  return { ...part, path: segs.join(""), nodes: R.flat().map((v) => `M${p(v)}h0.01`).join(""), outline: [...left, ...right].map(p).join(" ") };
}
const MESHES = {
  fine: PARTS.map((part, i) => mesh(part, (i + 1) * 101, 6)),
  light: PARTS.map((part, i) => mesh({ ...part, cols: Math.max(5, part.cols - 4) }, (i + 1) * 101, 9)),
};

// ===== Status =====
/** Soft organ glow when a system is away from normal: [cx, cy, rx, ry]. Immune & temperature is
 *  whole-body, so its limbs are tinted instead. */
const ZONE_GLOW = { mind_sleep: [CX, 34, 15, 19], heart: [123, 110, 21, 17], metabolism: [CX, 166, 20, 21] };
/** Status shapes (beside the head, on the chest, on the abdomen, on the left calf). */
const MARKER_AT = { mind_sleep: [166, 26], heart: [121, 111], metabolism: [CX, 168], immune_temp: [113, 302] };

// ===== Component =====
/**
 * Holographic human figure. `systems`: status per body system; `selected`: highlighted system;
 * `onSelect(system)`: tap on a part; `width`: largest rendered width in px (scales down to fit).
 */
export default function PolyBody({ systems, selected = null, onSelect, width = 280, label }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ""); // unique ids if two figures share a page
  const id = (name) => `${name}-${uid}`;
  const url = (name) => `url(#${id(name)})`;
  const meshes = width >= 240 ? MESHES.fine : MESHES.light;
  const k = W / width; // viewBox units per screen pixel: keeps lines about the same on screen
  const off = (system) => systems[system] !== "green";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block mx-auto poly-body overflow-visible"
         style={{ width: "100%", maxWidth: width, height: "auto" }}>
      <defs>
        {/* Halo fades to nothing well inside the drawing, so no edge of it is ever visible. */}
        <radialGradient id={id("halo")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(40 140 255 / 0.42)" />
          <stop offset="0.45" stopColor="rgb(30 100 230 / 0.16)" />
          <stop offset="0.8" stopColor="rgb(30 100 230 / 0.03)" />
          <stop offset="1" stopColor="rgb(30 100 230 / 0)" />
        </radialGradient>
        <radialGradient id={id("skin")} gradientUnits="userSpaceOnUse" cx={CX} cy="150" r="260">
          <stop offset="0" stopColor="#1754c8" />
          <stop offset="0.5" stopColor="#0d3794" />
          <stop offset="1" stopColor="#08205e" />
        </radialGradient>
        <radialGradient id={id("platform")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(90 200 255 / 0.5)" />
          <stop offset="0.6" stopColor="rgb(90 200 255 / 0.1)" />
          <stop offset="1" stopColor="rgb(90 200 255 / 0)" />
        </radialGradient>
        <linearGradient id={id("scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(170 230 255 / 0)" />
          <stop offset="0.85" stopColor="rgb(170 230 255 / 0.16)" />
          <stop offset="1" stopColor="rgb(230 248 255 / 0.45)" />
        </linearGradient>
        <filter id={id("bloom")} x="-40%" y="-20%" width="180%" height="140%">
          <feGaussianBlur stdDeviation={8 * k} />
        </filter>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2.2 * k} />
        </filter>
        <filter id={id("hair")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={0.6 * k} />
        </filter>
        <radialGradient id={id("zone-fade")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.35" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        {Object.entries(ZONE_GLOW).map(([system, [x, y, rx, ry]]) => (
          <mask key={system} id={id(`zone-${system}`)} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <ellipse cx={x} cy={y} rx={rx * 1.7} ry={ry * 1.7} fill={url("zone-fade")} />
          </mask>
        ))}
        <clipPath id={id("body")}><path d={BODY} /></clipPath>
        <clipPath id={id("head")}><path d={HEAD} /></clipPath>
        <clipPath id={id("hands")}>{FINGERS.map((d, i) => <path key={i} d={d} />)}</clipPath>
        <clipPath id={id("all")}><path d={BODY} /><path d={HEAD} />{FINGERS.map((d, i) => <path key={i} d={d} />)}</clipPath>
      </defs>

      {/* Light behind the figure (a soft ellipse, no box) and the lit platform under the feet. */}
      <ellipse cx={CX} cy="200" rx="128" ry="205" fill={url("halo")} />
      <ellipse cx={CX} cy="404" rx="80" ry="10" fill={url("platform")} />
      <ellipse cx={CX} cy="404" rx="56" ry="6.4" fill="none" stroke="rgb(120 210 255 / 0.42)" strokeWidth={0.8 * k} />

      {/* Outer bloom: the whole figure, blurred, glowing into the background. */}
      <g filter={url("bloom")} opacity="0.6" fill="#2f8cff" pointerEvents="none">
        <path d={BODY} /><path d={HEAD} />{FINGERS.map((d, i) => <path key={i} d={d} />)}
      </g>

      {/* Body: fill, then (inside only) rim light, shading, muscle lines and highlights. */}
      <path d={BODY} fill={url("skin")} />
      <g clipPath={url("body")} pointerEvents="none">
        <path d={BODY} fill="none" stroke="#7fd4ff" strokeWidth={9 * k} filter={url("soft")} opacity="0.85" />
        <path d={BODY} fill="none" stroke="#c9f0ff" strokeWidth={1.4 * k} opacity="0.9" />
        <path d={SHADOWS.join("")} fill="none" stroke="#020c2b" strokeWidth={4 * k} strokeLinecap="round" filter={url("soft")} opacity="0.55" />
        <path d={MUSCLES.join("")} fill="none" stroke="#8fdcff" strokeWidth={1.3 * k} strokeLinecap="round" filter={url("hair")} opacity="0.55" />
        <g filter={url("soft")}>
          {SHEEN.filter(([, y]) => y > 60).map(([x, y, rx, ry, o], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#bfeaff" opacity={o} />)}
        </g>
      </g>

      {/* Head: ears, skull, rim light, face. */}
      <g pointerEvents="none">
        {EARS.map((d, i) => <path key={i} d={d} fill={url("skin")} stroke="#9fe0ff" strokeWidth={0.9 * k} strokeOpacity="0.8" />)}
        {EAR_INNER.map((d, i) => <path key={i} d={d} fill="none" stroke="#8fdcff" strokeWidth={0.9 * k} opacity="0.6" />)}
        <path d={HEAD} fill={url("skin")} />
        <g clipPath={url("head")}>
          <path d={HEAD} fill="none" stroke="#7fd4ff" strokeWidth={7 * k} filter={url("soft")} opacity="0.85" />
          <path d={HEAD} fill="none" stroke="#c9f0ff" strokeWidth={1.3 * k} opacity="0.9" />
          {/* Eye sockets and under the nose / lip: soft shadow. */}
          <g filter={url("soft")} fill="#020c2b" opacity="0.65">
            <ellipse cx="122.5" cy="32.6" rx="5.8" ry="3.4" /><ellipse cx={mx(122.5)} cy="32.6" rx="5.8" ry="3.4" />
            <ellipse cx={CX} cy="47.6" rx="4.4" ry="1.4" /><ellipse cx={CX} cy="53.4" rx="4" ry="1.2" />
          </g>
          <g filter={url("soft")}>
            {SHEEN.filter(([, y]) => y <= 60).map(([x, y, rx, ry, o], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#bfeaff" opacity={o} />)}
          </g>
          {EYES.map((d, i) => <path key={i} d={d} fill="#9fdcff" fillOpacity="0.28" stroke="#bfeaff" strokeWidth={0.45 * k} strokeOpacity="0.8" />)}
          {IRISES.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="1.5" fill="#3a9be8" fillOpacity="0.85" />
              <circle cx={x} cy={y} r="0.7" fill="#041438" />
              <circle cx={x + 0.45} cy={y - 0.45} r="0.3" fill="#ffffff" opacity="0.8" />
            </g>
          ))}
          {LIPS.map((d, i) => <path key={i} d={d} fill="#6fc6ff" fillOpacity={i ? 0.45 : 0.35} />)}
          <path d={FACE_LINES.join("")} fill="none" stroke="#a6e4ff" strokeWidth={0.9 * k} strokeLinecap="round" filter={url("hair")} opacity="0.75" />
        </g>
      </g>

      {/* Thumb and fingers with their own rim light and knuckle creases. */}
      <g pointerEvents="none">
        {FINGERS.map((d, i) => <path key={i} d={d} fill={url("skin")} />)}
        <g clipPath={url("hands")}>
          {FINGERS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#9fe0ff" strokeWidth={2.4 * k} filter={url("hair")} opacity="0.8" />
          ))}
          <path d={KNUCKLES} fill="none" stroke="#8fdcff" strokeWidth={0.6 * k} opacity="0.6" />
        </g>
        <path d={FINGER_EDGES} fill="none" stroke="#c9f0ff" strokeWidth={0.5 * k} opacity="0.7" />
      </g>

      {/* Polygonal wire mesh on top, clipped to the figure: faint, brighter where selected or off. */}
      <g clipPath={url("all")} pointerEvents="none">
        {meshes.filter((m) => off(m.system) && ZONE_GLOW[m.system]).map((m) => (
          <path key={`base-${m.id}`} d={m.path} fill="none" stroke="var(--body-wire)" strokeWidth={0.42 * k} strokeOpacity="0.22" />
        ))}
        {meshes.map((m) => {
          const lit = off(m.system) || selected === m.system;
          const colour = off(m.system) ? STATUS_COLOR[systems[m.system]] : "var(--body-wire)";
          const zone = off(m.system) && ZONE_GLOW[m.system];
          const fade = m.id === "head" ? 0.55 : 1; // keep the face readable
          return (
            <g key={m.id} style={{ color: colour }} mask={zone ? url(`zone-${m.system}`) : undefined}>
              {off(m.system) && !ZONE_GLOW[m.system] && <polygon points={m.outline} fill="currentColor" fillOpacity="0.28" />}
              <path d={m.path} fill="none" stroke="currentColor" strokeWidth={(lit ? 0.55 : 0.42) * k} strokeOpacity={(lit ? 0.6 : 0.24) * fade} />
              <path d={m.nodes} fill="none" stroke="currentColor" strokeWidth={(lit ? 1.4 : 1.1) * k} strokeLinecap="round" strokeOpacity={(lit ? 0.8 : 0.36) * fade} />
              {selected === m.system && <polygon points={m.outline} fill="none" stroke="var(--color-ink)" strokeWidth={1.2 * k} strokeOpacity="0.8" />}
            </g>
          );
        })}
        {/* Organ glow in the status colour (head, heart, abdomen) when away from normal. */}
        <g filter={url("bloom")}>
          {Object.entries(ZONE_GLOW).map(([system, [x, y, rx, ry]]) => off(system) && (
            <ellipse key={system} cx={x} cy={y} rx={rx} ry={ry} fill={STATUS_COLOR[systems[system]]} opacity="0.9" />
          ))}
        </g>
        {/* A slow scan line moves down the figure (off when the system asks for reduced motion). */}
        <rect className="poly-body-scan" x="0" y="-60" width={W} height="60" fill={url("scan")} />
      </g>

      {/* Tap areas, one per body part. */}
      {onSelect && meshes.map((m) => (
        <polygon key={m.id} points={m.outline} fill="transparent" style={{ cursor: "pointer" }} onClick={() => onSelect(m.system)} />
      ))}

      {/* Status shapes on the parts that are away from normal (same on-screen size at any width). */}
      {Object.entries(MARKER_AT).map(([system, [x, y]]) => off(system) && (
        <g key={system} pointerEvents="none" transform={`translate(${x} ${y}) scale(${k}) translate(-14 -14)`}>
          <circle cx="14" cy="14" r="18" fill="var(--color-panel)" fillOpacity="0.85" />
          <StatusIcon status={systems[system]} size={28} />
        </g>
      ))}
    </svg>
  );
}
