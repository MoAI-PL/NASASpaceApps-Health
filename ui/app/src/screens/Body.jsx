// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import BodyMap from "../components/BodyMap.jsx";
import DriftRadar from "../components/DriftRadar.jsx";
import SystemDetail from "../components/SystemDetail.jsx";

// ===== Body map: pick a system → status, what changed and since when, why, actions =====
// Below it, the drift radar shows all indicators at once against the personal normal.
export default function Body({ record, records, system, onSelect }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BodyMap record={record} selected={system} onSelect={onSelect} />
      <SystemDetail record={record} records={records} system={system} />
      <div className="lg:col-span-2"><DriftRadar record={record} records={records} /></div>
    </div>
  );
}
