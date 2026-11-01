/**
 * Dated series and event dates, read from slugs and KEY_DATES. Related picks, "More in" and
 * Trending use them so a story's links point forward (no yesterday's game, no last week's
 * prediction) and one series never fills a list; the series nav links a story's neighbors.
 * Pure for testing.
 */

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const NAMES = /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/;

/**
 * Stories in a dated series (nba-games-today-october-29-2026, nfl-week-9-schedule-2026-...) share a
 * key: the slug without numbers, months and weekdays. Same rule as seriesKey in
 * scripts/lib/story-patterns.mjs, which the audit uses for headings.
 */
export const seriesKey = (slug: string): string => slug.split("-").filter((w) => !/^\d+$/.test(w) && !NAMES.test(w)).join("-");

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export interface StorySpan {
  /** First date the story is about (YYYY-MM-DD, Eastern Time). */
  start: string;
  /** Last date the story is about; the day after it, the story is past. */
  end: string;
}

const TITLE_DATE = /(?:\b(after|since|from)\s+)?\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?,\s*(20\d\d)\b/gi;

/**
 * The dates a story is about: "november-1-2026" and "november-6-8-2026" in the slug, a month
 * ("december-2026") when no day is given, full dates in the title ("Oct. 31, 2026", for slugs
 * without one) and the story's KEY_DATES. A date right after "after", "since" or "from" starts a
 * period ("time difference after November 1") instead of naming an event, so it is ignored.
 * Undefined for a story with no date (evergreen).
 */
export function storySpan(slug: string, keyDates: readonly string[] = [], title = ""): StorySpan | undefined {
  const w = slug.split("-");
  const dates: string[] = [];
  const opener = (i: number) => i > 0 && /^(after|since|from)$/.test(w[i - 1]!);
  for (let i = 0; i < w.length; i++) {
    const m = MONTHS.indexOf(w[i]!) + 1;
    if (!m) continue;
    const n = w.slice(i + 1, i + 4);
    const isDay = (s?: string) => !!s && /^\d{1,2}$/.test(s) && +s >= 1 && +s <= 31;
    const isYear = (s?: string) => !!s && /^20\d\d$/.test(s);
    if (isDay(n[0]) && isYear(n[1])) {
      if (!opener(i)) dates.push(iso(+n[1]!, m, +n[0]!));
      i += 2;
    } else if (isDay(n[0]) && isDay(n[1]) && isYear(n[2]) && +n[1]! > +n[0]!) {
      if (!opener(i)) dates.push(iso(+n[2]!, m, +n[0]!), iso(+n[2]!, m, +n[1]!));
      i += 3;
    } else if (isYear(n[0])) {
      if (!opener(i)) dates.push(iso(+n[0]!, m, 1), iso(+n[0]!, m, lastDay(+n[0]!, m)));
      i += 1;
    }
  }
  for (const m of title.matchAll(TITLE_DATE)) {
    if (m[1]) continue;
    const mon = MONTHS.findIndex((x) => x.startsWith(m[2]!.toLowerCase())) + 1;
    const y = +m[5]!, d1 = +m[3]!, d2 = m[4] ? +m[4] : d1;
    if (d1 >= 1 && d2 >= d1 && d2 <= lastDay(y, mon)) dates.push(iso(y, mon, d1), iso(y, mon, d2));
  }
  dates.push(...keyDates);
  if (!dates.length) return undefined;
  dates.sort();
  return { start: dates[0]!, end: dates.at(-1)! };
}

/** True when every date the story is about is before `today` (YYYY-MM-DD). Evergreen stories are never past. */
export const isPast = (span: StorySpan | undefined, today: string): boolean => !!span && span.end < today;

/**
 * The stories just before and after `id` in its series, ordered by the date they are about, then
 * by the numbers in the slug, then by publication time. Undefined when the story has no series.
 */
export function seriesNeighbors<T extends { id: string; publishedAt: Date }>(
  items: readonly T[],
  id: string,
  span: (id: string) => StorySpan | undefined,
): { prev?: T; next?: T } | undefined {
  const key = seriesKey(id);
  const members = items.filter((a) => seriesKey(a.id) === key);
  if (members.length < 2) return undefined;
  // Numbers in the slug order undated series (NFL week 9 before week 10) when dates tie.
  const nums = (s: string) => (s.match(/\d+/g) ?? []).map(Number);
  const byNumber = (a: string, b: string) => {
    const x = nums(a), y = nums(b);
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
    return 0;
  };
  members.sort((a, b) => (span(a.id)?.start ?? "").localeCompare(span(b.id)?.start ?? "") || byNumber(a.id, b.id) || a.publishedAt.getTime() - b.publishedAt.getTime());
  const i = members.findIndex((a) => a.id === id);
  if (i < 0) return undefined;
  return { prev: members[i - 1], next: members[i + 1] };
}
