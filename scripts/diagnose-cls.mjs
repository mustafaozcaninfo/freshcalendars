#!/usr/bin/env node
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(pathToFileURL(path.resolve("packages/generator/package.json")));
const { chromium } = require("playwright");

const url = process.argv[2] || "https://freshcalendars.com/printable-january-calendar.html";
const mobile = process.argv.includes("--desktop")
  ? false
  : true;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(
  mobile
    ? {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      }
    : { viewport: { width: 1366, height: 900 } },
);
const page = await context.newPage();
await page.addInitScript(() => {
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      const sources = (e.sources || []).map((s) => {
        const n = s.node;
        return {
          prev: s.previousRect,
          cur: s.currentRect,
          tag: n?.tagName,
          id: n?.id,
          cls: typeof n?.className === "string" ? n.className.slice(0, 80) : "",
          html: n?.outerHTML?.slice(0, 160),
        };
      });
      window.__shifts.push({ value: e.value, sources });
    }
  }).observe({ type: "layout-shift", buffered: true });
});
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);
const data = await page.evaluate(() => {
  const ads = [...document.querySelectorAll(".google-auto-placed, .ad-unit, ins.adsbygoogle")].map((el) => ({
    tag: el.tagName,
    cls: el.className,
    h: el.getBoundingClientRect().height,
    y: el.getBoundingClientRect().top + window.scrollY,
  }));
  const fonts = document.fonts ? [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`) : [];
  const cls = window.__shifts.reduce((a, s) => a + s.value, 0);
  return { cls, shifts: window.__shifts, ads, fonts: fonts.slice(0, 12) };
});
console.log(JSON.stringify({ url, mobile, ...data }, null, 2));
await browser.close();
