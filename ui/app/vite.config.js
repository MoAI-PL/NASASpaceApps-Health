// Astrobalance — NASA Space Apps Challenge 2026
// AI-assisted: drafted with Claude (Anthropic), reviewed by the team. License: Apache-2.0
//
// Build config. The UI reads the ML output in outputs/ui/ at build time (alias "@data"),
// so the built app in dist/ is fully self-contained: no backend, no network at runtime.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const dataDir = fileURLToPath(new URL("../../outputs/ui", import.meta.url));

export default defineConfig({
  base: "./", // relative asset paths: the dist/ folder works on any static host
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@data": dataDir } },
  server: { fs: { allow: [repoRoot] } }, // let the dev server read outputs/ui/
});
