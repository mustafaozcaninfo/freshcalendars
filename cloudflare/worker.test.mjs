// Printable downloads in the Worker: edge cache keyed by content hash, R2 for everything else.
// Runs under `pnpm test` with a fake R2 bucket and a fake edge cache (no Cloudflare needed).
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// The Worker imports maps that cloudflare/assemble.mjs writes at deploy time; give it test ones.
const CF = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist/cf");
const PDF = "/news/downloads/g/sheet.pdf", OLD = "/news/downloads/g/old.pdf";
await mkdir(CF, { recursive: true });
const keep = async (f, v) => { await readFile(path.join(CF, f)).catch(() => writeFile(path.join(CF, f), v)); };
await keep("pdf-canonical.json", JSON.stringify({ [PDF]: "https://freshcalendars.com/news/story/" }));
await keep("news-redirects.json", "{}");
await keep("calendar-canonical.json", JSON.stringify({ "november-2026": "https://freshcalendars.com/november-calendars.html", "march-2029": "https://freshcalendars.com/march-2029-calendar/", "2028": "https://freshcalendars.com/2028-calendar/" }));
await writeFile(path.join(CF, "download-versions.json"), JSON.stringify({ [PDF]: "abc123" }));

/** Fake edge cache: a Map from URL to a stored Response. */
const store = new Map();
globalThis.caches = { default: {
  match: async (req) => { const r = store.get(req.url); return r ? r.clone() : undefined; },
  put: async (req, res) => { store.set(req.url, new Response(await res.arrayBuffer(), { headers: res.headers })); },
} };

/** Fake R2: one file per path, records every call. */
const calls = [];
const body = "%PDF-1.7 test";
const object = (withBody, range) => ({
  size: body.length, httpEtag: '"e1"', uploaded: new Date("2026-11-05T00:00:00Z"), range,
  writeHttpMetadata: (h) => h.set("Content-Type", "application/pdf"),
  ...(withBody ? { body: new Response(range ? body.slice(range.offset, range.offset + range.length) : body).body } : {}),
});
/** Fake asset router: one live story, one renamed story (301 from _redirects), nothing else. */
const ASSETS = { fetch: async (req) => { const p = new URL(req.url ?? req).pathname; if (p.endsWith("/404.html")) return new Response("not found page"); return new Response(null, { status: p === "/news/live-story-here/" ? 200 : p === "/news/renamed-story-here/" ? 301 : 404 }); } };
const env = { ASSETS, CDN: {
  get: async (key, opts) => { calls.push(["get", key, !!opts?.range]); return key.endsWith("missing.pdf") ? null : object(true, opts?.range && opts.range.get?.("Range") ? { offset: 0, length: 4 } : undefined); },
  head: async (key) => { calls.push(["head", key]); return object(false); },
} };
const waits = [];
const ctx = { waitUntil: (p) => waits.push(p) };
const { default: worker } = await import("./worker.js");
const get = (p, headers = {}) => worker.fetch(new Request(`https://freshcalendars.com${p}`, { headers }), env, ctx);

test("first GET reads R2 and fills the edge cache; the next one is served from it", async () => {
  const a = await get(PDF);
  assert.equal(a.status, 200);
  assert.equal(a.headers.get("X-Edge-Cache"), "MISS");
  assert.equal(await a.text(), body);
  assert.equal(a.headers.get("Link"), '<https://freshcalendars.com/news/story/>; rel="canonical"');
  await Promise.all(waits);
  assert.ok(store.has("https://freshcalendars.com/news/downloads/g/sheet.pdf?v=abc123"), "cached under its content hash");
  calls.length = 0;
  const b = await get(PDF);
  assert.equal(b.headers.get("X-Edge-Cache"), "HIT");
  assert.equal(await b.text(), body);
  assert.equal(b.headers.get("Cache-Control"), "public, max-age=86400, stale-while-revalidate=604800", "readers get the normal policy, not the edge TTL");
  assert.equal(b.headers.get("Link"), '<https://freshcalendars.com/news/story/>; rel="canonical"');
  assert.deepEqual(calls, [], "a hit does not touch R2");
});

test("a client that holds the file gets 304", async () => {
  const r = await get(PDF, { "If-None-Match": '"e1"' });
  assert.equal(r.status, 304);
});

test("range requests, HEAD and unhashed files go to R2 as before", async () => {
  calls.length = 0;
  const r = await get(PDF, { Range: "bytes=0-3" });
  assert.equal(r.status, 206);
  assert.deepEqual(calls[0], ["get", "news/downloads/g/sheet.pdf", true]);
  const h = await worker.fetch(new Request(`https://freshcalendars.com${PDF}`, { method: "HEAD" }), env, ctx);
  assert.equal(h.status, 200);
  assert.equal(calls.at(-1)[0], "head");
  const o = await get(OLD);
  assert.equal(o.status, 200);
  assert.equal(o.headers.get("X-Edge-Cache"), null);
});

test("page-view beacon writes one data point for a same-origin view and ignores the rest", async () => {
  const points = [];
  const pvEnv = { ...env, PV: { writeDataPoint: (d) => points.push(d) } };
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1";
  const beacon = (body, headers = {}) => worker.fetch(new Request("https://freshcalendars.com/api/pv", {
    method: "POST", body, headers: { "Sec-Fetch-Site": "same-origin", "User-Agent": ua, ...headers },
  }), pvEnv, ctx);
  const ok = await beacon(JSON.stringify({ p: "/news/story/", r: "www.bing.com", t: 42.4, s: 130 }));
  assert.equal(ok.status, 204);
  assert.equal(points.length, 1);
  assert.deepEqual(points[0].blobs, ["/news/story/", "www.bing.com", "", "mobile", "", ""]);
  assert.deepEqual(points[0].doubles, [42, 100, 0, 0]);
  await beacon(JSON.stringify({ p: "/news/story/", i: 312.4, id: 120, it: "button.pz-ct", is: "pagead2.googlesyndication.com" }));
  assert.deepEqual(points[1].blobs.slice(4), ["button.pz-ct", "pagead2.googlesyndication.com"]);
  assert.deepEqual(points[1].doubles.slice(2), [312, 120]);
  await beacon(JSON.stringify({ p: "/news/story/", i: 50, it: "<script>", is: "a b" }));
  assert.deepEqual(points[2].blobs.slice(4), ["", ""]);
  points.length = 1;
  assert.equal((await beacon("{}", { "Sec-Fetch-Site": "cross-site" })).status, 204);
  await beacon(JSON.stringify({ p: "/news/x/" }), { "User-Agent": "Googlebot/2.1" });
  await beacon(JSON.stringify({ p: "https://evil.example/" }));
  await beacon("not json");
  await beacon("x".repeat(2000));
  assert.equal((await worker.fetch(new Request("https://freshcalendars.com/api/pv"), pvEnv, ctx)).status, 204);
  assert.equal(points.length, 1);
  // No binding (local runs, or before the first deploy): still 204, nothing written.
  assert.equal((await worker.fetch(new Request("https://freshcalendars.com/api/pv", { method: "POST", body: "{}" }), env, ctx)).status, 204);
});

test("a calendar PDF is served from R2 with its page as canonical; other calendar files go to the CDN host", async () => {
  const { pdfCanonical } = await import("./worker.js");
  const cal = JSON.parse(await readFile(path.join(CF, "calendar-canonical.json"), "utf8"));
  const month = Object.keys(cal).find((k) => /^[a-z]+-\d{4}$/.test(k)), [name, year] = month.split("-");
  calls.length = 0;
  const r = await get(`/assets/studio/${year}/${name}/scenic/letter-sunday.pdf`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Link"), `<${cal[month]}>; rel="canonical"`);
  assert.equal(calls[0][1], `assets/studio/${year}/${name}/scenic/letter-sunday.pdf`, "read from the bucket under the same path");
  // A month with no page of its own (an old year) names the page that always shows that month.
  assert.equal(pdfCanonical("/assets/studio/2019/may/floral/a4-monday.pdf"), "https://freshcalendars.com/may-calendars.html");
  assert.equal(pdfCanonical(`/assets/${year}/monthly/${name}/holidays/calendar.pdf`), cal[month]);
  assert.equal(pdfCanonical("/assets/1999/yearly/classic/calendar.pdf"), "https://freshcalendars.com/printable-calendars.html");
  assert.equal(pdfCanonical("/assets/weekly/hourly/calendar-a4.pdf"), "https://freshcalendars.com/printable-weekly-calendar.html");
  assert.equal(pdfCanonical("/assets/blank/yearly/classic/calendar.pdf"), "https://freshcalendars.com/printable-blank-yearly-calendar.html");
  assert.equal(pdfCanonical("/assets/blank/kids/calendar.pdf"), "https://freshcalendars.com/blank-calendars.html");
  assert.equal(pdfCanonical("/assets/school/2026-2027/overview/calendar.pdf"), "https://freshcalendars.com/printable-school-calendar.html");
  const png = await get("/assets/studio/2026/november/scenic/letter-sunday.png?x=1");
  assert.equal(png.status, 301);
  assert.equal(png.headers.get("Location"), "https://cdn.freshcalendars.com/assets/studio/2026/november/scenic/letter-sunday.png?x=1");
});

test("an ink-saver copy of a news printable takes the canonical of the sheet it copies", async () => {
  const { pdfCanonical } = await import("./worker.js");
  const map = JSON.parse(await readFile(path.join(CF, "pdf-canonical.json"), "utf8"));
  const listed = Object.keys(map).find((k) => !/-(ink|a4)\.pdf$/.test(k) && !map[k.replace(/\.pdf$/, "-ink.pdf")]);
  assert.equal(pdfCanonical(listed.replace(/\.pdf$/, "-ink.pdf")), map[listed]);
  assert.equal(pdfCanonical(listed.replace(/\.pdf$/, "-a4-ink.pdf")), map[listed]);
  assert.equal(pdfCanonical("/news/downloads/none/never-listed.pdf"), null);
});

test("old addresses with no page are redirected; unknown ones stay 404", async () => {
  const loc = async (p) => { const r = await get(p); return [r.status, r.headers.get("Location")]; };
  assert.deepEqual(await loc("/january-2018-calendar"), [301, "https://freshcalendars.com/january-calendars.html"]);
  assert.deepEqual(await loc("/2017-calendar/"), [301, "https://freshcalendars.com/printable-calendars.html"]);
  assert.deepEqual(await loc("/blank-calendar"), [301, "https://freshcalendars.com/blank-calendars.html"]);
  assert.deepEqual(await loc("/printable-monthly-calendar.html"), [301, "https://freshcalendars.com/monthly-calendars/"]);
  assert.deepEqual(await loc("/download/monthly/2018/november/November-2018-Calendar-Printable-Red"), [301, "https://freshcalendars.com/november-calendars.html"]);
  assert.deepEqual(await loc("/calendar/pdf/monthly/2017/december/Vertical-December-2017.pdf"), [301, "https://freshcalendars.com/december-calendars.html"]);
  assert.deepEqual(await loc("/download/blank/31-days-blank-calendar-template-bold"), [301, "https://freshcalendars.com/blank-calendars.html"]);
  // A story linked without /news/, and the calendar file of a live or a renamed story.
  assert.deepEqual(await loc("/live-story-here/"), [301, "https://freshcalendars.com/news/live-story-here/"]);
  assert.deepEqual(await loc("/news/live-story-here/dates.ics"), [301, "https://freshcalendars.com/news/live-story-here/"]);
  assert.deepEqual(await loc("/news/renamed-story-here/dates.ics"), [301, "https://freshcalendars.com/news/renamed-story-here/"]);
  assert.equal((await get("/no-such-story-anywhere/")).status, 404);
  assert.equal((await get("/news/no-such-story-anywhere/dates.ics")).status, 404);
});

test("the shop host answers only its IndexNow key file", async () => {
  const src = await readFile(new URL("./worker.js", import.meta.url), "utf8");
  const key = /SHOP_INDEXNOW_KEY = "([0-9a-f]{32})"/.exec(src)[1];
  const shop = (p) => worker.fetch(new Request(`https://shop.freshcalendars.com${p}`), env, ctx);
  const ok = await shop(`/${key}.txt`);
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), key);
  assert.match(ok.headers.get("Content-Type"), /^text\/plain/);
  assert.equal((await shop("/")).status, 404);
  assert.equal((await shop("/products/x")).status, 404);
  assert.equal((await get(`/${key}.txt`)).status, 404); // the calendar host has no such file
  const cfg = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.ok(cfg.includes(`"shop.freshcalendars.com/${key}.txt"`), "the route must be this one file, never shop.freshcalendars.com/*");
  assert.ok(!/shop\.freshcalendars\.com\/\*/.test(cfg));
});
