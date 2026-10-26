#!/usr/bin/env node
/**
 * Sends each new /news/ URL to the AnindaIndex indexing API exactly once (https://anindaindex.com).
 * scripts/news-publish.sh calls it with the stories that were new in that publish; IndexNow still
 * covers Bing and others, this adds Google. Every URL is recorded per engine in a state file, so a
 * URL is never paid for twice, and URLs that could not be sent (rate limit, capacity, network)
 * stay queued and go out with the next run. It never fails the publish: problems are logged.
 *
 * Usage: node scripts/index-submit.mjs submit [url...]   queue new URLs and send everything queued
 *        node scripts/index-submit.mjs flush               send what is queued
 *        node scripts/index-submit.mjs balance | status <projectId> | state
 * Env:   ANINDA_INDEX_KEY (required to send), ANINDA_INDEX_ENGINES (default "google"; "google,bing"),
 *        ANINDA_INDEX_INSTANT=1 (Google instant mode, 10 credits/URL), ANINDA_INDEX_MAX (default 25:
 *        more new URLs than this in one run are refused, so an empty target or a rebuild can never
 *        spend the day's credits), ANINDA_INDEX_STATE (default <repo>/.index-submit/state.json),
 *        ANINDA_INDEX_DRY=1 (log only).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://anindaindex.com/v1";
const KEY = process.env.ANINDA_INDEX_KEY ?? "";
const ENGINES = (process.env.ANINDA_INDEX_ENGINES || "google").split(",").map((e) => e.trim()).filter(Boolean);
const INSTANT = process.env.ANINDA_INDEX_INSTANT === "1";
const MAX_NEW = Number(process.env.ANINDA_INDEX_MAX || 25);
const DRY = process.env.ANINDA_INDEX_DRY === "1";
const STATE_FILE = process.env.ANINDA_INDEX_STATE || path.join(ROOT, ".index-submit/state.json");
/** A queued URL that keeps failing with a 400 (bad URL, no credit) is dropped after this many tries. */
const MAX_TRIES = 5;
const BATCH = INSTANT ? 50 : 200;

const log = (msg) => console.log(`[index] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** state = { done: { engine: { url: { at, projectId } } }, pending: { engine: { url: tries } } } */
function load() {
  const s = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};
  s.done ??= {}; s.pending ??= {};
  for (const e of ENGINES) { s.done[e] ??= {}; s.pending[e] ??= {}; }
  return s;
}
function save(s) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(`${STATE_FILE}.tmp`, `${JSON.stringify(s, null, 1)}\n`);
  renameSync(`${STATE_FILE}.tmp`, STATE_FILE);
}

async function api(method, route, body, headers = {}) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { "X-Api-Key": KEY, ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }
  return { status: res.status, data, retryAfter: res.headers.get("retry-after") };
}

/** Sends one engine's queue in batches. Same body, same Idempotency-Key, so a retry after a lost response is free. */
async function flushEngine(s, engine) {
  const urls = Object.keys(s.pending[engine]);
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH).sort();
    const body = { engine, urls: batch, name: `freshcalendars-news-${new Date().toISOString().slice(0, 10)}` };
    if (engine === "google") body.instant = INSTANT;
    const idem = createHash("sha256").update(`${engine}\n${INSTANT}\n${batch.join("\n")}`).digest("hex").slice(0, 40);
    if (DRY) { log(`dry run: would send ${batch.length} URL(s) to ${engine}: ${batch.join(" ")}`); continue; }

    let r;
    try { r = await api("POST", "/index", body, { "Idempotency-Key": `fc-${idem}` }); }
    catch (err) { log(`${engine}: request failed (${err.message}); ${batch.length} URL(s) stay queued`); return; }
    const at = new Date().toISOString();
    const markDone = (projectId) => { for (const u of batch) { s.done[engine][u] = { at, projectId }; delete s.pending[engine][u]; } };

    if (r.status === 200 && r.data.ok) {
      markDone(r.data.projectId ?? null);
      log(`${engine}: sent ${batch.length} URL(s), project ${r.data.projectId}, ${r.data.creditsUsed} credit(s)${r.data.idempotentReplay ? " (replay)" : ""}`);
    } else if (r.status === 409) {
      // The same list went out in the last 10 minutes: it is already submitted.
      markDone(null);
      log(`${engine}: ${batch.length} URL(s) already submitted (409), marked done`);
    } else if (r.status === 400) {
      for (const u of batch) {
        const tries = (s.pending[engine][u] ?? 0) + 1;
        if (tries >= MAX_TRIES) { delete s.pending[engine][u]; log(`${engine}: dropped ${u} after ${tries} tries`); }
        else s.pending[engine][u] = tries;
      }
      log(`${engine}: rejected (400 ${r.data.error ?? ""}); queued for the next run`);
    } else {
      // 401/403 (key or account), 429 (limit), 503 (daily capacity), 5xx: keep everything queued.
      log(`${engine}: HTTP ${r.status} ${r.data.error ?? ""}${r.retryAfter ? ` (retry after ${r.retryAfter}s)` : ""}; ${urls.length - i} URL(s) stay queued`);
      return;
    }
    await sleep(1100); // 1 request per second per key
  }
}

async function main() {
  const [cmd = "flush", ...args] = process.argv.slice(2);
  if (cmd === "state") {
    const s = load();
    for (const e of ENGINES) log(`${e}: ${Object.keys(s.done[e]).length} sent, ${Object.keys(s.pending[e]).length} queued`);
    return;
  }
  if (!KEY && !DRY) { log("ANINDA_INDEX_KEY not set; skipping"); return; }
  if (cmd === "balance") { const r = await api("GET", "/balance"); console.log(JSON.stringify(r.data)); return; }
  if (cmd === "status") { const r = await api("GET", `/projects/${encodeURIComponent(args[0] ?? "")}`); console.log(JSON.stringify(r.data, null, 2)); return; }
  if (cmd !== "submit" && cmd !== "flush") { log(`unknown command ${cmd}`); process.exitCode = 1; return; }

  const s = load();
  const urls = [...new Set(args.filter((u) => /^https:\/\/\S+$/.test(u)))];
  for (const e of ENGINES) {
    const fresh = urls.filter((u) => !s.done[e][u] && !(u in s.pending[e]));
    if (fresh.length > MAX_NEW) {
      log(`${e}: ${fresh.length} new URLs is over ANINDA_INDEX_MAX=${MAX_NEW}; not queued (a rebuild or empty target?)`);
      continue;
    }
    for (const u of fresh) s.pending[e][u] = 0;
  }
  if (!DRY) save(s);
  for (const [i, e] of ENGINES.entries()) {
    if (!Object.keys(s.pending[e]).length) continue;
    if (i) await sleep(1100);
    await flushEngine(s, e);
    if (!DRY) save(s);
  }
}

main().catch((err) => log(`error: ${err.message}`));
