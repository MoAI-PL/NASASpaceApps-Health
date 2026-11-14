// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Holographic human figure: an athletic male body ("classical statue" proportions) in translucent
// teal, with a realistic male face, a contour-following wire grid on the body and glowing joints.
// Our own geometry, drawn here in plain SVG: no 3D library, no third-party model or image.
//
// Anatomy: about 8.5 head-heights; broad shoulders (≈ 3 head widths), V-taper to a narrow waist,
// muscular arms and legs, thick neck. The WHOLE figure — head, ears, neck, torso, arms, hands,
// legs — is ONE smooth outline through anatomical landmarks (no seams). Volume comes from light:
// rim light, soft shadows and highlights; the face is sculpted the same way and has no grid.
// Layers, back to front: halo → bloom → body → face & hair → wire grid → organ glow → joints →
// scan line → status shapes. Parts take their body system's status (colour + shape, never colour alone).

import { useId } from "react";
import { STATUS_COLOR, StatusIcon } from "./icons.jsx";

// ===== Coordinates (viewBox 0 0 260 410, figure centred on x = 130) =====
const W = 260, H = 410, CX = 130;
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
const mirrorPts = (pts) => pts.map(([x, y, ...r]) => [mx(x), y, ...r]);
const mapPath = (d, fn) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => fn([+x, +y]).map(f).join(" "));
const mirrorPath = (d) => mapPath(d, ([x, y]) => [mx(x), y]);
const both = (list, mirror) => [...list, ...list.map(mirror)];
const mirrorEllipse = ([x, ...r]) => [mx(x), ...r];

// A-pose: the arms hang away from the body; everything on the arm turns about the shoulder.
const PIVOT = [84, 80], TURN = (18 * Math.PI) / 180;
const arm = ([x, y, ...r]) => {
  const dx = x - PIVOT[0], dy = y - PIVOT[1];
  return [PIVOT[0] + dx * Math.cos(TURN) - dy * Math.sin(TURN), PIVOT[1] + dx * Math.sin(TURN) + dy * Math.cos(TURN), ...r];
};
const armPath = (d) => mapPath(d, arm);

// ===== The outline (left half, from the top of the head down to the crotch) =====
const HEAD_SIDE = [
  [130, 8], [122.4, 9.2], [116.6, 12.6], [113.2, 18.6], [112.2, 26],         // skull
  [109.6, 27.6], [108.2, 31.8], [108.6, 37.6], [110.4, 41.8], [112.8, 43],   // ear
  [114.4, 46.6], [117, 50.2], [116.4, 54.6],                                 // jaw angle → neck
];
const NECK_TRAPEZIUS = [[113.6, 58], [106, 63.4], [96, 67.8], [86.4, 72.4]];
const ARM_HAND = [
  [79, 76.6], [74.6, 83], [72.6, 91], [72.4, 100], [73.2, 110],                // deltoid
  [72.6, 118], [72.4, 128], [73.6, 138], [74.8, 146],                          // triceps, elbow
  [73.8, 154], [74, 166], [75.8, 178], [77.6, 189],                            // forearm, wrist
  [76, 194], [74.6, 200], [74.4, 206], [75.6, 209], [77.2, 207], [77.8, 202],  // thumb
  [77.8, 208], [78.2, 215], [79, 221.4], [80.6, 222.2], [81.2, 214.6],         // index
  [81.8, 220], [82.8, 225.2], [84.4, 225.2], [84.8, 215],                      // middle
  [85.6, 223], [87.2, 222.6], [87.8, 213.8],                                   // ring
  [88.4, 218.6], [89.6, 219.2], [90.8, 217.4], [91, 210.6], [91.2, 202], [90.2, 195], [88.6, 189.6], // little, palm
  [89, 180], [90, 168], [91, 157], [91.4, 148],                                // inner forearm, elbow
  [92.6, 138], [93.6, 126], [94, 114], [94.8, 104],                            // inner upper arm (biceps)
].map(arm);
const TORSO_LEG = [
  [97.6, 98],                                                                  // armpit
  [99.2, 106], [100, 116], [101.6, 128], [103.4, 140], [104, 150],             // lats → narrow waist
  [103.6, 160], [102.2, 171], [101, 182], [100.6, 194],                         // obliques, hip
  [100.2, 206], [99.6, 220], [100.6, 236], [102.6, 252], [104.8, 266],          // outer quad sweep
  [106, 276], [106.2, 286], [104.8, 298], [104.6, 310], [106.6, 326],           // knee, calf
  [108.6, 342], [110, 356], [110.6, 366], [109, 374], [105.4, 384],             // shin, ankle, foot
  [106.2, 391], [115, 393.4], [123.2, 390.6], [123.8, 381], [122.2, 370],       // toes, inner ankle
  [122.6, 358], [123.8, 342], [125, 326], [126, 312], [125.4, 298],             // inner calf
  [124.2, 288], [126.2, 272], [126.4, 256], [127, 240], [127.8, 224],           // inner knee, thigh
  [128.6, 212], [130, 204],                                                     // crotch
];
const LEFT = [...HEAD_SIDE, ...NECK_TRAPEZIUS, ...ARM_HAND, ...TORSO_LEG];
const BODY = smooth([...LEFT, ...mirrorPts(LEFT).reverse().slice(1, -1)], true);

// ===== Hair: short, cut close at the sides =====
const HAIR = smooth([
  [112.2, 23], [112.8, 16.4], [116.4, 11.2], [122.4, 7.8], [130, 7], [137.6, 7.8], [143.6, 11.2], [147.2, 16.4], [147.8, 23],
  [146, 21.4], [144.4, 17.4], [139.6, 15.6], [134.4, 15.4], [130, 16], [125.6, 15.4], [120.4, 15.6], [115.6, 17.4], [114, 21.4],
], true);
const HAIR_STRANDS = [
  "M117 16 Q121 11 127 10", "M120 15.4 Q125 11.4 131 10.8", "M125 15.2 Q130 11.6 136 11.4",
  "M130 15.6 Q135 12 140 12.6", "M135 15.2 Q140 12.8 144 14.6", "M114.4 19.6 Q116 14.6 121 12",
].join("");

// ===== Light and shade =====
// Soft shadows: [cx, cy, rx, ry, opacity].
const SHADE = [
  ...both([
    [122.4, 30.4, 5.6, 3.2, 0.7],   // deep-set eye socket under the brow
    [127.2, 36, 1.5, 5.4, 0.45],    // side of the nose
    [127.4, 42.2, 1.3, 1, 0.55],    // nostril
    [118.4, 41.4, 2.8, 4.6, 0.38],  // hollow under the cheekbone
    [121.4, 52.4, 7.4, 2.4, 0.55],  // under the jaw, onto the neck
    [112, 108, 17, 5, 0.5],         // under the pectoral
    [100.6, 118, 3.4, 13, 0.35],    // under the lat / serratus
    [122.8, 127.4, 5.6, 1.4, 0.32], // between abdominal blocks
    [122.8, 141.4, 5.6, 1.4, 0.3],
    [122.6, 155.4, 5.4, 1.4, 0.28],
    [109, 170, 3, 12, 0.3],         // oblique edge
    [121.6, 263, 4, 6, 0.3],        // above the knee
  ], mirrorEllipse),
  [CX, 44, 3.6, 1.2, 0.5],          // under the nose
  [CX, 49.6, 3.4, 1.1, 0.45],       // under the lower lip
  [CX, 120, 1.4, 34, 0.32],         // centre line of the abdomen
  [CX, 218, 3, 14, 0.4],            // between the thighs
];
// Soft highlights: [cx, cy, rx, ry, opacity].
const SHEEN = [
  ...both([
    [122, 26.4, 5.4, 1.7, 0.42],    // brow ridge
    [119.2, 36.8, 3.6, 2.2, 0.4],   // cheekbone
    [118.6, 47.6, 3, 1.8, 0.28],    // jaw
    [113, 88, 15, 9, 0.34],         // pectoral
    [123, 120.6, 5, 5, 0.22],       // abdominal blocks
    [123, 134.6, 5, 5, 0.2],
    [123, 148.6, 4.8, 5, 0.18],
    [110, 230, 8, 22, 0.24],        // quadriceps
    [115.4, 280, 5, 6, 0.24],       // knee
    [107.6, 312, 3.6, 12, 0.22],    // calf
  ], mirrorEllipse),
  ...both([[78.4, 92, 6, 10, 0.36], [81, 124, 4.6, 11, 0.26], [79, 162, 4, 10, 0.22], [83.2, 206, 4.4, 7, 0.18]].map(arm), mirrorEllipse),
  [CX, 19.6, 8.4, 3.4, 0.3],        // forehead
  [CX, 34.8, 1, 5.4, 0.55],         // bridge of the nose
  [CX, 40.6, 2, 1.5, 0.55],         // tip of the nose
  [CX, 48, 2.8, 0.9, 0.32],         // lower lip
  [CX, 52.2, 4.4, 1.8, 0.34],       // square chin
  [CX, 60, 2, 2.4, 0.3],            // Adam's apple
];
// Fine lines: lids, nostrils, lips, ear; muscle edges on the body.
const FACE_LINES = [
  ...both(["M118.8 30.4 Q122.4 28.6 126 30.4", "M119.2 30.8 Q122.4 31.8 125.6 30.8", "M110 32.4 Q109.2 37 111.2 41"], mirrorPath),
  "M126.4 42.6 Q128.2 43.8 130 43.2 Q131.8 43.8 133.6 42.6",
  "M125 46.4 Q130 47.2 135 46.4", "M130 50.8 L130 52.4",
];
const BROWS = both(["M116.6 26.4 Q121.4 23.6 127.4 25.2 L127.2 26.6 Q121.6 25.4 117 27.6Z"], mirrorPath);
const UPPER_LIP = "M124.8 46.2 Q127.6 45 130 45.6 Q132.4 45 135.2 46.2 Q130 46.9 124.8 46.2Z";
const MUSCLES = [
  ...both([
    "M128 70 Q114 66 92 74", "M129.5 104 C122 117 104 116 97 99", "M92 74 Q88 86 94.6 99",
    "M118 120 Q123.6 122.2 129.4 120.6", "M117.8 134 Q123.6 136.2 129.4 134.6", "M118.4 148 Q123.8 150.2 129.4 148.6",
    "M116.6 112 Q113.8 140 118 176", "M104 160 Q114 180 127 196",
    "M102 112 L108 116", "M102.4 120 L108.4 124", "M103 128 L109 131",
    "M113 210 Q112.4 240 114 268", "M124 256 Q126.6 270 119 280", "M103 214 Q104 246 108 270",
    "M108 278 Q114.6 286 121 278", "M106 292 Q103.4 310 108 330", "M124 292 Q127.4 310 122 330",
    "M118 50 Q122 60 127.6 68", "M116 58 Q108 63 97 66",
  ], mirrorPath),
  ...both([armPath("M81.6 104 Q84 120 82.4 140"), armPath("M73.6 104 Q78 108.6 83.4 104"), armPath("M78 152 Q76 168 79 186")], mirrorPath),
  "M130 110 L130 182",
];

// ===== Wire grid (the main visual): rings that wrap around each part + long lines; faint on the face =====
const TUBES = [
  { id: "arm_l", system: "immune_temp", cols: 9, stations: [[84, 76, 8], [82.4, 88, 10.4], [82.6, 100, 11], [83, 112, 10.6], [83, 124, 10.6], [83.4, 136, 9.6], [83.2, 146, 8.8], [82.6, 156, 9], [82.6, 168, 8], [83, 180, 6.4], [83, 190, 5.6], [83.6, 200, 7.6], [84.4, 212, 7.6], [85, 222, 5.6]].map(arm) },
  { id: "leg_l", system: "immune_temp", cols: 10, stations: [[114, 204, 16.5], [114, 220, 15.5], [114.6, 236, 14], [115.4, 252, 12.6], [116, 266, 11], [116, 280, 10], [115.6, 292, 10.6], [115.4, 306, 10.8], [116.4, 322, 9.6], [116.6, 340, 7.6], [116.6, 356, 6.4], [116.4, 366, 6], [114.6, 378, 8.8], [115, 390, 8.6]] },
  { id: "neck", system: "immune_temp", cols: 9, stations: [[CX, 55, 14.6], [CX, 60, 16.4], [CX, 66, 18]] },
  { id: "belly", system: "metabolism", cols: 17, stations: [[CX, 140, 31.5], [CX, 150, 26.6], [CX, 160, 26.8], [CX, 172, 28], [CX, 184, 29.4], [CX, 196, 29.6], [CX, 205, 26]] },
  { id: "chest", system: "heart", cols: 17, stations: [[CX, 62, 14], [CX, 68, 26], [CX, 74, 40], [CX, 82, 48], [CX, 92, 50], [CX, 100, 46], [CX, 112, 40], [CX, 126, 35], [CX, 140, 31.5]] },
  { id: "head", system: "mind_sleep", cols: 13, stations: [[CX, 8, 2], [CX, 12, 10], [CX, 18, 15], [CX, 26, 18], [CX, 34, 18.2], [CX, 42, 17], [CX, 48, 15], [CX, 53, 9], [CX, 55, 4]], faint: true },
];
const PARTS = [
  ...TUBES,
  { ...TUBES[0], id: "arm_r", stations: mirrorPts(TUBES[0].stations) },
  { ...TUBES[1], id: "leg_r", stations: mirrorPts(TUBES[1].stations) },
];

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

/** Grid of one part: rings across (bowed, as seen slightly from above) and long lines along it;
 *  columns crowd towards the rim, as on a round body seen from the front. */
function grid(part, step) {
  const s = densify(part.stations, step);
  const R = s.map(([x, y, w], i) => {
    const [xa, ya] = s[Math.max(0, i - 1)], [xb, yb] = s[Math.min(s.length - 1, i + 1)];
    const len = Math.hypot(xb - xa, yb - ya) || 1, tx = (xb - xa) / len, ty = (yb - ya) / len, nx = ty, ny = -tx;
    return Array.from({ length: part.cols }, (_, j) => {
      const u = -Math.cos((Math.PI * j) / (part.cols - 1)), sag = 0.2 * w * (1 - u * u);
      return [x + nx * w * u + tx * sag, y + ny * w * u + ty * sag];
    });
  });
  const rings = R.map((r) => smooth(r)).join("");
  const longs = R[0].map((_, j) => smooth(R.map((r) => r[j]))).join("");
  const left = R.map((r) => r[0]), right = R.map((r) => r[r.length - 1]).reverse();
  return { ...part, path: part.noGrid ? "" : rings + longs, outline: [...left, ...right].map(([x, y]) => `${f(x)} ${f(y)}`).join(" ") };
}
const GRIDS = { fine: PARTS.map((p) => grid(p, 3.6)), light: PARTS.map((p) => grid({ ...p, cols: Math.max(7, p.cols - 4) }, 5.5)) };

// ===== Joints that glow (left side, mirrored) =====
const JOINTS = both([arm([80, 86]), arm([83.2, 148]), arm([83, 190]), [101, 190], [116, 280], [116.6, 366]], ([x, y]) => [mx(x), y]);

// ===== Status =====
/** Soft organ glow when a system is away from normal: [cx, cy, rx, ry]. Immune & temperature is
 *  whole-body, so its limbs are tinted instead. */
const ZONE_GLOW = { mind_sleep: [CX, 30, 15, 18], heart: [122, 100, 22, 17], metabolism: [CX, 160, 19, 20] };
/** Status shapes (beside the head, on the chest, on the abdomen, on the left calf). */
const MARKER_AT = { mind_sleep: [166, 24], heart: [121, 101], metabolism: [CX, 160], immune_temp: [113, 300] };

// ===== Component =====
/**
 * Holographic human figure. `systems`: status per body system; `selected`: highlighted system;
 * `onSelect(system)`: tap on a part; `width`: largest rendered width in px (scales down to fit).
 */
export default function PolyBody({ systems, selected = null, onSelect, width = 280, label }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ""); // unique ids if two figures share a page
  const id = (name) => `${name}-${uid}`;
  const url = (name) => `url(#${id(name)})`;
  const grids = width >= 240 ? GRIDS.fine : GRIDS.light;
  const k = W / width; // viewBox units per screen pixel: keeps lines about the same on screen
  const off = (system) => systems[system] !== "green";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block mx-auto poly-body overflow-visible"
         style={{ width: "100%", maxWidth: width, height: "auto" }}>
      <defs>
        {/* Halo fades to nothing well inside the drawing, so no edge of it is ever visible. */}
        <radialGradient id={id("halo")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(30 170 230 / 0.38)" />
          <stop offset="0.45" stopColor="rgb(20 120 210 / 0.14)" />
          <stop offset="0.8" stopColor="rgb(20 120 210 / 0.03)" />
          <stop offset="1" stopColor="rgb(20 120 210 / 0)" />
        </radialGradient>
        <radialGradient id={id("skin")} gradientUnits="userSpaceOnUse" cx={CX} cy="140" r="250">
          <stop offset="0" stopColor="rgb(40 170 210 / 0.32)" />
          <stop offset="0.5" stopColor="rgb(20 110 170 / 0.4)" />
          <stop offset="1" stopColor="rgb(10 60 120 / 0.55)" />
        </radialGradient>
        <radialGradient id={id("platform")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(80 220 255 / 0.5)" />
          <stop offset="0.6" stopColor="rgb(80 220 255 / 0.1)" />
          <stop offset="1" stopColor="rgb(80 220 255 / 0)" />
        </radialGradient>
        <radialGradient id={id("joint")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(255 255 255 / 1)" />
          <stop offset="0.25" stopColor="rgb(170 245 255 / 0.85)" />
          <stop offset="1" stopColor="rgb(80 220 255 / 0)" />
        </radialGradient>
        <radialGradient id={id("zone-fade")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.35" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <linearGradient id={id("scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(170 240 255 / 0)" />
          <stop offset="0.85" stopColor="rgb(170 240 255 / 0.16)" />
          <stop offset="1" stopColor="rgb(230 252 255 / 0.45)" />
        </linearGradient>
        <filter id={id("bloom")} x="-40%" y="-20%" width="180%" height="140%"><feGaussianBlur stdDeviation={8 * k} /></filter>
        <filter id={id("soft")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={2 * k} /></filter>
        <filter id={id("hair")} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={0.45 * k} /></filter>
        {Object.entries(ZONE_GLOW).map(([system, [x, y, rx, ry]]) => (
          <mask key={system} id={id(`zone-${system}`)} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <ellipse cx={x} cy={y} rx={rx * 1.7} ry={ry * 1.7} fill={url("zone-fade")} />
          </mask>
        ))}
        <clipPath id={id("body")}><path d={BODY} /></clipPath>
      </defs>

      {/* Light behind the figure (a soft ellipse, no box) and the lit platform under the feet. */}
      <ellipse cx={CX} cy="196" rx="128" ry="200" fill={url("halo")} />
      <ellipse cx={CX} cy="396" rx="80" ry="10" fill={url("platform")} />
      <ellipse cx={CX} cy="396" rx="56" ry="6.4" fill="none" stroke="rgb(120 230 255 / 0.42)" strokeWidth={0.8 * k} />

      {/* Outer bloom: the figure, blurred, glowing into the background. */}
      <path d={BODY} fill="#19b5e0" filter={url("bloom")} opacity="0.5" pointerEvents="none" />

      {/* Body, then inside it only: rim light, shadows, highlights, face, hair and muscle lines. */}
      <path d={BODY} fill={url("skin")} />
      <g clipPath={url("body")} pointerEvents="none">
        <path d={BODY} fill="none" stroke="#6fe6ff" strokeWidth={8 * k} filter={url("soft")} opacity="0.8" />
        <path d={BODY} fill="none" stroke="#d4f8ff" strokeWidth={1.3 * k} opacity="0.95" />
        <g filter={url("soft")} fill="#021630">
          {SHADE.map(([x, y, rx, ry, o], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} opacity={o} />)}
        </g>
        <g filter={url("soft")} fill="#c8f6ff">
          {SHEEN.map(([x, y, rx, ry, o], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} opacity={o} />)}
        </g>
        {/* Face: brows, eyes (dark iris, small catch-light), upper lip, fine lines. */}
        <path d={BROWS.join("")} fill="#a9ecff" opacity="0.5" filter={url("hair")} />
        {[122.4, mx(122.4)].map((x) => (
          <g key={x}>
            <path d={x < CX ? "M118.8 30.4 Q122.4 28.6 126 30.4 Q122.4 31.8 118.8 30.4Z" : mirrorPath("M118.8 30.4 Q122.4 28.6 126 30.4 Q122.4 31.8 118.8 30.4Z")}
                  fill="#c8f6ff" opacity="0.22" />
            <circle cx={x} cy="30.4" r="1.1" fill="#03213d" opacity="0.75" />
            <circle cx={x + 0.4} cy="30" r="0.28" fill="#e6fbff" opacity="0.7" />
          </g>
        ))}
        <path d={UPPER_LIP} fill="#03213d" opacity="0.32" />
        <path d={FACE_LINES.join("")} fill="none" stroke="#bff3ff" strokeWidth={0.75 * k} strokeLinecap="round" filter={url("hair")} opacity="0.55" />
        <path d={HAIR} fill="#0b4f7a" opacity="0.55" />
        <path d={HAIR_STRANDS} fill="none" stroke="#9fe9ff" strokeWidth={0.6 * k} opacity="0.45" />
        <path d={MUSCLES.join("")} fill="none" stroke="#9aeeff" strokeWidth={1.1 * k} strokeLinecap="round" filter={url("hair")} opacity="0.36" />
      </g>

      {/* Wire grid on the body (not on the face), clipped to the figure; status colour around an organ. */}
      <g clipPath={url("body")} pointerEvents="none">
        {grids.filter((g) => off(g.system) && ZONE_GLOW[g.system] && g.path).map((g) => (
          <path key={`base-${g.id}`} d={g.path} fill="none" stroke="var(--body-wire)" strokeWidth={0.4 * k} strokeOpacity="0.34" />
        ))}
        {grids.map((g) => {
          const lit = off(g.system) || selected === g.system, zone = off(g.system) && ZONE_GLOW[g.system];
          const colour = off(g.system) ? STATUS_COLOR[systems[g.system]] : "var(--body-wire)";
          return (
            <g key={g.id} style={{ color: colour }} mask={zone ? url(`zone-${g.system}`) : undefined}>
              {off(g.system) && !zone && <polygon points={g.outline} fill="currentColor" fillOpacity="0.26" />}
              {g.path && <path d={g.path} fill="none" stroke="currentColor" strokeWidth={(lit ? 0.5 : 0.38) * k}
                                strokeOpacity={(lit ? 0.85 : 0.62) * (g.faint ? 0.4 : 1)} />}
              {selected === g.system && <polygon points={g.outline} fill="none" stroke="var(--color-ink)" strokeWidth={1.2 * k} strokeOpacity="0.8" />}
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

      {/* Glowing joints: shoulders, elbows, wrists, hips, knees, ankles. */}
      <g pointerEvents="none">
        {JOINTS.map(([x, y], i) => (
          <circle key={i} className="poly-body-joint" style={{ animationDelay: `${(i % 6) * 0.4}s` }}
                  cx={x} cy={y} r={5.5} fill={url("joint")} />
        ))}
      </g>

      {/* Tap areas, one per body part. */}
      {onSelect && grids.map((g) => (
        <polygon key={g.id} points={g.outline} fill="transparent" style={{ cursor: "pointer" }} onClick={() => onSelect(g.system)} />
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
