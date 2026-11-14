// Astrobalance — NASA Space Apps Challenge 2026
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
  // navigation (screens)
  nav_today: <g fill="none" strokeWidth="2.5" strokeLinecap="round"><path d="M5 23 A11 11 0 0 1 27 23" /><path d="M16 23 L22 14" /><circle cx="16" cy="23" r="2" fill="currentColor" /></g>,
  nav_checkin: <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="5" width="18" height="23" rx="3" /><path d="M12 5 V3 H20 V5" /><path d="M11.5 17 L15 20.5 L21 13.5" /></g>,
  nav_body: <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="7" r="3.5" /><path d="M8 13.5 H24" /><path d="M16 13.5 V21" /><path d="M16 21 L11 29 M16 21 L21 29" /></g>,
  nav_trends: <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 27 H28" /><path d="M6 21 L12 14 L17 18 L26 7" /><circle cx="26" cy="7" r="1.5" fill="currentColor" /></g>,
  nav_earth: <g fill="none" strokeWidth="2.5" strokeLinecap="round"><circle cx="13" cy="19" r="9" /><path d="M4 19 H22 M13 10 C9 14 9 24 13 28 C17 24 17 14 13 10" /><path d="M21 4 A8 8 0 0 1 28 11" /><path d="M21 8.5 A4 4 0 0 1 24 11.5" /></g>,
  nav_how: <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 H20" /><path d="M13 4 V13 L6 26 A2 2 0 0 0 8 29 H24 A2 2 0 0 0 26 26 L19 13 V4" /><path d="M9 21 H23" /></g>,
  nav_settings: <g fill="none" strokeWidth="2.5" strokeLinecap="round"><path d="M5 9 H27 M5 16 H27 M5 23 H27" /><circle cx="11" cy="9" r="3" fill="var(--color-panel)" /><circle cx="21" cy="16" r="3" fill="var(--color-panel)" /><circle cx="13" cy="23" r="3" fill="var(--color-panel)" /></g>,
  nav_help: <g fill="none" strokeWidth="2.5" strokeLinecap="round"><circle cx="16" cy="16" r="12" /><path d="M12.5 12.5 A3.5 3.5 0 1 1 17 15.8 C16.2 16.2 16 16.8 16 18" /><circle cx="16" cy="22.5" r="1.4" fill="currentColor" stroke="none" /></g>,
  // brand mark: the index arc
  logo: <g fill="none" strokeLinecap="round"><path d="M6 22 A10 10 0 0 1 26 22" strokeWidth="4" stroke="var(--color-model)" /><circle cx="16" cy="22" r="3" fill="currentColor" stroke="none" /></g>,
};

export function Glyph({ name, size = 32, className = "text-ink" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" stroke="currentColor"
         className={`shrink-0 ${className}`} aria-hidden="true">
      {GLYPHS[name]}
    </svg>
  );
}
