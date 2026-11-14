// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// The ONLY place the UI touches ML output. Files come from outputs/ui/ (contract:
// schemas/day_record.schema.json). They are bundled at build time, so the app works offline.
// Switch DAY_RECORDS to "@data/sample.json" to work against the hand-made sample instead.

import DAY_RECORDS from "@data/demo_crew.json";
import META from "@data/meta.json";

// ===== Earth reports (queued for downlink) =====
const reportModules = import.meta.glob("@data/earth_reports/*.json", { eager: true, import: "default" });
export const EARTH_REPORTS = Object.values(reportModules).sort(
  (a, b) => a.astronaut.localeCompare(b.astronaut) || a.day - b.day
);

export { META };

// ===== Lookups =====
const byAstronaut = new Map();
for (const r of DAY_RECORDS) {
  if (!byAstronaut.has(r.astronaut)) byAstronaut.set(r.astronaut, []);
  byAstronaut.get(r.astronaut).push(r);
}
for (const list of byAstronaut.values()) list.sort((a, b) => a.day - b.day);

/** All day records of one crew member, sorted by mission day. */
export function recordsFor(astronaut) {
  return byAstronaut.get(astronaut) ?? [];
}

// ===== Number formatting =====
// Display precision per value id (default: whole numbers). The JSON keeps full precision;
// rounding happens only on screen, so comparisons with the normal band stay exact.
const DECIMALS = { temp: 1, sleep_h: 1, radiation_mGy: 2, radiation_cum_mGy: 1, cabin_co2_mmHg: 1 };

/** Value rounded for display (string), or null when missing. */
export function fmt(id, value) {
  return value == null ? null : Number(value).toFixed(DECIMALS[id] ?? 0);
}

/** Longest round trip of a message to Earth and back for an environment, as short text
 *  (2 × the maximum one-way delay in meta.environments; signal travel only, no reply time). */
export function roundTripText(env) {
  const s = 2 * (META.environments[env]?.one_way_delay_s?.[1] ?? 0);
  if (s < 2) return "a few seconds or less";
  return s < 120 ? `up to ~${Math.round(s)} s` : `up to ~${Math.round(s / 60)} min`;
}

/** Indicator ids the crew measures (exercise is context, not a health indicator). */
export const INDICATORS = Object.keys(META.features).filter((f) => f !== "exercise_min");

/** First day of the current run of non-green statuses for a system, or null if green today. */
export function offNormalSince(records, day, system) {
  let since = null;
  for (const r of records) {
    if (r.day > day) break;
    since = r.systems[system] === "green" ? null : since ?? r.day;
  }
  return since;
}

/** Direction an indicator moved over the last 7 days (+1 higher, −1 lower, 0 unknown).
 *  Mirrors the model's summary: weighted mean (weights 1…7, latest heaviest) of the deviation
 *  from the personal band centre; missing days are skipped. */
export function recentDirection(records, astronaut, day, f) {
  const band = META.normal_bands[astronaut]?.[f];
  if (!band) return 0;
  const mid = (band[0] + band[1]) / 2;
  let sum = 0;
  for (const r of records) {
    const w = r.day - (day - 7);
    if (w < 1 || w > 7 || r.values[f] == null) continue;
    sum += w * (r.values[f] - mid);
  }
  return Math.sign(sum);
}

/** Consecutive days up to `day` with every indicator recorded (the check-in streak). */
export function checkinStreak(records, day) {
  let streak = 0;
  for (const r of records) {
    if (r.day > day) break;
    streak = r.missing.length === 0 ? streak + 1 : 0;
  }
  return streak;
}
