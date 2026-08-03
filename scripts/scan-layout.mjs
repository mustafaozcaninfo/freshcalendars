#!/usr/bin/env node
/** Deep layout/overflow scan — mobile + desktop. Exit 1 on hard issues. */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(pathToFileURL(path.resolve("packages/generator/package.json")));
const { chromium } = require("playwright");

const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";
const URLS = [
  `${BASE}/`,
  `${BASE}/printable-january-calendar.html`,
  `${BASE}/printable-august-calendar.html`,
  `${BASE}/printable-blank-calendar.html`,
  `${BASE}/printable-calendar.html`,
  `${BASE}/printable-weekly-calendar.html`,
  `${BASE}/holidays.html`,
  `${BASE}/page/contact.html`,
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "tablet", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "desktop", width: 1366, height: 900, isMobile: false, hasTouch: false },
];

let fails = 0;
const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
  });
  const page = await ctx.newPage();
  for (const url of URLS) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(3000);
    const report = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const issues = [];
      if (document.documentElement.scrollWidth > docW + 2) {
        issues.push(`html overflow ${document.documentElement.scrollWidth}px > ${docW}px`);
      }
      if (document.body.scrollWidth > docW + 2) {
        issues.push(`body overflow ${document.body.scrollWidth}px > ${docW}px`);
      }
      // Wide nodes outside scroll containers
      const wide = [];
      for (const el of document.querySelectorAll("body *")) {
        if (el.closest(".table-scroll, .lightbox, [hidden]")) continue;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width > docW + 2 && r.height > 8) {
          wide.push({ tag: el.tagName, cls: String(el.className || "").slice(0, 40), w: Math.round(r.width) });
          if (wide.length >= 6) break;
        }
      }
      if (wide.length) issues.push(`wide nodes: ${JSON.stringify(wide)}`);
      // Empty giant rails (no ins/iframe) — filled rails are OK
      const rail = document.querySelector(".ad-rail-top");
      if (rail) {
        const h = rail.getBoundingClientRect().height;
        const filled = rail.querySelector("iframe, ins.adsbygoogle");
        if (h >= 280 && !filled) issues.push(`empty ad-rail-top height=${Math.round(h)}`);
      }
      let cls = 0;
      try {
        for (const e of performance.getEntriesByType("layout-shift")) if (!e.hadRecentInput) cls += e.value;
      } catch {}
      const brand = document.querySelector(".brand");
      const toggle = document.querySelector(".nav-toggle");
      if (brand && toggle && getComputedStyle(toggle).display !== "none") {
        const b = brand.getBoundingClientRect();
        const t = toggle.getBoundingClientRect();
        if (t.width > 0 && b.right > t.left + 2) issues.push("brand overlaps nav-toggle");
      }
      return {
        cls: Number(cls.toFixed(4)),
        issues,
        autoAds: document.querySelectorAll(".google-auto-placed").length,
      };
    });
    const ok = report.issues.length === 0;
    console.log(
      `\n${vp.name} ${url.replace(BASE, "") || "/"}\n  CLS~${report.cls} autoAds=${report.autoAds} ${ok ? "OK" : "FAIL"}`,
    );
    for (const i of report.issues) console.log(`  - ${i}`);
    if (!ok) fails++;
  }
  await ctx.close();
}

await browser.close();
if (fails) {
  console.error(`\nLayout scan FAILED (${fails})`);
  process.exit(1);
}
console.log("\nLayout scan OK");
