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
  nhlbi_heart: { title: "NIH National Heart, Lung, and Blood Institute — How the Heart Works", url: "https://www.nhlbi.nih.gov/health/heart" },
  nhlbi_sleep: { title: "NIH National Heart, Lung, and Blood Institute — Why Is Sleep Important?", url: "https://www.nhlbi.nih.gov/health/sleep/why-sleep-important" },
  mlp_metabolism: { title: "MedlinePlus — Metabolic Disorders (what metabolism is)", url: "https://medlineplus.gov/metabolicdisorders.html" },
  mlp_immune: { title: "MedlinePlus — Immune System and Disorders", url: "https://medlineplus.gov/immunesystemanddisorders.html" },
  van_dongen_2003: { title: "Van Dongen H.P.A. et al. (2003) — The cumulative cost of additional wakefulness, Sleep 26(2):117–26 (sleepiness ratings missed growing performance deficits)", url: "https://pubmed.ncbi.nlm.nih.gov/12683469/" },
  tobin_2002: { title: "Tobin B.W. et al. (2002) — Insulin secretion and sensitivity in space flight: diabetogenic effects, Nutrition 18(10):842–8", url: "https://pubmed.ncbi.nlm.nih.gov/12361776/" },
};

// ===== Status vocabulary: colour + shape + word, never colour alone =====
export const STATUS_LABEL = { green: "Nominal", yellow: "Watch", orange: "Act", red: "Critical", info: "Info" };

// ===== Legend: what each status means and what to do (Help dialog) =====
// Matches the app logic: Watch/Act come from the index held for several days, Critical only
// from critical limits (meta.index; PLAN.md M2.3–M2.4).
export const STATUS_HELP = [
  { status: "green", meaning: "Within your normal.", action: "Keep your daily routine." },
  { status: "yellow", meaning: "Drifting away from your normal for several days.", action: "Do today’s actions and re-measure." },
  { status: "orange", meaning: "Clearly away from your normal, or several systems at once.", action: "Inform the crew medical officer." },
  { status: "red", meaning: "A critical limit was crossed.", action: "Open Emergency and follow the steps." },
  { status: "info", meaning: "Information only, not a health status.", action: "" },
];

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

// ===== Check-in cards: one per indicator (ids from meta.features) =====
// How = how to measure, Why = why it matters in space, If abnormal = what to do when the value is
// off your normal. Paraphrased from SOURCES (listed per card).
// Written for spaceflight: no "morning", "bed" or "sitting" assumptions. Earth guidance (AHA,
// MedlinePlus) is adapted to a spacecraft day — "after your sleep period" instead of "in the
// morning", "anchor yourself" in weightlessness — without changing what the source says.
// `range`: input plausibility limits that catch typos (e.g. 1200 instead of 120). Team assumption,
// deliberately wide; NOT clinical thresholds and never shown as medical advice.
const BP = {
  how: "No exercise or caffeine in the last 30 minutes. Keep still and quiet for 5 minutes first — in weightlessness, anchor your feet; with gravity, sit. Cuff on the bare upper arm, arm supported at heart level. Take two readings one minute apart, at the same point of your daily schedule.",
  why: "Weightlessness shifts body fluids towards the head and changes how the heart and blood vessels work; this can lead to heart rhythm problems and low blood pressure with fainting.",
  ifAbnormal: "One high reading is not an emergency: measure again. Systolic above 180 or diastolic above 120 mmHg: wait one minute and measure again; if it stays that high, tell the crew medical officer at once — with chest pain or shortness of breath, open Emergency.",
  source: ["aha_bp_home", "hrp_cardio", "hrp_gravity"],
};
export const CHECKIN = {
  sys: { ...BP, step: 1, range: [60, 250] },
  dia: { ...BP, step: 1, range: [30, 150] },
  hr: {
    how: "Measure right after your sleep period, while still resting in your sleep station and before caffeine or exercise. Two fingertips (not the thumb) on the thumb side of the inner wrist; count the beats for 30 seconds and multiply by 2.",
    why: "Spaceflight changes the heart and blood vessels and can bring heart rhythm problems. A higher resting heart rate goes with lower physical fitness.",
    ifAbnormal: "Re-measure at rest. For most adults 60–100 beats per minute is normal at rest, but compare with your own normal. With chest discomfort, shortness of breath or light-headedness, open Emergency.",
    source: ["aha_heart_rate", "hrp_cardio", "aha_heart_attack"],
    step: 1, range: [25, 220],
  },
  glucose: {
    how: "Measure fasting: nothing to eat for at least 8 hours — easiest right after your sleep period, before your first meal.",
    why: "Spaceflight has been linked to reduced insulin sensitivity and changes in glucose tolerance, and the space diet must keep the crew well fed for years without resupply.",
    ifAbnormal: "A normal fasting value is 70–99 mg/dL. Re-measure fasting after your next sleep period and tell the crew medical officer if it stays outside your normal. If someone feels faint from low blood sugar, give something sweet only once they are conscious.",
    source: ["mlp_glucose", "tobin_2002", "hrp_nutrition", "mlp_unconscious"],
    step: 1, range: [20, 600],
  },
  temp: {
    how: "Body temperature changes over the day and is lowest early in your day, so measure at the same point of your schedule each day — right after your sleep period.",
    why: "Radiation, weightlessness and poor sleep can weaken the immune system and wake up dormant viruses, and germs pass more easily between people in a closed habitat.",
    ifAbnormal: "Above 38 °C usually means fever from an infection or illness. Re-measure before your next sleep period and tell the crew medical officer about a fever or any new rash.",
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
    how: "Use the reaction test in the guided check-in, at the same point of your schedule each day: tap as soon as the circle appears. The result is the median of five tries.",
    why: "A reaction-time test has been used on the space station as an objective measure of fatigue from sleep loss and workload.",
    ifAbnormal: "Slower than your normal can mean fatigue. Check your sleep and workload, and re-test after your next sleep period; tell the crew medical officer if it stays slow.",
    source: ["nasa_pvt", "hrp_sleep"],
    step: 1, range: [100, 2000],
  },
};

// ===== Guided check-in: one measurement at a time, in the order of a post-sleep routine =====
// Order follows the sources, adapted to a spacecraft day: resting heart rate while still resting
// after the sleep period (AHA), fasting glucose before the first meal (MedlinePlus), blood
// pressure after 5 minutes of quiet rest (AHA). `tool` picks the
// helper on the step: a 30-second pulse timer, the rest timer with two readings, the in-app
// reaction test. Short steps are condensed from the CHECKIN cards and share their sources.
export const GUIDE = [
  {
    id: "hr", fields: ["hr"], title: "Resting heart rate", tool: "pulse",
    steps: [
      "Do this right after your sleep period, still resting in your sleep station — before caffeine or exercise.",
      "Put two fingertips (not the thumb) on the thumb side of your inner wrist.",
      "Press Start and count the beats until the timer ends. The app does the maths.",
    ],
  },
  {
    id: "temp", fields: ["temp"], title: "Body temperature",
    steps: [
      "Measure at the same point of your schedule each day: right after your sleep period.",
      "Enter the reading from the thermometer.",
    ],
  },
  {
    id: "glucose", fields: ["glucose"], title: "Fasting blood glucose",
    steps: [
      "Measure before your first meal: nothing to eat for at least 8 hours.",
      "Enter the reading from the glucose meter.",
    ],
  },
  {
    id: "bp", fields: ["sys", "dia"], title: "Blood pressure", tool: "bp",
    steps: [
      "No exercise or caffeine in the last 30 minutes; empty your bladder first.",
      "Keep still: in weightlessness anchor your feet, with gravity sit. Arm supported at heart level, cuff on the bare upper arm.",
      "Rest 5 minutes without talking, then take two readings one minute apart. The app averages them.",
    ],
  },
  {
    id: "sleep_h", fields: ["sleep_h"], title: "Sleep",
    steps: ["How many hours did you actually sleep in your last sleep period? Not the time in your sleep station."],
  },
  {
    id: "mood", fields: ["mood"], title: "Mood",
    steps: ["How do you feel today? Pick the first answer that fits — there is no right answer."],
  },
  {
    id: "reaction_ms", fields: ["reaction_ms"], title: "Reaction time", tool: "reaction",
    steps: [
      "Tap the circle as soon as it appears. Five tries; the result is your middle (median) time.",
      "This short in-app test is not the validated NASA test: compare it only with your own results.",
    ],
  },
];
export const MOOD_WORDS = { 1: "Very low", 2: "Low", 3: "OK", 4: "Good", 5: "Very good" };

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
  repeat_temperature_evening: { title: "Re-measure body temperature before your next sleep", ...CHECKIN.temp },
};

// ===== Body systems (ids from meta.systems) =====
// function = what the system does (challenge: a clickable body part shows "its function");
// whyInSpace = how spaceflight affects it; helps = what the crew can do to stay well
// (challenge: "guidance on treatments and health improvements", "actions to prevent a critical
// health condition"). Every line is paraphrased from the listed sources.
export const SYSTEM_TEXT = {
  heart: {
    function: "Your heart pumps blood through your body. The blood carries oxygen and nutrients to your organs and takes carbon dioxide to the lungs. The heart's electrical system sets the rate and rhythm of each beat.",
    whyInSpace: "Without gravity, body fluids shift towards the head and the heart and blood vessels adapt. This can lead to blood clots, heart rhythm problems and low blood pressure with fainting when gravity returns.",
    helps: [
      "Do your daily exercise sessions and eat a balanced diet: both help keep the heart and blood vessels fit.",
      "Before returning to gravity (landing): drink plenty of fluids and wear the lower-body compression garment — both help prevent low blood pressure and fainting.",
      "Sleep enough: short or broken sleep is linked to high blood pressure.",
    ],
    source: ["nhlbi_heart", "hrp_cardio", "hrp_gravity", "nhlbi_sleep"],
  },
  metabolism: {
    function: "Metabolism turns the food you eat into energy. Your body uses this fuel at once or stores it in the liver, muscles and body fat.",
    whyInSpace: "Spaceflight has been linked to reduced insulin sensitivity. On long missions the food system must stay nutritious and varied for years without resupply.",
    helps: [
      "Eat your planned meals: good nutrition is essential for health and performance in space.",
      "Sleep enough: too little sleep lowers the body's response to insulin.",
    ],
    source: ["mlp_metabolism", "tobin_2002", "hrp_nutrition", "nhlbi_sleep"],
  },
  mind_sleep: {
    function: "Sleep keeps the brain and body working: how you think, react and get along with others while awake depends partly on it. Mood shapes sleep, morale and decisions.",
    whyInSpace: "Isolation, confinement, sleep loss, an irregular day–night cycle and heavy workload can wear down mood, alertness and teamwork. On a space station the crew sees about 16 sunrises a day.",
    helps: [
      "Follow the cabin lighting schedule: the lights imitate a day–night cycle to help you sleep.",
      "Watch when you have caffeine: light and caffeine both affect your body clock.",
      "Use your relaxation and self-care time — keep a journal, look out of a window, tend plants if you have them on board.",
      "Tell a crew mate or the crew medical officer early if sleep or mood stay low.",
    ],
    source: ["nhlbi_sleep", "hrp_sleep", "hrp_behavior", "hrp_isolation"],
  },
  immune_temp: {
    function: "Your immune system — skin, white blood cells and the lymph organs — fights germs. A fever is often its response to an infection.",
    whyInSpace: "Radiation, weightlessness and poor sleep can change the immune system and wake dormant viruses. In a closed habitat germs pass more easily between crew members.",
    helps: [
      "Sleep enough: some immune cells work hardest during sleep, and people who sleep too little catch infections more easily.",
      "Report a fever, cold sore or new rash early, so the crew can limit its spread in the closed habitat.",
    ],
    source: ["mlp_immune", "mlp_temp", "hrp_immune", "hrp_closed_env", "nhlbi_sleep"],
  },
};

// ===== Ready for critical tasks? (Today) =====
// Compares how the crew member feels (mood self-rating) with how they perform (reaction
// self-test, like the PVT on the ISS). In sleep-restriction studies people largely missed
// their own growing performance deficits, so a slower reaction with an unchanged self-rating
// is flagged before critical tasks. Thresholds are team assumptions, not validated.
export const READINESS = {
  title: "Ready for critical tasks?",
  verdict: {
    go: "Alertness as usual",
    blindSpot: "Feels fine ≠ is fine",
    both: "Slower, and you feel it",
    noData: "Do the reaction test",
    learning: "Learning your normal",
  },
  advice: "Spacewalk, docking or robotic arm: a crewmate checks each step — or rest first.",
  how: [
    "Compares your mood rating with your reaction test over the last 7 days. Tiredness often hides from your own judgement.",
    "Slower = 1.5 SD or more above your normal; \"as usual\" = mood within 0.5 SD. Team thresholds — an assumption, not validated. The cited study used sleepiness ratings; here mood is the self-rating.",
  ],
  source: ["van_dongen_2003", "nasa_pvt", "hrp_sleep"],
};

// ===== Is it me or the habitat? (Today) =====
// When the same body system is away from normal in two or more crew members on the same day,
// a shared cause in the closed habitat is worth checking before a personal one. The "2 or more"
// rule is a team assumption, not validated: the synthetic demo crew has no shared scenario.
export const HABITAT = {
  title: "Is it me or the habitat?",
  verdict: {
    shared: "Shared by the crew — check the habitat",
    personal: "Only you — likely personal",
    clear: "Nothing shared in the crew",
  },
  how: [
    "Compares today's body systems across the crew. The same system away from normal in 2 or more crew members points to the habitat, not to one person.",
    "Crewmates are counted, never named. Team rule — an assumption, not validated.",
  ],
  checks: {
    heart: {
      items: ["Cabin CO₂ above its usual level", "Cabin temperature and the exercise schedule"],
      source: ["ochmo_co2", "hrp_closed_env"],
    },
    metabolism: {
      items: ["The same food or water batch for everyone", "Changes to the meal or exercise plan"],
      source: ["hrp_nutrition", "hrp_closed_env"],
    },
    mind_sleep: {
      items: ["Cabin CO₂ (headaches, poor sleep)", "Lighting schedule, noise and shift changes"],
      source: ["ochmo_co2", "hrp_sleep"],
    },
    immune_temp: {
      items: ["An infection passing between crew members", "A recent solar particle event (radiation)"],
      source: ["hrp_immune", "hrp_closed_env", "nasa_radiation"],
    },
  },
};

// ===== How we know: method and evidence (screen "How we know") =====
// Numbers copied by hand on 2026-11-14 from the ML results, which the README also reports:
// outputs/results/benchmark.md, dev_metrics.json, final_test.json (hold-out, run once).
// The UI contract reads only outputs/ui/, so if those results change, update these numbers.
// Numbers below are copied from outputs/results/benchmark.md, dev_metrics.md and final_test.json;
// update them if those files are regenerated.
export const EVIDENCE = {
  label: "Synthetic data calibrated on published sources — proof of concept, not clinical validation.",
  // The four numbers a reader sees first (same sources as below).
  question: "Can you trust Baseline?",
  answer: "We tested it like a scientist would: a fair contest against other methods, then one test on a health change it had never seen.",
  headline: [
    { value: "10 of 10", caption: "infections caught in the one-time test on an unseen change", compare: "clinical limits: 7 of 10" },
    { value: "+5 days", caption: "earlier than clinical limits (median)", compare: "3 cases only Baseline caught" },
    { value: "+7.5 days", caption: "earlier than single-value limits (median)", compare: "all 10 caught by both" },
    { value: "82%", caption: "of changes caught within 21 days in the fair contest", compare: "clinical limits: 39%" },
  ],
  steps: [
    { title: "1. Your personal normal", body: "The first 21 days teach Baseline what is normal for you." },
    { title: "2. Drift over 7 days", body: "It watches all values move together, not one at a time." },
    { title: "3. One index", body: "0–100: how unusual your week is, and which values caused it." },
    { title: "Safety net", body: "Critical limits and Emergency work even without the model." },
  ],
  benchmark: {
    title: "1 · Chosen in a fair contest",
    note: "38 configurations, all tuned to the same false-alarm budget (at most 0.05 per crew member per week). Share of simulated health changes caught within 21 days:",
    rows: [
      { label: "Baseline drift model (chosen)", value: 82, color: "var(--color-model)" },
      { label: "Autoencoder ensemble (deep learning)", value: 68, color: "var(--color-ink-2)", outline: true },
      { label: "Your single-value limits (each indicator alone)", value: 64, color: "var(--color-b2)" },
      { label: "Standard clinical limits*", value: 39, color: "var(--color-b1)" },
    ],
    footnote: "* Standard clinical limits are fixed values and cannot be tuned; their own false-alarm rate was 0.084.",
  },
  confirmation: {
    title: "2 · Confirmed with frozen settings",
    note: "Median days from the start of a change to the first alert:",
    head: ["Change", "Baseline", "Clinical limits", "Single-value limits"],
    rows: [
      ["Cardiovascular", "11", "29", "18.5"],
      ["Isolation & stress", "13", "16", "13.5"],
      ["Metabolic", "8.5", "18.5", "15"],
    ],
  },
  holdout: {
    title: "3 · Tested once on a change it never saw",
    note: "Infection onset was kept aside during development and evaluated a single time.",
    facts: [
      ["Caught", "10 of 10 (clinical limits: 7 of 10)"],
      ["Earlier than clinical limits", "+5 days (median); 3 cases only Baseline caught"],
      ["Earlier than single-value limits", "+7.5 days (median)"],
    ],
  },
  limits: {
    title: "What it does not show",
    items: [
      "More false alarms than the simple methods: about one per crew member every 14 weeks (0.071 per week, vs 0.044 and 0.016).",
      "For isolation & stress, Baseline was not earlier: compared crew member by crew member, it alerted about a day later than the other methods (median).",
      "All data are synthetic. Real crews may behave differently; this is not clinical validation and not a medical device.",
    ],
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
      "With gravity (Moon or Mars): lay the person on their back on a firm, flat surface.",
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
      "Keep the airway open: tilt the head back gently.",
      "In weightlessness: strap the person to the medical restraint so they do not drift.",
      "With gravity (Moon or Mars): if you do not suspect a neck or spine injury, turn them onto their side (recovery position). If you suspect a spine injury, do not move them while they keep breathing.",
      "Check breathing and pulse often. If breathing stops, start CPR.",
      "Keep them warm. Give nothing to eat or drink.",
    ],
    source: ["mlp_unconscious", "cpr_microgravity"],
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
      "Measure blood pressure now. Systolic above 180 or diastolic above 120 mmHg together with chest pain is a hypertensive emergency.",
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
      "Give nothing to eat or drink.",
      "Check the cabin CO₂ reading: too much CO₂ can cause headache and shortness of breath.",
    ],
    source: ["mlp_breathing", "ochmo_co2", "mlp_cpr"],
    then: [{ label: "Not breathing → CPR", next: "cpr", status: "red" }],
  },
};
