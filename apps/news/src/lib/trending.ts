/**
 * "Trending now": the stories readers opened most in the last 24 hours. CI writes the ranking to
 * apps/news/.trending.json before the build (scripts/news-trending.mjs, Cloudflare analytics);
 * every deploy refreshes it. Local builds and builds without the analytics token have no file
 * and show no box, and a file older than MAX_AGE_H is ignored rather than shown as current.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { seriesKey } from "./series";

export interface TrendingFile {
  /** ISO time the ranking was read. */
  generatedAt: string;
  hours: number;
  /** /news/<slug>/ paths, most requested first. */
  pages: { path: string; requests: number }[];
}

export const TRENDING_FILE = ".trending.json";
export const TRENDING_COUNT = 5;
const MAX_AGE_H = 48;

let cached: string[] | undefined;

/** Article slugs in ranking order, or [] when there is no fresh ranking. Read once per build. */
export function loadRanking(): string[] {
  return (cached ??= readRanking());
}

export function readRanking(file = path.resolve(process.cwd(), TRENDING_FILE), now = new Date()): string[] {
  if (!existsSync(file)) return [];
  try {
    const t = JSON.parse(readFileSync(file, "utf8")) as TrendingFile;
    const age = (now.getTime() - Date.parse(t.generatedAt)) / 3_600_000;
    if (!(age >= -1 && age <= MAX_AGE_H) || !Array.isArray(t.pages)) return [];
    return t.pages.map((p) => /^\/news\/([a-z0-9-]+)\/$/.exec(p.path)?.[1]).filter((s): s is string => !!s);
  } catch {
    return [];
  }
}

/**
 * The trending box for one story: ranked slugs that are published (`known`), allowed from this
 * story (not itself, its series or a past event, lib/storygraph.ts linkable) and not already shown
 * on the page, one per series, so five days of one puzzle never fill it.
 */
export function trendingFor(ranking: readonly string[], known: (slug: string) => boolean, allow: (slug: string) => boolean, shown: ReadonlySet<string>, limit = TRENDING_COUNT): string[] {
  const out: string[] = [];
  const series = new Set<string>();
  for (const s of ranking) {
    if (out.length >= limit) break;
    if (!known(s) || !allow(s) || shown.has(s) || series.has(seriesKey(s))) continue;
    out.push(s);
    series.add(seriesKey(s));
  }
  return out;
}
