#!/usr/bin/env node
/**
 * Desk watchdog (docs/DESK.md "Watchdog", .github/workflows/desk-watchdog.yml). A writer or puzzle
 * session can end before its pull request merges; nothing else would notice. Each run:
 *  1. desk pull requests ([W1]..., Puzzles ...): merge main into a conflicting one when only the
 *     queue files conflict (both sides kept), start CI where none ran, merge one that
 *     has been green for GRACE minutes, then start CI on main so it publishes;
 *  2. delete claim branches the "Claiming" rules free (ticked, blocked, stalled) and branches
 *     already in main;
 *  3. write what needs a person (red CI, other conflicts, silent writers, blocked items) to the
 *     "Desk watchdog" issue.
 * Pushes and merges made with the Actions token start no workflows, so CI is started by hand.
 * Usage: node scripts/desk-watchdog.mjs [--dry-run]
 */
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DESK_PR, outOfScope } from "./desk-scope.mjs";

const DRY = process.argv.includes("--dry-run");
const NOW = Date.now();
const MIN = 60e3;
const H = 60 * MIN;
const GRACE = 20 * MIN;      // the session itself merges right after CI; give it the first chance
const NO_CI = 20 * MIN;      // a head commit this old with no checks never got a CI run
const STALL = 3 * H;         // docs/DESK.md "Claiming"
const SILENT = 8 * H;        // writers run every 6 h; one missed run shows here
const OLD_MERGED = 6 * H;    // a branch in main younger than this may be a run that has not committed yet
// Lines both sides add to these files belong together (docs/DESK.md "Writer rules").
const UNION = ["docs/desk/*.md"];

const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const git = (...a) => run("git", a);
const gh = (...a) => run("gh", a);
const did = [];
const attention = [];
const act = (msg, fn) => {
  console.log(`${DRY ? "[dry run] " : ""}${msg}`);
  did.push(msg);
  if (!DRY) fn();
};
const ago = (t) => `${Math.round((NOW - t) / H * 10) / 10} h ago`;

git("fetch", "-q", "--prune", "origin", "+refs/heads/*:refs/remotes/origin/*");
const commitTime = (ref) => Number(git("log", "-1", "--format=%ct", ref)) * 1000;
const inMain = (ref) => spawnSync("git", ["merge-base", "--is-ancestor", ref, "origin/main"]).status === 0;

// Queue items on main: id -> { writer, state: open | done | blocked, text }.
const items = new Map();
const writers = [];
for (const f of git("ls-tree", "--name-only", "origin/main", "docs/desk/").split("\n")) {
  const m = path.basename(f).match(/^(w\d)\.md$/);
  if (!m) continue;
  writers.push(m[1]);
  for (const line of git("show", `origin/main:${f}`).split("\n")) {
    const it = line.match(/^- \[( |x)\] \*\*([^*]+)\*\*\s*(.*)$/);
    if (!it) continue;
    const state = it[1] === "x" ? "done" : /^\(blocked/.test(it[3]) ? "blocked" : "open";
    items.set(it[2], { writer: m[1], state, text: it[3] });
  }
}

// Pull requests from forks are never ours: the repository is public, so anyone can open one with a
// desk title, and its CI runs the fork's own code. Their head branch is not a branch of this
// repository either (origin/<name> is missing or is someone else's branch). The watchdog leaves
// them to a person and reports only their number, never their text.
const allPrs = JSON.parse(gh("pr", "list", "--state", "open", "--limit", "100",
  "--json", "number,title,headRefName,headRefOid,isDraft,mergeable,statusCheckRollup,isCrossRepository"));
const prs = allPrs.filter((p) => p.isCrossRepository === false);
const forks = allPrs.filter((p) => p.isCrossRepository !== false);
if (forks.length) attention.push(`pull request(s) from outside this repository, not handled by the watchdog (review by hand, never merge unread): ${forks.map((p) => `#${p.number}`).join(", ")}`);
const openHeads = new Set(prs.map((p) => p.headRefName));

// 1. Desk pull requests. Each one is handled on its own: an error is reported and the run goes on,
// so one bad pull request never stops the merges, the publish, the cleanup or the report.
let merged = 0;
for (const pr of prs) {
  if (pr.isDraft || !DESK_PR.test(pr.title)) continue;
  const tag = `#${pr.number} ${pr.title.slice(0, 70)}`;
  try {
    merged += deskPr(pr, tag);
  } catch (e) {
    attention.push(`${tag}: watchdog error, skipped (${String(e.message).split("\n")[0].slice(0, 200)})`);
  }
}

/** One desk pull request: merge main in, start CI, or merge it. Returns 1 when it was merged. */
function deskPr(pr, tag) {
  const ref = `origin/${pr.headRefName}`;
  if (pr.mergeable === "CONFLICTING") { mergeMain(pr, tag); return 0; }
  if (pr.mergeable !== "MERGEABLE") return 0; // GitHub is still working it out; next run
  const checks = (pr.statusCheckRollup ?? []).map((c) => ({
    name: c.name ?? c.context,
    done: c.status ? c.status === "COMPLETED" : c.state !== "PENDING",
    ok: ["SUCCESS", "SKIPPED", "NEUTRAL"].includes(c.conclusion ?? c.state),
    at: Date.parse(c.completedAt ?? c.startedAt ?? 0) || 0,
  }));
  if (!checks.length) {
    if (NOW - commitTime(ref) > NO_CI) act(`${tag}: no CI ran on ${pr.headRefOid.slice(0, 8)}; starting it`,
      () => gh("workflow", "run", "ci.yml", "--ref", pr.headRefName));
    return 0;
  }
  if (checks.some((c) => !c.done)) return 0;
  const failed = checks.filter((c) => !c.ok).map((c) => c.name);
  if (failed.length) { attention.push(`${tag}: CI failed (${failed.join(", ")}); needs a fix commit`); return 0; }
  const green = Math.max(...checks.map((c) => c.at));
  if (NOW - green < GRACE) return 0;
  // Main's copy of the scope rule, so the pull request cannot change the check that judges it.
  const bad = outOfScope(gh("pr", "diff", String(pr.number), "--name-only").split("\n").filter(Boolean));
  if (bad.length) {
    attention.push(`${tag}: changes files a desk pull request may not touch (${bad.slice(0, 5).join(", ")}${bad.length > 5 ? ", ..." : ""}); not merged, the owner decides`);
    return 0;
  }
  act(`${tag}: green since ${ago(green)}; merging`, () => {
    // --match-head-commit: merge only the commit whose checks were read, not one pushed since.
    gh("pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid);
    openHeads.delete(pr.headRefName);
    // The merge is done; a failed branch delete only leaves the branch for the cleanup below.
    try { git("push", "-q", "origin", "--delete", pr.headRefName); } catch {}
  });
  return 1;
}
if (merged) act("starting CI on main so the merged stories publish", () => gh("workflow", "run", "ci.yml", "--ref", "main"));

// 1b. Main itself red: a red main is never published and every open pull request inherits the failure,
// so it is the first thing a person should see. A red pull request that is only behind a main that has
// since gone green needs main merged in, not a fix.
const mainRuns = JSON.parse(gh("run", "list", "--workflow", "ci.yml", "--branch", "main", "--event", "push", "--limit", "5",
  "--json", "conclusion,status,createdAt,url"));
const lastDone = mainRuns.find((r) => r.status === "completed");
if (lastDone && lastDone.conclusion === "failure") attention.push(`main CI is red (${ago(Date.parse(lastDone.createdAt))}): ${lastDone.url}; nothing publishes until it is fixed`);
else if (lastDone) {
  for (const pr of prs) {
    if (pr.isDraft || DESK_PR.test(pr.title)) continue;
    const red = (pr.statusCheckRollup ?? []).some((c) => (c.conclusion ?? c.state) === "FAILURE");
    if (red && !inMain(`origin/${pr.headRefName}`) && spawnSync("git", ["merge-base", "--is-ancestor", "origin/main", `origin/${pr.headRefName}`]).status !== 0)
      attention.push(`#${pr.number} ${pr.title.slice(0, 60)}: CI red and the branch is behind a green main; merge main in and re-run CI`);
  }
}

/** Merges main into a conflicting desk branch when only UNION files conflict, then starts its CI. */
function mergeMain(pr, tag) {
  const b = pr.headRefName;
  const dir = path.join(tmpdir(), `desk-watchdog-${pr.number}`);
  try {
    git("worktree", "add", "-q", "-f", "--detach", dir, `origin/${b}`);
    const attrs = path.join(tmpdir(), "desk-watchdog.attributes");
    writeFileSync(attrs, UNION.map((p) => `${p} merge=union\n`).join(""));
    const wt = (...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    wt("-c", `core.attributesFile=${attrs}`, "-c", "user.name=github-actions[bot]",
      "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "merge", "--no-edit", "-m", "Merge main (desk watchdog: queue lines from both sides)", "origin/main");
    act(`${tag}: conflicted with main in queue lines only; merged main, kept both sides, starting CI`, () => {
      wt("push", "-q", "origin", `HEAD:refs/heads/${b}`);
      gh("workflow", "run", "ci.yml", "--ref", b);
    });
  } catch {
    const left = spawnSync("git", ["-C", dir, "diff", "--name-only", "--diff-filter=U"], { encoding: "utf8" }).stdout.trim();
    attention.push(`${tag}: conflicts with main in ${left.split("\n").join(", ") || "files"}; needs a person`);
  } finally {
    spawnSync("git", ["worktree", "remove", "-f", dir]); // absent when the add itself failed
  }
}

// 2. Branches.
const branches = git("for-each-ref", "--format=%(refname:short) %(committerdate:unix) %(objectname)", "refs/remotes/origin/claude/")
  .split("\n").filter(Boolean).map((l) => {
    const [ref, t, sha] = l.split(" ");
    return { ref, name: ref.replace(/^origin\//, ""), time: Number(t) * 1000, sha };
  });
// Writers squash-merge, so a run branch never becomes part of main's history and the "already in
// main" test below misses it. A branch whose tip is exactly the head of a merged pull request is
// fully in main all the same.
const mergedHeads = new Map(JSON.parse(gh("pr", "list", "--state", "merged", "--limit", "200",
  "--json", "number,headRefName,headRefOid,mergedAt")).map((p) => [`${p.headRefName} ${p.headRefOid}`, p]));
const mergedPr = (b) => mergedHeads.get(`${b.name} ${b.sha}`);
const writerBusy = (w) => prs.some((p) => p.title.startsWith(`[${w.toUpperCase()}]`))
  || branches.some((b) => b.name.startsWith(`claude/desk-run-${w}-`) && NOW - b.time < STALL);
const cleaned = []; // branches already in main: nothing is lost, so they are only counted
for (const b of branches) {
  if (openHeads.has(b.name)) continue;
  let why = null;
  const claim = b.name.match(/^claude\/desk-(?!run-)(.+)$/);
  if (claim) {
    const item = items.get(claim[1]);
    // A self-found item gets its queue line only when its run merges, so a claim with no item is
    // normal while that run works. Left for longer than STALL (an update that found nothing to
    // change, a run that ended early) it would hide the story from every later run: delete it.
    if (!item) { if (NOW - b.time > STALL) why = `no queue item, newest commit ${ago(b.time)}`; }
    else if (item.state === "done") why = "item ticked";
    else if (item.state === "blocked") why = "item blocked";
    else if (NOW - b.time > STALL && !writerBusy(item.writer)) why = `stalled, newest commit ${ago(b.time)}`;
  } else if (inMain(b.ref) && NOW - b.time > OLD_MERGED) why = "already in main";
  else if (mergedPr(b) && NOW - Date.parse(mergedPr(b).mergedAt) > OLD_MERGED) why = "already in main";
  else if (/^claude\/desk-run-/.test(b.name) && NOW - b.time > 24 * H) {
    attention.push(`${b.name}: unmerged run with no pull request (${ago(b.time)})`);
  }
  if (why === "already in main") { if (!DRY) git("push", "-q", "origin", "--delete", b.name); else console.log(`[dry run] would delete ${b.name}`); cleaned.push(b.name); }
  else if (why) act(`delete ${b.name}: ${why}`, () => git("push", "-q", "origin", "--delete", b.name));
}

// 3. Report.
const recent = JSON.parse(gh("pr", "list", "--state", "all", "--limit", "150", "--json", "title,createdAt"));
for (const w of writers) {
  const times = recent.filter((p) => p.title.startsWith(`[${w.toUpperCase()}]`)).map((p) => Date.parse(p.createdAt))
    .concat(branches.filter((b) => b.name.startsWith("claude/desk-") && items.get(b.name.slice(12))?.writer === w).map((b) => b.time));
  const last = Math.max(0, ...times);
  if (NOW - last > SILENT) attention.push(`${w.toUpperCase()}: no pull request or claim for ${last ? ago(last).replace(" ago", "") : "a long time"}; check its routine`);
}
// The research desk (r) commits "desk(r): ..." to main every run; the update desk (u) lands "[U] ..."
// pull requests or a "desk(u): ..." line when nothing changed (docs/DESK.md). Checked only once a
// desk has run at least once, so a routine not set up yet raises nothing.
for (const [code, name, window] of [["r", "Research desk", SILENT], ["u", "Update desk", SILENT], ["s", "Search desk", 30 * H]]) {
  const mark = (l) => l.startsWith(`desk(${code}):`) || (code === "u" && l.startsWith("[U]"));
  const ever = git("log", "origin/main", "--format=%s", "-E", `--grep=^(desk\\(${code}\\):${code === "u" ? "|\\[U\\])" : ")"}`, "-1");
  if (!ever) continue;
  const lately = git("log", "origin/main", `--since=${window / H} hours ago`, "--format=%s").split("\n").some(mark)
    || recent.some((p) => code === "u" && p.title.startsWith("[U]") && NOW - Date.parse(p.createdAt) < window);
  if (!lately) attention.push(`${name} (${code}): no run on record for ${window / H} hours; check its routine`);
}
// The daily Search Console read (.github/workflows/search-console.yml) commits its data to main; a
// file older than 3 days means the job or its credentials failed. Checked only once a file exists.
try {
  const sc = JSON.parse(git("show", "origin/main:docs/desk/search-console.json"));
  if (NOW - Date.parse(sc.generatedAt) > 3 * 24 * H) attention.push(`Search Console data is ${ago(Date.parse(sc.generatedAt))} old; check the "Search Console" workflow and its secrets`);
} catch { /* not set up yet */ }
// Daily puzzle pages on main: written in the new model and not repeating the last three days
// (audit 13-PUZZLE-MODEL and 13-PUZZLE-SIMILAR), and how far ahead each game is written. CI already
// blocks a failing page; this shows the state every day in the issue.
const puzzleLines = [];
try {
  const dir = path.join(tmpdir(), "watchdog-articles");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync("sh", ["-c", `git archive origin/main apps/news/src/content/articles | tar -x -C "${dir}"`]);
  const lib = await import("./lib/puzzle-similarity.mjs");
  const src = path.join(dir, "apps/news/src/content/articles");
  const today = new Date(NOW).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const model = lib.modelProblems(src), similar = lib.similarityProblems(src).fails;
  for (const p of [...model, ...similar]) attention.push(`Puzzle page in the old model: ${p}`);
  puzzleLines.push(model.length || similar.length
    ? `- ${model.length + similar.length} page(s) from ${lib.SIMILAR_SINCE} on fail the new model (listed under "Needs a person").`
    : `- Every page from ${lib.SIMILAR_SINCE} on is in the new model (no rules section, hub rules linked, under ${lib.SIMILAR_MAX} shared with the last three days).`);
  // Same-day games (Waffle, Quordle and the like) are written from 7:17 a.m. ET; by 3 p.m. ET every
  // routine of the day has run, so a game active this week with no page for today has stalled.
  const weekAgo = new Date(NOW - 7 * 24 * H).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const etHour = Number(new Date(NOW).toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }));
  puzzleLines.push("", "| Game | Pages from today | Last date written |", "|---|---|---|");
  for (const g of lib.queueAhead(src, today)) {
    if (g.last < weekAgo) continue;
    const behind = g.last < today;
    puzzleLines.push(`| ${g.game} | ${g.ahead} | ${g.last}${behind ? " (no page for today yet)" : ""} |`);
    if (behind && etHour >= 15) attention.push(`Puzzle queue: ${g.game} has no page for ${today} (last ${g.last}); check routine A or B`);
  }
} catch (e) {
  puzzleLines.push(`- Could not check the puzzle pages: ${e.message.split("\n")[0]}`);
}
const blocked = [...items].filter(([, it]) => it.state === "blocked")
  .map(([id, it]) => `- ${it.writer.toUpperCase()} \`${id}\` ${it.text.match(/^\(([^)]*)\)/)?.[1] ?? ""}`);

const stamp = new Date(NOW).toISOString().slice(0, 16).replace("T", " ") + " UTC";
const body = [
  `Updated by the desk watchdog (\`scripts/desk-watchdog.mjs\`), last check ${stamp}. See docs/DESK.md "Watchdog".`,
  "", "## Needs a person", "", ...(attention.length ? attention.map((a) => `- ${a}`) : ["Nothing."]),
  "", "## Done in the last check", "", ...(did.length ? did.map((d) => `- ${d}`) : ["Nothing to do."]),
  ...(cleaned.length ? ["", `${DRY ? "Would delete" : "Deleted"} ${cleaned.length} branch(es) already in main.`] : []),
  "", "## Puzzle pages (new model)", "", ...puzzleLines,
  "", "## Blocked items (the manager unblocks them)", "", ...(blocked.length ? blocked : ["None."]), "",
].join("\n");
console.log(`\n${body}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
if (!DRY) {
  const file = path.join(tmpdir(), "desk-watchdog.md");
  writeFileSync(file, body);
  // Only the issue the Actions bot opened: anyone can open an issue with this title on a public
  // repository, and the manager acts on what it says. If only someone else's issue has the title,
  // write nothing there and open none (a new one each run would pile up); the run log still has it.
  const BOT = new Set(["app/github-actions", "github-actions", "github-actions[bot]"]);
  const titled = JSON.parse(gh("issue", "list", "--state", "open", "--search", "\"Desk watchdog\" in:title", "--json", "number,title,author"))
    .filter((i) => i.title === "Desk watchdog");
  const issue = titled.find((i) => BOT.has(i.author?.login));
  if (issue) gh("issue", "edit", String(issue.number), "--body-file", file);
  else if (!titled.length) gh("issue", "create", "--title", "Desk watchdog", "--body-file", file);
  else console.warn(`::warning::Open "Desk watchdog" issue(s) ${titled.map((i) => `#${i.number}`).join(", ")} not opened by the Actions bot; report not written there`);
}
