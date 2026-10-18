import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

/** Astro leaves content-layer/server chunks in an outDir outside the project; none of it is public. */
const cleanBuildLeftovers = {
  name: "clean-build-leftovers",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const out = fileURLToPath(dir);
      for (const f of await readdir(out)) {
        if (f.endsWith(".mjs") || f === "chunks" || f === "collections") {
          await rm(path.join(out, f), { recursive: true, force: true });
        }
      }
    },
  },
};

/**
 * Fresh Calendars News — static Google News section served at /news/.
 * Output goes to dist/news (outside dist/site, which the calendar generator wipes)
 * and is deployed on its own to public_html/news/. See docs/NEWS-ROADMAP.md.
 */
export default defineConfig({
  site: process.env.NEWS_SITE_ORIGIN ?? "https://freshcalendars.com",
  base: "/news",
  trailingSlash: "always",
  output: "static",
  outDir: "../../dist/news",
  compressHTML: true,
  build: {
    format: "directory",
    inlineStylesheets: "always",
    assets: "_astro",
  },
  integrations: [cleanBuildLeftovers],
  devToolbar: { enabled: false },
  vite: {
    server: { port: 4322 },
  },
});
