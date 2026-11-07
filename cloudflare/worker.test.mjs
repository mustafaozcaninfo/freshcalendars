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
const env = { CDN: {
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
  assert.deepEqual(points[0].blobs, ["/news/story/", "www.bing.com", "", "mobile"]);
  assert.deepEqual(points[0].doubles, [42, 100]);
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
