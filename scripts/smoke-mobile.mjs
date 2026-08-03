#!/usr/bin/env node
/** Multi-viewport responsive smoke: fail on horizontal overflow / layout breaks. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";

const VIEWPORTS = [
  { name: "iPhone-SE", width: 375, height: 667 },
  { name: "iPhone-14", width: 390, height: 844 },
  { name: "Pixel-7", width: 412, height: 915 },
  { name: "iPhone-14-Pro-Max", width: 430, height: 932 },
  { name: "iPhone-landscape", width: 844, height: 390 },
  { name: "iPad-Mini", width: 768, height: 1024 },
  { name: "iPad-Air", width: 820, height: 1180 },
  { name: "iPad-landscape", width: 1024, height: 768 },
  { name: "Nest-Hub", width: 1024, height: 600 },
  { name: "Laptop", width: 1280, height: 800 },
  { name: "Desktop", width: 1440, height: 900 },
];

const PATHS = process.env.SMOKE_PATHS
  ? process.env.SMOKE_PATHS.split(",")
  : [
      "/",
      "/printable-calendar.html",
      "/printable-august-calendar.html",
      "/printable-blank-calendar.html",
      "/printable-weekly-calendar.html",
      "/printable-school-calendar.html",
      "/print-guide.html",
      "/holidays.html",
      "/when-is/easter.html",
      "/page/contact.html",
    ];

/** If SMOKE_WIDTH is set, run only that single viewport (legacy). */
const ONLY_W = process.env.SMOKE_WIDTH ? Number(process.env.SMOKE_WIDTH) : 0;
const ONLY_H = process.env.SMOKE_HEIGHT ? Number(process.env.SMOKE_HEIGHT) : 844;
const ACTIVE = ONLY_W
  ? [{ name: `custom-${ONLY_W}`, width: ONLY_W, height: ONLY_H }]
  : VIEWPORTS;

function findPlaywrightIndex() {
  const pnpm = path.join(ROOT, "node_modules/.pnpm");
  if (fs.existsSync(pnpm)) {
    for (const name of fs.readdirSync(pnpm)) {
      if (!name.startsWith("playwright@")) continue;
      const idx = path.join(pnpm, name, "node_modules/playwright/index.mjs");
      if (fs.existsSync(idx)) return idx;
    }
  }
  const flat = path.join(ROOT, "node_modules/playwright/index.mjs");
  if (fs.existsSync(flat)) return flat;
  return null;
}

const idx = findPlaywrightIndex();
if (!idx) {
  console.error("playwright not found under node_modules");
  process.exit(1);
}
const { chromium } = await import(pathToFileURL(idx).href);
const browser = await chromium.launch({ headless: true });

let fail = 0;
console.log(`Responsive smoke against ${BASE} (${ACTIVE.length} viewports × ${PATHS.length} paths)`);

for (const vp of ACTIVE) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  console.log(`\n── ${vp.name} ${vp.width}×${vp.height} ──`);

  for (const p of PATHS) {
    const url = `${BASE}${p}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    }
    await page.waitForTimeout(600);

    const info = await page.evaluate(() => {
      const vw = window.innerWidth;
      const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const hero = document.querySelector(".hero");
      const header = document.querySelector(".site-header");
      const navToggle = document.querySelector(".nav-toggle");
      const nav = document.querySelector(".nav-drawer > .nav");
      const chips = [...document.querySelectorAll(".month-chips a")];
      const btns = [...document.querySelectorAll(".cta .btn, .btn-primary, .nav-toggle")];
      const auto = document.querySelectorAll(".google-auto-placed");
      const visibleAuto = [...auto].filter((el) => {
        const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && el.getBoundingClientRect().height > 8;
      });
      const heroTop = hero ? hero.getBoundingClientRect().top : 0;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const toggleVisible = navToggle
        ? getComputedStyle(navToggle).display !== "none"
        : false;
      const navDisplay = nav ? getComputedStyle(nav).display : "none";
      const smallTap = [...chips, ...btns].filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        return r.height < 40 || (el.classList.contains("nav-toggle") && r.width < 40);
      }).length;
      const week = document.querySelector(".week-print");
      let weekCols = 0;
      if (week) {
        const cs = getComputedStyle(week).gridTemplateColumns;
        weekCols = cs && cs !== "none" ? cs.split(" ").filter(Boolean).length : 0;
      }
      return {
        overflowPx: scrollW - vw,
        visibleAuto: visibleAuto.length,
        gapAfterHeader: Math.round(heroTop - headerBottom),
        headerH: header ? Math.round(header.getBoundingClientRect().height) : 0,
        toggleVisible,
        navDisplay,
        smallTap,
        weekCols,
        vw,
      };
    });

    const problems = [];
    if (info.overflowPx > 1) problems.push(`overflow +${info.overflowPx}px`);
    /* Auto ads allowed — only fail if they blow horizontal layout (overflow check above). */
    if (p === "/" && info.gapAfterHeader > 200 && info.visibleAuto === 0) {
      problems.push(`hero-gap ${info.gapAfterHeader}px`);
    }
    if (info.headerH > 110) problems.push(`headerH ${info.headerH}`);
    if (info.vw < 1024 && !info.toggleVisible) problems.push("nav-toggle hidden");
    if (info.vw >= 1024 && info.toggleVisible) problems.push("nav-toggle shown on desktop");
    if (info.vw >= 1024 && info.navDisplay === "none") problems.push("desktop nav hidden");
    if (info.vw < 1024 && info.navDisplay !== "none") {
      /* closed drawer should hide nav — unless details open; ignore */
    }
    if (p.includes("weekly") && info.vw >= 900 && info.weekCols < 7) {
      problems.push(`week-cols ${info.weekCols} (want 7)`);
    }
    if (p.includes("weekly") && info.vw < 900 && info.weekCols > 1) {
      problems.push(`week-cols ${info.weekCols} (want stacked)`);
    }
    if (info.smallTap > 0 && info.vw <= 430) problems.push(`small-taps ${info.smallTap}`);

    if (problems.length) {
      fail = 1;
      console.error(`FAIL ${problems.join(", ")} ${url}`);
    } else {
      console.log(
        `OK  overflow=0 header=${info.headerH} gap=${info.gapAfterHeader} nav=${info.toggleVisible ? "menu" : "inline"} ${url}`,
      );
    }
  }

  await page.close();
}

await browser.close();
if (fail) {
  console.error("\nResponsive smoke FAILED");
  process.exit(1);
}
console.log("\nResponsive smoke OK");
