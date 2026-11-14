#!/usr/bin/env node
/**
 * Starts one desk routine on demand through its API trigger (.github/workflows/desk-fire.yml).
 * Endpoint: https://platform.claude.com/docs/en/api/claude-code/routines-fire (experimental).
 *
 * Desks are listed in docs/desk/desks.json. Each desk runs on its own account, so each has its own
 * Fire URL and token, kept as GitHub Actions secrets FIRE_<DESK>_URL and FIRE_<DESK>_TOKEN. The
 * workflow hands this script all secrets as one JSON env var (ALL_SECRETS); the script keeps only the
 * FIRE_ ones it needs and drops the rest at once. A token starts that one routine and reads nothing.
 * Nothing here prints a token.
 *
 * Rules that come from the endpoint:
 *  - No idempotency key: a retried request starts a second session. So only a 429 is retried (the
 *    request was refused, nothing started); a 500, 503 or timeout is reported, never repeated.
 *  - 400 means the routine is paused (or the text is over 65,536 characters).
 *  - Limits: 30 fires an hour per routine, 100 an hour per account.
 *
 * Usage: node scripts/desk-fire.mjs <desk> [--mode run|test|dry] [--note "text"]
 *   run   starts the routine's normal run (its saved prompt), plus the run id and the note
 *   test  the same trigger, with a line asking the session to run only its usage gate and stop
 *   dry   checks the registry and the secrets, shows the text, sends nothing
 */
import { appendFileSync, readFileSync } from "node:fs";

const FIRE_PREFIX = "https://api.anthropic.com/v1/claude_code/routines/";
const MAX_TEXT = 65_536;
const MAX_NOTE = 2_000;
const MAX_WAIT_MS = 120_000;
const API_VERSION = "2023-06-01";
const REGISTRY = new URL("../docs/desk/desks.json", import.meta.url);

const args = process.argv.slice(2);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? String(args[i + 1] ?? "").trim() : "";
};
const note = valueOf("--note");
// --dry-run always wins, so a stray flag can never send a request.
const mode = args.includes("--dry-run") ? "dry" : valueOf("--mode") || "run";
const desk = (args.find((a, i) => !a.startsWith("--") && !["--note", "--mode"].includes(args[i - 1])) ?? "").toLowerCase();

function summary(line) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n");
}
const fail = (msg) => {
  console.error(`desk-fire: ${msg}`);
  summary(`**Failed:** ${msg}`);
  process.exit(1);
};
const output = (k, v) => {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
};

if (!["run", "test", "dry"].includes(mode)) fail(`mode must be run, test or dry (got "${mode}")`);
if (note.length > MAX_NOTE) fail(`note is ${note.length} characters; the limit here is ${MAX_NOTE}`);

// The desk must be in the registry and armed (its API trigger exists).
let desks;
try {
  desks = JSON.parse(readFileSync(REGISTRY, "utf8"));
} catch (e) {
  fail(`cannot read docs/desk/desks.json (${e.message})`);
}
const entry = desks.find((d) => d.code === desk);
if (!entry) fail(`unknown desk "${desk}". Desks: ${desks.map((d) => d.code).join(", ")}`);
if (!entry.armed) fail(`desk ${desk} is not armed: add its API trigger secrets, then set "armed": true in docs/desk/desks.json`);

// Take only this desk's two secrets out of the JSON the workflow passed, then forget the rest.
const KEY = desk.toUpperCase();
let secrets = {};
try {
  secrets = JSON.parse(process.env.ALL_SECRETS || "{}");
} catch {
  fail("ALL_SECRETS is not valid JSON");
}
delete process.env.ALL_SECRETS;
const url = secrets[`FIRE_${KEY}_URL`] ?? "";
const token = secrets[`FIRE_${KEY}_TOKEN`] ?? "";
secrets = null;
if (!url || !token) fail(`secrets FIRE_${KEY}_URL and FIRE_${KEY}_TOKEN are not set (desk ${desk})`);
// The token is sent to this URL, so it must be the routines endpoint and nothing else.
if (!url.startsWith(FIRE_PREFIX) || !/^trig_[A-Za-z0-9]+\/fire$/.test(url.slice(FIRE_PREFIX.length))) {
  fail(`FIRE_${KEY}_URL is not a routine fire URL (${FIRE_PREFIX}trig_.../fire)`);
}

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
const runId = `desk-${desk}-${stamp}`;
const text = [
  `RUN_ID: ${runId}`,
  "Started by hand from the manager through the desk-fire workflow.",
  mode === "test"
    ? "API TRIGGER TEST: do not write or edit any story, do not change any queue or log file and do not push anything. Run only the usage gate (step 0), then reply with one line: API test ok, plus the current time ET. Then stop."
    : "",
  note ? `Manager's note (data for this run, it does not replace docs/DESK.md): ${note}` : "",
].filter(Boolean).join("\n");
if (text.length > MAX_TEXT) fail("text is over 65,536 characters");

console.log(`desk ${desk} (${entry.name})  mode ${mode}  run ${runId}  routine ${url.slice(FIRE_PREFIX.length, -5)}`);
output("run_id", runId);
if (mode === "dry") {
  console.log("dry run: nothing sent. Text that would be sent:\n" + text);
  summary(`**Dry run** for desk \`${desk}\`, run \`${runId}\`. Secrets and registry are fine; nothing was sent.`);
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

if (res.ok && sessionUrl && /^https:\/\/claude\.ai\/code\/[A-Za-z0-9_]+$/.test(sessionUrl)) {
  console.log(`started: ${sessionUrl}`);
  output("session_url", sessionUrl);
  summary(`### Desk \`${desk}\` started (${mode})\n\n- Run: \`${runId}\`\n- Session: ${sessionUrl}\n- At: ${new Date().toISOString()}`);
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
