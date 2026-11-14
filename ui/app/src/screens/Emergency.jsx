// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect, useState } from "react";
import { META, fmt, roundTripText } from "../data.js";
import { EMERGENCY, EMERGENCY_START } from "../content/texts.js";
import { StatusIcon } from "../components/icons.jsx";
import { SourceLink, TapButton, Text } from "../components/ui.jsx";

// ===== Emergency (Respond path): a crew mate is guided step by step; works without the model =====
// The flow (content/texts.js EMERGENCY) starts with responsiveness and breathing, then branches.
// A history stack gives a reliable Back button; nothing here depends on the anomaly model.

/** One answer / follow-up button: status shape + words, large tap target. */
function Choice({ option, onPick }) {
  return (
    <TapButton onClick={() => onPick(option.next)} className="text-xl flex items-center gap-3">
      {option.status && <StatusIcon status={option.status} size={26} />} {option.label}
    </TapButton>
  );
}

export default function Emergency({ env, record, onClose }) {
  const [path, setPath] = useState([EMERGENCY_START]);
  const id = path[path.length - 1];
  const node = EMERGENCY[id];
  const go = (next) => setPath([...path, next]);
  const back = () => setPath(path.slice(0, -1));
  const environment = META.environments[env];
  const co2 = record?.context?.cabin_co2_mmHg;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="em-title"
         className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="panel p-6 max-w-2xl w-full border-critical! max-h-full overflow-auto">
        <p className="flex items-center gap-3 text-xl font-bold text-ink-2"><StatusIcon status="red" size={30} /> Emergency</p>

        <h2 id="em-title" className="mt-4 text-2xl font-bold">{node.title}</h2>
        {node.prompt && <p className="mt-2 text-xl">{node.prompt}</p>}

        {node.options && (
          <div className="grid gap-3 mt-5">
            {node.options.map((o) => <Choice key={o.next + o.label} option={o} onPick={go} />)}
          </div>
        )}

        {node.steps && (
          <ol className="list-decimal ml-7 mt-4 space-y-3 text-lg">
            {node.steps.map((s, i) => <li key={i}><Text>{s}</Text></li>)}
          </ol>
        )}

        {id === "breathing" && co2 != null && (
          <p className="mt-4 flex items-center gap-3 text-lg">
            <StatusIcon status={co2 > META.cabin_co2_limit_mmHg ? "orange" : "green"} size={24} />
            Cabin CO₂ now: <span className="font-semibold">{fmt("cabin_co2_mmHg", co2)} mmHg</span>
            <span className="text-ink-2">(limit {META.cabin_co2_limit_mmHg} mmHg)</span>
          </p>
        )}

        {node.then && (
          <div className="grid gap-3 mt-5">
            {node.then.map((o) => <Choice key={o.next + o.label} option={o} onPick={go} />)}
          </div>
        )}

        {node.source && <div className="mt-4"><SourceLink id={node.source} /></div>}

        <div className="mt-5 p-4 rounded-xl bg-panel-2 text-lg">
          <p>Earth: {environment.name} · signal {environment.one_way_delay_text} one way. Any reply takes at least the round trip ({roundTripText(env)}).</p>
          <p className="mt-1 text-ink-2 text-base">These steps support, never replace, your medical training and onboard procedures.</p>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {path.length > 1 && <TapButton onClick={back}>◀ Back</TapButton>}
          {path.length > 1 && <TapButton onClick={() => setPath([EMERGENCY_START])}>Start over</TapButton>}
          <TapButton onClick={onClose} className="bg-line! ml-auto">Close</TapButton>
        </div>
      </div>
    </div>
  );
}
