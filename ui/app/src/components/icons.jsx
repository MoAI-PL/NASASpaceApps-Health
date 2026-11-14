// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Own SVG icons only (no third-party assets). Status = colour + shape + glyph + word.

import { STATUS_LABEL } from "../content/texts.js";

// ===== Status icon: circle / triangle / diamond / octagon / square =====
export const STATUS_COLOR = {
  green: "var(--color-good)",
  yellow: "var(--color-warning)",
  orange: "var(--color-serious)",
  red: "var(--color-critical)",
  info: "var(--color-ink-2)",
};
const SHAPE = { green: "circle", yellow: "triangle", orange: "diamond", red: "octagon", info: "square" };
const GLYPH = { circle: "✓", triangle: "!", diamond: "!!", octagon: "✕", square: "i" };

export function StatusIcon({ status, size = 28 }) {
  const key = SHAPE[status] ? status : "info";
  const shape = SHAPE[key], color = STATUS_COLOR[key], h = size / 2, a = size * 0.29;
  const body = {
    circle: <circle cx={h} cy={h} r={h - 1} fill={color} />,
    triangle: <polygon points={`${h},1 ${size - 1},${size - 2} 1,${size - 2}`} fill={color} />,
    diamond: <polygon points={`${h},1 ${size - 1},${h} ${h},${size - 1} 1,${h}`} fill={color} />,
    octagon: <polygon points={`${a},1 ${size - a},1 ${size - 1},${a} ${size - 1},${size - a} ${size - a},${size - 1} ${a},${size - 1} 1,${size - a} 1,${a}`} fill={color} />,
    square: <rect x="1" y="1" width={size - 2} height={size - 2} rx="4" fill={color} />,
  }[shape];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={STATUS_LABEL[key]} className="shrink-0">
      {body}
      <text x={h} y={shape === "triangle" ? h + size * 0.2 : h + size * 0.17} textAnchor="middle" fontSize={size * 0.45}
            fontWeight="700" fill={key === "red" ? "#ffffff" : "var(--color-on-status)"}>{GLYPH[shape]}</text>
    </svg>
  );
}

export function StatusChip({ status }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel-2 text-base">
      <StatusIcon status={status} size={22} /> {STATUS_LABEL[status] ?? STATUS_LABEL.info}
    </span>
  );
}

// ===== Hazard and system icons (32 × 32, currentColor) =====
const GLYPHS = {
  // hazards
  radiation: <g><circle cx="16" cy="16" r="3" /><path d="M16 13 L10 3 A14 14 0 0 1 22 3 Z" /><path d="M18.6 17.5 L29 22 A14 14 0 0 1 23 29 Z" /><path d="M13.4 17.5 L9 29 A14 14 0 0 1 3 22 Z" /></g>,
  isolation: <g fill="none" strokeWidth="2.5"><rect x="3" y="3" width="26" height="26" rx="3" /><circle cx="16" cy="12" r="4" /><path d="M9 25 C9 19 23 19 23 25" /></g>,
  distance: <g fill="none" strokeWidth="2.5"><circle cx="7" cy="16" r="5" /><circle cx="27" cy="16" r="2.5" /><path d="M14 16 H22" strokeDasharray="2 3" /></g>,
  gravity: <g fill="none" strokeWidth="2.5"><path d="M16 4 V26" /><path d="M9 19 L16 26 L23 19" /><path d="M5 29 H27" /></g>,
  closed_environment: <g fill="none" strokeWidth="2.5"><path d="M6 26 V12 A10 10 0 0 1 26 12 V26 Z" /><text x="16" y="22" fontSize="8" textAnchor="middle" stroke="none" fill="currentColor">CO₂</text></g>,
  // body systems
  heart: <path d="M16 27 C6 20 3 14 3 10 A6.5 6.5 0 0 1 16 8 A6.5 6.5 0 0 1 29 10 C29 14 26 20 16 27 Z" strokeWidth="0" />,
  metabolism: <path d="M16 3 C11 11 7 16 7 20 A9 9 0 0 0 25 20 C25 16 21 11 16 3 Z" strokeWidth="0" />,
  mind_sleep: <path d="M20 4 A12 12 0 1 0 28 21 A10 10 0 0 1 20 4 Z" strokeWidth="0" />,
  immune_temp: <g fill="none" strokeWidth="2.5"><path d="M13 19 V6 A3 3 0 0 1 19 6 V19" /><circle cx="16" cy="23" r="5" /><path d="M16 23 V11" /></g>,
};

export function Glyph({ name, size = 32, className = "text-ink" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" stroke="currentColor"
         className={`shrink-0 ${className}`} aria-hidden="true">
      {GLYPHS[name]}
    </svg>
  );
}
