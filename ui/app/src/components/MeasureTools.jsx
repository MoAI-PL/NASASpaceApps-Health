// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useRef, useState } from "react";
import Countdown from "./Countdown.jsx";
import Stepper from "./Stepper.jsx";

// ===== Measurement helpers: the app times and calculates, the crew member only reads off =====
// Pulse: 30-second timer, beats × 2 (AHA method). Blood pressure: 5-minute rest timer, two
// readings one minute apart, average (AHA). Reaction: a short tap test, median of five tries.

/** Resting heart rate from beats counted over 30 seconds. */
export function PulseTool({ value, onChange, start }) {
  const [beats, setBeats] = useState(value != null ? Math.round(value / 2) : undefined);
  const setFromBeats = (b) => { setBeats(b); onChange(b == null ? undefined : b * 2); };
  return (
    <div className="grid gap-4">
      <Countdown seconds={30} label="30-second count" doneText="Time! Enter the number of beats you counted." />
      <div>
        <p className="text-lg mb-2">Beats counted in 30 seconds</p>
        <Stepper id="g-beats" label="Beats in 30 seconds" unit="beats" value={beats} onChange={setFromBeats}
                 start={start != null ? Math.round(start / 2) : 35} min={10} max={110} />
      </div>
      {value != null && <p className="text-2xl">= <span className="font-bold">{value}</span> beats per minute</p>}
    </div>
  );
}

/** Blood pressure: rest, two readings a minute apart, the average goes into the check-in. */
export function BpTool({ sys, dia, onChange, start }) {
  const [readings, setReadings] = useState([{}, {}]);
  const setReading = (i, key, v) => {
    const next = readings.map((r, j) => (j === i ? { ...r, [key]: v } : r));
    setReadings(next);
    const full = next.filter((r) => r.sys != null && r.dia != null);
    if (full.length) {
      const avg = (k) => Math.round(full.reduce((s, r) => s + r[k], 0) / full.length);
      onChange(avg("sys"), avg("dia"));
    }
  };
  const Reading = ({ i }) => (
    <div className="grid gap-2">
      <p className="text-lg font-semibold">Reading {i + 1}</p>
      <Stepper id={`g-sys-${i}`} label={`Reading ${i + 1} systolic`} unit="mmHg (upper)" value={readings[i].sys}
               onChange={(v) => setReading(i, "sys", v)} start={start?.sys ?? 120} min={60} max={250} />
      <Stepper id={`g-dia-${i}`} label={`Reading ${i + 1} diastolic`} unit="mmHg (lower)" value={readings[i].dia}
               onChange={(v) => setReading(i, "dia", v)} start={start?.dia ?? 80} min={30} max={150} />
    </div>
  );
  const both = readings.every((r) => r.sys != null && r.dia != null);
  return (
    <div className="grid gap-4">
      <Countdown seconds={300} label="5-minute rest" allowSkip doneText="Rested. Take reading 1 now." />
      {Reading({ i: 0 })}
      <Countdown seconds={60} label="1-minute wait" allowSkip doneText="Take reading 2 now." />
      {Reading({ i: 1 })}
      {sys != null && dia != null && (
        <p className="text-2xl">
          {both ? "Average" : "Recorded"}: <span className="font-bold">{sys}/{dia}</span> mmHg
          {!both && <span className="text-ink-2 text-lg"> (one reading — add the second if you can)</span>}
        </p>
      )}
    </div>
  );
}

/** Short reaction test: five tries, median in milliseconds. Taps before the circle are not counted. */
export function ReactionTest({ value, onChange }) {
  const TRIES = 5;
  const [phase, setPhase] = useState("idle"); // idle | wait | go | early | done
  const [times, setTimes] = useState([]);
  const shownAt = useRef(0), timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []); // no stray timer after leaving the step

  const next = () => {
    setPhase("wait");
    timer.current = setTimeout(() => { shownAt.current = performance.now(); setPhase("go"); }, 1500 + Math.random() * 2500);
  };
  const begin = () => { setTimes([]); next(); };
  const tap = () => {
    if (phase === "wait") { clearTimeout(timer.current); setPhase("early"); return; }
    if (phase === "go") {
      const t = [...times, Math.round(performance.now() - shownAt.current)];
      setTimes(t);
      if (t.length < TRIES) { next(); return; }
      const sorted = [...t].sort((a, b) => a - b);
      onChange(sorted[Math.floor(sorted.length / 2)]);
      setPhase("done");
    }
  };

  const area = {
    idle: "Press Start, then tap here as soon as the circle appears.",
    wait: "Wait for the circle…",
    go: "",
    early: "Too early — that try does not count.",
    done: "Done.",
  }[phase];

  return (
    <div className="grid gap-3">
      {/* pointerdown, not click: click fires on release and would add the finger-lift time.
          Keyboard presses arrive as a click with detail 0. */}
      <button type="button" onPointerDown={tap} onClick={(e) => e.detail === 0 && tap()}
              disabled={phase === "idle" || phase === "done" || phase === "early"}
              aria-label={phase === "go" ? "Tap now" : area}
              className="h-64 rounded-2xl bg-panel-2 border border-line flex items-center justify-center text-xl text-ink-2 select-none">
        {phase === "go"
          ? <span className="block w-32 h-32 rounded-full bg-model" />
          : <span>{area}</span>}
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {(phase === "idle" || phase === "done") && (
          <button type="button" onClick={begin} className="tap px-6 rounded-xl bg-model text-on-status text-xl font-semibold">
            {phase === "done" ? "Test again" : "Start test"}
          </button>
        )}
        {phase === "early" && (
          <button type="button" onClick={next} className="tap px-6 rounded-xl bg-model text-on-status text-xl font-semibold">Try again</button>
        )}
        <span role="status" aria-live="polite" className="text-lg">
          {phase !== "idle" && phase !== "done" && `Try ${Math.min(times.length + 1, TRIES)} of ${TRIES}`}
          {phase === "done" && value != null && <>Your result: <span className="font-bold text-2xl">{value} ms</span> (median of {TRIES})</>}
          {phase === "idle" && value != null && <>Saved result: <span className="font-bold">{value} ms</span></>}
        </span>
      </div>
    </div>
  );
}
