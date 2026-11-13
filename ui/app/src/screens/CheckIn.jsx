// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useState } from "react";
import { INDICATORS, META } from "../data.js";
import { CHECKIN } from "../content/texts.js";
import { Panel, SourceLink, TapButton, Text } from "../components/ui.jsx";

// ===== Check-in: the 8 daily self-measurements, each with How / Why / If abnormal =====
// The demo runs on precomputed model output, so entries here are kept on this screen only
// and do not change the SAI. TODO(UI): decide whether to keep entries in localStorage.
export default function CheckIn({ record }) {
  const [entries, setEntries] = useState({});
  const [open, setOpen] = useState(null);
  const [saved, setSaved] = useState(false);
  const set = (f, v) => { setEntries({ ...entries, [f]: v }); setSaved(false); };

  return (
    <div className="grid gap-4">
      {INDICATORS.map((f) => {
        const feat = META.features[f], card = CHECKIN[f];
        return (
          <Panel key={f}>
            <div className="flex flex-wrap items-center gap-4">
              <label htmlFor={`in-${f}`} className="text-xl font-semibold flex-1 min-w-48">
                {feat.name} <span className="text-muted text-base">({feat.unit})</span>
              </label>
              {card.scale ? (
                <div className="flex gap-2" role="group" aria-label={feat.name}>
                  {card.scale.map((v) => (
                    <TapButton key={v} active={entries[f] === v} onClick={() => set(f, v)} className="text-center font-semibold">{v}</TapButton>
                  ))}
                </div>
              ) : (
                <input id={`in-${f}`} type="number" inputMode="decimal" step={card.step}
                       value={entries[f] ?? ""} onChange={(e) => set(f, e.target.value === "" ? undefined : +e.target.value)}
                       className="tap w-40 px-4 rounded-xl bg-panel-2 border border-line text-xl" />
              )}
              <TapButton active={open === f} onClick={() => setOpen(open === f ? null : f)}>How / Why</TapButton>
            </div>
            <p className="mt-2 text-ink-2">Recorded today: {record.values[f] ?? "missing"}</p>
            {open === f && (
              <dl className="mt-3 grid gap-2 text-lg">
                <dt className="text-ink-2">How</dt><dd><Text>{card.how}</Text></dd>
                <dt className="text-ink-2">Why</dt><dd><Text>{card.why}</Text></dd>
                <dt className="text-ink-2">If abnormal</dt><dd><Text>{card.ifAbnormal}</Text></dd>
                <dd><SourceLink id={card.source} /></dd>
              </dl>
            )}
          </Panel>
        );
      })}
      <TapButton onClick={() => setSaved(true)} className="bg-model! text-white font-semibold text-center">Save check-in</TapButton>
      {saved && <p role="status" className="text-lg">Saved on this device. (Demo: the index uses the precomputed mission data.)</p>}
    </div>
  );
}
