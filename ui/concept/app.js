// Baseline — NASA Space Apps Challenge 2026 — CONCEPT UI
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
// Source of app.js. Rebuild after edits: see ui/README.md.
const {
  useState,
  useMemo
} = React;
const DATA = window.BASELINE_DATA;

// ===== Status vocabulary: colour + icon shape + word, never colour alone =====
const STATUS = {
  green: {
    color: "var(--good)",
    label: "Nominal",
    shape: "circle"
  },
  yellow: {
    color: "var(--warning)",
    label: "Watch",
    shape: "triangle"
  },
  orange: {
    color: "var(--serious)",
    label: "Act",
    shape: "diamond"
  },
  red: {
    color: "var(--critical)",
    label: "Critical",
    shape: "octagon"
  },
  info: {
    color: "var(--ink-2)",
    label: "Info",
    shape: "square"
  }
};
function StatusIcon({
  status,
  size = 28
}) {
  const s = STATUS[status] || STATUS.info,
    h = size / 2;
  const glyph = {
    circle: "✓",
    triangle: "!",
    diamond: "!!",
    octagon: "✕",
    square: "i"
  }[s.shape];
  let shape;
  if (s.shape === "circle") shape = /*#__PURE__*/React.createElement("circle", {
    cx: h,
    cy: h,
    r: h - 1,
    fill: s.color
  });
  if (s.shape === "triangle") shape = /*#__PURE__*/React.createElement("polygon", {
    points: `${h},1 ${size - 1},${size - 2} 1,${size - 2}`,
    fill: s.color
  });
  if (s.shape === "diamond") shape = /*#__PURE__*/React.createElement("polygon", {
    points: `${h},1 ${size - 1},${h} ${h},${size - 1} 1,${h}`,
    fill: s.color
  });
  if (s.shape === "octagon") {
    const a = size * 0.29;
    shape = /*#__PURE__*/React.createElement("polygon", {
      points: `${a},1 ${size - a},1 ${size - 1},${a} ${size - 1},${size - a} ${size - a},${size - 1} ${a},${size - 1} 1,${size - a} 1,${a}`,
      fill: s.color
    });
  }
  if (s.shape === "square") shape = /*#__PURE__*/React.createElement("rect", {
    x: "1",
    y: "1",
    width: size - 2,
    height: size - 2,
    rx: "4",
    fill: s.color
  });
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    role: "img",
    "aria-label": s.label
  }, shape, /*#__PURE__*/React.createElement("text", {
    x: h,
    y: s.shape === "triangle" ? h + size * 0.2 : h + size * 0.17,
    textAnchor: "middle",
    fontSize: size * 0.45,
    fontWeight: "700",
    fill: status === "yellow" ? "#0b0b0b" : "#ffffff"
  }, glyph));
}
function StatusChip({
  status
}) {
  const s = STATUS[status] || STATUS.info;
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--panel-2)] text-base"
  }, /*#__PURE__*/React.createElement(StatusIcon, {
    status: status,
    size: 22
  }), " ", s.label);
}

// ===== Hazard icons (own SVG, no third-party assets) =====
const HAZARD_ICON = {
  radiation: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "16",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 13 L10 3 A14 14 0 0 1 22 3 Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18.6 17.5 L29 22 A14 14 0 0 1 23 29 Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13.4 17.5 L9 29 A14 14 0 0 1 3 22 Z"
  })),
  isolation: /*#__PURE__*/React.createElement("g", {
    fill: "none",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "26",
    height: "26",
    rx: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 25 C9 19 23 19 23 25"
  })),
  distance: /*#__PURE__*/React.createElement("g", {
    fill: "none",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "16",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "27",
    cy: "16",
    r: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 16 H22",
    strokeDasharray: "2 3"
  })),
  gravity: /*#__PURE__*/React.createElement("g", {
    fill: "none",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M16 4 V26"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 19 L16 26 L23 19"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 29 H27"
  })),
  closed_environment: /*#__PURE__*/React.createElement("g", {
    fill: "none",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 26 V12 A10 10 0 0 1 26 12 V26 Z"
  }), /*#__PURE__*/React.createElement("text", {
    x: "16",
    y: "22",
    fontSize: "8",
    textAnchor: "middle",
    stroke: "none",
    fill: "currentColor"
  }, "CO₂"))
};
const PROMPT_TEXT = {
  repeat_bp_hr_rest: "Re-measure blood pressure and resting heart rate",
  repeat_glucose_fasting: "Re-measure fasting blood glucose",
  reaction_test_mood_checkin: "Do the reaction test and mood check-in",
  repeat_temperature_evening: "Re-measure body temperature this evening"
};
const ESCALATION_TEXT = {
  monitor: "Keep the daily routine",
  self_care: "Self-care actions",
  crew_medical_officer: "Inform the crew medical officer",
  flight_surgeon: "Emergency: onboard protocol + flight surgeons"
};

// ===== SAI gauge =====
function Gauge({
  record
}) {
  const sai = record.sai,
    level = record.level;
  const angle = sai == null ? 0 : sai / 100 * 180;
  const r = 90,
    cx = 110,
    cy = 110;
  const end = a => [cx - r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  const [ex, ey] = end(angle);
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-5 flex flex-col items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[var(--ink-2)] text-lg"
  }, "Systemic Anomaly Index"), /*#__PURE__*/React.createElement("svg", {
    width: "220",
    height: "130",
    viewBox: "0 0 220 130",
    role: "img",
    "aria-label": `SAI ${sai ?? "calibrating"}`
  }, /*#__PURE__*/React.createElement("path", {
    d: `M20 110 A90 90 0 0 1 200 110`,
    stroke: "var(--line)",
    strokeWidth: "18",
    fill: "none",
    strokeLinecap: "round"
  }), sai != null && /*#__PURE__*/React.createElement("path", {
    d: `M20 110 A90 90 0 0 1 ${ex} ${ey}`,
    stroke: STATUS[level].color,
    strokeWidth: "18",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("text", {
    x: "110",
    y: "100",
    textAnchor: "middle",
    fontSize: "44",
    fontWeight: "700",
    fill: "var(--ink)"
  }, sai ?? "—")), /*#__PURE__*/React.createElement(StatusChip, {
    status: level
  }), record.calibrating && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 text-[var(--ink-2)] text-center"
  }, "Learning your personal baseline · day ", record.day, " of ", DATA.meta.mission.calibration_days));
}

// ===== Body map =====
const ZONES = {
  mind_sleep: {
    label: "Mind & sleep",
    path: /*#__PURE__*/React.createElement("circle", {
      cx: "100",
      cy: "42",
      r: "28"
    }),
    icon: [128, 20]
  },
  heart: {
    label: "Heart & circulation",
    path: /*#__PURE__*/React.createElement("rect", {
      x: "68",
      y: "80",
      width: "64",
      height: "58",
      rx: "18"
    }),
    icon: [134, 80]
  },
  metabolism: {
    label: "Metabolism",
    path: /*#__PURE__*/React.createElement("rect", {
      x: "72",
      y: "142",
      width: "56",
      height: "50",
      rx: "16"
    }),
    icon: [130, 142]
  },
  immune_temp: {
    label: "Immune & temperature",
    path: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
      x: "34",
      y: "84",
      width: "26",
      height: "100",
      rx: "13"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "140",
      y: "84",
      width: "26",
      height: "100",
      rx: "13"
    })),
    icon: [168, 84]
  }
};
function BodyMap({
  record,
  selected,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[var(--ink-2)] text-lg mb-2"
  }, "Body systems"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-4 items-start"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "200",
    height: "300",
    viewBox: "0 0 200 300",
    role: "img",
    "aria-label": "Body map"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M80 196 L74 290 H96 L100 210 L104 290 H126 L120 196 Z",
    fill: "var(--panel-2)"
  }), Object.entries(ZONES).map(([id, z]) => {
    const st = record.systems[id];
    return /*#__PURE__*/React.createElement("g", {
      key: id,
      onClick: () => onSelect(id),
      style: {
        cursor: "pointer"
      },
      fill: st === "green" ? "var(--panel-2)" : STATUS[st].color,
      fillOpacity: st === "green" ? 1 : 0.35,
      stroke: selected === id ? "var(--ink)" : STATUS[st].color,
      strokeWidth: selected === id ? 4 : 2
    }, z.path);
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2 flex-1"
  }, Object.entries(ZONES).map(([id, z]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onSelect(id),
    className: `tap flex items-center gap-3 px-4 rounded-xl text-left text-lg ${selected === id ? "bg-[var(--line)]" : "bg-[var(--panel-2)]"}`
  }, /*#__PURE__*/React.createElement(StatusIcon, {
    status: record.systems[id]
  }), " ", z.label)))));
}

// ===== System detail =====
function SystemDetail({
  record,
  system
}) {
  const features = DATA.meta.systems[system].features;
  const bands = DATA.meta.normal_bands[record.astronaut];
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-xl font-semibold"
  }, /*#__PURE__*/React.createElement(StatusIcon, {
    status: record.systems[system]
  }), " ", DATA.meta.systems[system].name), /*#__PURE__*/React.createElement("table", {
    className: "w-full mt-3 text-lg"
  }, /*#__PURE__*/React.createElement("tbody", null, features.map(f => {
    const v = record.values[f],
      [lo, hi] = bands[f];
    const out = v != null && (v < lo || v > hi);
    return /*#__PURE__*/React.createElement("tr", {
      key: f,
      className: "border-t border-[var(--line)]"
    }, /*#__PURE__*/React.createElement("td", {
      className: "py-2"
    }, DATA.meta.features[f].name), /*#__PURE__*/React.createElement("td", {
      className: "py-2 text-right font-semibold"
    }, v ?? "missing", " ", /*#__PURE__*/React.createElement("span", {
      className: "text-[var(--muted)] text-base"
    }, DATA.meta.features[f].unit)), /*#__PURE__*/React.createElement("td", {
      className: "py-2 text-right text-[var(--ink-2)] text-base"
    }, "your normal ", lo, "–", hi, " ", out && /*#__PURE__*/React.createElement("span", {
      className: "ml-1"
    }, "▲")));
  }))), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-[var(--muted)] text-sm"
  }, "TODO(UI): why this system matters in space + actions, each with a cited NASA HRP source."));
}

// ===== What changed + prompts =====
function WhatChanged({
  record
}) {
  const entries = Object.entries(record.contributions).filter(([f]) => f !== "other");
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[var(--ink-2)] text-lg mb-3"
  }, "What moved away from your normal"), record.sai == null ? /*#__PURE__*/React.createElement("div", {
    className: "text-[var(--muted)]"
  }, "Not enough days yet.") : entries.map(([f, share]) => /*#__PURE__*/React.createElement("div", {
    key: f,
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-lg"
  }, /*#__PURE__*/React.createElement("span", null, DATA.meta.features[f].name), /*#__PURE__*/React.createElement("span", null, Math.round(share * 100), "%")), /*#__PURE__*/React.createElement("div", {
    className: "h-3 rounded bg-[var(--panel-2)]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-3 rounded",
    style: {
      width: `${share * 100}%`,
      background: "var(--model)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 text-[var(--ink-2)] text-lg"
  }, "Today's actions"), record.prompts.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-lg mt-1"
  }, "Routine measurements only.") : record.prompts.map(p => /*#__PURE__*/React.createElement("div", {
    key: p,
    className: "tap mt-2 flex items-center gap-3 px-4 rounded-xl bg-[var(--panel-2)] text-lg"
  }, "▶ ", PROMPT_TEXT[p])), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 flex items-center gap-3 text-lg"
  }, /*#__PURE__*/React.createElement(StatusIcon, {
    status: record.level
  }), " ", ESCALATION_TEXT[record.escalation]));
}

// ===== Hazard strip =====
function HazardStrip({
  record,
  env
}) {
  const delay = DATA.meta.environments[env].one_way_delay_text;
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-4 grid grid-cols-5 gap-3"
  }, Object.entries(DATA.meta.hazards).map(([id, h]) => {
    const st = record.hazards[id];
    const detail = id === "radiation" ? `${record.context.radiation_cum_mGy} mGy total` : id === "closed_environment" ? `CO₂ ${record.context.cabin_co2_mmHg} mmHg` : id === "distance" ? `Earth: ${delay}` : STATUS[st].label;
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      className: "flex flex-col items-center gap-1 text-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("svg", {
      width: "32",
      height: "32",
      viewBox: "0 0 32 32",
      fill: "currentColor",
      stroke: "currentColor",
      className: "text-[var(--ink)]"
    }, HAZARD_ICON[id]), /*#__PURE__*/React.createElement(StatusIcon, {
      status: st,
      size: 22
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-base"
    }, h.name), /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-[var(--ink-2)]"
    }, detail));
  }));
}

// ===== Trends =====
function Trends({
  records,
  day,
  astronaut
}) {
  const [feature, setFeature] = useState("hr");
  const W = 900,
    H = 320,
    P = 44;
  const rs = records;
  const vals = rs.map(r => r.values[feature]).filter(v => v != null);
  const [lo, hi] = DATA.meta.normal_bands[astronaut][feature];
  const ymin = Math.min(lo, ...vals),
    ymax = Math.max(hi, ...vals);
  const X = d => P + (d - 1) / (DATA.meta.mission.days - 1) * (W - 2 * P);
  const Y = v => H - P - (v - ymin) / (ymax - ymin || 1) * (H - 2 * P);
  const line = rs.filter(r => r.values[feature] != null && r.day <= day).map(r => `${X(r.day)},${Y(r.values[feature])}`).join(" ");
  const markers = [["Model", "var(--model)", r => r.level !== "green" && r.level !== "red"], ["Fixed thresholds", "var(--b1)", r => r.rule_alert], ["Personal single-indicator", "var(--b2)", r => r.univariate_alert]];
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-3"
  }, Object.keys(DATA.meta.features).filter(f => f !== "exercise_min").map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setFeature(f),
    className: `tap px-4 rounded-xl text-base ${f === feature ? "bg-[var(--line)]" : "bg-[var(--panel-2)]"}`
  }, DATA.meta.features[f].name))), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label": `${DATA.meta.features[feature].name} trend`
  }, /*#__PURE__*/React.createElement("rect", {
    x: P,
    y: Y(hi),
    width: W - 2 * P,
    height: Math.max(0, Y(lo) - Y(hi)),
    fill: "var(--panel-2)"
  }), /*#__PURE__*/React.createElement("text", {
    x: P + 6,
    y: Y(hi) - 6,
    fill: "var(--ink-2)",
    fontSize: "14"
  }, "Your normal range"), /*#__PURE__*/React.createElement("polyline", {
    points: line,
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2"
  }), markers.map(([label, color, test], i) => rs.filter(r => r.day <= day && test(r)).map(r => /*#__PURE__*/React.createElement("rect", {
    key: label + r.day,
    x: X(r.day) - 2,
    y: 8 + i * 10,
    width: "4",
    height: "8",
    fill: color
  }))), /*#__PURE__*/React.createElement("line", {
    x1: X(day),
    x2: X(day),
    y1: P - 10,
    y2: H - P,
    stroke: "var(--muted)",
    strokeDasharray: "4 4"
  }), /*#__PURE__*/React.createElement("text", {
    x: P,
    y: H - 12,
    fill: "var(--muted)",
    fontSize: "13"
  }, "Day 1"), /*#__PURE__*/React.createElement("text", {
    x: W - P,
    y: H - 12,
    fill: "var(--muted)",
    fontSize: "13",
    textAnchor: "end"
  }, "Day ", DATA.meta.mission.days)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-5 mt-2 text-base text-[var(--ink-2)]"
  }, markers.map(([label, color], i) => /*#__PURE__*/React.createElement("span", {
    key: label,
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: color
    },
    className: "inline-block w-3 h-3"
  }), "Row ", i + 1, ": ", label, " alert"))));
}

// ===== Earth link =====
function EarthLink({
  records,
  day,
  env,
  queued,
  onQueue
}) {
  const env_ = DATA.meta.environments[env];
  const onsets = records.filter((r, i) => r.day <= day && ["crew_medical_officer", "flight_surgeon"].includes(r.escalation) && (i === 0 || !["crew_medical_officer", "flight_surgeon"].includes(records[i - 1].escalation)));
  return /*#__PURE__*/React.createElement("div", {
    className: "panel p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-semibold"
  }, "Earth link · ", env_.name), /*#__PURE__*/React.createElement("div", {
    className: "text-lg text-[var(--ink-2)] mt-1"
  }, "One-way signal delay: ", env_.one_way_delay_text), /*#__PURE__*/React.createElement("button", {
    onClick: onQueue,
    className: "tap mt-4 px-6 rounded-xl bg-[var(--model)] text-white text-lg font-semibold"
  }, "Queue health report for downlink"), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 text-lg"
  }, "Automatic reports (escalations): ", onsets.map(r => `day ${r.day}`).join(", ") || "none"), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 text-lg"
  }, "Manually queued: ", queued.length ? queued.map(d => `day ${d}`).join(", ") : "none"), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm text-[var(--muted)]"
  }, "Concept: reports are stored locally and sent in the next communication window."));
}

// ===== Emergency =====
const EMERGENCIES = {
  chest_pain: "Chest pain",
  unconscious: "Crew member unresponsive",
  breathing: "Difficulty breathing"
};
function Emergency({
  onClose,
  env
}) {
  const [choice, setChoice] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel p-6 max-w-2xl w-full border-[var(--critical)]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-2xl font-bold"
  }, /*#__PURE__*/React.createElement(StatusIcon, {
    status: "red",
    size: 36
  }), " Emergency"), !choice ? /*#__PURE__*/React.createElement("div", {
    className: "grid gap-3 mt-5"
  }, Object.entries(EMERGENCIES).map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setChoice(id),
    className: "tap px-5 rounded-xl bg-[var(--panel-2)] text-xl text-left"
  }, label))) : /*#__PURE__*/React.createElement("div", {
    className: "mt-5 text-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-xl"
  }, EMERGENCIES[choice]), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal ml-6 mt-3 space-y-2"
  }, /*#__PURE__*/React.createElement("li", null, "Call the crew medical officer and stay with the crew member."), /*#__PURE__*/React.createElement("li", null, "Measure heart rate, blood pressure and temperature now."), /*#__PURE__*/React.createElement("li", null, "Follow the onboard emergency checklist for this symptom."), /*#__PURE__*/React.createElement("li", null, "Send an urgent report to flight surgeons (delay: ", DATA.meta.environments[env].one_way_delay_text, ").")), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-sm text-[var(--muted)]"
  }, "DRAFT placeholder steps — the UI team replaces them with a protocol written from cited sources.")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "tap mt-6 px-6 rounded-xl bg-[var(--line)] text-lg"
  }, "Close")));
}

// ===== App =====
function App() {
  if (!DATA) return /*#__PURE__*/React.createElement("div", {
    className: "p-10 text-xl"
  }, "Run ", /*#__PURE__*/React.createElement("code", null, "python -m src.export --crew demo"), " to generate data.js.");
  const crew = DATA.meta.crew;
  const [astronaut, setAstronaut] = useState("A2");
  const [day, setDay] = useState(70);
  const [env, setEnv] = useState(DATA.meta.default_environment);
  const [screen, setScreen] = useState("today");
  const [system, setSystem] = useState("heart");
  const [emergency, setEmergency] = useState(false);
  const [queued, setQueued] = useState([]);
  const records = useMemo(() => DATA.records.filter(r => r.astronaut === astronaut), [astronaut]);
  const record = records.find(r => r.day === day);
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto p-4 md:p-6"
  }, /*#__PURE__*/React.createElement("header", {
    className: "flex flex-wrap items-center gap-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-bold mr-4"
  }, "Baseline"), crew.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => setAstronaut(c.id),
    className: `tap px-5 rounded-xl text-lg ${c.id === astronaut ? "bg-[var(--line)]" : "bg-[var(--panel)]"}`
  }, c.display_name)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }), Object.entries(DATA.meta.environments).map(([id, e]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setEnv(id),
    className: `tap px-4 rounded-xl text-base ${id === env ? "bg-[var(--line)]" : "bg-[var(--panel)]"}`
  }, e.name))), /*#__PURE__*/React.createElement("div", {
    className: "panel p-4 mb-4 flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg whitespace-nowrap"
  }, "Mission day ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-2xl"
  }, day)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "1",
    max: DATA.meta.mission.days,
    value: day,
    onChange: e => setDay(+e.target.value),
    className: "flex-1",
    "aria-label": "Mission day"
  }), /*#__PURE__*/React.createElement("nav", {
    className: "flex gap-2"
  }, ["today", "trends", "earth"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setScreen(s),
    className: `tap px-5 rounded-xl text-lg capitalize ${s === screen ? "bg-[var(--line)]" : "bg-[var(--panel-2)]"}`
  }, s === "earth" ? "Earth link" : s)))), screen === "today" && /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 md:grid-cols-3"
  }, /*#__PURE__*/React.createElement(Gauge, {
    record: record
  }), /*#__PURE__*/React.createElement(BodyMap, {
    record: record,
    selected: system,
    onSelect: setSystem
  }), /*#__PURE__*/React.createElement(WhatChanged, {
    record: record
  }), /*#__PURE__*/React.createElement("div", {
    className: "md:col-span-3"
  }, /*#__PURE__*/React.createElement(HazardStrip, {
    record: record,
    env: env
  })), /*#__PURE__*/React.createElement("div", {
    className: "md:col-span-3"
  }, /*#__PURE__*/React.createElement(SystemDetail, {
    record: record,
    system: system
  }))), screen === "trends" && /*#__PURE__*/React.createElement(Trends, {
    records: records,
    day: day,
    astronaut: astronaut
  }), screen === "earth" && /*#__PURE__*/React.createElement(EarthLink, {
    records: records,
    day: day,
    env: env,
    queued: queued,
    onQueue: () => setQueued([...queued, day])
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEmergency(true),
    className: "fixed bottom-6 right-6 tap px-8 rounded-2xl text-xl font-bold text-white shadow-lg flex items-center gap-3",
    style: {
      background: "var(--critical)"
    }
  }, /*#__PURE__*/React.createElement(StatusIcon, {
    status: "red",
    size: 30
  }), " Emergency"), /*#__PURE__*/React.createElement("footer", {
    className: "mt-8 mb-24 text-sm text-[var(--muted)]"
  }, DATA.meta.disclaimer), emergency && /*#__PURE__*/React.createElement(Emergency, {
    env: env,
    onClose: () => setEmergency(false)
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
