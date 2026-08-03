#!/usr/bin/env node
/**
 * Lighthouse performance gate for key URLs (mobile).
 * Requires: npx lighthouse (downloaded on demand).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";
const URLS = [
  `${BASE}/`,
  `${BASE}/printable-calendars.html`,
  `${BASE}/august-calendars.html`,
  `${BASE}/blank-calendars.html`,
];

// Mobile floors. AdSense injects 3P cookies / inspector Cookie issues that
// cap Best Practices ~60–80 — gate BP softer; hard-fail on first-party console errors.
const MIN_PERF = Number(process.env.LH_MIN_PERF || 70);
const MIN_A11Y = Number(process.env.LH_MIN_A11Y || 90);
const MIN_BP = Number(process.env.LH_MIN_BP || 60);
const MIN_SEO = Number(process.env.LH_MIN_SEO || 90);
const MAX_CLS = Number(process.env.LH_MAX_CLS || 0.5);

let fails = 0;

function score(cat) {
  if (!cat || cat.score == null) return 0;
  return Math.round(cat.score * 100);
}

function runLh(url, outJson) {
  return spawnSync(
    "npx",
    [
      "--yes",
      "lighthouse@12.2.1",
      url,
      "--only-categories=performance,accessibility,best-practices,seo",
      "--form-factor=mobile",
      "--screenEmulation.mobile=true",
      "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
      "--quiet",
      "--output=json",
      `--output-path=${outJson}`,
    ],
    { encoding: "utf8", timeout: 180_000 },
  );
}

function evaluate(report) {
  const cats = report.categories || {};
  const perf = score(cats.performance);
  const a11y = score(cats.accessibility);
  const bp = score(cats["best-practices"]);
  const seo = score(cats.seo);
  const lcp = report.audits?.["largest-contentful-paint"]?.displayValue;
  const clsDisplay = report.audits?.["cumulative-layout-shift"]?.displayValue;
  const clsNumeric = report.audits?.["cumulative-layout-shift"]?.numericValue ?? 0;
  const tbt = report.audits?.["total-blocking-time"]?.displayValue;
  const runtimeErrors = report.audits?.["errors-in-console"];
  let hardJs = false;
  let consoleNote = "no browser errors in console";
  if (runtimeErrors && runtimeErrors.score !== null && runtimeErrors.score < 1) {
    const details = JSON.stringify(runtimeErrors.details || {}).slice(0, 800);
    if (/Uncaught|TypeError|ReferenceError|SyntaxError/i.test(details)) {
      hardJs = true;
      consoleNote = `first-party console errors ${details}`;
    } else {
      consoleNote = "console clean of hard JS exceptions";
    }
  }
  const ok =
    !hardJs &&
    perf >= MIN_PERF &&
    a11y >= MIN_A11Y &&
    bp >= MIN_BP &&
    seo >= MIN_SEO &&
    clsNumeric <= MAX_CLS;
  return { perf, a11y, bp, seo, lcp, clsDisplay, clsNumeric, tbt, hardJs, consoleNote, ok };
}

for (const url of URLS) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "its-lh-"));
  const outJson = path.join(outDir, "report.json");
  console.log(`\nLighthouse → ${url}`);
  let r = runLh(url, outJson);
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    console.error("FAIL lighthouse process", url);
    fails++;
    continue;
  }
  let result = evaluate(JSON.parse(fs.readFileSync(outJson, "utf8")));
  console.log(
    `  perf=${result.perf} a11y=${result.a11y} bp=${result.bp} seo=${result.seo}  LCP=${result.lcp} CLS=${result.clsDisplay} TBT=${result.tbt}`,
  );
  // AdSense / CDN cold can spike LCP once — retry once before failing perf.
  if (!result.ok && !result.hardJs && result.perf < MIN_PERF) {
    console.log("  retry (AdSense/network variance)…");
    r = runLh(url, outJson);
    if (r.status === 0) {
      result = evaluate(JSON.parse(fs.readFileSync(outJson, "utf8")));
      console.log(
        `  perf=${result.perf} a11y=${result.a11y} bp=${result.bp} seo=${result.seo}  LCP=${result.lcp} CLS=${result.clsDisplay} TBT=${result.tbt}`,
      );
    }
  }

  if (result.hardJs) {
    console.error("FAIL", result.consoleNote);
    fails++;
  } else {
    console.log("OK ", result.consoleNote);
  }
  if (result.perf < MIN_PERF) {
    console.error(`FAIL perf ${result.perf} < ${MIN_PERF}`);
    fails++;
  }
  if (result.a11y < MIN_A11Y) {
    console.error(`FAIL a11y ${result.a11y} < ${MIN_A11Y}`);
    fails++;
  }
  if (result.bp < MIN_BP) {
    console.error(`FAIL best-practices ${result.bp} < ${MIN_BP}`);
    fails++;
  } else if (result.bp < 90) {
    console.log(`OK  best-practices ${result.bp} (AdSense 3P cookie / bf-cache cap — expected)`);
  }
  if (result.seo < MIN_SEO) {
    console.error(`FAIL seo ${result.seo} < ${MIN_SEO}`);
    fails++;
  }
  if (result.clsNumeric > MAX_CLS) {
    console.error(`FAIL CLS ${result.clsNumeric} > ${MAX_CLS}`);
    fails++;
  }
  if (result.ok) console.log("OK  thresholds met");
}

if (fails) {
  console.error(`\nLighthouse smoke FAILED (${fails})`);
  process.exit(1);
}
console.log("\nLighthouse smoke OK");
