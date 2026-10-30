#!/usr/bin/env node
/**
 * Which CI gates a push needs, from the files it changed (CI's "scope" step; server-autopublish.sh
 * uses the same content rule). Prints `content_only=…` and `visual=…` lines for $GITHUB_OUTPUT.
 *
 * - content_only: only stories, images, printables or keydates.ts changed.
 * - visual: something that can change how a page looks: a file the calendar site build imports
 *   (the import graph from packages/generator/src/gen.ts), /news/ code outside the content
 *   folders, brand files, dependencies, the contrast gate itself or this workflow. Only then does
 *   CI build the calendar site and run the WCAG contrast gate. The per-story printable and hero
 *   generators in packages/generator/src are outside that graph, so editing them does not.
 *
 * Usage: node scripts/ci-scope.mjs <base-sha>   (files from `git diff --name-only <base> HEAD`)
 *        node scripts/ci-scope.mjs --files a b c
 * An unknown base (first push, force-push) counts as "everything changed".
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT_RE = /^apps\/news\/(src\/content\/|src\/assets\/|public\/|src\/lib\/keydates\.ts$)/;

/** Files under packages/generator/src reachable from gen.ts by relative imports. */
export function calendarBuildFiles() {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/(?:import|export)[^"'`]*?from\s*["'](\.{1,2}\/[^"']+)["']|import\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g)) {
      const spec = m[1] ?? m[2];
      const base = path.resolve(path.dirname(file), spec);
      for (const cand of [base, base.replace(/\.js$/, ".ts"), `${base}.ts`, path.join(base, "index.ts")]) {
        if (existsSync(cand) && cand.endsWith(".ts")) { visit(cand); break; }
      }
    }
  };
  visit(path.join(ROOT, "packages/generator/src/gen.ts"));
  return new Set([...seen].map((f) => path.relative(ROOT, f)));
}

export function isVisual(file, buildFiles) {
  if (CONTENT_RE.test(file)) return false;
  if (file.startsWith("packages/generator/src/")) return buildFiles.has(file);
  if (file.startsWith("packages/generator/render3d/")) return false; // news hero scenes
  if (/^packages\/(engine|site-chrome|templates)\//.test(file)) return true;
  if (file.startsWith("apps/news/")) return !/^apps\/news\/(test\/|redirects\.map$)/.test(file);
  if (file.startsWith("brand/")) return true;
  return /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|packages\/[^/]+\/package\.json|scripts\/smoke-contrast\.mjs|scripts\/ci-scope\.mjs|\.github\/workflows\/)/.test(file);
}

function changedFiles(base) {
  try {
    if (!base || /^0+$/.test(base)) return null;
    return execFileSync("git", ["diff", "--name-only", base, "HEAD"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const files = args[0] === "--files" ? args.slice(1) : changedFiles(args[0]);
  let contentOnly = false, visual = true;
  if (files) {
    const build = calendarBuildFiles();
    contentOnly = files.every((f) => CONTENT_RE.test(f));
    visual = files.some((f) => isVisual(f, build));
    const shown = files.filter((f) => isVisual(f, build)).slice(0, 5);
    console.error(`${files.length} changed file(s); visual: ${shown.length ? shown.join(", ") : "none"}`);
  } else {
    console.error("base commit unknown: running every gate");
  }
  console.log(`content_only=${contentOnly}`);
  console.log(`visual=${visual}`);
}
