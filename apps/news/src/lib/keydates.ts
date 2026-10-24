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
  { date: "2026-10-27", label: "Free entry at national parks (U.S. residents)", slug: "national-parks-free-days-october-27-veterans-day-2026" },
  { date: "2026-11-01", label: "NYC Marathon: Wave 1 starts 9:10 a.m. ET", slug: "nyc-marathon-2026-start-times-road-closures-where-to-watch" },
  { date: "2026-11-11", label: "Last 2026 fee-free day at national parks", slug: "national-parks-free-days-october-27-veterans-day-2026" },
  { date: "2026-11-24", label: "Thanksgiving travel period begins (2025 pattern)", slug: "thanksgiving-travel-2026-best-days-to-fly-and-drive" },
  { date: "2026-10-28", label: "Social Security payday: birthdays 21st-31st", slug: "social-security-payment-schedule-october-2026-who-gets-paid-today" },
  { date: "2026-11-10", label: "Social Security paid a day early (Veterans Day)", slug: "social-security-payment-schedule-october-2026-who-gets-paid-today" },
  { date: "2026-10-25", label: "Clocks go back in the UK and Europe", slug: "uk-europe-clocks-go-back-october-25-2026-time-difference" },
  { date: "2026-10-31", label: "Halloween falls on a Saturday", slug: "halloween-2026-saturday-sunset-trick-or-treat-times" },
  { date: "2026-11-01", label: "Daylight saving time ends in the U.S.", slug: "daylight-saving-time-ends-november-1-2026" },
  { date: "2026-11-01", label: "ACA open enrollment for 2027 begins", slug: "aca-open-enrollment-2027-dates-november-1-january-15" },
  { date: "2026-11-02", label: "Día de los Muertos", slug: "day-of-the-dead-2026-dia-de-los-muertos-dates" },
  { date: "2026-10-23", label: "Texas mail ballot applications due", slug: "texas-election-calendar-2026-early-voting-dates-deadlines" },
  { date: "2026-10-30", label: "Last day of early voting in Texas", slug: "texas-election-calendar-2026-early-voting-dates-deadlines" },
  { date: "2026-11-03", label: "Election Day", slug: "sample-ballot-by-zip-code-2026-texas-ballot" },
  { date: "2026-11-04", label: "Southern Taurid meteor shower peaks", slug: "november-2026-meteor-showers-taurids-leonids" },
  { date: "2026-11-06", label: "Dhanteras, first day of Diwali", slug: "diwali-2026-date-lakshmi-puja-time-usa" },
  { date: "2026-11-08", label: "Diwali and Lakshmi Puja", slug: "diwali-2026-date-lakshmi-puja-time-usa" },
  { date: "2026-11-11", label: "Veterans Day", slug: "veterans-day-2026-wednesday-november-11" },
  { date: "2026-10-29", label: "Wisconsin and Maine: absentee ballot requests due", slug: "wisconsin-ballot-2026-governor-candidates-constitutional-amendments" },
  { date: "2026-11-05", label: "Bonfire Night in the UK; fireworks allowed until midnight", slug: "bonfire-night-2026-thursday-november-5-fireworks-rules" },
  { date: "2026-11-08", label: "Remembrance Sunday in the UK", slug: "remembrance-day-2026-canada-statutory-holiday-remembrance-sunday-uk" },
  { date: "2026-11-09", label: "Federal Benefits Open Season begins", slug: "federal-benefits-open-season-2026-dates-fehb-premiums" },
  { date: "2026-11-11", label: "Remembrance Day in Canada: two minutes of silence at 11 a.m.", slug: "remembrance-day-2026-canada-statutory-holiday-remembrance-sunday-uk" },
  { date: "2026-12-14", label: "Federal Benefits Open Season ends", slug: "federal-benefits-open-season-2026-dates-fehb-premiums" },
  { date: "2026-11-16", label: "Leonid meteor shower peaks", slug: "november-2026-meteor-showers-taurids-leonids" },
  { date: "2026-11-18", label: "Opt in to read your COLA notice online", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2026-11-02", label: "No school in Chicago (Nov. 2-3)", slug: "chicago-public-schools-calendar-2026-27-breaks" },
  { date: "2026-11-03", label: "NYC schools remote for Election Day", slug: "nyc-public-schools-calendar-2026-27-breaks-holidays" },
  { date: "2026-11-26", label: "Thanksgiving", slug: "why-thanksgiving-2026-is-november-26" },
  { date: "2026-11-29", label: "First Sunday of Advent", slug: "advent-calendar-2026-dates-free-printable" },
  { date: "2026-12-01", label: "Advent calendars begin: door 1", slug: "advent-calendar-2026-dates-free-printable" },
  { date: "2026-12-07", label: "Medicare open enrollment ends", slug: "medicare-open-enrollment-2026-december-7-90-dollar-rebate" },
  { date: "2026-12-11", label: "Federal government funding deadline", slug: "government-funding-deadline-december-11-2026-shutdown" },
  { date: "2026-12-17", label: "USPS Ground Advantage deadline for Christmas", slug: "usps-holiday-shipping-deadlines-2026" },
  { date: "2026-12-15", label: "ACA deadline for Jan. 1 coverage", slug: "aca-open-enrollment-2027-dates-november-1-january-15" },
  { date: "2026-12-31", label: "First SSI payment with the 3.6% COLA", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2027-01-04", label: "ISO week 1 of 2027 begins", slug: "week-numbers-2027-calendar-printable" },
  { date: "2027-01-13", label: "First Social Security payments with the 3.6% COLA", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2027-01-22", label: "Wolf Moon, the first full moon of 2027", slug: "moon-phases-2027-full-moon-calendar" },
  { date: "2027-02-06", label: "Lunar New Year, Year of the Goat", slug: "lunar-new-year-2027-year-of-the-goat" },
  { date: "2027-02-08", label: "Ramadan 2027 expected to begin", slug: "ramadan-2027-calendar-dates-timetable" },
  { date: "2027-03-09", label: "Eid al-Fitr", slug: "ramadan-2027-calendar-dates-timetable" },
  { date: "2026-10-23", label: "SAT registration deadline for Nov. 7", slug: "sat-act-test-dates-2026-27-registration-deadlines" },
  { date: "2026-11-07", label: "SAT test day", slug: "sat-act-test-dates-2026-27-registration-deadlines" },
  { date: "2026-11-11", label: "November LSAT begins (Nov. 11-14)", slug: "lsat-test-dates-2026-27-registration-deadlines" },
  { date: "2026-11-23", label: "Thanksgiving week off in Miami-Dade, Broward and Palm Beach", slug: "broward-county-school-calendar-2026-27" },
  { date: "2026-12-01", label: "LSAT registration deadline for January", slug: "lsat-test-dates-2026-27-registration-deadlines" },
  { date: "2026-12-12", label: "ACT test day", slug: "sat-act-test-dates-2026-27-registration-deadlines" },
  { date: "2027-01-01", label: "New Year's Day, first federal holiday of 2027", slug: "federal-holidays-2027-observed-dates-list" },
  { date: "2027-03-26", label: "Good Friday: stock market closed", slug: "stock-market-holidays-2027-nyse-closed-dates" },
  { date: "2027-03-26", label: "Ultra Music Festival in Miami (March 26-28)", slug: "ultra-music-festival-2027-miami-dates-march-26-28" },
  { date: "2026-10-22", label: "This day in history: Oct. 22", slug: "october-22-2026-this-day-in-history-observances" },
  { date: "2026-10-23", label: "Mole Day, 6:02 a.m. to 6:02 p.m.", slug: "mole-day-2026-october-23-6-02" },
  { date: "2026-10-23", label: "World Series Game 1, 8 p.m. ET on FOX", slug: "world-series-2026-schedule-game-times-tv-channel" },
  { date: "2026-10-24", label: "DEA Prescription Drug Take Back Day, 10 a.m.-2 p.m.", slug: "dea-drug-take-back-day-october-24-2026-locations" },
  { date: "2026-10-25", label: "Hunter's Moon rises at sunset (full 12:12 a.m. EDT Oct. 26)", slug: "hunters-moon-october-2026-full-moon-time" },
  { date: "2026-10-30", label: "Nevada Day · November SSI paid early", slug: "social-security-payment-schedule-october-2026-who-gets-paid-today" },
  { date: "2026-11-01", label: "Sunset jumps an hour earlier", slug: "sunset-times-after-daylight-saving-time-ends-2026" },
  { date: "2026-12-21", label: "Winter break begins in most large school districts", slug: "winter-break-2026-school-districts-dates" },
  { date: "2027-01-15", label: "Fourth-quarter 2026 estimated tax due", slug: "tax-calendar-2027-irs-deadlines" },
  { date: "2027-04-15", label: "Tax Day 2027", slug: "tax-calendar-2027-irs-deadlines" },
  { date: "2026-10-22", label: "Florida: last day to request a mail ballot", slug: "florida-amendments-2026-ballot-senate-special-election" },
  { date: "2026-10-23", label: "Georgia and Arizona: last day to request a mail ballot", slug: "georgia-2026-ballot-amendments-advance-voting" },
  { date: "2026-10-24", label: "Early voting opens in Michigan, Florida and New York", slug: "early-voting-starts-october-24-michigan-new-york-2026" },
  { date: "2026-10-27", label: "Pennsylvania mail ballot applications due, 5 p.m.", slug: "pennsylvania-2026-election-governor-mail-ballot-deadlines" },
  { date: "2026-10-27", label: "Mail your ballot by today (USPS advice)", slug: "mail-ballot-deadlines-2026-by-state" },
  { date: "2026-10-30", label: "Texas early voting ends; find your sample ballot by ZIP code", slug: "sample-ballot-by-zip-code-2026-texas-ballot" },
  { date: "2026-11-03", label: "Polls close from 6 p.m. ET", slug: "what-time-do-polls-close-election-day-2026" },
  { date: "2026-11-04", label: "Election results: when each state finishes counting", slug: "when-will-we-know-election-results-2026-midterms" },
  { date: "2026-11-27", label: "Black Friday: store opening times", slug: "black-friday-2026-store-hours-walmart-target-best-buy" },
  { date: "2026-12-24", label: "Christmas Eve: stores close early", slug: "christmas-eve-christmas-day-2026-store-hours" },
  { date: "2026-11-11", label: "Veterans Day: free meals and discounts list", slug: "veterans-day-free-meals-discounts" },
  { date: "2026-11-12", label: "GTA 6 pre-load opens; boxed edition on sale", slug: "gta-6-october-22-2026-what-is-confirmed-release-countdown" },
  { date: "2026-11-19", label: "GTA 6 launches on PS5 and Xbox Series X|S", slug: "gta-6-october-22-2026-what-is-confirmed-release-countdown" },
  { date: "2026-12-01", label: "Georgia runoff, if needed", slug: "georgia-2026-ballot-amendments-advance-voting" },
  { date: "2026-11-03", label: "Lyft VOTE26: 50% off one ride to the polls, up to $10", slug: "free-rides-to-the-polls-2026-lyft-uber-transit" },
  { date: "2026-11-12", label: "Northern Taurid meteor shower peaks (Nov. 11-12)", slug: "november-2026-meteor-showers-taurids-leonids" },
  { date: "2026-11-21", label: "Start thawing a 16-20 lb turkey in the fridge (Nov. 21-22)", slug: "when-to-thaw-thanksgiving-turkey-2026" },
  { date: "2026-12-09", label: "USPS: send-by date for international gifts (Priority Mail International)", slug: "usps-holiday-shipping-deadlines-2026" },
  { date: "2027-01-15", label: "ACA open enrollment for 2027 ends", slug: "aca-open-enrollment-2027-dates-november-1-january-15" },
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

/** Upcoming dates (today included) reported by any of `slugs`, soonest first: a story's or a topic's own dates. */
export function upcomingFor(slugs: Set<string>, now: Date = new Date()): (KeyDate & { days: number })[] {
  const today = todayET(now);
  return KEY_DATES.filter((k) => k.date >= today && slugs.has(k.slug))
    .sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
    .map((k) => ({ ...k, days: daysUntil(k.date, today) }));
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
    var n=Math.round((Date.parse(el.getAttribute('data-days-until'))-Date.parse(today))/864e5);
    if(n<0){ var li=el.closest('li'); if(li) li.remove(); } else el.textContent=n===0?'Today':n===1?'Tomorrow':'In '+n+' days';
  });
})();
`;
