// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect } from "react";
import { META } from "../data.js";
import { STATUS_HELP, STATUS_LABEL } from "../content/texts.js";
import { Glyph, StatusIcon } from "./icons.jsx";
import { TapButton } from "./ui.jsx";

// ===== Help: how to read Astrobalance (status shapes, the index, hazard icons) =====
// Opened from the "?" button in the header, so the legend is one tap away on every screen.

export default function HelpDialog({ onClose, onIntro, onAbout }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="help-title"
         className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="panel p-6 max-w-2xl w-full max-h-full overflow-auto">
        <h2 id="help-title" className="text-2xl font-bold">How to read Astrobalance</h2>

        <h3 className="mt-5 text-ink-2 text-lg">Status — always a shape, a word and a colour</h3>
        <ul className="mt-2 grid gap-3">
          {STATUS_HELP.map((s) => (
            <li key={s.status} className="flex items-start gap-3 text-lg">
              <StatusIcon status={s.status} size={32} />
              <span>
                <span className="font-semibold">{STATUS_LABEL[s.status]}</span> — {s.meaning}
                {s.action && <span className="block text-ink-2">{s.action}</span>}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-ink-2 text-lg">{META.index.name} (0–100)</h3>
        <p className="mt-1 text-lg">
          How unusual your last 7 days are for you, compared with healthy days. Higher means more unusual.
          Watch from {META.index.p_yellow}, act from {META.index.p_orange}. It does not diagnose anything.
        </p>

        <h3 className="mt-5 text-ink-2 text-lg">Spaceflight hazards (NASA Human Research Program)</h3>
        <ul className="mt-2 grid sm:grid-cols-2 gap-2 text-lg">
          {Object.entries(META.hazards).map(([id, h]) => (
            <li key={id} className="flex items-center gap-3"><Glyph name={id} size={28} className="text-ink-2" /> {h.name}</li>
          ))}
        </ul>

        <p className="mt-5 text-ink-2">{META.disclaimer}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <TapButton onClick={onClose} className="bg-line!">Close</TapButton>
          {onAbout && <TapButton onClick={onAbout}>How we know · sources</TapButton>}
          {onIntro && <TapButton onClick={onIntro}>Show the 3-step intro</TapButton>}
        </div>
      </div>
    </div>
  );
}
