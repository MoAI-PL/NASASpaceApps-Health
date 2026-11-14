// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useRef, useState } from "react";

// ===== Countdown: a large timer the crew member starts; the end is shown and announced =====
// Uses wall-clock time (not tick counting), so it stays right if the tab is slowed down.

/** mm:ss for a number of seconds. */
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Countdown({ seconds, label, doneText, onDone, allowSkip = false }) {
  const [endsAt, setEndsAt] = useState(null);
  const [left, setLeft] = useState(seconds);
  const [done, setDone] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (endsAt == null) return undefined;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !fired.current) {
        fired.current = true;
        setDone(true);
        setEndsAt(null);
        onDone?.();
      }
    }, 200);
    return () => clearInterval(id);
  }, [endsAt, onDone]);

  const start = () => { fired.current = false; setDone(false); setLeft(seconds); setEndsAt(Date.now() + seconds * 1000); };
  const finish = () => { setEndsAt(null); setLeft(0); setDone(true); fired.current = true; onDone?.(); };
  const running = endsAt != null;

  return (
    <div className="p-4 rounded-xl bg-panel-2">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-5xl font-bold tabular-nums" aria-hidden="true">{clock(left)}</span>
        {!running && (
          <button type="button" onClick={start} className="tap px-6 rounded-xl bg-model text-on-status text-xl font-semibold">
            {done ? "Restart" : "Start"} {label}
          </button>
        )}
        {running && allowSkip && (
          <button type="button" onClick={finish} className="tap px-5 rounded-xl bg-line text-lg">Skip (demo)</button>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-lg">
        {running ? `${label}: ${clock(left)} left` : done ? doneText : ""}
      </p>
    </div>
  );
}
