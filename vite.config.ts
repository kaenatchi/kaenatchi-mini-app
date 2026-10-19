import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

export default defineConfig({
  plugins: [react()],
  // The independent Cloudflare Pages preview is served from the domain root.
  // GitHub Pages production continues to use the repository subpath.
  base: env?.PREVIEW_DEPLOY === "true"
    ? "/"
    : env?.GITHUB_ACTIONS === "true"
      ? "/kaenatchi-mini-app/"
      : "/",
});
