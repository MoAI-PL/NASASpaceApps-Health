// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Check-in logic shared by the guided and the quick-entry modes: drafts and device storage,
// plausibility checks and the comparison with the personal normal. No UI here.

import { META, fmt, fmtBand } from "./data.js";
import { CHECKIN } from "./content/texts.js";

// ===== Storage (optional: the app works without it) =====
// The demo runs on precomputed model output, so entries do not change the SAI. They are kept on
// this device (localStorage, per crew member and mission day) when the browser allows it.
const storageKey = (record) => `baseline.checkin.${record.astronaut}.${record.day}`;

// Unsaved entries live here while the app is open, per crew member and day, so moving the day,
// switching crew member, mode or screen never throws typed values away.
const drafts = new Map();

function loadSaved(record) {
  try { return JSON.parse(localStorage.getItem(storageKey(record))) ?? {}; } catch { return {}; }
}

/** The unsaved draft for this crew member and day if there is one, else what was saved. */
export function loadEntries(record) {
  return drafts.get(storageKey(record)) ?? loadSaved(record);
}

/** Remember unsaved entries for this crew member and day. */
export function keepDraft(record, entries) {
  drafts.set(storageKey(record), entries);
}

/** True while this crew member and day has entries that are not saved yet. */
export function hasDraft(record) {
  return drafts.has(storageKey(record));
}

/** Save to the device; true on success (the draft is then dropped), false when storage is blocked. */
export function storeEntries(record, entries) {
  try {
    localStorage.setItem(storageKey(record), JSON.stringify(entries));
    drafts.delete(storageKey(record));
    return true;
  } catch {
    return false; // no device storage: the draft stays in memory
  }
}

// ===== Validation =====
/** Message when a value is outside the plausible input range, otherwise null. */
export function problem(f, v) {
  const range = CHECKIN[f].range;
  if (v == null || !range) return null;
  if (!Number.isFinite(v)) return "Enter a number.";
  const [lo, hi] = range;
  return v < lo || v > hi ? `Check the value: expected ${lo}–${hi} ${META.features[f].unit}.` : null;
}

// ===== Critical limits (Respond path, independent of the model) =====
// meta.rules.critical comes from config/rules.yaml via the export (feature, op, value, source or
// null when the value is a team assumption).
const OPS = { gt: (a, b) => a > b, ge: (a, b) => a >= b, lt: (a, b) => a < b, le: (a, b) => a <= b };
const OP_WORD = { gt: "above", ge: "at or above", lt: "below", le: "at or below" };

/** Entries that cross a critical limit: [{ f, value, rule, text }]. Implausible values are ignored. */
export function criticalBreaches(entries) {
  return (META.rules?.critical ?? []).flatMap((rule) => {
    const v = entries[rule.feature];
    if (v == null || problem(rule.feature, v) || !OPS[rule.op]?.(v, rule.value)) return [];
    const unit = META.features[rule.feature].unit;
    return [{ f: rule.feature, value: v, rule,
      text: `${META.features[rule.feature].name} ${fmt(rule.feature, v)} ${unit} — critical limit: ${OP_WORD[rule.op]} ${rule.value} ${unit}` }];
  });
}

// ===== Comparison with the personal normal =====
/** Where a valid entry sits against this crew member's normal band (meta.normal_bands). */
export function versusNormal(record, f, v) {
  const band = META.normal_bands[record.astronaut]?.[f];
  if (v == null || !band) return null;
  const [lo, hi] = band;
  const range = `your normal ${fmtBand(f, lo)}–${fmtBand(f, hi)} ${META.features[f].unit}`;
  if (v < lo) return { status: "yellow", text: `▼ Below your normal (${range})` };
  if (v > hi) return { status: "yellow", text: `▲ Above your normal (${range})` };
  return { status: "green", text: `Within your normal (${range})` };
}
