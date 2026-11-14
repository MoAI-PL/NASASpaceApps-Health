// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect } from "react";
import { META } from "../data.js";
import { Glyph, StatusIcon } from "./icons.jsx";
import { TapButton } from "./ui.jsx";

// ===== First-run intro: what Baseline does, in three steps =====
// Shown once per device (App.jsx remembers it; the app works without storage) and again from Help.

const STEPS = [
  {
    icon: <Glyph name="nav_checkin" size={40} className="text-model" />,
    title: "Check in every day",
    body: "About 2 minutes: blood pressure, heart rate, temperature, glucose, sleep, mood and a reaction test. The app guides each measurement.",
  },
  {
    icon: <Glyph name="logo" size={40} className="text-ink" />,
    title: `Baseline learns your normal`,
    body: `In the first ${META.mission.calibration_days} days it learns what is normal for you, not for an average person.`,
  },
  {
    icon: <span className="flex gap-1"><StatusIcon status="yellow" size={34} /><StatusIcon status="orange" size={34} /></span>,
    title: "It warns you early and says what to do",
    body: "When several small changes add up, you see Watch or Act and the next step, often before any single value crosses a limit.",
  },
];

export default function Welcome({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title"
         className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="panel p-6 md:p-8 max-w-3xl w-full max-h-full overflow-auto">
        <p className="flex items-center gap-3 text-ink-2 text-lg"><Glyph name="logo" size={28} /> Baseline</p>
        <h2 id="welcome-title" className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Your health, measured against <em>you</em></h2>

        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-panel-2 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                {s.icon}
                <span className="text-ink-2 text-lg font-semibold" aria-hidden="true">{i + 1}</span>
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="text-base text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-2xl border border-critical/60 p-4 flex items-start gap-3">
          <StatusIcon status="red" size={30} />
          <p className="text-lg"><span className="font-semibold">Emergency is always one tap away</span>, top right. Critical limits work from day 1, without the model.</p>
        </div>

        <p className="mt-4 text-sm text-muted">{META.disclaimer}</p>
        <TapButton onClick={onClose} className="mt-5 w-full md:w-auto text-center bg-model! text-[#06121b]! font-semibold px-10">Start</TapButton>
      </div>
    </div>
  );
}
