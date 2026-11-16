/**
 * What a month, year or countdown page works out about its own dates.
 *
 * The dated month pages were nine tenths the same words with the month name swapped, and Google
 * left them out of the index. Everything here is arithmetic on one month, year or holiday, so the
 * text a page builds from it cannot be said of any other page: which years share the layout, how
 * the holidays moved since last year, which weekday comes five times, how early a holiday can fall.
 * Nothing is typed in. The only outside rules are the two the code already cites: federal holidays
 * on a weekend are observed on the nearest weekday (OPM), and US clocks change on the second Sunday
 * of March and the first Sunday of November (15 U.S.C. 260a).
 */
import {
  holidaysForYear, monthNumberToName, resolveHoliday, usDstFallBack,
  type HolidayDef, type HolidayLocale, type ResolvedHoliday,
} from "@freshcalendars/engine";

export const DAY = 864e5;
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
export const weekdayOf = (t: number) => new Date(t).getUTCDay();
export const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
export const dayOfYear = (t: number) => Math.round((t - Date.UTC(new Date(t).getUTCFullYear(), 0, 1)) / DAY) + 1;
export const listAnd = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a.at(-1)}`);
export const plural = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
export const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export const word = (n: number) => NUMBER_WORDS[n] ?? `${n}`;
/** "Monday, May 29" */
export function dayLabel(t: number): string {
  const d = new Date(t);
  return `${WEEKDAYS[d.getUTCDay()]}, ${monthNumberToName(d.getUTCMonth() + 1)} ${d.getUTCDate()}`;
}
/** "May 29" */
export function shortDay(t: number): string {
  const d = new Date(t);
  return `${monthNumberToName(d.getUTCMonth() + 1)} ${d.getUTCDate()}`;
}
const holidayTime = (h: ResolvedHoliday) => utc(h.year, h.month, h.day);

/** ISO 8601 week number of the week that holds `t`. */
export function isoWeekOf(t: number): number {
  const day = weekdayOf(t) || 7, thu = t + (4 - day) * DAY;
  return Math.ceil(((thu - Date.UTC(new Date(thu).getUTCFullYear(), 0, 1)) / DAY + 1) / 7);
}

/** Rows a month takes on a sheet whose weeks start on Sunday (0) or Monday (1). */
export function sheetRows(year: number, month: number, startsOn: 0 | 1): number {
  return Math.ceil((((weekdayOf(utc(year, month, 1)) - startsOn + 7) % 7) + daysIn(year, month)) / 7);
}

/** Other years in which this month has the same length and starts on the same weekday. */
export function sameLayoutYears(year: number, month: number): { before: number[]; after: number[] } {
  const start = weekdayOf(utc(year, month, 1)), len = daysIn(year, month);
  const same = (y: number) => weekdayOf(utc(y, month, 1)) === start && daysIn(y, month) === len;
  const before: number[] = [], after: number[] = [];
  for (let y = year - 1; y >= year - 60 && before.length < 3; y--) if (same(y)) before.push(y);
  for (let y = year + 1; y <= year + 60 && after.length < 3; y++) if (same(y)) after.push(y);
  return { before, after };
}

/** Other years whose whole calendar matches: same January 1 weekday and the same leap status. */
export function sameCalendarYears(year: number): { before: number[]; after: number[] } {
  const same = (y: number) => weekdayOf(utc(y, 1, 1)) === weekdayOf(utc(year, 1, 1)) && isLeap(y) === isLeap(year);
  const before: number[] = [], after: number[] = [];
  for (let y = year - 1; y >= year - 60 && before.length < 3; y--) if (same(y)) before.push(y);
  for (let y = year + 1; y <= year + 60 && after.length < 3; y++) if (same(y)) after.push(y);
  return { before, after };
}

/** Months of the same year that begin on this month's weekday. */
export function monthsStartingAlike(year: number, month: number): number[] {
  const start = weekdayOf(utc(year, month, 1));
  return Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => m !== month && weekdayOf(utc(year, m, 1)) === start);
}

/** The dates of each weekday, Sunday first: [[1, 8, 15, 22, 29], ...]. */
export function datesByWeekday(year: number, month: number): number[][] {
  const out: number[][] = WEEKDAYS.map(() => []);
  for (let d = 1; d <= daysIn(year, month); d++) out[weekdayOf(utc(year, month, d))]!.push(d);
  return out;
}

/**
 * The day federal offices close for a federal holiday: the Friday before one on a Saturday, the
 * Monday after one on a Sunday (OPM). The same date when the holiday is on a weekday.
 */
export function observedTime(h: ResolvedHoliday): number {
  const t = holidayTime(h), g = weekdayOf(t);
  return g === 6 ? t - DAY : g === 0 ? t + DAY : t;
}

export type FederalDay = { h: ResolvedHoliday; date: number; observed: number; weekend: [number, number] | null };
/** A year's federal holidays with the day off and, when that is a Monday or Friday, the three days it joins. */
export function federalDays(year: number): FederalDay[] {
  return holidaysForYear(year, { federalOnly: true }).map((h) => {
    const date = holidayTime(h), observed = observedTime(h), g = weekdayOf(observed);
    return { h, date, observed, weekend: g === 1 ? [observed - 2 * DAY, observed] : g === 5 ? [observed, observed + 2 * DAY] : null };
  });
}

/** Monday to Friday days of a month that are not an observed federal holiday, with the first and last. */
export function workingDays(year: number, month: number): { count: number; first: number; last: number; off: FederalDay[] } {
  const closed = new Map([...federalDays(year - 1), ...federalDays(year), ...federalDays(year + 1)].map((f) => [f.observed, f]));
  const days: number[] = [], off: FederalDay[] = [];
  for (let d = 1; d <= daysIn(year, month); d++) {
    const t = utc(year, month, d), g = weekdayOf(t);
    if (g === 0 || g === 6) continue;
    if (closed.has(t)) off.push(closed.get(t)!); else days.push(t);
  }
  return { count: days.length, first: days[0]!, last: days.at(-1)!, off };
}

/** Months of a year whose 13th is a Friday. */
export const fridayThe13ths = (year: number) => Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => weekdayOf(utc(year, m, 13)) === 5);

/** US clock changes inside a month: [date, hours in that day]. Most of the US; Hawaii and most of Arizona stay put. */
export function clockChange(year: number, month: number): { t: number; forward: boolean } | null {
  if (month === 3) { let t = utc(year, 3, 1); while (weekdayOf(t) !== 0) t += DAY; return { t: t + 7 * DAY, forward: true }; }
  if (month === 11) { const d = usDstFallBack(year).date; return { t: utc(d.getFullYear(), d.getMonth() + 1, d.getDate()), forward: false }; }
  return null;
}

export type WeekRow = { week: number; from: number; to: number; inMonth: [number, number]; holidays: ResolvedHoliday[] };
/** The ISO weeks (Monday to Sunday) that touch a month, with the part inside it and the holidays in that part. */
export function isoWeeksOfMonth(year: number, month: number, holidays: ResolvedHoliday[]): WeekRow[] {
  const first = utc(year, month, 1), last = utc(year, month, daysIn(year, month)), rows: WeekRow[] = [];
  for (let mon = first - ((weekdayOf(first) + 6) % 7) * DAY; mon <= last; mon += 7 * DAY) {
    const a = Math.max(mon, first), b = Math.min(mon + 6 * DAY, last);
    rows.push({ week: isoWeekOf(mon), from: mon, to: mon + 6 * DAY, inMonth: [a, b], holidays: holidays.filter((h) => holidayTime(h) >= a && holidayTime(h) <= b) });
  }
  return rows;
}

/** How a holiday's date can move: the earliest and latest month-day its rule allows, and the next year each comes up. */
export function holidaySpan(def: HolidayDef, fromYear: number): { earliest: ResolvedHoliday; latest: ResolvedHoliday; days: number } | null {
  if (def.rule.t === "fixed") return null;
  const key = (h: ResolvedHoliday) => h.month * 100 + h.day;
  let lo = Infinity, hi = -Infinity;
  // 1900 to 2400 holds a full 400-year weekday cycle and both ends of Easter's range (2285, 2038).
  for (let y = 1900; y <= 2400; y++) { const k = key(resolveHoliday(def, y)); lo = Math.min(lo, k); hi = Math.max(hi, k); }
  const next = (k: number) => { for (let y = fromYear; y <= fromYear + 500; y++) { const h = resolveHoliday(def, y); if (key(h) === k) return h; } return null; };
  const earliest = next(lo), latest = next(hi);
  if (!earliest || !latest || lo === hi) return null;
  return { earliest, latest, days: Math.round((utc(2001, Math.floor(hi / 100), hi % 100) - utc(2001, Math.floor(lo / 100), lo % 100)) / DAY) + 1 };
}

/** The nearest other holiday before and after one, from the same country's list. */
export function neighbours(h: ResolvedHoliday, locale: HolidayLocale): { before: ResolvedHoliday | null; after: ResolvedHoliday | null; sameDay: ResolvedHoliday[] } {
  const t = holidayTime(h);
  const all = [h.year - 1, h.year, h.year + 1].flatMap((y) => holidaysForYear(y, { locale })).filter((x) => x.slug !== h.slug);
  return {
    before: all.filter((x) => holidayTime(x) < t).at(-1) ?? null,
    after: all.find((x) => holidayTime(x) > t) ?? null,
    sameDay: all.filter((x) => holidayTime(x) === t),
  };
}
export const daysApart = (a: ResolvedHoliday, b: ResolvedHoliday) => Math.abs(Math.round((holidayTime(a) - holidayTime(b)) / DAY));
export { holidayTime };

/**
 * The sentences of a page's running text (paragraphs and list items; tables, link rows and stat
 * tiles are data and navigation). The tests use it to hold the rule that no sentence appears on
 * two month, year or countdown pages.
 */
export function proseSentences(html: string): string[] {
  const blocks = [...html.replace(/<(script|style|nav|table)[\s\S]*?<\/\1>|<ul class="design-grid">[\s\S]*?<\/ul>/g, "").matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  return blocks.flatMap((b) => b.split(/(?<=[.?!])(?<!\b(?:St|Jr|Mt)\.)(?<![ap]\.m\.)\s+(?=[A-Z])/)).map((x) => x.trim()).filter((x) => x.split(" ").length >= 5);
}
export function repeatedSentences(pages: { id: string; body: string }[]): string[] {
  const seen = new Map<string, string>(), out: string[] = [];
  for (const p of pages) for (const x of new Set(proseSentences(p.body))) { if (seen.has(x)) out.push(`${seen.get(x)} and ${p.id}: ${x}`); else seen.set(x, p.id); }
  return out;
}
