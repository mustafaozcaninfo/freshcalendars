import { addDays, easterSunday } from "./easter.js";
import {
  allHolidayRules,
  holidayDefBySlug,
  holidayRulesForLocale,
  type HolidayDef,
  type HolidayLocale,
  type WeekdayName,
} from "./rules.js";

const WEEKDAY_INDEX: Record<WeekdayName, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type ResolvedHoliday = {
  slug: string;
  name: string;
  kind: HolidayDef["kind"];
  date: Date;
  iso: string;
  weekdayName: string;
  formatted: string;
  month: number;
  day: number;
  year: number;
  blurb: string;
};

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nthWeekday(year: number, month: number, weekday: WeekdayName, n: number): Date {
  const target = WEEKDAY_INDEX[weekday];
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === target) {
      count++;
      if (count === n) return d;
    }
  }
  throw new Error(`nth_weekday not found: ${n} ${weekday} ${month}/${year}`);
}

function lastWeekday(year: number, month: number, weekday: WeekdayName): Date {
  const target = WEEKDAY_INDEX[weekday];
  const lastDay = new Date(year, month, 0).getDate();
  for (let day = lastDay; day >= 1; day--) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === target) return d;
  }
  throw new Error(`last_weekday not found: ${weekday} ${month}/${year}`);
}

function weekdayOnOrBefore(
  year: number,
  month: number,
  day: number,
  weekday: WeekdayName,
): Date {
  const target = WEEKDAY_INDEX[weekday];
  const d = new Date(year, month - 1, day);
  while (d.getDay() !== target) d.setDate(d.getDate() - 1);
  return d;
}

function resolveDate(def: HolidayDef, year: number, stack: Set<string>): Date {
  if (stack.has(def.slug)) {
    throw new Error(`Holiday cycle detected at ${def.slug}`);
  }
  stack.add(def.slug);
  const rule = def.rule;
  let date: Date;
  if (rule.t === "fixed") date = new Date(year, rule.m - 1, rule.d);
  else if (rule.t === "nth_weekday") date = nthWeekday(year, rule.m, rule.weekday, rule.n);
  else if (rule.t === "last_weekday") date = lastWeekday(year, rule.m, rule.weekday);
  else if (rule.t === "weekday_on_or_before")
    date = weekdayOnOrBefore(year, rule.m, rule.d, rule.weekday);
  else if (rule.t === "easter_offset") date = addDays(easterSunday(year), rule.offset);
  else {
    const base = holidayDefBySlug(rule.base);
    if (!base) throw new Error(`Unknown base holiday ${rule.base} for ${def.slug}`);
    date = addDays(resolveDate(base, year, stack), rule.days);
  }
  stack.delete(def.slug);
  return date;
}

/** "Sunday, November 1, 2026" — the long form used across when-is pages. */
function formatLong(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]!}, ${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

/**
 * US daylight saving time end ("fall back"): first Sunday of November at
 * 2:00 a.m. local (15 U.S.C. 260a). Kept out of the holiday list on purpose:
 * the daylight-savings when-is slug stays the March start, and pages that
 * need both edges of the season read this instead.
 */
export function usDstFallBack(year: number): { date: Date; iso: string; formatted: string } {
  const date = nthWeekday(year, 11, "sunday", 1);
  return { date, iso: toIso(date), formatted: formatLong(date) };
}

export function resolveHoliday(def: HolidayDef, year: number): ResolvedHoliday {
  const date = resolveDate(def, year, new Set());
  const weekdayName = WEEKDAY_NAMES[date.getDay()]!;
  return {
    slug: def.slug,
    name: def.name,
    kind: def.kind,
    date,
    iso: toIso(date),
    weekdayName,
    formatted: formatLong(date),
    month: date.getMonth() + 1,
    day: date.getDate(),
    year: date.getFullYear(),
    blurb: def.blurb,
  };
}

/**
 * Evergreen when-is pages — same idea as `resolveMonthYear`:
 * show the next occurrence of this holiday from `today` (today still counts).
 * Example: Aug 2026 → New Year’s Day resolves to 2027, Thanksgiving stays 2026.
 */
export function resolveHolidayYear(def: HolidayDef, today: Date = new Date()): number {
  const y = today.getFullYear();
  const occurrence = resolveHoliday(def, y);
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const holidayDay = new Date(
    occurrence.date.getFullYear(),
    occurrence.date.getMonth(),
    occurrence.date.getDate(),
  ).getTime();
  return holidayDay >= startToday ? y : y + 1;
}

export function resolveNextHoliday(def: HolidayDef, today: Date = new Date()): ResolvedHoliday {
  return resolveHoliday(def, resolveHolidayYear(def, today));
}

export function holidaysForYear(
  year: number,
  opts: {
    federalOnly?: boolean;
    kinds?: HolidayDef["kind"][];
    locale?: HolidayLocale;
  } = {},
): ResolvedHoliday[] {
  let defs = holidayRulesForLocale(opts.locale ?? "us");
  if (opts.federalOnly) defs = defs.filter((d) => d.kind === "federal");
  if (opts.kinds) defs = defs.filter((d) => opts.kinds!.includes(d.kind));
  return defs
    .map((d) => ({ def: d, h: resolveHoliday(d, year) }))
    .sort((a, b) => a.h.iso.localeCompare(b.h.iso) || a.def.sort - b.def.sort)
    .map((x) => x.h);
}

export function holidaysForMonth(
  year: number,
  month: number,
  locale: HolidayLocale = "us",
): ResolvedHoliday[] {
  return holidaysForYear(year, { locale }).filter((h) => h.month === month);
}

export function allHolidaySlugs(): string[] {
  return allHolidayRules().map((h) => h.slug);
}
