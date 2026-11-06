#!/usr/bin/env node
/**
 * What a desk pull request ([W1]..., [U], Puzzles ...) may not touch: the files that run in CI with
 * the deploy secrets or steer later sessions (docs/DESK.md "Files you never change"). The rule was
 * prose only; a desk session misled by text it read (a web page, a PR comment, a search query) could
 * have changed them and merged on a green CI. Checked in two places:
 *  - the desk watchdog (main's copy) before it merges a desk pull request;
 *  - CI on a desk-titled pull request (`node scripts/desk-scope.mjs`), so a session that merges its
 *    own pull request sees it go red.
 * packages/ is not listed: writers may change printable generators (DESK.md, owner decision 2026-11-03).
 * Such a change belongs in a pull request with a non-desk title, which the owner merges.
 */
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Titles the desk uses; the watchdog merges only these. */
export const DESK_PR = /^(\[W\d\]|\[U\]|Puzzles\b)/;

/** Paths a desk pull request must not change. */
export const PROTECTED = [
  /^\.github\//,
  /^\.githooks\//,
  /^\.claude\//,
  /^scripts\//,
  /^cloudflare\//,
  /(^|\/)package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^\.npmrc$/,
  /^wrangler\.jsonc?$/,
  /^CLAUDE\.md$/,
];

/** The changed paths a desk pull request may not touch. */
export const outOfScope = (files) => files.filter((f) => PROTECTED.some((re) => re.test(f)));

// CI: `DESK_TITLE=<pr title> DESK_BASE=HEAD^1 node scripts/desk-scope.mjs` (HEAD is the pull request's
// merge commit, HEAD^1 the base it merged onto) fails when a desk-titled
// pull request changes a protected path. Any other title passes (the owner's own pull requests).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const title = process.env.DESK_TITLE ?? "";
  const base = process.env.DESK_BASE ?? "";
  if (!DESK_PR.test(title)) {
    console.log("Not a desk pull request; no scope limit.");
  } else {
    if (!base) throw new Error("DESK_BASE (the base commit) is not set");
    const files = execFileSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);
    const bad = outOfScope(files);
    if (bad.length) {
      console.error(`A desk pull request may not change these files (docs/DESK.md "Files you never change"):\n${bad.map((f) => `  ${f}`).join("\n")}\nMove the change to its own pull request without a desk title; the owner merges it.`);
      process.exit(1);
    }
    console.log(`Desk scope OK: ${files.length} changed file(s), none protected.`);
  }
}
