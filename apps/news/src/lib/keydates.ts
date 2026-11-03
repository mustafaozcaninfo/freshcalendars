/**
 * "Coming up" dates on the news home. Every entry points at the published story that reports
 * it, and every date is taken from that story (the build fails if the story is missing).
 * Past dates drop off automatically on the next build; the cron rebuild runs every 15 minutes.
 */
import { holidaysForYear } from "@freshcalendars/engine";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadRanking } from "./trending";
export interface KeyDate {
  /** Calendar date in Eastern Time, YYYY-MM-DD. */
  date: string;
  label: string;
  /** Article slug that covers it. */
  slug: string;
  /**
   * Extra rank within its day on the home page's "Coming up" (higher first, default 0), added to
   * the automatic score (dayScore below). Needed only for a main event the score cannot see.
   */
  weight?: number;
}

/**
 * Which rows of a busy day the "Coming up" box keeps (it shows at most two a day; Election Day 2026
 * had 19). Without a ranking it kept whichever two came first in this file. Score, highest first:
 * - a holiday that falls on the date (engine rules, US, UK and Canada) or a national event the rules
 *   do not hold (Election Day, polls opening or closing), named in the label: 150 when the label is
 *   the name ("Thanksgiving"), 120 when it starts with it ("Veterans Day: free meals"), 100 when it
 *   only mentions it. UK and Canadian holidays count 0.4 of that (the readers are mostly in the US),
 *   and a US holiday row about another country ("Black Friday in Canada") loses 30;
 * - up to 30 for the story's place in the last 24 hours' most-read ranking (CI's .trending.json),
 *   so readers' interest decides between rows that mention the same event;
 * - plus the row's own `weight`, for a main event whose label does not name it.
 */
const NATIONAL_EVENTS = ["election day", "polls close", "polls open"];
const ABROAD = /\b(canada|canadian|uk|england|scotland|wales|london|ireland|australia)\b/i;
/** [name, country factor] by ISO date, filled one year at a time. */
const holidayNames = new Map<string, [string, number][]>();
const yearsLoaded = new Set<number>();
function holidaysOn(date: string): [string, number][] {
  const year = Number(date.slice(0, 4));
  if (!yearsLoaded.has(year)) {
    yearsLoaded.add(year);
    for (const locale of ["us", "uk", "ca"] as const) {
      for (const h of holidaysForYear(year, { locale })) {
        const name = h.name.toLowerCase().replace(/\s*\((uk|canada)\)$/, "");
        holidayNames.set(h.iso, [...(holidayNames.get(h.iso) ?? []), [name, locale === "us" ? 1 : 0.4]]);
      }
    }
  }
  return holidayNames.get(date) ?? [];
}
function nameScore(label: string, name: string): number {
  if (label === name || label === `${name}.`) return 150;
  if (label.startsWith(name)) return 120;
  return label.includes(name) ? 100 : 0;
}
export function dayScore(k: KeyDate, ranking: readonly string[] = []): number {
  const label = k.label.toLowerCase();
  let best = Math.max(0, ...NATIONAL_EVENTS.map((n) => nameScore(label, n)));
  for (const [name, factor] of holidaysOn(k.date)) {
    const s = nameScore(label, name);
    if (s) best = Math.max(best, s * factor - (factor === 1 && ABROAD.test(k.label) ? 30 : 0));
  }
  const rank = ranking.indexOf(k.slug);
  return best + (k.weight ?? 0) + (rank >= 0 ? 30 * (1 - rank / ranking.length) : 0);
}

/**
 * One JSON file per story in `apps/news/key-dates/<slug>.json`: an array of { date, label, weight? }.
 * A story's dates live in that story's own file, so two writers never edit the same lines and git
 * has nothing to conflict on (the old single array did, on every parallel pull request).
 */
function keyDatesDir(): string {
  const cwd = process.cwd();
  return [path.join(cwd, "key-dates"), path.join(cwd, "apps/news/key-dates")].find((d) => existsSync(d))
    ?? path.join(cwd, "apps/news/key-dates");
}

function loadKeyDates(dir = keyDatesDir()): KeyDate[] {
  if (!existsSync(dir)) throw new Error(`key dates folder not found: ${dir}`);
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().flatMap((f) => {
    const slug = f.slice(0, -".json".length);
    const rows = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Omit<KeyDate, "slug">[];
    if (!Array.isArray(rows)) throw new Error(`key-dates/${f}: expected an array`);
    return rows.map((r) => ({ ...r, slug }));
  });
}

export const KEY_DATES: KeyDate[] = loadKeyDates();

/** Today's date in Eastern Time as YYYY-MM-DD. */
export function todayET(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Whole days from `today` to `date` (both YYYY-MM-DD). */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** Upcoming dates (today included) whose story is published, soonest first. */
export function upcoming(published: Set<string>, limit = 6, now: Date = new Date(), perDay = Infinity, ranking: readonly string[] = loadRanking()): (KeyDate & { days: number })[] {
  for (const k of KEY_DATES) if (!/^\d{4}-\d{2}-\d{2}$/.test(k.date)) throw new Error(`key date "${k.label}": bad date ${k.date}`);
  const today = todayET(now);
  // perDay caps rows per date, so one busy day does not fill the whole list.
  const seen = new Map<string, number>();
  return KEY_DATES.filter((k) => k.date >= today && published.has(k.slug))
    .sort((a, b) => a.date.localeCompare(b.date) || dayScore(b, ranking) - dayScore(a, ranking))
    .filter((k) => { const n = (seen.get(k.date) ?? 0) + 1; seen.set(k.date, n); return n <= perDay; })
    .slice(0, limit)
    .map((k) => ({ ...k, days: daysUntil(k.date, today) }));
}

/** Upcoming dates (today included) reported by any of `slugs`, soonest first: a story's or a topic's own dates. */
export function upcomingFor(slugs: Set<string>, now: Date = new Date()): (KeyDate & { days: number })[] {
  const today = todayET(now);
  return KEY_DATES.filter((k) => k.date >= today && slugs.has(k.slug))
    .sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
    .map((k) => ({ ...k, days: daysUntil(k.date, today) }));
}

/**
 * Dates for a story's or topic's .ics file: the upcoming ones, or once they have all passed, every
 * date it reported. The file then keeps its URL after the event, so links Google and readers saved
 * still open a calendar instead of a 404.
 */
export function calendarDatesFor(slugs: Set<string>, now: Date = new Date()): KeyDate[] {
  const next = upcomingFor(slugs, now);
  if (next.length) return next;
  return KEY_DATES.filter((k) => slugs.has(k.slug)).sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

/** Stable event id for calendar files: the date plus a slug of the label. */
export const keyDateUid = (k: KeyDate) => `${k.date}-${k.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

/**
 * Cached pages: recompute "In N days" from today's date in New York for every
 * [data-days-until="YYYY-MM-DD"] and drop the row once the date has passed. Appended to the
 * layout's inline script, so the home page, stories and topic hubs share one copy.
 */
export const DAYS_JS = `
(function(){
  var els=document.querySelectorAll('[data-days-until]'); if(!els.length) return;
  var today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date());
  els.forEach(function(el){
    if(!/^\\d{4}-\\d\\d-\\d\\d$/.test(el.getAttribute('data-days-until'))) return; // year-only values belong to the story's days-until table
    var n=Math.round((Date.parse(el.getAttribute('data-days-until'))-Date.parse(today))/864e5);
    if(n<0){ var li=el.closest('li'); if(li) li.remove(); } else el.textContent=n===0?'Today':n===1?'Tomorrow':'In '+n+' days';
  });
})();
`;
