// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { META, offNormalSince } from "../data.js";
import { PROMPTS, SYSTEM_TEXT } from "../content/texts.js";
import { Glyph, StatusIcon } from "./icons.jsx";
import { SourceLink, Text } from "./ui.jsx";

// ===== One body system: values vs personal normal, since when, why, actions =====
export default function SystemDetail({ record, records, system }) {
  const sys = META.systems[system];
  const bands = META.normal_bands[record.astronaut];
  const since = offNormalSince(records, record.day, system);
  const promptId = META.prompts && Object.keys(META.prompts).find((p) => META.prompts[p].system === system);
  const promptOpen = record.prompts.includes(promptId);
  const text = SYSTEM_TEXT[system];

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <StatusIcon status={record.systems[system]} /> <Glyph name={system} size={26} className="text-ink-2" /> {sys.name}
      </h2>
      <p className="mt-2 text-lg text-ink-2">
        {since == null ? "Within your normal." : `Away from your normal since day ${since} (${record.day - since + 1} days).`}
      </p>

      <table className="w-full mt-3 text-lg">
        <tbody>
          {sys.features.map((f) => {
            const v = record.values[f], [lo, hi] = bands[f];
            const dir = v == null ? null : v < lo ? "▼ below" : v > hi ? "▲ above" : null;
            return (
              <tr key={f} className="border-t border-line">
                <td className="py-2">{META.features[f].name}</td>
                <td className="py-2 text-right font-semibold">
                  {v ?? "missing"} <span className="text-muted text-base">{META.features[f].unit}</span>
                </td>
                <td className="py-2 text-right text-ink-2 text-base">
                  your normal {lo}–{hi} {dir && <span className="ml-1 font-semibold text-ink">{dir}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 className="mt-4 text-ink-2">Why it matters in space</h3>
      <p className="mt-1"><Text>{text.whyInSpace}</Text></p>
      <h3 className="mt-4 text-ink-2">What to do</h3>
      <p className="mt-1 text-lg">{promptOpen ? `▶ ${PROMPTS[promptId].title}` : "Routine measurements only."}</p>
      <div className="mt-3"><SourceLink id={text.source} /></div>
    </section>
  );
}
