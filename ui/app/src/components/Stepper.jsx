// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

// ===== Number stepper: large − / + buttons around a typed value (gloves, microgravity) =====
// Empty until the crew member acts. The first − or + starts from `start` (their personal normal),
// so the usual value is a few taps away and nothing is pre-filled without a tap.

const decimals = (step) => (String(step).split(".")[1] ?? "").length;

export default function Stepper({ id, label, unit, value, onChange, step = 1, start, min, max, invalid }) {
  const round = (v) => +v.toFixed(decimals(step));
  const clamp = (v) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  const bump = (dir) => onChange(round(clamp(value == null ? start : value + dir * step)));
  return (
    <div className="flex items-stretch gap-2" role="group" aria-label={label}>
      <button type="button" onClick={() => bump(-1)} aria-label={`${label}: decrease by ${step}`}
              className="tap w-16 rounded-xl bg-panel-2 text-3xl font-bold">−</button>
      <label className="sr-only" htmlFor={id}>{label} ({unit})</label>
      <input id={id} type="number" inputMode="decimal" step={step} min={min} max={max}
             value={value ?? ""} placeholder="—"
             onChange={(e) => onChange(e.target.value === "" ? undefined : +e.target.value)}
             aria-invalid={invalid ? true : undefined}
             className={`tap w-24 sm:w-32 min-w-0 text-center rounded-xl bg-panel-2 border text-3xl font-semibold
                         ${invalid ? "border-critical border-2" : "border-line"}`} />
      <button type="button" onClick={() => bump(1)} aria-label={`${label}: increase by ${step}`}
              className="tap w-16 rounded-xl bg-panel-2 text-3xl font-bold">+</button>
      <span className="self-center text-ink-2 text-lg">{unit}</span>
    </div>
  );
}
