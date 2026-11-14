// Baseline — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0

import { useEffect } from "react";
import { META } from "../data.js";
import HowWeKnow from "../screens/HowWeKnow.jsx";
import { SourcesList } from "../screens/Settings.jsx";
import { TapButton } from "./ui.jsx";

// ===== About Baseline: how it works, the evidence and its limits, every source =====
// Opened from Help ("?") and from Trends ("Why trust this?"), so it is one tap away without
// needing its own tab.

export default function AboutDialog({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="about-title"
         className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="panel p-4 sm:p-6 max-w-6xl w-full max-h-full overflow-auto">
        <div className="flex items-center gap-3 mb-4">
          <h2 id="about-title" className="text-2xl font-bold flex-1">How we know — method, evidence, limits</h2>
          <TapButton onClick={onClose} className="bg-line!">Close</TapButton>
        </div>
        <HowWeKnow />
        <section className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Sources</h3>
          <SourcesList />
          <p className="mt-3 text-ink-2">{META.disclaimer}</p>
        </section>
      </div>
    </div>
  );
}
