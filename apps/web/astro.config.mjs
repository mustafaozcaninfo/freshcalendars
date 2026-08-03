import { defineConfig } from "astro/config";

/** Astro mirror of the premium UI. Production HTML with exact .html filenames is emitted by `@freshcalendars/generator` (`pnpm fc build`). */
export default defineConfig({
  output: "static",
  build: {
    format: "file",
  },
  outDir: "../../dist/astro-site",
  trailingSlash: "never",
  vite: {
    server: { port: 4321 },
  },
});
