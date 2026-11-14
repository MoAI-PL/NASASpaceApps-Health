// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// All crew-facing text lives here, so it can be reviewed and sourced in one place.
// Rules (CLAUDE.md, PLAN.md UI brief): short English labels; every medical instruction cites a
// source from SOURCES (by id). Any string starting with "TODO(UI)" is shown as a visible gap.

// ===== Sources (every medical text points to one of these ids) =====
// Texts are paraphrased (never copied) from these pages; each page was opened and checked on
// 2026-11-14. Third-party pages are linked, not redistributed.
export const SOURCES = {
  hrp_hazards: { title: "NASA Human Research Program — 5 Hazards of Human Spaceflight", url: "https://www.nasa.gov/hrp/hazards/" },
  hrp_risks: { title: "NASA Human Research Program — Risks of Human Spaceflight", url: "https://www.nasa.gov/hrp/risks/" },
  hrp_distance: { title: "NASA HRP — Hazard: Distance from Earth", url: "https://www.nasa.gov/hrp/hazard-distance-from-earth/" },
  aha_bp_home: { title: "American Heart Association — Home Blood Pressure Monitoring", url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home" },
  aha_heart_attack: { title: "American Heart Association — Warning Signs of a Heart Attack", url: "https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack" },
  mlp_cpr: { title: "MedlinePlus (U.S. National Library of Medicine) — CPR: adult", url: "https://medlineplus.gov/ency/article/000013.htm" },
  mlp_unconscious: { title: "MedlinePlus — Unconsciousness: first aid", url: "https://medlineplus.gov/ency/article/000022.htm" },
  mlp_breathing: { title: "MedlinePlus — Breathing difficulties: first aid", url: "https://medlineplus.gov/ency/article/000007.htm" },
  mlp_chest_pain: { title: "MedlinePlus — Chest pain", url: "https://medlineplus.gov/ency/article/003079.htm" },
  cpr_microgravity: {
    title: "Hinkelbein J. et al. (2020) — CPR during spaceflight: guideline for CPR in microgravity (DGLRM / ESAM-SMG), Scand J Trauma Resusc Emerg Med 28:108",
    url: "https://link.springer.com/article/10.1186/s13049-020-00793-y",
  },
  ochmo_co2: { title: "NASA OCHMO Technical Brief OCHMO-TB-004 — Carbon Dioxide", url: "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf" },
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
// `range`: input plausibility limits that catch typos (e.g. 1200 instead of 120). Team assumption,
// deliberately wide; NOT clinical thresholds and never shown as medical advice.
export const CHECKIN = {
  sys: { ...todoCard, step: 1, range: [60, 250] },
  dia: { ...todoCard, step: 1, range: [30, 150] },
  hr: { ...todoCard, step: 1, range: [25, 220] },
  glucose: { ...todoCard, step: 1, range: [20, 600] },
  temp: { ...todoCard, step: 0.1, range: [32, 43] },
  sleep_h: { ...todoCard, step: 0.1, range: [0, 24] },
  mood: { ...todoCard, step: 1, scale: [1, 2, 3, 4, 5] },
  reaction_ms: { ...todoCard, step: 1, range: [100, 2000] },
};

// ===== Body systems: why each matters in space (ids from meta.systems) =====
export const SYSTEM_TEXT = {
  heart: { whyInSpace: "TODO(UI): fluid shift and cardiovascular deconditioning in weightlessness.", source: "hrp_hazards" },
  metabolism: { whyInSpace: "TODO(UI)", source: "hrp_risks" },
  mind_sleep: { whyInSpace: "TODO(UI): isolation, confinement and disrupted sleep.", source: "hrp_hazards" },
  immune_temp: { whyInSpace: "TODO(UI): closed environment and immune changes.", source: "hrp_hazards" },
};

// ===== Emergency (Respond path; works without the model) =====
// A crew mate helps the person in trouble (challenge video: "your fellow crew mate … collapses"),
// so the flow starts with responsiveness and breathing, then branches. Nodes are either a
// question (`options` → next node) or a list of `steps`; `then` offers follow-up nodes.
// Steps are first aid for a trained lay rescuer, paraphrased from the cited pages. They support,
// never replace, the crew's medical training and onboard procedures. No medicine doses are given.
export const EMERGENCY_START = "responsive";
export const EMERGENCY = {
  responsive: {
    title: "Is the crew member responsive?",
    prompt: "Tap or gently shake their shoulder and shout: “Are you OK?”",
    options: [
      { label: "No response", next: "breathing_check", status: "red" },
      { label: "Responds", next: "symptom" },
    ],
    source: "mlp_cpr",
  },
  breathing_check: {
    title: "Are they breathing normally?",
    prompt: "Watch the chest move, listen and feel for breath at the mouth and nose. Gasping is not normal breathing.",
    options: [
      { label: "Not breathing, or only gasping", next: "cpr", status: "red" },
      { label: "Breathing normally", next: "unresponsive_breathing", status: "orange" },
    ],
    source: "mlp_cpr",
  },
  cpr: {
    title: "Start CPR now",
    steps: [
      "Shout for the whole crew and the crew medical officer. Send someone for the defibrillator (AED).",
      "Start chest compressions at once: hard and fast in the centre of the chest, about 5 cm deep, 100–120 per minute, letting the chest rise fully after each push.",
      "In weightlessness: begin with the microgravity technique you trained (Evetts-Russomano); if compressions are not effective, switch to the reverse bear hug. Move to the handstand method once the person is strapped to the medical restraint.",
      "On the Moon or Mars: lay the person on their back on a firm, flat surface.",
      "Give 30 compressions, then 2 rescue breaths if trained; keep pauses under 10 seconds.",
      "Use the AED as soon as it arrives and follow its voice prompts. In weightlessness, shock only a person who is strapped down on an electrically isolated surface.",
      "Swap the person doing compressions about every 2 minutes. Keep going until they recover or the crew medical officer takes over.",
      "Far from Earth: do not wait for flight surgeons during CPR — the signal delay makes live help impractical. A crew member not involved in CPR may send the report.",
    ],
    source: ["mlp_cpr", "cpr_microgravity"],
  },
  unresponsive_breathing: {
    title: "Unresponsive but breathing",
    steps: [
      "Call the crew medical officer now. Do not leave the person alone.",
      "If you do not suspect a neck or spine injury, turn them onto their side (recovery position) and tilt the head back gently to keep the airway open.",
      "If you suspect a spine injury, keep them where they are as long as they keep breathing.",
      "Check breathing and pulse often. If breathing stops, start CPR.",
      "Keep them warm. Give nothing to eat or drink, and no pillow under the head.",
    ],
    source: "mlp_unconscious",
    then: [{ label: "Breathing stopped → CPR", next: "cpr", status: "red" }],
  },
  symptom: {
    title: "What is the main problem?",
    options: [
      { label: "Chest pain or pressure", next: "chest_pain", status: "orange" },
      { label: "Difficulty breathing", next: "breathing", status: "orange" },
      { label: "Stopped responding", next: "breathing_check", status: "red" },
    ],
  },
  chest_pain: {
    title: "Chest pain or pressure",
    steps: [
      "Treat it as an emergency: tell the crew medical officer now. Do not wait to see if it passes.",
      "Warning signs of a heart attack: pressure, squeezing or pain in the centre of the chest; pain spreading to an arm, the back, neck or jaw; shortness of breath; cold sweat, nausea or light-headedness.",
      "Measure blood pressure now. Above 180/120 mmHg together with chest pain is a hypertensive emergency.",
      "If they stop responding or stop breathing normally, start CPR.",
    ],
    source: ["aha_heart_attack", "mlp_chest_pain", "aha_bp_home", "mlp_cpr"],
    then: [{ label: "Stopped responding → check breathing", next: "breathing_check", status: "red" }],
  },
  breathing: {
    title: "Difficulty breathing",
    steps: [
      "Treat it as an emergency: tell the crew medical officer now.",
      "Check airway, breathing and pulse. If they are not breathing, start CPR.",
      "Loosen anything tight around the neck and chest.",
      "Help them use a medicine already prescribed for them, such as an inhaler, from the medical kit.",
      "Keep watching breathing and pulse. Quieter breathing (wheezing stops) does not always mean it is better.",
      "Give nothing to eat or drink, and no pillow under the head.",
      "Check the cabin CO₂ reading: too much CO₂ can cause headache and shortness of breath.",
    ],
    source: ["mlp_breathing", "ochmo_co2", "mlp_cpr"],
    then: [{ label: "Not breathing → CPR", next: "cpr", status: "red" }],
  },
};
