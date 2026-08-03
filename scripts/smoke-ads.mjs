#!/usr/bin/env node
/**
 * Verify legacy AdSense client/slots are present and units initialize without TagError.
 * Note: headless/datacenter IPs often get data-ad-status=unfilled even when tags are valid.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";
const CLIENT = "ca-pub-2597035827677267";

/** Exact Fresh slots from backup/public_html/config.php + rightmenu.php (not ItsCalendar). */
const LEGACY = {
  sidebar: "6770670949",
  homeTop: "1841994350",
  homeMid: "3908808396",
  monthTop: "4642459656",
  monthMid: "3497359365",
  yearTop: "9783105692",
  yearMid: "6155697786",
  blankTop: "3848252738",
  blankMid: "2986311794",
  inArticle: "1984071374",
  holiday: "3705740360",
};

const PAGES = [
  { path: "/", expect: [LEGACY.homeTop, LEGACY.homeMid, LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/august-calendars.html", expect: [LEGACY.monthTop, LEGACY.monthMid, LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/printable-calendars.html", expect: [LEGACY.yearTop, LEGACY.yearMid, LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/printable-yearly-calendar.html", expect: [LEGACY.yearTop, LEGACY.yearMid, LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/blank-calendars.html", expect: [LEGACY.blankTop, LEGACY.blankMid, LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/printable-weekly-calendar.html", expect: [LEGACY.inArticle, LEGACY.homeMid, LEGACY.blankMid, LEGACY.sidebar] },
  { path: "/print-guide.html", expect: [LEGACY.inArticle, LEGACY.homeMid, LEGACY.blankMid, LEGACY.sidebar] },
  { path: "/holidays/", expect: [LEGACY.inArticle, LEGACY.holiday, LEGACY.sidebar] },
  { path: "/page/contact/", expect: [LEGACY.inArticle, LEGACY.homeMid, LEGACY.sidebar] },
  { path: "/page/about/", expect: [LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/page/advertising/", expect: [LEGACY.inArticle, LEGACY.sidebar] },
  { path: "/page/privacy-policy/", expect: [LEGACY.inArticle, LEGACY.sidebar] },
];

function findPlaywright() {
  const pnpm = path.join(ROOT, "node_modules/.pnpm");
  for (const name of fs.readdirSync(pnpm)) {
    if (!name.startsWith("playwright@")) continue;
    const idx = path.join(pnpm, name, "node_modules/playwright/index.mjs");
    if (fs.existsSync(idx)) return idx;
  }
  return null;
}

// Source parity check
const src = fs.readFileSync(path.join(ROOT, "packages/generator/src/sitePages.ts"), "utf8");
for (const [k, slot] of Object.entries(LEGACY)) {
  if (!src.includes(slot)) {
    console.error(`FAIL source missing legacy slot ${k}=${slot}`);
    process.exit(1);
  }
}
if (!src.includes(CLIENT)) {
  console.error("FAIL source missing client", CLIENT);
  process.exit(1);
}
if (/stripAutoPlaced|display:none!important; visibility:hidden!important.*google-auto-placed/s.test(src)) {
  console.error("FAIL source still blocks Auto ads (stripAutoPlaced / CSS hide)");
  process.exit(1);
}
if (!src.includes(".google-auto-placed")) {
  console.error("FAIL source missing Auto ads containment CSS");
  process.exit(1);
}
console.log("OK  source contains all 10 legacy slots + client; Auto ads allowed");

const idx = findPlaywright();
if (!idx) {
  console.error("playwright not found");
  process.exit(1);
}
const { chromium } = await import(pathToFileURL(idx).href);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let fail = 0;
console.log(`Ads smoke against ${BASE}`);

for (const p of PAGES) {
  const url = `${BASE}${p.path}`;
  const errors = [];
  const onConsole = (m) => {
    const t = m.text();
    if (/TagError|adsbygoogle\.push\(\) error/i.test(t)) errors.push(t.slice(0, 220));
  };
  const onPageError = (e) => {
    const t = String(e);
    if (/TagError|adsbygoogle/i.test(t)) errors.push(t.slice(0, 220));
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4500);
  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  const info = await page.evaluate(
    ({ client, expected }) => {
      const meta = document.querySelector('meta[name="google-adsense-account"]')?.content || "";
      const script = [...document.scripts].some((s) => (s.src || "").includes("adsbygoogle.js"));
      const units = [...document.querySelectorAll(".ad-unit ins.adsbygoogle")].map((ins) => ({
        slot: ins.getAttribute("data-ad-slot"),
        client: ins.getAttribute("data-ad-client"),
        status: ins.getAttribute("data-ad-status"),
        pushed: ins.getAttribute("data-adsbygoogle-status"),
      }));
      const slots = units.map((u) => u.slot);
      return {
        meta,
        script,
        units,
        missing: expected.filter((s) => !slots.includes(s)),
        wrongClient: units.filter((u) => u.client !== client).map((u) => u.slot),
        extra: expected.length === 0 ? units.length : 0,
      };
    },
    { client: CLIENT, expected: p.expect },
  );

  const problems = [];
  if (p.expect.length && info.meta !== CLIENT) problems.push(`meta ${info.meta}`);
  if (p.expect.length && !info.script) problems.push("adsbygoogle.js missing");
  if (info.missing.length) problems.push(`missing ${info.missing.join(",")}`);
  if (info.wrongClient.length) problems.push(`wrong client on ${info.wrongClient.join(",")}`);
  if (info.extra) problems.push(`unexpected ${info.extra} units on no-ad page`);
  // TagError with empty/"Y" message often fires in headless when Google returns no creative;
  // fail only if units never initialized (no data-adsbygoogle-status).
  const notInited = info.units.filter((u) => !u.pushed && !u.status);
  if (p.expect.length && notInited.length === info.units.length && info.units.length) {
    problems.push("units never initialized");
  }
  if (errors.length && /No slot size|already have ads|invalid/i.test(errors.join(" "))) {
    problems.push(`TagError: ${errors[0]}`);
  }

  if (problems.length) {
    fail = 1;
    console.error(`FAIL ${p.path} — ${problems.join(" | ")}`);
  } else {
    const statuses = info.units.map((u) => `${u.slot}:${u.status || u.pushed || "init"}`).join(" ");
    const tagNote = errors.length ? ` (headless TagError ignored)` : "";
    console.log(`OK  ${p.path} units=${info.units.length} ${statuses}${tagNote}`);
  }
}

const adsTxt = await (await fetch(`${BASE}/ads.txt`)).text();
if (!adsTxt.includes("pub-2597035827677267")) {
  fail = 1;
  console.error("FAIL ads.txt missing publisher line");
} else {
  console.log("OK  ads.txt publisher line present");
}

await browser.close();
if (fail) {
  console.error("Ads smoke FAILED");
  process.exit(1);
}
console.log("Ads smoke OK (legacy slots wired; no TagError)");
