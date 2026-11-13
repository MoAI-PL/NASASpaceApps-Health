// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useState } from "react";
import { META } from "../data.js";
import { EMERGENCIES } from "../content/texts.js";
import { StatusIcon } from "../components/icons.jsx";
import { SourceLink, TapButton, Text } from "../components/ui.jsx";

// ===== Emergency (Respond path): symptom → steps; works without the model =====
export default function Emergency({ env, onClose }) {
  const [choice, setChoice] = useState(null);
  const em = choice && EMERGENCIES[choice];
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label="Emergency" className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="panel p-6 max-w-2xl w-full border-critical! max-h-full overflow-auto">
        <h2 className="flex items-center gap-3 text-2xl font-bold"><StatusIcon status="red" size={36} /> Emergency</h2>
        {!em ? (
          <div className="grid gap-3 mt-5">
            {Object.entries(EMERGENCIES).map(([id, e]) => (
              <TapButton key={id} onClick={() => setChoice(id)} className="text-xl">{e.title}</TapButton>
            ))}
          </div>
        ) : (
          <div className="mt-5 text-lg">
            <div className="font-semibold text-xl">{em.title}</div>
            <ol className="list-decimal ml-6 mt-3 space-y-2">
              {em.steps.map((s, i) => <li key={i}><Text>{s}</Text></li>)}
            </ol>
            <p className="mt-3">Signal delay to flight surgeons: {META.environments[env].one_way_delay_text} one way.</p>
            {em.draft && <p className="mt-3 text-sm text-muted">DRAFT steps — not yet written from a cited source.</p>}
            {em.source && <div className="mt-2"><SourceLink id={em.source} /></div>}
            <TapButton onClick={() => setChoice(null)} className="mt-4">◀ Other symptom</TapButton>
          </div>
        )}
        <TapButton onClick={onClose} className="mt-6 bg-line!">Close</TapButton>
      </div>
    </div>
  );
}
