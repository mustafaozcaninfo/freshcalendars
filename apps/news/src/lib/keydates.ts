/**
 * "Coming up" dates on the news home. Every entry points at the published story that reports
 * it, and every date is taken from that story (the build fails if the story is missing).
 * Past dates drop off automatically on the next build; the cron rebuild runs every 15 minutes.
 */
export interface KeyDate {
  /** Calendar date in Eastern Time, YYYY-MM-DD. */
  date: string;
  label: string;
  /** Article slug that covers it. */
  slug: string;
}

export const KEY_DATES: KeyDate[] = [
  { date: "2026-10-19", label: "Voter registration deadline in California, Pennsylvania and Michigan", slug: "voter-registration-deadline-october-19-2026-early-voting" },
  { date: "2026-10-21", label: "Orionid meteor shower peaks, night of Oct. 21-22", slug: "orionid-meteor-shower-2026-peak-october-21-22" },
  { date: "2026-10-25", label: "Clocks go back in the UK and Europe", slug: "uk-europe-clocks-go-back-october-25-2026-time-difference" },
  { date: "2026-11-01", label: "Daylight saving time ends in the U.S.", slug: "daylight-saving-time-ends-november-1-2026" },
  { date: "2026-10-30", label: "Last day of early voting in Texas", slug: "sample-ballot-by-zip-code-2026-texas-ballot" },
  { date: "2026-11-03", label: "Election Day", slug: "sample-ballot-by-zip-code-2026-texas-ballot" },
  { date: "2026-11-06", label: "Dhanteras, first day of Diwali", slug: "diwali-2026-date-lakshmi-puja-time-usa" },
  { date: "2026-11-08", label: "Diwali and Lakshmi Puja", slug: "diwali-2026-date-lakshmi-puja-time-usa" },
  { date: "2026-11-11", label: "Veterans Day", slug: "veterans-day-2026-wednesday-november-11" },
  { date: "2026-11-18", label: "Opt in to read your COLA notice online", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2026-11-26", label: "Thanksgiving", slug: "why-thanksgiving-2026-is-november-26" },
  { date: "2026-11-29", label: "First Sunday of Advent", slug: "advent-calendar-2026-dates-free-printable" },
  { date: "2026-12-01", label: "Advent calendars begin: door 1", slug: "advent-calendar-2026-dates-free-printable" },
  { date: "2026-12-07", label: "Medicare open enrollment ends", slug: "medicare-open-enrollment-2026-december-7-90-dollar-rebate" },
  { date: "2026-12-11", label: "Federal government funding deadline", slug: "government-funding-deadline-december-11-2026-shutdown" },
  { date: "2026-12-31", label: "First SSI payment with the 3.6% COLA", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2027-01-04", label: "ISO week 1 of 2027 begins", slug: "week-numbers-2027-calendar-printable" },
  { date: "2027-01-13", label: "First Social Security payments with the 3.6% COLA", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2027-01-22", label: "Wolf Moon, the first full moon of 2027", slug: "moon-phases-2027-full-moon-calendar" },
  { date: "2027-02-06", label: "Lunar New Year, Year of the Goat", slug: "lunar-new-year-2027-year-of-the-goat" },
  { date: "2027-02-08", label: "Ramadan 2027 expected to begin", slug: "ramadan-2027-calendar-dates-timetable" },
  { date: "2027-03-09", label: "Eid al-Fitr", slug: "ramadan-2027-calendar-dates-timetable" },
];

/** Today's date in Eastern Time as YYYY-MM-DD. */
export function todayET(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Whole days from `today` to `date` (both YYYY-MM-DD). */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** Upcoming dates (today included) whose story is published, soonest first. */
export function upcoming(published: Set<string>, limit = 6, now: Date = new Date()): (KeyDate & { days: number })[] {
  for (const k of KEY_DATES) if (!/^\d{4}-\d{2}-\d{2}$/.test(k.date)) throw new Error(`key date "${k.label}": bad date ${k.date}`);
  const today = todayET(now);
  return KEY_DATES.filter((k) => k.date >= today && published.has(k.slug))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((k) => ({ ...k, days: daysUntil(k.date, today) }));
}
