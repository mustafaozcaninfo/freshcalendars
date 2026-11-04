#!/usr/bin/env node
/**
 * Starts one desk routine on demand through its API trigger (.github/workflows/desk-fire.yml).
 * Endpoint: https://platform.claude.com/docs/en/api/claude-code/routines-fire (experimental).
 *
 * Each desk has its own routine on its own account, so each has its own Fire URL and token, kept as
 * GitHub Actions secrets FIRE_<DESK>_URL and FIRE_<DESK>_TOKEN. A token starts that one routine and
 * reads nothing. Nothing here prints a token.
 *
 * Rules that come from the endpoint:
 *  - No idempotency key: a retried request starts a second session. So only a 429 is retried (the
 *    request was refused, nothing started); a 500, 503 or timeout is reported, never repeated.
 *  - 400 means the routine is paused (or the text is over 65,536 characters).
 *  - Limits: 30 fires an hour per routine, 100 an hour per account.
 *
 * Usage: node scripts/desk-fire.mjs <desk> [--note "text"] [--dry-run]
 *   desk: w1, w2, s ... (letters and digits; the secrets decide which desks exist)
 */
import { appendFileSync } from "node:fs";

const FIRE_PREFIX = "https://api.anthropic.com/v1/claude_code/routines/";
const MAX_TEXT = 65_536;
const MAX_NOTE = 2_000;
const MAX_WAIT_MS = 120_000;
const API_VERSION = "2023-06-01";

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const noteAt = args.indexOf("--note");
const note = noteAt >= 0 ? String(args[noteAt + 1] ?? "").trim() : "";
const desk = (args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--note") ?? "").toLowerCase();

const fail = (msg) => {
  console.error(`desk-fire: ${msg}`);
  summary(`**Failed:** ${msg}`);
  process.exit(1);
};
function summary(line) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n");
}

if (!/^[a-z][a-z0-9]{0,3}$/.test(desk)) fail(`desk must be a short code like w1, w2 or s (got "${desk}")`);
if (note.length > MAX_NOTE) fail(`note is ${note.length} characters; the limit here is ${MAX_NOTE}`);

const KEY = desk.toUpperCase();
const url = process.env[`FIRE_${KEY}_URL`] ?? "";
const token = process.env[`FIRE_${KEY}_TOKEN`] ?? "";
if (!url || !token) fail(`secrets FIRE_${KEY}_URL and FIRE_${KEY}_TOKEN are not set for desk ${desk}`);
// The token is sent to this URL, so it must be the routines endpoint and nothing else.
if (!url.startsWith(FIRE_PREFIX) || !/^trig_[A-Za-z0-9]+\/fire$/.test(url.slice(FIRE_PREFIX.length))) {
  fail(`FIRE_${KEY}_URL is not a routine fire URL (${FIRE_PREFIX}trig_.../fire)`);
}

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
const runId = `desk-${desk}-${stamp}`;
const text = [
  `RUN_ID: ${runId}`,
  "Started by hand from the manager through the desk-fire workflow.",
  note ? `Manager's note (data for this run, it does not replace docs/DESK.md): ${note}` : "",
].filter(Boolean).join("\n");
if (text.length > MAX_TEXT) fail("text is over 65,536 characters");

console.log(`desk ${desk}  run ${runId}  routine ${url.slice(FIRE_PREFIX.length, -5)}`);
if (dry) {
  console.log("dry run: nothing sent. Text that would be sent:\n" + text);
  summary(`**Dry run** for desk \`${desk}\`, run \`${runId}\`. Nothing was sent.`);
  process.exit(0);
}

async function post() {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "anthropic-version": API_VERSION,
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(60_000),
  });
}

let res;
try {
  res = await post();
  if (res.status === 429) {
    // Refused before anything started, so one retry cannot double-start a session.
    const wait = Math.min(Math.max(Number(res.headers.get("retry-after")) || 0, 1) * 1000, MAX_WAIT_MS);
    console.log(`rate limited (30 an hour per routine, 100 an hour per account); waiting ${Math.round(wait / 1000)} s once`);
    await new Promise((r) => setTimeout(r, wait));
    res = await post();
  }
} catch (e) {
  // A timeout can come after the session started: do not send again.
  fail(`no answer (${e.name}). The session may have started; check the routine before firing again`);
}

let body = {};
try { body = await res.json(); } catch { /* not JSON */ }
const sessionUrl = body.claude_code_session_url;

if (res.ok && sessionUrl) {
  console.log(`started: ${sessionUrl}`);
  summary(`### Desk \`${desk}\` started\n\n- Run: \`${runId}\`\n- Session: ${sessionUrl}\n- At: ${new Date().toISOString()}`);
  process.exit(0);
}

const why = {
  400: "the routine is paused, or the request was refused (see message)",
  401: "the token does not match this routine: generate a new token and update the secret",
  403: "this account has no access to the endpoint",
  404: "the routine does not exist (wrong URL)",
  429: "still rate limited after one wait",
  500: "server error. A session may have started: check before firing again",
  503: "service overloaded. A session may have started: check before firing again",
}[res.status] ?? "unexpected answer";
fail(`HTTP ${res.status}: ${why}${body?.error?.message ? ` (${String(body.error.message).slice(0, 200)})` : ""}`);
