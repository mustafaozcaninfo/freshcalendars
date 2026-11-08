#!/usr/bin/env node
/**
 * Sends /news/ URLs to the AnindaIndex indexing API (https://anindaindex.com): each new story once,
 * and an updated story once per new modified time (owner decision 2026-11-08: every update goes to
 * Google too). cloudflare/index-ping.mjs calls it after each deploy; IndexNow still covers Bing and
 * others. Every URL is recorded per engine with the modified time it was sent for, so the same
 * version is never paid for twice, and URLs that could not be sent (rate limit, capacity, network)
 * stay queued and go out with the next run. It never fails the publish: problems are logged.
 *
 * Usage: node scripts/index-submit.mjs submit [url...] [--updated url|modified ...]
 *                                                       queue new URLs and updated versions, send everything queued
 *        node scripts/index-submit.mjs flush               send what is queued
 *        node scripts/index-submit.mjs balance | status <projectId> | state
 * Env:   ANINDA_INDEX_KEY (required to send), ANINDA_INDEX_ENGINES (default "google"; "google,bing"),
 *        ANINDA_INDEX_INSTANT=1 (Google instant mode, 10 credits/URL), ANINDA_INDEX_MAX (default 25:
 *        more new URLs than this in one run are refused, so an empty target or a rebuild can never
 *        spend the day's credits), ANINDA_INDEX_MAX_UPDATED (default 60, the same guard for updated
 *        stories: a change that touches every page's modified time is not sent), ANINDA_INDEX_STATE (default <repo>/.index-submit/state.json),
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
const MAX_UPDATED = Number(process.env.ANINDA_INDEX_MAX_UPDATED || 60);
const DRY = process.env.ANINDA_INDEX_DRY === "1";
const STATE_FILE = process.env.ANINDA_INDEX_STATE || path.join(ROOT, ".index-submit/state.json");
/** A queued URL that keeps failing with a 400 (bad URL, no credit) is dropped after this many tries. */
const MAX_TRIES = 5;
const BATCH = INSTANT ? 50 : 200;

const log = (msg) => console.log(`[index] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * state = { done: { engine: { url: { at, projectId, mod? } } }, pending: { engine: { url: tries } },
 *           pendingMod: { engine: { url: modified } } }; mod is the article:modified_time an updated
 * story was sent for (new stories have none).
 */
function load() {
  const s = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};
  s.done ??= {}; s.pending ??= {}; s.pendingMod ??= {};
  for (const e of ENGINES) { s.done[e] ??= {}; s.pending[e] ??= {}; s.pendingMod[e] ??= {}; }
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
    const markDone = (projectId) => {
      for (const u of batch) {
        const mod = s.pendingMod[engine][u];
        s.done[engine][u] = mod ? { at, projectId, mod } : { at, projectId };
        delete s.pending[engine][u]; delete s.pendingMod[engine][u];
      }
    };

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
        if (tries >= MAX_TRIES) { delete s.pending[engine][u]; delete s.pendingMod[engine][u]; log(`${engine}: dropped ${u} after ${tries} tries`); }
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
  const cut = args.indexOf("--updated");
  const isUrl = (u) => /^https:\/\/\S+$/.test(u);
  const urls = [...new Set((cut < 0 ? args : args.slice(0, cut)).filter(isUrl))];
  // "url|modified": the story's article:modified_time, so each new version is sent once.
  const updated = new Map((cut < 0 ? [] : args.slice(cut + 1)).map((a) => a.split("|")).filter(([u, m]) => isUrl(u) && m));
  for (const e of ENGINES) {
    const fresh = urls.filter((u) => !s.done[e][u] && !(u in s.pending[e]));
    if (fresh.length > MAX_NEW) log(`${e}: ${fresh.length} new URLs is over ANINDA_INDEX_MAX=${MAX_NEW}; not queued (a rebuild or empty target?)`);
    else for (const u of fresh) s.pending[e][u] = 0;
    const changed = [...updated].filter(([u, m]) => s.done[e][u]?.mod !== m && s.pendingMod[e][u] !== m && !(u in s.pending[e] && !s.pendingMod[e][u]));
    if (changed.length > MAX_UPDATED) log(`${e}: ${changed.length} updated URLs is over ANINDA_INDEX_MAX_UPDATED=${MAX_UPDATED}; not queued (a change to every page?)`);
    else for (const [u, m] of changed) { s.pending[e][u] = 0; s.pendingMod[e][u] = m; }
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
