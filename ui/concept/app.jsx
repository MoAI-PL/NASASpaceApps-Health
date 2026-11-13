// Baseline — NASA Space Apps Challenge 2026 — CONCEPT UI
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
// Source of app.js. Rebuild after edits: see ui/README.md.
const { useState, useMemo } = React;
const DATA = window.BASELINE_DATA;

// ===== Status vocabulary: colour + icon shape + word, never colour alone =====
const STATUS = {
  green:  { color: "var(--good)",     label: "Nominal",  shape: "circle" },
  yellow: { color: "var(--warning)",  label: "Watch",    shape: "triangle" },
  orange: { color: "var(--serious)",  label: "Act",      shape: "diamond" },
  red:    { color: "var(--critical)", label: "Critical", shape: "octagon" },
  info:   { color: "var(--ink-2)",    label: "Info",     shape: "square" },
};

function StatusIcon({ status, size = 28 }) {
  const s = STATUS[status] || STATUS.info, h = size / 2;
  const glyph = { circle: "✓", triangle: "!", diamond: "!!", octagon: "✕", square: "i" }[s.shape];
  let shape;
  if (s.shape === "circle") shape = <circle cx={h} cy={h} r={h - 1} fill={s.color} />;
  if (s.shape === "triangle") shape = <polygon points={`${h},1 ${size - 1},${size - 2} 1,${size - 2}`} fill={s.color} />;
  if (s.shape === "diamond") shape = <polygon points={`${h},1 ${size - 1},${h} ${h},${size - 1} 1,${h}`} fill={s.color} />;
  if (s.shape === "octagon") { const a = size * 0.29; shape = <polygon points={`${a},1 ${size - a},1 ${size - 1},${a} ${size - 1},${size - a} ${size - a},${size - 1} ${a},${size - 1} 1,${size - a} 1,${a}`} fill={s.color} />; }
  if (s.shape === "square") shape = <rect x="1" y="1" width={size - 2} height={size - 2} rx="4" fill={s.color} />;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={s.label}>
      {shape}
      <text x={h} y={s.shape === "triangle" ? h + size * 0.2 : h + size * 0.17} textAnchor="middle" fontSize={size * 0.45}
            fontWeight="700" fill={status === "yellow" ? "#0b0b0b" : "#ffffff"}>{glyph}</text>
    </svg>
  );
}

function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.info;
  return <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--panel-2)] text-base">
    <StatusIcon status={status} size={22} /> {s.label}
  </span>;
}

// ===== Hazard icons (own SVG, no third-party assets) =====
const HAZARD_ICON = {
  radiation: <g><circle cx="16" cy="16" r="3" /><path d="M16 13 L10 3 A14 14 0 0 1 22 3 Z" /><path d="M18.6 17.5 L29 22 A14 14 0 0 1 23 29 Z" /><path d="M13.4 17.5 L9 29 A14 14 0 0 1 3 22 Z" /></g>,
  isolation: <g fill="none" strokeWidth="2.5"><rect x="3" y="3" width="26" height="26" rx="3" /><circle cx="16" cy="12" r="4" /><path d="M9 25 C9 19 23 19 23 25" /></g>,
  distance: <g fill="none" strokeWidth="2.5"><circle cx="7" cy="16" r="5" /><circle cx="27" cy="16" r="2.5" /><path d="M14 16 H22" strokeDasharray="2 3" /></g>,
  gravity: <g fill="none" strokeWidth="2.5"><path d="M16 4 V26" /><path d="M9 19 L16 26 L23 19" /><path d="M5 29 H27" /></g>,
  closed_environment: <g fill="none" strokeWidth="2.5"><path d="M6 26 V12 A10 10 0 0 1 26 12 V26 Z" /><text x="16" y="22" fontSize="8" textAnchor="middle" stroke="none" fill="currentColor">CO₂</text></g>,
};

const PROMPT_TEXT = {
  repeat_bp_hr_rest: "Re-measure blood pressure and resting heart rate",
  repeat_glucose_fasting: "Re-measure fasting blood glucose",
  reaction_test_mood_checkin: "Do the reaction test and mood check-in",
  repeat_temperature_evening: "Re-measure body temperature this evening",
};
const ESCALATION_TEXT = {
  monitor: "Keep the daily routine",
  self_care: "Self-care actions",
  crew_medical_officer: "Inform the crew medical officer",
  flight_surgeon: "Emergency: onboard protocol + flight surgeons",
};

// ===== SAI gauge =====
function Gauge({ record }) {
  const sai = record.sai, level = record.level;
  const angle = sai == null ? 0 : (sai / 100) * 180;
  const r = 90, cx = 110, cy = 110;
  const end = (a) => [cx - r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
  const [ex, ey] = end(angle);
  return (
    <div className="panel p-5 flex flex-col items-center">
      <div className="text-[var(--ink-2)] text-lg">Systemic Anomaly Index</div>
      <svg width="220" height="130" viewBox="0 0 220 130" role="img" aria-label={`SAI ${sai ?? "calibrating"}`}>
        <path d={`M20 110 A90 90 0 0 1 200 110`} stroke="var(--line)" strokeWidth="18" fill="none" strokeLinecap="round" />
        {sai != null && <path d={`M20 110 A90 90 0 0 1 ${ex} ${ey}`} stroke={STATUS[level].color} strokeWidth="18" fill="none" strokeLinecap="round" />}
        <text x="110" y="100" textAnchor="middle" fontSize="44" fontWeight="700" fill="var(--ink)">{sai ?? "—"}</text>
      </svg>
      <StatusChip status={level} />
      {record.calibrating && <div className="mt-3 text-[var(--ink-2)] text-center">Learning your personal baseline · day {record.day} of {DATA.meta.mission.calibration_days}</div>}
    </div>
  );
}

// ===== Body map =====
const ZONES = {
  mind_sleep: { label: "Mind & sleep", path: <circle cx="100" cy="42" r="28" /> , icon: [128, 20] },
  heart: { label: "Heart & circulation", path: <rect x="68" y="80" width="64" height="58" rx="18" />, icon: [134, 80] },
  metabolism: { label: "Metabolism", path: <rect x="72" y="142" width="56" height="50" rx="16" />, icon: [130, 142] },
  immune_temp: { label: "Immune & temperature", path: <g><rect x="34" y="84" width="26" height="100" rx="13" /><rect x="140" y="84" width="26" height="100" rx="13" /></g>, icon: [168, 84] },
};

function BodyMap({ record, selected, onSelect }) {
  return (
    <div className="panel p-5">
      <div className="text-[var(--ink-2)] text-lg mb-2">Body systems</div>
      <div className="flex gap-4 items-start">
        <svg width="200" height="300" viewBox="0 0 200 300" role="img" aria-label="Body map">
          <path d="M80 196 L74 290 H96 L100 210 L104 290 H126 L120 196 Z" fill="var(--panel-2)" />
          {Object.entries(ZONES).map(([id, z]) => {
            const st = record.systems[id];
            return (
              <g key={id} onClick={() => onSelect(id)} style={{ cursor: "pointer" }}
                 fill={st === "green" ? "var(--panel-2)" : STATUS[st].color}
                 fillOpacity={st === "green" ? 1 : 0.35}
                 stroke={selected === id ? "var(--ink)" : STATUS[st].color} strokeWidth={selected === id ? 4 : 2}>
                {z.path}
              </g>
            );
          })}
        </svg>
        <div className="flex flex-col gap-2 flex-1">
          {Object.entries(ZONES).map(([id, z]) => (
            <button key={id} onClick={() => onSelect(id)}
                    className={`tap flex items-center gap-3 px-4 rounded-xl text-left text-lg ${selected === id ? "bg-[var(--line)]" : "bg-[var(--panel-2)]"}`}>
              <StatusIcon status={record.systems[id]} /> {z.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== System detail =====
function SystemDetail({ record, system }) {
  const features = DATA.meta.systems[system].features;
  const bands = DATA.meta.normal_bands[record.astronaut];
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3 text-xl font-semibold"><StatusIcon status={record.systems[system]} /> {DATA.meta.systems[system].name}</div>
      <table className="w-full mt-3 text-lg">
        <tbody>
          {features.map((f) => {
            const v = record.values[f], [lo, hi] = bands[f];
            const out = v != null && (v < lo || v > hi);
            return (
              <tr key={f} className="border-t border-[var(--line)]">
                <td className="py-2">{DATA.meta.features[f].name}</td>
                <td className="py-2 text-right font-semibold">{v ?? "missing"} <span className="text-[var(--muted)] text-base">{DATA.meta.features[f].unit}</span></td>
                <td className="py-2 text-right text-[var(--ink-2)] text-base">your normal {lo}–{hi} {out && <span className="ml-1">▲</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[var(--muted)] text-sm">TODO(UI): why this system matters in space + actions, each with a cited NASA HRP source.</p>
    </div>
  );
}

// ===== What changed + prompts =====
function WhatChanged({ record }) {
  const entries = Object.entries(record.contributions).filter(([f]) => f !== "other");
  return (
    <div className="panel p-5">
      <div className="text-[var(--ink-2)] text-lg mb-3">What moved away from your normal</div>
      {record.sai == null ? <div className="text-[var(--muted)]">Not enough days yet.</div> :
        entries.map(([f, share]) => (
          <div key={f} className="mb-2">
            <div className="flex justify-between text-lg"><span>{DATA.meta.features[f].name}</span><span>{Math.round(share * 100)}%</span></div>
            <div className="h-3 rounded bg-[var(--panel-2)]"><div className="h-3 rounded" style={{ width: `${share * 100}%`, background: "var(--model)" }} /></div>
          </div>
        ))}
      <div className="mt-4 text-[var(--ink-2)] text-lg">Today's actions</div>
      {record.prompts.length === 0 ? <div className="text-lg mt-1">Routine measurements only.</div> :
        record.prompts.map((p) => <div key={p} className="tap mt-2 flex items-center gap-3 px-4 rounded-xl bg-[var(--panel-2)] text-lg">▶ {PROMPT_TEXT[p]}</div>)}
      <div className="mt-4 flex items-center gap-3 text-lg"><StatusIcon status={record.level} /> {ESCALATION_TEXT[record.escalation]}</div>
    </div>
  );
}

// ===== Hazard strip =====
function HazardStrip({ record, env }) {
  const delay = DATA.meta.environments[env].one_way_delay_text;
  return (
    <div className="panel p-4 grid grid-cols-5 gap-3">
      {Object.entries(DATA.meta.hazards).map(([id, h]) => {
        const st = record.hazards[id];
        const detail = id === "radiation" ? `${record.context.radiation_cum_mGy} mGy total` :
                       id === "closed_environment" ? `CO₂ ${record.context.cabin_co2_mmHg} mmHg` :
                       id === "distance" ? `Earth: ${delay}` : STATUS[st].label;
        return (
          <div key={id} className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" stroke="currentColor" className="text-[var(--ink)]">{HAZARD_ICON[id]}</svg>
              <StatusIcon status={st} size={22} />
            </div>
            <div className="text-base">{h.name}</div>
            <div className="text-sm text-[var(--ink-2)]">{detail}</div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Trends =====
function Trends({ records, day, astronaut }) {
  const [feature, setFeature] = useState("hr");
  const W = 900, H = 320, P = 44;
  const rs = records;
  const vals = rs.map((r) => r.values[feature]).filter((v) => v != null);
  const [lo, hi] = DATA.meta.normal_bands[astronaut][feature];
  const ymin = Math.min(lo, ...vals), ymax = Math.max(hi, ...vals);
  const X = (d) => P + ((d - 1) / (DATA.meta.mission.days - 1)) * (W - 2 * P);
  const Y = (v) => H - P - ((v - ymin) / (ymax - ymin || 1)) * (H - 2 * P);
  const line = rs.filter((r) => r.values[feature] != null && r.day <= day).map((r) => `${X(r.day)},${Y(r.values[feature])}`).join(" ");
  const markers = [["Model", "var(--model)", (r) => r.level !== "green" && r.level !== "red"], ["Fixed thresholds", "var(--b1)", (r) => r.rule_alert], ["Personal single-indicator", "var(--b2)", (r) => r.univariate_alert]];
  return (
    <div className="panel p-5">
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(DATA.meta.features).filter((f) => f !== "exercise_min").map((f) => (
          <button key={f} onClick={() => setFeature(f)} className={`tap px-4 rounded-xl text-base ${f === feature ? "bg-[var(--line)]" : "bg-[var(--panel-2)]"}`}>{DATA.meta.features[f].name}</button>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${DATA.meta.features[feature].name} trend`}>
        <rect x={P} y={Y(hi)} width={W - 2 * P} height={Math.max(0, Y(lo) - Y(hi))} fill="var(--panel-2)" />
        <text x={P + 6} y={Y(hi) - 6} fill="var(--ink-2)" fontSize="14">Your normal range</text>
        <polyline points={line} fill="none" stroke="var(--ink)" strokeWidth="2" />
        {markers.map(([label, color, test], i) => rs.filter((r) => r.day <= day && test(r)).map((r) => (
          <rect key={label + r.day} x={X(r.day) - 2} y={8 + i * 10} width="4" height="8" fill={color} />)))}
        <line x1={X(day)} x2={X(day)} y1={P - 10} y2={H - P} stroke="var(--muted)" strokeDasharray="4 4" />
        <text x={P} y={H - 12} fill="var(--muted)" fontSize="13">Day 1</text>
        <text x={W - P} y={H - 12} fill="var(--muted)" fontSize="13" textAnchor="end">Day {DATA.meta.mission.days}</text>
      </svg>
      <div className="flex flex-wrap gap-5 mt-2 text-base text-[var(--ink-2)]">
        {markers.map(([label, color], i) => <span key={label} className="flex items-center gap-2"><span style={{ background: color }} className="inline-block w-3 h-3" />Row {i + 1}: {label} alert</span>)}
      </div>
    </div>
  );
}

// ===== Earth link =====
function EarthLink({ records, day, env, queued, onQueue }) {
  const env_ = DATA.meta.environments[env];
  const onsets = records.filter((r, i) => r.day <= day && ["crew_medical_officer", "flight_surgeon"].includes(r.escalation) &&
                                          (i === 0 || !["crew_medical_officer", "flight_surgeon"].includes(records[i - 1].escalation)));
  return (
    <div className="panel p-5">
      <div className="text-xl font-semibold">Earth link · {env_.name}</div>
      <div className="text-lg text-[var(--ink-2)] mt-1">One-way signal delay: {env_.one_way_delay_text}</div>
      <button onClick={onQueue} className="tap mt-4 px-6 rounded-xl bg-[var(--model)] text-white text-lg font-semibold">Queue health report for downlink</button>
      <div className="mt-4 text-lg">Automatic reports (escalations): {onsets.map((r) => `day ${r.day}`).join(", ") || "none"}</div>
      <div className="mt-2 text-lg">Manually queued: {queued.length ? queued.map((d) => `day ${d}`).join(", ") : "none"}</div>
      <p className="mt-3 text-sm text-[var(--muted)]">Concept: reports are stored locally and sent in the next communication window.</p>
    </div>
  );
}

// ===== Emergency =====
const EMERGENCIES = {
  chest_pain: "Chest pain",
  unconscious: "Crew member unresponsive",
  breathing: "Difficulty breathing",
};
function Emergency({ onClose, env }) {
  const [choice, setChoice] = useState(null);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
      <div className="panel p-6 max-w-2xl w-full border-[var(--critical)]">
        <div className="flex items-center gap-3 text-2xl font-bold"><StatusIcon status="red" size={36} /> Emergency</div>
        {!choice ? (
          <div className="grid gap-3 mt-5">
            {Object.entries(EMERGENCIES).map(([id, label]) => (
              <button key={id} onClick={() => setChoice(id)} className="tap px-5 rounded-xl bg-[var(--panel-2)] text-xl text-left">{label}</button>
            ))}
          </div>
        ) : (
          <div className="mt-5 text-lg">
            <div className="font-semibold text-xl">{EMERGENCIES[choice]}</div>
            <ol className="list-decimal ml-6 mt-3 space-y-2">
              <li>Call the crew medical officer and stay with the crew member.</li>
              <li>Measure heart rate, blood pressure and temperature now.</li>
              <li>Follow the onboard emergency checklist for this symptom.</li>
              <li>Send an urgent report to flight surgeons (delay: {DATA.meta.environments[env].one_way_delay_text}).</li>
            </ol>
            <p className="mt-4 text-sm text-[var(--muted)]">DRAFT placeholder steps — the UI team replaces them with a protocol written from cited sources.</p>
          </div>
        )}
        <button onClick={onClose} className="tap mt-6 px-6 rounded-xl bg-[var(--line)] text-lg">Close</button>
      </div>
    </div>
  );
}

// ===== App =====
function App() {
  if (!DATA) return <div className="p-10 text-xl">Run <code>python -m src.export --crew demo</code> to generate data.js.</div>;
  const crew = DATA.meta.crew;
  const [astronaut, setAstronaut] = useState("A2");
  const [day, setDay] = useState(70);
  const [env, setEnv] = useState(DATA.meta.default_environment);
  const [screen, setScreen] = useState("today");
  const [system, setSystem] = useState("heart");
  const [emergency, setEmergency] = useState(false);
  const [queued, setQueued] = useState([]);
  const records = useMemo(() => DATA.records.filter((r) => r.astronaut === astronaut), [astronaut]);
  const record = records.find((r) => r.day === day);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <div className="text-3xl font-bold mr-4">Baseline</div>
        {crew.map((c) => (
          <button key={c.id} onClick={() => setAstronaut(c.id)} className={`tap px-5 rounded-xl text-lg ${c.id === astronaut ? "bg-[var(--line)]" : "bg-[var(--panel)]"}`}>{c.display_name}</button>
        ))}
        <div className="flex-1" />
        {Object.entries(DATA.meta.environments).map(([id, e]) => (
          <button key={id} onClick={() => setEnv(id)} className={`tap px-4 rounded-xl text-base ${id === env ? "bg-[var(--line)]" : "bg-[var(--panel)]"}`}>{e.name}</button>
        ))}
      </header>

      <div className="panel p-4 mb-4 flex items-center gap-4">
        <div className="text-lg whitespace-nowrap">Mission day <span className="font-bold text-2xl">{day}</span></div>
        <input type="range" min="1" max={DATA.meta.mission.days} value={day} onChange={(e) => setDay(+e.target.value)} className="flex-1" aria-label="Mission day" />
        <nav className="flex gap-2">
          {["today", "trends", "earth"].map((s) => (
            <button key={s} onClick={() => setScreen(s)} className={`tap px-5 rounded-xl text-lg capitalize ${s === screen ? "bg-[var(--line)]" : "bg-[var(--panel-2)]"}`}>{s === "earth" ? "Earth link" : s}</button>
          ))}
        </nav>
      </div>

      {screen === "today" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Gauge record={record} />
          <BodyMap record={record} selected={system} onSelect={setSystem} />
          <WhatChanged record={record} />
          <div className="md:col-span-3"><HazardStrip record={record} env={env} /></div>
          <div className="md:col-span-3"><SystemDetail record={record} system={system} /></div>
        </div>
      )}
      {screen === "trends" && <Trends records={records} day={day} astronaut={astronaut} />}
      {screen === "earth" && <EarthLink records={records} day={day} env={env} queued={queued} onQueue={() => setQueued([...queued, day])} />}

      <button onClick={() => setEmergency(true)} className="fixed bottom-6 right-6 tap px-8 rounded-2xl text-xl font-bold text-white shadow-lg flex items-center gap-3" style={{ background: "var(--critical)" }}>
        <StatusIcon status="red" size={30} /> Emergency
      </button>
      <footer className="mt-8 mb-24 text-sm text-[var(--muted)]">{DATA.meta.disclaimer}</footer>
      {emergency && <Emergency env={env} onClose={() => setEmergency(false)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
