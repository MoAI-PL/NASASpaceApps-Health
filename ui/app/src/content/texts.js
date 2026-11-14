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
  hrp_cardio: { title: "NASA HRP — Risk of Cardiovascular Adaptations", url: "https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/" },
  hrp_gravity: { title: "NASA HRP — Hazard: Gravity Fields", url: "https://www.nasa.gov/hrp/hazard-gravity-fields/" },
  hrp_immune: { title: "NASA HRP — Risk of Altered Immune System Responses", url: "https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/" },
  hrp_closed_env: { title: "NASA HRP — Hazard: Hostile/Closed Environments", url: "https://www.nasa.gov/hrp/hazard-hostile-closed-environments/" },
  hrp_sleep: { title: "NASA HRP — Risk from Inadequate Sleep and Irregular Schedules", url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/" },
  hrp_behavior: { title: "NASA HRP — Risk of Behavioral Changes and Psychiatric Disorders", url: "https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/" },
  hrp_isolation: { title: "NASA HRP — Hazard: Isolation and Confinement", url: "https://www.nasa.gov/hrp/hazard-isolation-and-confinement/" },
  hrp_nutrition: { title: "NASA HRP — Risk of Inadequate Food and Nutrition", url: "https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/" },
  nasa_pvt: { title: "NASA Human Research Roadmap — Psychomotor Vigilance Test (Reaction Self-Test) on ISS", url: "https://humanresearchroadmap.nasa.gov/Tasks/task.aspx?i=1651" },
  nasa_radiation: { title: "NASA — Space Radiation Won’t Stop NASA’s Human Exploration", url: "https://www.nasa.gov/humans-in-space/space-radiation-wont-stop-nasas-human-exploration/" },
  aha_heart_rate: { title: "American Heart Association — Target Heart Rates (resting heart rate, taking your pulse)", url: "https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates" },
  mlp_temp: { title: "MedlinePlus — Body temperature norms", url: "https://medlineplus.gov/ency/article/001982.htm" },
  mlp_glucose: { title: "MedlinePlus — Blood sugar test", url: "https://medlineplus.gov/ency/article/003482.htm" },
  tobin_2002: { title: "Tobin B.W. et al. (2002) — Insulin secretion and sensitivity in space flight: diabetogenic effects, Nutrition 18(10):842–8", url: "https://pubmed.ncbi.nlm.nih.gov/12361776/" },
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
  sep_event: {
    title: "Solar particle event",
    body: "Radiation is higher today (solar particle event recorded by NASA DONKI). NASA protects crews from these events by having them shelter in an area with extra shielding: follow the radiation alert procedure.",
    source: "nasa_radiation",
  },
  co2_high: {
    title: "Cabin CO₂ above limit",
    body: "Cabin CO₂ is above the 3 mmHg NASA limit. Headache is the most common symptom. Report it so the CO₂ scrubbers can be checked or backup CO₂ removal started.",
    source: "ochmo_co2",
  },
  possible_sensor_fault: { title: "Possible sensor fault", body: "One reading is far from your normal while the others are not. Re-measure before acting." },
};

// ===== Prompts: the model asks for a follow-up measurement (ids from the contract) =====
// ===== Check-in cards: one per indicator (ids from meta.features) =====
// How = how to measure, Why = why it matters in space, If abnormal = what to do when the value is
// off your normal. Paraphrased from SOURCES (listed per card).
// `range`: input plausibility limits that catch typos (e.g. 1200 instead of 120). Team assumption,
// deliberately wide; NOT clinical thresholds and never shown as medical advice.
const BP = {
  how: "Sit and rest quietly for 5 minutes first: no exercise or caffeine in the last 30 minutes, no talking. Upper-arm cuff on bare skin, arm supported at heart level. Take two readings one minute apart, at the same time every day.",
  why: "Weightlessness shifts body fluids towards the head and changes how the heart and blood vessels work; this can lead to heart rhythm problems and low blood pressure with fainting.",
  ifAbnormal: "One high reading is not an emergency: measure again. Above 180/120 mmHg, wait one minute and measure again; if it stays that high, tell the crew medical officer at once — with chest pain or shortness of breath, open Emergency.",
  source: ["aha_bp_home", "hrp_cardio", "hrp_gravity"],
};
export const CHECKIN = {
  sys: { ...BP, step: 1, range: [60, 250] },
  dia: { ...BP, step: 1, range: [30, 150] },
  hr: {
    how: "Measure in the morning after sleep, before getting up or drinking coffee. Two fingertips (not the thumb) on the thumb side of the inner wrist; count the beats for 30 seconds and multiply by 2.",
    why: "Spaceflight changes the heart and blood vessels and can bring heart rhythm problems. On Earth, a higher resting heart rate goes with lower physical fitness.",
    ifAbnormal: "Re-measure at rest. For most adults 60–100 beats per minute is normal at rest, but compare with your own normal. With chest discomfort, shortness of breath or light-headedness, open Emergency.",
    source: ["aha_heart_rate", "hrp_cardio", "aha_heart_attack"],
    step: 1, range: [25, 220],
  },
  glucose: {
    how: "Measure fasting: nothing to eat for at least 8 hours before the test.",
    why: "Spaceflight has been linked to reduced insulin sensitivity and changes in glucose tolerance, and the space diet must keep the crew well fed for years without resupply.",
    ifAbnormal: "A normal fasting value is 70–99 mg/dL. Re-measure fasting the next morning and tell the crew medical officer if it stays outside your normal. If someone feels faint from low blood sugar, give something sweet only once they are conscious.",
    source: ["mlp_glucose", "tobin_2002", "hrp_nutrition", "mlp_unconscious"],
    step: 1, range: [20, 600],
  },
  temp: {
    how: "Measure at the same time each day. Body temperature is lowest in the early morning and changes during the day.",
    why: "Radiation, weightlessness and poor sleep can weaken the immune system and wake up dormant viruses, and germs pass more easily between people in a closed habitat.",
    ifAbnormal: "Above 38 °C usually means fever from an infection or illness. Re-measure in the evening and tell the crew medical officer about a fever or any new rash.",
    source: ["mlp_temp", "hrp_immune", "hrp_closed_env"],
    step: 0.1, range: [32, 43],
  },
  sleep_h: {
    how: "Enter the hours you actually slept in your last sleep period, not the time you spent in your sleep station.",
    why: "Irregular light–dark cycles, sleep disruption and heavy workload are known spaceflight stressors that harm health and performance.",
    ifAbnormal: "Keep a regular schedule, use the cabin lighting schedule and watch caffeine timing. Tell the crew medical officer if short sleep continues for several days.",
    source: ["hrp_sleep", "hrp_isolation"],
    step: 0.1, range: [0, 24],
  },
  mood: {
    how: "Rate how you feel today, from 1 (very low) to 5 (very good). Answer quickly — there is no right answer.",
    why: "Long isolation and confinement can increase anxiety and depression, which affect sleep, morale and decisions. Far from Earth, talking to family and support teams gets harder.",
    ifAbnormal: "Use your self-care time — for example, keep a journal. Tell a crew mate or the crew medical officer if low mood lasts several days.",
    source: ["hrp_behavior", "hrp_isolation"],
    step: 1, scale: [1, 2, 3, 4, 5],
  },
  reaction_ms: {
    how: "Do the short reaction test at the same time each day: tap as soon as the signal appears. Enter your average reaction time.",
    why: "A reaction-time test has been used on the space station as an objective measure of fatigue from sleep loss and workload.",
    ifAbnormal: "Slower than your normal can mean fatigue. Check your sleep and workload, and re-test tomorrow; tell the crew medical officer if it stays slow.",
    source: ["nasa_pvt", "hrp_sleep"],
    step: 1, range: [100, 2000],
  },
};

// ===== Prompts: the model asks for a follow-up measurement (ids from the contract) =====
// Each prompt reuses the How / Why / If abnormal of the indicators it asks for; a prompt for two
// indicators labels each part ("Blood pressure: …  Heart rate: …").
const merge = ([la, a], [lb, b]) => ({
  how: `${la}: ${a.how}  ${lb}: ${b.how}`,
  why: `${la}: ${a.why}  ${lb}: ${b.why}`,
  ifAbnormal: `${la}: ${a.ifAbnormal}  ${lb}: ${b.ifAbnormal}`,
  source: [...new Set([...a.source, ...b.source])],
});
export const PROMPTS = {
  repeat_bp_hr_rest: {
    title: "Re-measure blood pressure and resting heart rate",
    ...merge(["Blood pressure", BP], ["Heart rate", CHECKIN.hr]),
  },
  repeat_glucose_fasting: { title: "Re-measure fasting blood glucose", ...CHECKIN.glucose },
  reaction_test_mood_checkin: {
    title: "Do the reaction test and mood check-in",
    ...merge(["Reaction test", CHECKIN.reaction_ms], ["Mood", CHECKIN.mood]),
  },
  repeat_temperature_evening: { title: "Re-measure body temperature this evening", ...CHECKIN.temp },
};

// ===== Body systems: why each matters in space (ids from meta.systems) =====
export const SYSTEM_TEXT = {
  heart: {
    whyInSpace: "Without gravity, body fluids shift towards the head and the heart and blood vessels adapt. This can lead to blood clots, heart rhythm problems and low blood pressure with fainting when gravity returns. Exercise and a healthy diet help keep the heart fit.",
    source: ["hrp_cardio", "hrp_gravity"],
  },
  metabolism: {
    whyInSpace: "Spaceflight has been linked to reduced insulin sensitivity. On long missions the food system must stay nutritious and varied for years without resupply.",
    source: ["tobin_2002", "hrp_nutrition"],
  },
  mind_sleep: {
    whyInSpace: "Isolation, confinement, sleep loss, an irregular day–night cycle and heavy workload can wear down mood, alertness and teamwork. On a space station the crew sees about 16 sunrises a day.",
    source: ["hrp_isolation", "hrp_sleep", "hrp_behavior"],
  },
  immune_temp: {
    whyInSpace: "Radiation, weightlessness and poor sleep can change the immune system and wake dormant viruses. In a closed habitat germs pass more easily between crew members.",
    source: ["hrp_immune", "hrp_closed_env"],
  },
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
