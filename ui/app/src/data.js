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

/** Consecutive days up to `day` with every indicator recorded (the check-in streak). */
export function checkinStreak(records, day) {
  let streak = 0;
  for (const r of records) {
    if (r.day > day) break;
    streak = r.missing.length === 0 ? streak + 1 : 0;
  }
  return streak;
}
