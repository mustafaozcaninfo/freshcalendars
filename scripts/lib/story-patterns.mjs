/**
 * Source-level checks on story Markdown that the built HTML cannot answer: headings and hooks
 * copied from story to story, and new stories no other story links to. Only stories published
 * on or after PATTERNS_SINCE must pass; older ones are counted so editors can fix them on update.
 * Daily puzzle pages are a template by design and are left out (news-puzzle-check covers them).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Owner decision 2026-10-30: stories published from this date on must pass the pattern checks. */
export const PATTERNS_SINCE = "2026-10-31";
/** A heading already used by this many other stories (outside the story's own series) is a template. */
export const H2_REUSE_MAX = 3;
/** Headline length for new stories; the schema still allows 110 for older ones. */
export const TITLE_MAX = 90;

const MONTHS = /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/;
/** Stories in a dated series (nba-games-today-october-29-2026) share a key and may share headings. */
export const seriesKey = (slug) => slug.split("-").filter((w) => !/^\d+$/.test(w) && !MONTHS.test(w)).join("-");
/** Heading text without case, punctuation or a year, so "Key dates 2026" and "Key Dates" match. */
export const normHeading = (h) => h.toLowerCase().replace(/\b(19|20)\d\d\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
/** The clock-change hook belongs to time-change stories or to stories whose headline makes it the angle. */
const CLOCK_HOOK = /clocks? (?:fall|falls|go|goes|turn|turns|move|moves) back|\bfall back\b|daylight saving/i;

const list = (fm, key) => {
  const inline = fm.match(new RegExp(`^${key}:\\s*\\[(.*)\\]`, "m"));
  if (inline) return inline[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  const block = fm.match(new RegExp(`^${key}:\\s*\\n((?:[ \\t]+-.*\\n?)+)`, "m"));
  return block ? block[1].split("\n").map((s) => s.replace(/^\s*-\s*["']?|["']?\s*$/g, "")).filter(Boolean) : [];
};
const field = (fm, key) => fm.match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"))?.[1] ?? "";

/** Every non-draft story with the fields the pattern checks need. */
export function storySources(articlesDir = path.join(ROOT, "apps/news/src/content/articles")) {
  const out = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".md")) continue;
      const [, fm = "", ...rest] = readFileSync(p, "utf8").split(/^---$/m);
      if (/^draft:\s*true/m.test(fm)) continue;
      const body = rest.join("---");
      out.push({
        slug: f.replace(/\.md$/, ""),
        title: field(fm, "title"),
        description: field(fm, "description"),
        category: field(fm, "category"),
        published: field(fm, "publishedAt").slice(0, 10),
        related: list(fm, "related"),
        summary: list(fm, "summary"),
        h2: [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]),
        links: [...body.matchAll(/\/news\/([a-z0-9-]+)\//g)].map((m) => m[1]),
      });
    }
  })(articlesDir);
  return out;
}

/** Failures for stories published since PATTERNS_SINCE, keyed by check id. */
export function patternProblems(stories = storySources()) {
  const editorial = stories.filter((s) => s.category !== "puzzles");
  const fresh = editorial.filter((s) => s.published >= PATTERNS_SINCE);
  const fails = { h2: [], hook: [], title: [], inbound: [] };

  const usedBy = new Map();
  for (const s of editorial) for (const h of new Set(s.h2.map(normHeading))) {
    if (!usedBy.has(h)) usedBy.set(h, []);
    usedBy.get(h).push(s);
  }
  const inbound = new Map();
  for (const s of stories) for (const t of new Set([...s.related, ...s.links])) if (t !== s.slug) inbound.set(t, (inbound.get(t) ?? 0) + 1);

  for (const s of fresh) {
    for (const h of new Set(s.h2.map(normHeading))) {
      const others = (usedBy.get(h) ?? []).filter((o) => o.slug !== s.slug && seriesKey(o.slug) !== seriesKey(s.slug));
      if (others.length >= H2_REUSE_MAX) fails.h2.push(`${s.slug}: "## ${h}" is already a heading in ${others.length} stories (${others.slice(0, 2).map((o) => o.slug).join(", ")}…); name the subject in it`);
    }
    if (s.category !== "time-change" && !CLOCK_HOOK.test(s.title)) {
      const where = [["description", s.description], ...s.summary.map((t, i) => [`summary ${i + 1}`, t])].find(([, t]) => CLOCK_HOOK.test(t));
      if (where) fail(fails.hook, s, `clock-change hook in the ${where[0]}; keep it in the body where it changes a time`);
    }
    if (s.title.length > TITLE_MAX) fail(fails.title, s, `headline is ${s.title.length} characters (max ${TITLE_MAX})`);
    if (!inbound.get(s.slug)) fail(fails.inbound, s, "no other story links to it; add it to the related list or body of 1-2 stories on the same topic");
  }
  return fails;
}
const fail = (arr, s, msg) => arr.push(`${s.slug}: ${msg}`);
