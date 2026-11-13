// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// All crew-facing text lives here, so it can be reviewed and sourced in one place.
// Rules (CLAUDE.md, PLAN.md UI brief): short English labels; every medical instruction cites a
// source from SOURCES (by id). Any string starting with "TODO(UI)" is shown as a visible gap.

// ===== Sources (every medical text points to one of these ids) =====
export const SOURCES = {
  hrp_hazards: { title: "NASA Human Research Program — 5 Hazards of Human Spaceflight", url: "https://www.nasa.gov/hrp/hazards/" },
  hrp_risks: { title: "NASA Human Research Program — Risks of Human Spaceflight", url: "https://www.nasa.gov/hrp/risks/" },
  // TODO(UI): add every page you quote for prompts, check-in cards, systems and emergency steps.
};

// ===== Status vocabulary: colour + shape + word, never colour alone =====
export const STATUS_LABEL = { green: "Nominal", yellow: "Watch", orange: "Act", red: "Critical", info: "Info" };

// ===== Escalation ladder (ids from the contract) =====
export const ESCALATION_TEXT = {
  monitor: "Keep the daily routine",
  self_care: "Self-care actions",
  crew_medical_officer: "Inform the crew medical officer",
  flight_surgeon: "Emergency: onboard protocol + flight surgeons",
};

// ===== Events (ids from the contract) =====
export const EVENT_TEXT = {
  sep_event: { title: "Solar particle event", body: "Radiation is higher today. TODO(UI): shelter guidance with source." },
  co2_high: { title: "Cabin CO₂ above limit", body: "TODO(UI): what to do about high CO₂, with source." },
  possible_sensor_fault: { title: "Possible sensor fault", body: "One reading is far from your normal while the others are not. Re-measure before acting." },
};

// ===== Prompts: the model asks for a follow-up measurement (ids from the contract) =====
export const PROMPTS = {
  repeat_bp_hr_rest: {
    title: "Re-measure blood pressure and resting heart rate",
    how: "TODO(UI): how to measure (rest 5 min, seated, cuff position…).",
    why: "TODO(UI): why it matters in space (fluid shift, deconditioning).",
    ifAbnormal: "TODO(UI): what to do if still off your normal.",
    source: "hrp_risks",
  },
  repeat_glucose_fasting: {
    title: "Re-measure fasting blood glucose",
    how: "TODO(UI)", why: "TODO(UI)", ifAbnormal: "TODO(UI)", source: "hrp_risks",
  },
  reaction_test_mood_checkin: {
    title: "Do the reaction test and mood check-in",
    how: "TODO(UI)", why: "TODO(UI)", ifAbnormal: "TODO(UI)", source: "hrp_hazards",
  },
  repeat_temperature_evening: {
    title: "Re-measure body temperature this evening",
    how: "TODO(UI)", why: "TODO(UI)", ifAbnormal: "TODO(UI)", source: "hrp_risks",
  },
};

// ===== Check-in cards: one per indicator (ids from meta.features) =====
const todoCard = { how: "TODO(UI)", why: "TODO(UI)", ifAbnormal: "TODO(UI)", source: "hrp_risks" };
export const CHECKIN = {
  sys: { ...todoCard, step: 1 },
  dia: { ...todoCard, step: 1 },
  hr: { ...todoCard, step: 1 },
  glucose: { ...todoCard, step: 1 },
  temp: { ...todoCard, step: 0.1 },
  sleep_h: { ...todoCard, step: 0.1 },
  mood: { ...todoCard, step: 1, scale: [1, 2, 3, 4, 5] },
  reaction_ms: { ...todoCard, step: 1 },
};

// ===== Body systems: why each matters in space (ids from meta.systems) =====
export const SYSTEM_TEXT = {
  heart: { whyInSpace: "TODO(UI): fluid shift and cardiovascular deconditioning in weightlessness.", source: "hrp_hazards" },
  metabolism: { whyInSpace: "TODO(UI)", source: "hrp_risks" },
  mind_sleep: { whyInSpace: "TODO(UI): isolation, confinement and disrupted sleep.", source: "hrp_hazards" },
  immune_temp: { whyInSpace: "TODO(UI): closed environment and immune changes.", source: "hrp_hazards" },
};

// ===== Emergency (Respond path; works without the model) =====
export const EMERGENCIES = {
  chest_pain: {
    title: "Chest pain",
    steps: [
      "Call the crew medical officer and stay with the crew member.",
      "Measure heart rate, blood pressure and temperature now.",
      "Follow the onboard emergency checklist for this symptom.",
      "Send an urgent report to flight surgeons.",
    ],
    draft: true, // TODO(UI): replace with a protocol written from cited sources, then set false.
    source: null,
  },
  unconscious: {
    title: "Crew member unresponsive",
    steps: ["TODO(UI): steps from a cited source."],
    draft: true,
    source: null,
  },
  breathing: {
    title: "Difficulty breathing",
    steps: ["TODO(UI): steps from a cited source."],
    draft: true,
    source: null,
  },
};
