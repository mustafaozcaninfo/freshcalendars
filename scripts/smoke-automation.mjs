#!/usr/bin/env node
/**
 * Full automation + year-transition + cache + CDN smoke.
 * Exit 1 on any failure. Used by cron (post-deploy) and local verify.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  resolveMonthYear,
  resolvePlanningYear,
  resolveAllMonthYears,
  schoolYearStartYear,
  schoolYearSpanLabel,
  holidaysForYear,
} from "../packages/engine/src/index.ts";

const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";
const CDN = process.env.CDN_ORIGIN || "https://cdn.freshcalendars.com";
let fails = 0;

function fail(msg) {
  console.error("FAIL", msg);
  fails++;
}
function ok(msg) {
  console.log("OK ", msg);
}

async function fetchHead(url) {
  const res = await fetch(url, { redirect: "manual", method: "GET" });
  return res;
}

async function expectStatus(url, code) {
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== code) fail(`${url} expected ${code} got ${res.status}`);
  else ok(`${code} ${url}`);
  return res;
}

function runShellSmoke() {
  const r = spawnSync("bash", ["scripts/smoke.sh"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: { ...process.env, SMOKE_BASE: BASE },
    encoding: "utf8",
  });
  process.stdout.write(r.stdout || "");
  process.stderr.write(r.stderr || "");
  if (r.status !== 0) fail("scripts/smoke.sh failed");
  else ok("HTTP smoke suite");
}

function verifyYearMath() {
  // Mid-year: Jan evergreen is next civil year
  const mid = new Date(2026, 7, 15); // Aug 15 2026
  assert.equal(resolvePlanningYear(mid), 2026);
  assert.equal(resolveMonthYear(1, mid), 2027);
  assert.equal(resolveMonthYear(8, mid), 2026);
  assert.equal(schoolYearStartYear(mid), 2026);
  assert.equal(schoolYearSpanLabel(2026), "2026-2027");

  // Jan 1 flip
  const jan1 = new Date(2027, 0, 1);
  assert.equal(resolvePlanningYear(jan1), 2027);
  assert.equal(resolveMonthYear(1, jan1), 2027);
  assert.equal(resolveMonthYear(12, jan1), 2027);

  // After Sep 1, August rolls forward
  const sep1 = new Date(2026, 8, 1);
  assert.equal(resolveMonthYear(8, sep1), 2027);

  const years = new Set([
    resolvePlanningYear(mid),
    resolvePlanningYear(mid) + 1,
    ...Object.values(resolveAllMonthYears(mid)),
  ]);
  assert.ok(years.has(2026) && years.has(2027), "refresh year set must include Y and Y+1");

  // Holidays resolve for next year without hardcoded dates
  const uk = holidaysForYear(2027, { locale: "uk" });
  const ca = holidaysForYear(2027, { locale: "ca" });
  assert.ok(uk.length >= 10 && ca.length >= 10);
  ok("year-transition engine math (Aug/Sep/Jan + UK/CA 2027)");
}

async function verifyLiveYears() {
  const now = new Date();
  const y = resolvePlanningYear(now);
  const next = y + 1;
  const janY = resolveMonthYear(1, now);

  // Homepage / yearly hubs mention planning year in HTML
  const yearly = await (await fetch(`${BASE}/printable-calendar.html`)).text();
  if (!yearly.includes(String(y))) fail(`yearly hub missing planning year ${y}`);
  else ok(`yearly hub shows ${y}`);

  const nextPage = await (await fetch(`${BASE}/printable-yearly-calendar.html`)).text();
  if (!nextPage.includes(String(next))) fail(`next-year hub missing ${next}`);
  else ok(`next-year hub shows ${next}`);

  const jan = await (await fetch(`${BASE}/printable-january-calendar.html`)).text();
  if (!jan.includes(String(janY))) fail(`january page missing resolved year ${janY}`);
  else ok(`january evergreen → ${janY}`);

  // CDN assets for Y and Y+1 classic yearly
  for (const year of [y, next]) {
    const url = `${CDN}/assets/${year}/yearly/classic/calendar.pdf`;
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) fail(`CDN missing ${url} (${res.status})`);
    else ok(`CDN ${year} yearly classic PDF`);
  }

  const span = schoolYearSpanLabel(schoolYearStartYear(now));
  const school = `${CDN}/assets/school/${span}/overview/calendar.pdf`;
  const sres = await fetch(school, { method: "HEAD" });
  if (!sres.ok) fail(`CDN missing school overview ${school}`);
  else ok(`CDN school overview ${span}`);
}

async function verifyCacheHeaders() {
  const html = await fetchHead(`${BASE}/printable-calendar.html`);
  const cc = html.headers.get("cache-control") || "";
  const cdnCc = html.headers.get("cdn-cache-control") || "";
  const cf = html.headers.get("cf-cache-status") || "";
  ok(`HTML Cache-Control: ${cc || "(none)"} · CDN-Cache-Control: ${cdnCc || "(none)"} · cf: ${cf || "(none)"}`);
  if (!/max-age=\d+/i.test(cc) && !/s-maxage=\d+/i.test(cc)) {
    fail("HTML response missing max-age Cache-Control");
  } else {
    const m = cc.match(/max-age=(\d+)/i);
    const age = m ? Number(m[1]) : 0;
    // Monthly SSG: browser ≥7d, edge via CDN-Cache-Control ≥31d
    if (age < 604800) fail(`HTML browser max-age too low (${age}s); want ≥604800 (7d)`);
    else ok(`HTML browser max-age ${age}s (≥7d)`);
  }
  if (cdnCc) {
    const m = cdnCc.match(/max-age=(\d+)/i);
    const edge = m ? Number(m[1]) : 0;
    if (edge < 2678400) fail(`CDN-Cache-Control too low (${edge}s); want ≥2678400 (31d)`);
    else ok(`edge CDN-Cache-Control ${edge}s (≥31d)`);
  } else {
    fail("missing CDN-Cache-Control on HTML (edge monthly TTL)");
  }

  const font = await fetchHead(`${BASE}/fonts/dm-sans-latin-400-normal.woff2`);
  const fcc = font.headers.get("cache-control") || "";
  if (!/max-age=31536000|immutable/i.test(fcc)) {
    if (font.status === 200) fail(`font Cache-Control weak: ${fcc}`);
    else ok(`font path status ${font.status} (skip TTL)`);
  } else ok(`font long-cache ${fcc}`);

  // Warm then require edge HIT (monthly cache must actually serve from CF)
  await fetch(`${BASE}/`);
  await fetch(`${BASE}/`);
  const home2 = await fetchHead(`${BASE}/`);
  const st = home2.headers.get("cf-cache-status") || "";
  ok(`homepage cf-cache-status (warm): ${st}`);
  if (!["HIT", "EXPIRED", "STALE", "REVALIDATED", "UPDATING"].includes(st)) {
    fail(`warm homepage not edge-cached (cf-cache-status=${st || "missing"})`);
  }

  // TTFB sanity on warm HIT
  const t0 = performance.now();
  const warm = await fetch(`${BASE}/printable-august-calendar.html`);
  await warm.arrayBuffer();
  const ms = performance.now() - t0;
  const wst = warm.headers.get("cf-cache-status") || "";
  ok(`warm HTML fetch ${ms.toFixed(0)}ms cf=${wst}`);
  if (wst === "HIT" && ms > 1500) fail(`warm HIT TTFB too slow (${ms.toFixed(0)}ms)`);
}

async function main() {
  console.log("=== Automation / year / cache smoke ===");
  verifyYearMath();
  runShellSmoke();
  await verifyLiveYears();
  await verifyCacheHeaders();

  if (fails) {
    console.error(`\nAutomation smoke FAILED (${fails})`);
    process.exit(1);
  }
  console.log("\nAutomation smoke OK — year transitions + HTTP + CDN + cache");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
