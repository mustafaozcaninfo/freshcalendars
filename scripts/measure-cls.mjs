#!/usr/bin/env node
/**
 * Measure CLS with Playwright PerformanceObserver (mobile + desktop).
 * Not a soft smoke gate — prints numeric proof and exits 1 if CLS > MAX.
 */
import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";
// Lab noise + rare Auto residual; field “good” is < 0.1
const MAX = Number(process.env.CLS_MAX || 0.1);
const URLS = (process.env.CLS_URLS ||
  [
    `${BASE}/printable-january-calendar.html`,
    `${BASE}/`,
    `${BASE}/printable-blank-calendar.html`,
    `${BASE}/printable-august-calendar.html`,
  ].join(",")).split(",");

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "desktop", width: 1366, height: 900, isMobile: false, hasTouch: false },
];

async function measureCls(page, url) {
  await page.addInitScript(() => {
    window.__cls = 0;
    window.__clsEntries = [];
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) {
          window.__cls += e.value;
          const node = e.sources?.[0]?.node;
          window.__clsEntries.push({
            value: e.value,
            tag: node?.tagName || null,
            id: node?.id || null,
            cls: node?.className || null,
          });
        }
      }
    });
    po.observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  // Allow late Auto ads / fonts
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  return page.evaluate(() => ({
    cls: window.__cls,
    entries: window.__clsEntries.slice(0, 12),
  }));
}

let fails = 0;
const browser = await chromium.launch({ headless: true });
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      userAgent: vp.isMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
    });
    const page = await context.newPage();
    for (const url of URLS) {
      process.stdout.write(`\nCLS ${vp.name} → ${url}\n`);
      const { cls, entries } = await measureCls(page, url);
      const ok = cls <= MAX;
      console.log(`  CLS=${cls.toFixed(4)}  max=${MAX}  ${ok ? "OK" : "FAIL"}`);
      if (entries.length) {
        for (const e of entries.slice(0, 5)) {
          console.log(
            `    shift=${e.value.toFixed(4)} <${e.tag || "?"}${e.id ? "#" + e.id : ""}${e.cls ? "." + String(e.cls).split(" ")[0] : ""}>`,
          );
        }
      }
      if (!ok) fails++;
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (fails) {
  console.error(`\nCLS measure FAILED (${fails})`);
  process.exit(1);
}
console.log(`\nCLS measure OK — all ≤ ${MAX}`);
