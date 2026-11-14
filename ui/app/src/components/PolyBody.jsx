// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Holographic human figure: a translucent teal body with a sculpted face, a contour-following
// wire grid and glowing joints. Our own geometry, drawn here in plain SVG: no 3D library, no
// third-party model or image.
//
// Anatomy: about eight head-heights, relaxed standing pose, arms slightly away from the body.
// The WHOLE figure — head, ears, neck, torso, arms, hands with fingers, legs — is ONE smooth
// outline through anatomical landmarks, so there is no seam at the neck, shoulders or wrists.
// Volume comes from light: rim light along the outline, soft shadows and highlights (the face is
// sculpted the same way) and a grid of rings and long lines that wraps around each part.
// Layers, back to front: halo → bloom → body → face → wire grid → organ glow → joints → scan line
// → status shapes. Parts take their body system's status (colour + status shape, never colour alone).

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
const mirrorPts = (pts) => pts.map(([x, y, ...r]) => [mx(x), y, ...r]);
const mapPath = (d, fn) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => fn([+x, +y]).map(f).join(" "));
const mirrorPath = (d) => mapPath(d, ([x, y]) => [mx(x), y]);

// Arms hang slightly away from the body: everything on the arm turns about the shoulder.
const PIVOT = [86, 88], TURN = (9 * Math.PI) / 180;
const arm = ([x, y, ...r]) => {
  const dx = x - PIVOT[0], dy = y - PIVOT[1];
  return [PIVOT[0] + dx * Math.cos(TURN) - dy * Math.sin(TURN), PIVOT[1] + dx * Math.sin(TURN) + dy * Math.cos(TURN), ...r];
};
const armPath = (d) => mapPath(d, arm);

// ===== The outline (left half, from the top of the head down to the crotch) =====
const HEAD_SIDE = [
  [130, 9.5], [122, 11], [115.6, 15.2], [112.4, 22], [111.5, 29.4],          // skull
  [108.9, 30.4], [107.5, 34.4], [108.1, 40], [110.1, 44.4], [112.7, 46.2],   // ear
  [114.4, 50.2], [118.4, 55.2],                                              // jaw angle → neck
];
const NECK_TRAPEZIUS = [[119.6, 62.5], [117.4, 71], [109, 75.5], [98, 79.5], [89, 82.6]];
const ARM_HAND = [
  [82.5, 86.5], [78.2, 93.5], [76.3, 103], [75.4, 115], [75.6, 128], [75.1, 142], [74, 155], // shoulder, upper arm
  [72.4, 166], [72, 179], [73.4, 192], [74.6, 202.5],                                        // forearm, wrist
  [72.8, 208.4], [70.8, 214.2], [69.7, 220.2], [69.9, 224.2], [71.7, 224.9], [73.1, 221.2],  // thumb
  [73.3, 227.4], [73.6, 234.6], [74.5, 239.8], [76.2, 240.4], [76.9, 232],                   // index
  [77.5, 237.2], [78.5, 242.8], [80.2, 243.1], [80.8, 232.4],                                // middle
  [81.6, 241], [83.3, 241], [84, 231.4],                                                     // ring
  [84.6, 236.4], [85.8, 237.6], [87.2, 236], [87.7, 228], [88, 219], [87.1, 211.5], [84.8, 204], // little, palm
  [85.2, 192], [86.2, 178], [87.2, 166], [88.2, 156], [89.4, 143], [89.9, 129], [90.4, 117], [91.6, 107.5], // inner arm
].map(arm);
const TORSO_LEG = [
  [94, 103.5],                                                            // armpit
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
const LEFT = [...HEAD_SIDE, ...NECK_TRAPEZIUS, ...ARM_HAND, ...TORSO_LEG];
const BODY = smooth([...LEFT, ...mirrorPts(LEFT).reverse().slice(1, -1)], true);

// ===== Light and shade (left half where symmetric, then mirrored) =====
const both = (list, mirror) => [...list, ...list.map(mirror)];
const mirrorEllipse = ([x, ...r]) => [mx(x), ...r];
// Soft shadows: [cx, cy, rx, ry, opacity].
const SHADE = [
  ...both([
    [122.4, 33, 6.2, 3.8, 0.6],     // eye socket
    [126.6, 39.6, 1.6, 5.4, 0.45],  // side of the nose
    [126.8, 44.6, 1.6, 1.4, 0.45],  // nose wing
    [118.6, 47.6, 3, 4.2, 0.3],     // under the cheekbone
    [121.6, 58.4, 6, 2.4, 0.45],    // under the jaw, onto the neck
    [114, 113, 13, 4, 0.35],        // under the pectoral
    [97, 115, 3, 12, 0.3],          // side of the chest
  ], mirrorEllipse),
  [CX, 46.8, 3.8, 1.3, 0.55],       // under the nose
  [CX, 53.6, 3.6, 1.2, 0.45],       // under the lower lip
  [CX, 222, 3, 16, 0.4],            // between the thighs
];
// Soft highlights: [cx, cy, rx, ry, opacity].
const SHEEN = [
  ...both([
    [122.4, 28.6, 5.4, 1.8, 0.4],   // brow ridge
    [119.4, 40.2, 3.8, 2.4, 0.38],  // cheekbone
    [114, 97, 12, 7, 0.3],          // pectoral
    [123.6, 139, 4, 14, 0.15],      // abdominals
    [110, 236, 7, 22, 0.22],        // thigh
    [113, 286, 5, 6, 0.22],         // knee
    [106, 318, 3, 11, 0.18],        // calf
  ], mirrorEllipse),
  ...both([[81.6, 96, 5, 9, 0.32], [81.6, 126, 3.4, 9, 0.22], [77.4, 178, 3, 10, 0.2], [79.6, 220, 4.4, 7, 0.2]].map(arm), mirrorEllipse),
  [CX, 18.5, 9, 5, 0.32],           // forehead
  [CX, 37.6, 1.1, 5.6, 0.6],        // bridge of the nose
  [CX, 43.6, 2, 1.5, 0.5],          // tip of the nose
  [CX, 51.6, 2.6, 1, 0.3],          // lower lip
  [CX, 56.2, 3.6, 2, 0.32],         // chin
  [CX, 65, 2, 2.6, 0.2],            // throat
];
// Fine lines: brows, eyelids, nostrils, lips; muscle edges on the body.
const FACE_LINES = [
  ...both(["M117.4 28.6 Q121.6 26.2 127 28", "M118.4 33 Q122.5 30.6 126.6 33", "M118.8 33.4 Q122.5 35 126.2 33.4"], mirrorPath),
  "M126.4 45.4 Q128.2 46.8 130 46 Q131.8 46.8 133.6 45.4",
  "M125.4 50.4 Q127.8 49 130 49.6 Q132.2 49 134.6 50.4", "M125.6 50.6 Q130 51.6 134.4 50.6",
];
const MUSCLES = [
  ...both([
    "M127 76 Q115 72.6 99 79.6", "M129 106 C121 118 104.6 119 95.6 104", "M99 82 Q91.6 91.6 93.2 103.4",
    "M117.6 124.4 Q123.4 126.6 129.4 124.8", "M117.4 138.4 Q123.4 140.6 129.4 138.8", "M118 152.4 Q123.6 154.6 129.4 152.8",
    "M115.6 116 Q111.8 146 116.6 180", "M104 158 Q113.6 183 127 200", "M104.6 212 Q109.4 241 113 272",
    "M107.4 285 Q113.4 293 120 285", "M106 301 Q102.6 318 107.6 341", "M123.8 301 Q126 318 122.4 337",
    "M121.6 56.4 Q124.6 66 127.8 74",
  ], mirrorPath),
  ...both([armPath("M84.4 110 Q86.6 127 85.2 146"), armPath("M79 162 Q76.6 178 78.6 197")], mirrorPath),
  "M130 82 L130 110", "M130 114 L130 186",
];

// ===== Wire grid: rings that wrap around each part + long lines, clipped to the outline =====
const TUBES = [
  { id: "arm_l", system: "immune_temp", cols: 6, stations: [[88, 86, 7], [85, 96, 8], [83.5, 104, 7.6], [82.5, 116, 7.6], [82.8, 130, 7.4], [82.3, 144, 7.4], [81, 156, 7.1], [80, 166, 7.4], [79, 178, 7.2], [79.2, 192, 6.1], [79.5, 204, 5.6], [79.6, 216, 9], [79.8, 230, 7.6], [80.2, 242, 6]].map(arm) },
  { id: "leg_l", system: "immune_temp", cols: 7, stations: [[112, 206, 16.5], [112.3, 224, 15.4], [112.8, 240, 13.9], [113, 258, 12.2], [113.5, 274, 10.7], [114, 288, 10.2], [114.3, 300, 10.4], [113.6, 314, 10.8], [115, 330, 10.2], [115.6, 348, 8.7], [116, 364, 7.2], [116.2, 376, 6.2], [114.6, 388, 9.6], [115, 398, 9]] },
  { id: "neck", system: "immune_temp", cols: 7, stations: [[CX, 54, 11], [CX, 64, 11], [CX, 73, 13.4]] },
  { id: "belly", system: "metabolism", cols: 11, stations: [[CX, 140, 30.6], [CX, 150, 29.6], [CX, 162, 30], [CX, 174, 31.6], [CX, 186, 33.4], [CX, 198, 34], [CX, 207, 30]] },
  { id: "chest", system: "heart", cols: 11, stations: [[CX, 72, 13], [CX, 76, 22], [CX, 80, 32], [CX, 86, 38.6], [CX, 96, 38], [CX, 106, 36.6], [CX, 118, 34.6], [CX, 130, 32.6], [CX, 140, 30.6]] },
  { id: "head", system: "mind_sleep", cols: 9, stations: [[CX, 10, 2], [CX, 14, 10], [CX, 20, 14.5], [CX, 28, 17.6], [CX, 36, 18.2], [CX, 44, 16.6], [CX, 50, 13], [CX, 55, 8.6], [CX, 58.6, 3]] },
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
  return { ...part, path: rings + longs, outline: [...left, ...right].map(([x, y]) => `${f(x)} ${f(y)}`).join(" ") };
}
const GRIDS = { fine: PARTS.map((p) => grid(p, 5)), light: PARTS.map((p) => grid({ ...p, cols: Math.max(5, p.cols - 2) }, 8)) };

// ===== Joints that glow (left side, mirrored) =====
const JOINTS = both([arm([84, 92]), arm([81.4, 156]), arm([80, 204]), [100, 196], [113.6, 288], [116.4, 376]], ([x, y]) => [mx(x), y]);

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
        {/* Translucent teal body: lighter in the middle, the halo shows through. */}
        <radialGradient id={id("skin")} gradientUnits="userSpaceOnUse" cx={CX} cy="150" r="260">
          <stop offset="0" stopColor="rgb(40 170 210 / 0.5)" />
          <stop offset="0.5" stopColor="rgb(20 110 170 / 0.58)" />
          <stop offset="1" stopColor="rgb(10 60 120 / 0.7)" />
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
        <filter id={id("soft")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={2.2 * k} /></filter>
        <filter id={id("hair")} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={0.5 * k} /></filter>
        {Object.entries(ZONE_GLOW).map(([system, [x, y, rx, ry]]) => (
          <mask key={system} id={id(`zone-${system}`)} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <ellipse cx={x} cy={y} rx={rx * 1.7} ry={ry * 1.7} fill={url("zone-fade")} />
          </mask>
        ))}
        <clipPath id={id("body")}><path d={BODY} /></clipPath>
      </defs>

      {/* Light behind the figure (a soft ellipse, no box) and the lit platform under the feet. */}
      <ellipse cx={CX} cy="200" rx="128" ry="205" fill={url("halo")} />
      <ellipse cx={CX} cy="404" rx="80" ry="10" fill={url("platform")} />
      <ellipse cx={CX} cy="404" rx="56" ry="6.4" fill="none" stroke="rgb(120 230 255 / 0.42)" strokeWidth={0.8 * k} />

      {/* Outer bloom: the figure, blurred, glowing into the background. */}
      <path d={BODY} fill="#19b5e0" filter={url("bloom")} opacity="0.5" pointerEvents="none" />

      {/* Body, then inside it only: rim light, shadows, highlights, face and muscle lines. */}
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
        {/* Eyes: soft, not drawn on — a faint eyeball and iris under the lids. */}
        {[122.5, mx(122.5)].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="33.1" rx="3.5" ry="1.4" fill="#bff3ff" opacity="0.12" />
            <circle cx={x} cy="33.2" r="1.25" fill="#06294a" opacity="0.55" filter={url("hair")} />
            <circle cx={x + 0.5} cy="32.7" r="0.35" fill="#e6fbff" opacity="0.6" />
          </g>
        ))}
        <path d={FACE_LINES.join("")} fill="none" stroke="#bff3ff" strokeWidth={0.8 * k} strokeLinecap="round" filter={url("hair")} opacity="0.55" />
        <path d={MUSCLES.join("")} fill="none" stroke="#9aeeff" strokeWidth={1.1 * k} strokeLinecap="round" filter={url("hair")} opacity="0.32" />
      </g>

      {/* Wire grid on top, clipped to the figure; status colour around an organ that is off. */}
      <g clipPath={url("body")} pointerEvents="none">
        {grids.filter((g) => off(g.system) && ZONE_GLOW[g.system]).map((g) => (
          <path key={`base-${g.id}`} d={g.path} fill="none" stroke="var(--body-wire)" strokeWidth={0.4 * k} strokeOpacity="0.38" />
        ))}
        {grids.map((g) => {
          const lit = off(g.system) || selected === g.system, zone = off(g.system) && ZONE_GLOW[g.system];
          const colour = off(g.system) ? STATUS_COLOR[systems[g.system]] : "var(--body-wire)";
          return (
            <g key={g.id} style={{ color: colour }} mask={zone ? url(`zone-${g.system}`) : undefined}>
              {off(g.system) && !zone && <polygon points={g.outline} fill="currentColor" fillOpacity="0.26" />}
              <path d={g.path} fill="none" stroke="currentColor" strokeWidth={(lit ? 0.55 : 0.4) * k}
                    strokeOpacity={(lit ? 0.75 : 0.42) * (g.id === "head" ? 0.75 : 1)} />
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
