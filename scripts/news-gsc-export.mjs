#!/usr/bin/env node
// Full Search Console export for a one-off analysis (which pages and queries lost or never won
// clicks). The daily report (news-gsc.mjs) keeps the 5,000 largest query-page rows of 28 days; this
// reads every row Google returns, one day at a time, because the API's row cap is per request and a
// day-sized request reaches far deeper into the long tail than a 28-day one.
// Read-only (same service account), writes gzip files to gsc-export/ that the workflow uploads as
// an artifact; nothing is committed. Usage: node scripts/news-gsc-export.mjs [days=60]
import { createSign } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "gsc-export");
const DAY = 86_400_000;
const API = "https://www.googleapis.com/webmasters/v3/sites";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const ROWS = 25_000;
const ymd = (t) => new Date(t).toISOString().slice(0, 10);
const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const aud = key.token_uri ?? "https://oauth2.googleapis.com/token";
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: key.client_email, scope: SCOPE, aud, iat: now, exp: now + 3000 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const res = await fetch(aud, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }), signal: AbortSignal.timeout(20_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) throw new Error(`token: ${res.status} ${body.error_description ?? body.error ?? ""}`);
  return body.access_token;
}

/** Every row of one query, paged until Google returns a short page; retries a failed page 3 times. */
async function query(site, token, body) {
  const rows = [];
  for (let startRow = 0; ; startRow += ROWS) {
    let data;
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`${API}/${encodeURIComponent(site)}/searchAnalytics/query`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ ...body, rowLimit: ROWS, startRow, dataState: "all" }), signal: AbortSignal.timeout(120_000) }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: { message: e.message } }) }));
      data = await res.json().catch(() => ({}));
      if (res.ok) break;
      if (attempt === 3) throw new Error(`searchAnalytics ${res.status} ${data.error?.message ?? ""}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
    rows.push(...(data.rows ?? []));
    if ((data.rows ?? []).length < ROWS) return rows;
  }
}

/** Runs `fn` over `items`, `n` at a time, keeping order. */
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i]); } }));
  return out;
}

const save = (name, rows) => {
  writeFileSync(path.join(OUT, `${name}.ndjson.gz`), gzipSync(rows.map((r) => JSON.stringify(r)).join("\n")));
  console.log(`gsc export: ${name} ${rows.length} rows`);
};
const flat = (dims) => (r) => ({ ...Object.fromEntries(dims.map((d, i) => [d, r.keys[i]])), c: r.clicks, i: r.impressions, p: Math.round(r.position * 10) / 10 });

async function main() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON, site = process.env.GSC_SITE;
  if (!raw || !site) throw new Error("GSC_SERVICE_ACCOUNT_JSON or GSC_SITE not set");
  const days = Number(process.argv[2] ?? 60);
  const token = await accessToken(JSON.parse(raw));
  const end = Date.parse(ymd(Date.now() - DAY)), start = end - (days - 1) * DAY;
  const dates = Array.from({ length: days }, (_, k) => ymd(start + k * DAY));
  const range = { startDate: ymd(start), endDate: ymd(end) };
  mkdirSync(OUT, { recursive: true });

  // Totals per day and search type: the only numbers that include the queries Google hides.
  for (const type of ["web", "image", "discover", "news", "video"]) {
    const rows = await query(site, token, { ...range, dimensions: ["date"], type }).catch((e) => (console.log(`gsc export: ${type} daily skipped: ${e.message}`), []));
    save(`daily-${type}`, rows.map(flat(["date"])));
  }
  for (const dims of [["date", "country"], ["date", "device"], ["date", "searchAppearance"]]) {
    const rows = await query(site, token, { ...range, dimensions: dims, type: "web" }).catch((e) => (console.log(`gsc export: ${dims[1]} skipped: ${e.message}`), []));
    save(`daily-${dims[1]}`, rows.map(flat(dims)));
  }
  // One request set per day: every page, every query, every query and page pair.
  for (const [name, dims] of [["page", ["page"]], ["query", ["query"]], ["query-page", ["query", "page"]]]) {
    const perDay = await pool(dates, 4, async (d) => (await query(site, token, { startDate: d, endDate: d, dimensions: dims, type: "web" })).map((r) => ({ date: d, ...flat(dims)(r) })));
    save(`day-${name}`, perDay.flat());
  }
  const imagePages = await pool(dates, 4, async (d) => (await query(site, token, { startDate: d, endDate: d, dimensions: ["page"], type: "image" })).map((r) => ({ date: d, ...flat(["page"])(r) })));
  save("day-page-image", imagePages.flat());
  writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ generatedAt: new Date().toISOString(), site, ...range, dataState: "all" }));
}

await main();
