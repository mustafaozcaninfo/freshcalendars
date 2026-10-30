#!/usr/bin/env node
/**
 * Fast 08-ABBREV check on story Markdown, no build needed: the same rule as the SEO audit
 * (scripts/lib/abbrev.mjs) run on the description (the lede) and the body. The pre-push hook
 * runs it on the stories a push changes, so a missing "Full Name (ABBR)" fails in about a second
 * on the writer's machine instead of turning CI red and holding back every later publish.
 * Usage: node scripts/news-abbrev-check.mjs [--all | file.md ...]   (default: stories changed vs origin/main)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unexpandedAbbrevs } from "./lib/abbrev.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES = "apps/news/src/content/articles";

function allStories(dir = path.join(ROOT, ARTICLES)) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allStories(path.join(dir, e.name)) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []);
}

/** Stories added or modified since origin/main, committed or not. */
function changedStories() {
  const git = (...args) => { try { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }); } catch { return ""; } };
  const base = git("merge-base", "HEAD", "origin/main").trim();
  const names = [
    ...(base ? git("diff", "--name-only", "--diff-filter=AM", base, "--", ARTICLES).split("\n") : []),
    ...git("diff", "--name-only", "--diff-filter=AM", "HEAD", "--", ARTICLES).split("\n"),
    ...git("ls-files", "--others", "--exclude-standard", "--", ARTICLES).split("\n"),
  ];
  return [...new Set(names.filter((n) => n.endsWith(".md")))].map((n) => path.join(ROOT, n)).filter(existsSync);
}

/** The lede and body as the reader sees them: links reduced to their text, no images, URLs or code. */
function storyText(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
  const raw = fm?.[1].match(/^description:\s*(.*)$/m)?.[1].trim() ?? "";
  let lede = raw;
  if (raw.startsWith('"')) { try { lede = JSON.parse(raw); } catch { lede = raw.slice(1, -1); } }
  else if (raw.startsWith("'")) lede = raw.slice(1, -1).replaceAll("''", "'");
  const body = md.slice(fm ? fm[0].length : 0)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // alt text is not prose; the audit does not read it either
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  return `${lede} ${body}`.replace(/\s+/g, " ");
}

const args = process.argv.slice(2);
const files = args.includes("--all") ? allStories() : args.length ? args.map((f) => path.resolve(f)) : changedStories();
let failed = 0;
for (const f of files) {
  const missing = unexpandedAbbrevs(storyText(readFileSync(f, "utf8")));
  if (missing.length) {
    failed++;
    console.error(`✗ ${path.relative(ROOT, f)}: not expanded on first use: ${missing.join(", ")}`);
  }
}
if (failed) {
  console.error(`\n${failed} stor${failed === 1 ? "y" : "ies"} need "Full Name (ABBR)" at the first use of each abbreviation (08-ABBREV).`);
  console.error(`If it is a proper name everyone knows (like NBC), tell the site owner; only they add words to COMMON in scripts/lib/abbrev.mjs.`);
  process.exit(1);
}
console.log(`abbreviations OK in ${files.length} stor${files.length === 1 ? "y" : "ies"}`);
