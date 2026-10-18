import { defineConfig } from "astro/config";

/**
 * Fresh Calendars News — static Google News section served at /news/.
 * Output goes to dist/news (outside dist/site, which the calendar generator wipes)
 * and is deployed on its own to public_html/news/. See docs/NEWS-ROADMAP.md.
 */
export default defineConfig({
  site: "https://freshcalendars.com",
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
  devToolbar: { enabled: false },
  vite: {
    server: { port: 4322 },
  },
});
