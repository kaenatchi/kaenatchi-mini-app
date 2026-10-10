import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from its repository subpath; browser previews run at the domain root.
  base: env?.GITHUB_ACTIONS === "true" ? "/kaenatchi-mini-app/" : "/",
});
