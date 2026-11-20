/**
 * Permanent month and year pages: /december-2027-calendar/ and /2028-calendar/.
 *
 * The evergreen pages (/december-calendars.html, /printable-calendars.html) move to a new year when
 * the old one ends, so nothing on the site could answer "december 2027 calendar" or "2028 calendar"
 * until that year arrived. These pages keep one address per month and per year for every year the
 * studio has printables for.
 *
 * A month or year an evergreen page shows today is not a second copy of it: its dated page points
 * its canonical at the evergreen page and stays out of the sitemap, and links go to the evergreen
 * page (monthHref, yearHref). When the evergreen page moves on, the dated page stands on its own.
 * No Worker rule covers these paths: the deploy refuses an old-URL rule that matches a real page.
 */
import {
  buildMonthGrid, cdnUrl, holidayDefBySlug, holidayWhenIsPath, holidaysForMonth, holidaysForYear, monthNumberToName, monthNumberToSlug,
  resolveAllMonthYears, resolveHoliday, resolvePlanningYear, type ResolvedHoliday, type SeoMeta,
} from "@freshcalendars/engine";
import { breadcrumbNavHtml, esc } from "@freshcalendars/site-chrome";
import { YEARLY_VARIANTS } from "./catalog.js";
import { CARD_STYLES, monthSearchImage, studioAssets, yearSearchImage } from "./studio.js";
import {
  clockChange, datesByWeekday, dayLabel, dayOfYear, daysIn, federalDays, fridayThe13ths, isoWeeksOfMonth, listAnd, monthsStartingAlike,
  ordinal, plural, sameCalendarYears, sameLayoutYears, sheetRows, shortDay, utc, weekdayOf, word, workingDays,
} from "./pageFacts.js";
import { isoWeek } from "./toolPages.js";
import { PACK_JS, packBoxHtml, packFor, packLd, packTermsHtml } from "./packs.js";

export type DatedPage = {
  id: string; path: string; title: string; description: string; body: string;
  crumbs: { name: string; url: string }[];
  /** Set when an evergreen page shows the same month or year today. */
  canonicalPath?: string;
  /** Extra structured data for the head: the Product of a month with a printable pack on sale. */
  ld?: Record<string, unknown>[];
  /** Month or year drawn on the share card. */
  sheet: { year: number; month?: number };
};

const DAY = 864e5;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORIGIN = "https://freshcalendars.com";
/** Years with studio printables: gen.ts draws the planning year and the four after it. */
export const DATED_YEARS = 5;
export function datedYears(today: Date): number[] {
  const first = resolvePlanningYear(today);
  return Array.from({ length: DATED_YEARS }, (_, i) => first + i);
}
export const monthYearPath = (year: number, month: number) => `/${monthNumberToSlug(month)}-${year}-calendar/`;
export const yearPath = (year: number) => `/${year}-calendar/`;
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** The page to link for a month of a year: the evergreen page while it shows that year, else the dated one. */
export function monthHref(year: number, month: number, today: Date): string | null {
  if (resolveAllMonthYears(today)[month] === year) return `/${monthNumberToSlug(month)}-calendars.html`;
  return datedYears(today).includes(year) ? monthYearPath(year, month) : null;
}
export function yearHref(year: number, today: Date): string | null {
  const planning = resolvePlanningYear(today);
  if (year === planning) return "/printable-calendars.html";
  if (year === planning + 1) return "/printable-yearly-calendar.html";
  return datedYears(today).includes(year) ? yearPath(year) : null;
}

const crumbs = (...rest: [string, string][]) => [{ name: "Home", url: `${ORIGIN}/` }, ...rest.map(([name, p]) => ({ name, url: `${ORIGIN}${p}` }))];
const shell = (cls: string, crumb: { name: string; url: string }[], inner: string) => `<section class="concept-wrap tools-page dated-page ${cls}">${breadcrumbNavHtml(crumb)}${inner}</section>`;
const chip = (href: string | null, label: string, current = false) => (current ? `<span aria-current="page">${esc(label)}</span>` : href ? `<a href="${href}">${esc(label)}</a>` : "");

function monthFacts(year: number, month: number) {
  const days = new Date(year, month, 0).getDate(), first = new Date(year, month - 1, 1).getDay();
  let weekdays = 0;
  for (let d = 1; d <= days; d++) { const g = (first + d - 1) % 7; if (g !== 0 && g !== 6) weekdays++; }
  const w1 = isoWeek(Date.UTC(year, month - 1, 1)).week, w2 = isoWeek(Date.UTC(year, month - 1, days)).week;
  return { days, start: WEEKDAYS[first]!, end: WEEKDAYS[(first + days - 1) % 7]!, weekdays, weekendDays: days - weekdays, w1, w2 };
}

const table = (head: string[], rows: string[][], cls = "") => `<div class="tool-scroll"><table class="dates-table tool-table${cls}"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(([first, ...rest]) => `<tr><th scope="row">${first}</th>${rest.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const ps = (sentences: (string | false | null | undefined)[]) => { const t = sentences.filter(Boolean).join(" "); return t ? `<p>${t}</p>` : ""; };
/** "March 6 to 12", "February 28 to March 5" */
function rangeLabel(a: number, b: number): string {
  if (a === b) return shortDay(a);
  return new Date(a).getUTCMonth() === new Date(b).getUTCMonth() ? `${shortDay(a)} to ${new Date(b).getUTCDate()}` : `${shortDay(a)} to ${shortDay(b)}`;
}
const fiveTimers = (year: number, month: number) => datesByWeekday(year, month).map((d, g) => (d.length === 5 ? `${WEEKDAYS[g]}s` : "")).filter(Boolean);

/** How many rows the month takes on each kind of sheet, said once where the sheets are offered. */
export function monthRowsNote(year: number, month: number): string {
  const name = `${monthNumberToName(month)} ${year}`, su = sheetRows(year, month, 0), mo = sheetRows(year, month, 1), days = daysIn(year, month);
  const tail = (startsOn: 0 | 1) => { const n = ((weekdayOf(utc(year, month, 1)) - startsOn + 7) % 7) + days - 35; return n === 1 ? `the ${ordinal(days)}` : `the ${ordinal(days - 1)} and ${ordinal(days)}`; };
  if (su === 4) return `${name} starts on a Sunday and has 28 days, so a Sunday-start sheet holds it in four full rows with no empty box. A Monday-start sheet needs five.`;
  if (mo === 4) return `${name} starts on a Monday and has 28 days, so a Monday-start sheet holds it in four full rows with no empty box. A Sunday-start sheet needs five.`;
  if (su === 6 && mo === 6) return `${name} needs six rows on a sheet with either start day.`;
  if (su === 6) return `On a Sunday-start sheet ${name} runs into a sixth row that holds only ${tail(0)}, while a Monday start fits the month in five.`;
  if (mo === 6) return `On a Monday-start sheet ${name} runs into a sixth row that holds only ${tail(1)}, while a Sunday start fits the month in five.`;
  return `${name} fits in five rows whether the sheet starts on Sunday or on Monday.`;
}

/** The month one ISO week per row: the dates inside the month and what falls in them. */
export function monthWeeksHtml(year: number, month: number): string {
  const name = monthNumberToName(month), days = daysIn(year, month), first = utc(year, month, 1), last = utc(year, month, days);
  const rows = isoWeeksOfMonth(year, month, holidaysForMonth(year, month)).map((w) => {
    const n = Math.round((w.inMonth[1] - w.inMonth[0]) / DAY) + 1;
    const partial = n < 7 ? (w.inMonth[0] === first && w.from < first ? `Shared with ${monthNumberToName(new Date(w.from).getUTCMonth() + 1)}` : `Shared with ${monthNumberToName(new Date(w.to).getUTCMonth() + 1)}`) : "";
    const marks = [partial, ...w.holidays.map((h) => `${esc(h.name)} (${h.weekdayName.slice(0, 3)} ${h.day})`)].filter(Boolean).join("; ");
    return [`Week ${w.week}`, rangeLabel(w.inMonth[0], w.inMonth[1]), `${n}`, marks];
  });
  const doy = dayOfYear(first), left = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365) - dayOfYear(last);
  return `${table(["ISO week", `Dates in ${name}`, "Days", "Holidays and notes"], rows)}
${ps([left ? `${name} 1 is day ${doy} of ${year}, and ${plural(left, "day")} of the year remain after ${name} ${days}.` : `December 1 is day ${doy} of ${year} and December 31 closes the year in ISO week ${isoWeek(last).week}.`])}`;
}

/** Working days once federal holidays are taken out, with the days federal offices close. */
export function monthWorkHtml(year: number, month: number): string {
  const name = `${monthNumberToName(month)} ${year}`, f = monthFacts(year, month), w = workingDays(year, month);
  const out = federalDays(year).filter((d) => d.h.month === month && new Date(d.observed).getUTCMonth() + 1 !== month);
  const notes = [
    ...w.off.map((d) => (d.observed !== d.date
      ? `${d.h.name}${d.h.year !== year ? ` ${d.h.year}` : ""} falls on ${dayLabel(d.date)}, so federal offices close on ${dayLabel(d.observed)}.`
      : d.weekend
        ? `${d.h.name} on ${dayLabel(d.date)} makes a three-day weekend, ${rangeLabel(d.weekend[0], d.weekend[1])}.`
        : d.h.slug === "thanksgiving"
          ? `Thanksgiving is ${dayLabel(d.date)}. The Friday after it, ${shortDay(d.date + DAY)}, is not a federal holiday.`
          : `${d.h.name} lands midweek in ${year}, on ${dayLabel(d.date)}.`)),
    ...out.map((d) => `${d.h.name} ${year} falls on ${dayLabel(d.date)}, and the federal day off is ${dayLabel(d.observed)}, ${new Date(d.observed).getUTCFullYear()}.`),
  ];
  const lead = w.off.length
    ? `With ${listAnd(w.off.map((d) => d.h.name))} taken out, ${name} has ${w.count} working days. The first is ${dayLabel(w.first)} and the last is ${dayLabel(w.last)}.`
    : `No federal holiday closes offices on a weekday in ${name}, so all ${w.count} weekdays are working days, from ${dayLabel(w.first)} to ${dayLabel(w.last)}.`;
  const rows: [string, string][] = [
    ["Days", `${f.days}`],
    ["Weekdays, Monday to Friday", `${f.weekdays}`],
    ["Saturdays and Sundays", `${f.weekendDays}`],
    ["Working days, federal holidays out", `${w.count}`],
    ["Hours at 8 a day", `${w.count * 8}`],
    ["15th of the month", WEEKDAYS[weekdayOf(utc(year, month, 15))]!],
    ["Quarter", `Q${Math.ceil(month / 3)} of ${year}`],
  ];
  return `${ps([lead, ...notes])}
<div class="tool-scroll"><table class="dates-table"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`;
}

/** Every date of each weekday, for anything that repeats weekly. */
export function monthWeekdaysHtml(year: number, month: number): string {
  const name = monthNumberToName(month), by = datesByWeekday(year, month), five = fiveTimers(year, month), f13 = fridayThe13ths(year);
  const rows = [1, 2, 3, 4, 5, 6, 0].map((g) => [`${WEEKDAYS[g]}s`, by[g]!.map((d) => `${name.slice(0, 3)} ${d}`).join(", "), `${by[g]!.length}`]);
  return `${table(["Weekday", `Dates in ${name} ${year}`, "Count"], rows)}
${ps([
    five.length ? `${name} ${year} has five ${listAnd(five)} and four of every other weekday.` : `Each weekday comes exactly four times in ${name} ${year}.`,
    f13.includes(month) && (f13.length === 1 ? `${name} 13 is the only Friday the 13th of ${year}.` : `${name} 13 is a Friday the 13th, one of ${word(f13.length)} in ${year} (${listAnd(f13.map((m) => monthNumberToName(m)))}).`),
  ])}`;
}

/** Where the same sheet can be reused, and how the month moved since last year. */
export function monthYearsNote(year: number, month: number): string {
  const name = monthNumberToName(month), same = sameLayoutYears(year, month), start = weekdayOf(utc(year, month, 1)), prev = weekdayOf(utc(year - 1, month, 1));
  const shift = (start - prev + 7) % 7, alike = monthsStartingAlike(year, month);
  return ps([
    same.before.length && same.after.length
      ? `${name} had this exact layout in ${same.before[0]} and has it again in ${listAnd(same.after.map(String))}.`
      : same.after.length ? `${name} has this exact layout again in ${listAnd(same.after.map(String))}.` : "",
    `Against ${name} ${year - 1}, every date sits ${shift === 1 ? "one weekday" : `${word(shift)} weekdays`} later: the 1st was a ${WEEKDAYS[prev]} then and is a ${WEEKDAYS[start]} now.`,
    alike.length ? `In ${year}, ${listAnd(alike.map((m) => monthNumberToName(m)))} ${alike.length === 1 ? "starts" : "start"} on a ${WEEKDAYS[start]} as well.` : `No other month of ${year} starts on a ${WEEKDAYS[start]}.`,
  ]);
}

/** A month's holidays beside where each fell the year before, and the clock change when there is one. */
export function monthHolidaysHtml(year: number, month: number): string {
  const name = monthNumberToName(month), hols = holidaysForMonth(year, month), clock = clockChange(year, month);
  const before = (h: ResolvedHoliday) => { const def = holidayDefBySlug(h.slug); return def ? resolveHoliday(def, year - 1) : null; };
  const clockNote = clock && (clock.forward
    ? `Clocks in most of the United States go forward an hour at 2 a.m. on ${dayLabel(clock.t)}, which leaves that Sunday 23 hours long.`
    : `Clocks in most of the United States go back an hour at 2 a.m. on ${dayLabel(clock.t)}, so that Sunday lasts 25 hours.`);
  if (!hols.length) return `<p>No holiday on our <a href="/holidays/">US holiday list</a> falls in ${name} ${year}.</p>${ps([clockNote])}`;
  const anyFederal = hols.some((h) => h.kind === "federal");
  const rows = hols.map((h) => { const b = before(h); return [`<a href="${holidayWhenIsPath(h.slug)}">${esc(h.name)}</a>`, `${h.weekdayName}, ${name} ${h.day}`, b ? `${b.weekdayName}, ${monthNumberToName(b.month)} ${b.day}` : "", ...(anyFederal ? [h.kind === "federal" ? "Federal holiday" : "Observance"] : [])]; });
  return `${table(["Holiday", `${year} date`, `In ${year - 1}`, ...(anyFederal ? ["Status"] : [])], rows)}${ps([clockNote])}`;
}

/** The month as a table with holidays ringed and the ISO week number of each row. */
export function monthTable(year: number, month: number): string {
  const name = monthNumberToName(month), hol = new Map(holidaysForMonth(year, month).map((h) => [h.day, h.name]));
  const rows = buildMonthGrid({ year, month }).weeks.map((w) => {
    const i = w.findIndex(Boolean), monday = Date.UTC(year, month - 1, w[i]!.day) + (1 - i) * DAY;
    return `<tr><th scope="row">${isoWeek(monday).week}</th>${w.map((c) => (!c ? "<td></td>" : hol.has(c.day) ? `<td class="is-other"><span title="${esc(hol.get(c.day)!)}">${c.day}</span></td>` : `<td>${c.day}</td>`)).join("")}</tr>`;
  }).join("");
  return `<table class="hm-grid dated-grid" aria-label="${name} ${year} calendar with week numbers">
  <caption>${name} ${year}</caption>
  <thead><tr><th scope="col" title="ISO week number">Wk</th>${WEEKDAYS.map((d) => `<th scope="col">${d.slice(0, 3)}</th>`).join("")}</tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

/** A design card's picture is about a quarter of the 1100 px grid, or half a phone screen. */
const CARD_SIZES = "(max-width:640px) 45vw, 240px";
const monthImageName = (year: number, month: number, s: { label: string }) => `${monthNumberToName(month)} ${year} calendar, ${s.label} design`;
const yearImageName = (year: number, v: { label: string }) => `${year} yearly calendar, ${v.label}`;

/**
 * The pictures a month or year page offers image search: the same files its design cards show
 * (designCards, the year posters), so the page, its ImageObject data and the image sitemap agree.
 */
export function sheetSearchImages(year: number, month?: number | null): NonNullable<SeoMeta["searchImages"]> {
  const list = month
    ? CARD_STYLES.map((s) => ({ image: monthSearchImage(year, month, s.id), name: monthImageName(year, month, s), description: `Free printable ${monthNumberToName(month)} ${year} calendar. ${s.description}.` }))
    : YEARLY_VARIANTS.map((v) => ({ image: yearSearchImage(year, v.id), name: yearImageName(year, v), description: `Free printable ${year} calendar on one page. ${v.description}` }));
  return list.map(({ image, name, description }) => ({ url: cdnUrl(image.full), width: image.width, height: image.height, name, description }));
}

/**
 * `own` is for the dated pages: the design's stock description (the same on every month) gives way
 * to what this month's sheet shows, so no card text repeats from page to page.
 */
export function designCards(year: number, month: number, own = false): string {
  const name = monthNumberToName(month), hols = holidaysForMonth(year, month);
  const shows = `${daysIn(year, month)} days from a ${WEEKDAYS[weekdayOf(utc(year, month, 1))]} start${hols.length ? `, ${listAnd(hols.slice(0, 3).map((h) => h.name))} named` : ""}`;
  return `<ul class="design-grid">${CARD_STYLES.map((s) => {
    const sun = studioAssets(year, month, s.id), mon = studioAssets(year, month, s.id, "letter", "monday"), a4 = studioAssets(year, month, s.id, "a4");
    const image = monthSearchImage(year, month, s.id);
    return `<li><a class="dg-thumb" href="${sun.pdf}" title="${name} ${year} calendar, ${s.label} design, PDF"><img src="${image.full}" srcset="${image.srcset}" sizes="${CARD_SIZES}" alt="${esc(monthImageName(year, month, s))}${own ? `: ${esc(shows)}` : `. ${esc(s.description)}`}" title="${esc(monthImageName(year, month, s))}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></a><h3>${s.label}</h3>${own ? "" : `<p>${esc(s.description)}</p>`}<a class="btn btn-primary btn-sm" href="${sun.pdf}" download>Download PDF</a><p class="dg-more"><a href="${mon.pdf}" download>Monday start</a><a href="${a4.pdf}" download>A4</a><a href="${sun.png}" download>PNG</a></p></li>`;
  }).join("")}</ul>`;
}

function monthPage(year: number, month: number, today: Date): DatedPage {
  const name = monthNumberToName(month), f = monthFacts(year, month), hols = holidaysForMonth(year, month), years = datedYears(today);
  const prev = month === 1 ? [year - 1, 12] as const : [year, month - 1] as const, next = month === 12 ? [year + 1, 1] as const : [year, month + 1] as const;
  const prevHref = monthHref(prev[0], prev[1], today), nextHref = monthHref(next[0], next[1], today), yHref = yearHref(year, today);
  const evergreen = resolveAllMonthYears(today)[month] === year ? `/${monthNumberToSlug(month)}-calendars.html` : undefined;
  const c = crumbs(["Monthly calendars", "/monthly-calendars/"], ...(yHref ? [[`${year}`, yHref] as [string, string]] : []), [`${name} ${year}`, monthYearPath(year, month)]);
  const weeks = f.w1 === f.w2 ? `${f.w1}` : `${f.w1} to ${f.w2}`;
  // The first Sunday shows how an ISO week differs from a row of a Sunday-start sheet.
  const sun = 1 + ((7 - new Date(year, month - 1, 1).getDay()) % 7);
  const isoNote = `Week numbers follow ISO 8601, where a week runs Monday to Sunday: Sunday, ${name} ${sun} closes week ${isoWeek(Date.UTC(year, month - 1, sun)).week} and Monday, ${name} ${sun + 1} opens week ${isoWeek(Date.UTC(year, month - 1, sun + 1)).week}.`;
  const pack = packFor(year, month);
  const five = datesByWeekday(year, month).map((d, g) => (d.length === 5 ? `${WEEKDAYS[g]}s` : "")).filter(Boolean);
  const body = shell("dated-month", c, `
<h1>${name} ${year} calendar</h1>
<p class="tool-lead">${name} ${year} starts on a <strong>${f.start}</strong> and ends on a ${f.end}, <strong>${f.days} days</strong> in all${five.length ? `, with five ${listAnd(five)}` : ", four of each weekday"}. The eight ${name} ${year} sheets below print free as PDF on US Letter or A4.</p>
<nav class="month-pager" aria-label="Other months">${prevHref ? `<a href="${prevHref}" rel="prev">« ${monthNumberToName(prev[1])} ${prev[0]}</a>` : "<span></span>"}${nextHref ? `<a href="${nextHref}" rel="next">${monthNumberToName(next[1])} ${next[0]} »</a>` : "<span></span>"}</nav>
<div class="dated-top">
  ${monthTable(year, month)}
  <div class="tool-today dated-facts"><div><span>First day</span><strong>${f.start}, ${name} 1</strong></div><div><span>Last day</span><strong>${f.end}, ${name} ${f.days}</strong></div><div><span>Weekdays</span><strong>${f.weekdays} weekdays, ${f.weekendDays} weekend days</strong></div><div><span>Week numbers</span><strong>${weeks}</strong></div></div>
</div>
<p class="tool-note">${isoNote}</p>
${pack ? packBoxHtml(pack) : ""}
<h2>Print ${name} ${year} in eight designs</h2>
<p>${monthRowsNote(year, month)}</p>
${designCards(year, month, true)}
<h2>${name} ${year} week by week</h2>
${monthWeeksHtml(year, month)}
<h2>Holidays in ${name} ${year}</h2>
${monthHolidaysHtml(year, month)}
<h2>Working days in ${name} ${year}</h2>
${monthWorkHtml(year, month)}
<h2>${name} ${year} dates by weekday</h2>
${monthWeekdaysHtml(year, month)}
<h2>${name} ${year} compared with other years</h2>
${monthYearsNote(year, month)}
<div class="du-chips">${years.map((y) => chip(monthHref(y, month, today), `${name} ${y}`, y === year)).join("")}</div>
${pack ? `${packTermsHtml(pack)}<script>${PACK_JS}</script>` : ""}
<h2>Every month of ${year}</h2>
<div class="du-chips">${Array.from({ length: 12 }, (_, i) => chip(monthHref(year, i + 1, today), monthNumberToName(i + 1), i + 1 === month)).join("")}${yHref ? `<a href="${yHref}">${year} on one page</a>` : ""}</div>
<nav class="tool-links" aria-label="Related tools and sheets"><a href="/calendar-tools/days-between-dates/">Days between dates</a><a href="/calendar-tools/business-days/">Business days</a><a href="/calendar-tools/week-number/">Week numbers</a><a href="/blank-calendars.html">Blank calendar</a><a href="/printable-weekly-calendar.html">Weekly planner</a><a href="/print-guide.html">Print guide</a></nav>`);
  return {
    id: `month-${year}-${monthNumberToSlug(month)}`, path: monthYearPath(year, month),
    // Same wording as the evergreen month page (engine buildMeta.ts), which this page becomes.
    title: `Free Printable ${name} ${year} Calendar PDF${hols.length ? " with Holidays" : " in 8 Designs"}`,
    description: [hols.length ? `; ${hols[0]!.name} is ${name} ${hols[0]!.day}` : "", ""].map((tail) => `Free printable ${name} ${year} calendar in eight PDF designs, Letter or A4. It starts on a ${f.start}, has ${f.days} days and ${workingDays(year, month).count} working days${tail}.`).find((d) => d.length <= 158)!,
    body, crumbs: c, canonicalPath: evergreen, sheet: { year, month },
    // The Product sits on the page that sells it: never on a month whose canonical is elsewhere.
    ld: pack?.checkoutUrl && !evergreen ? [packLd(pack, `${ORIGIN}${monthYearPath(year, month)}`)] : undefined,
  };
}

function miniMonth(year: number, month: number, today: Date): string {
  const name = monthNumberToName(month), href = monthHref(year, month, today), hol = new Set(holidaysForMonth(year, month).map((h) => h.day));
  const rows = buildMonthGrid({ year, month }).weeks.map((w) => `<tr>${w.map((c) => (!c ? "<td></td>" : hol.has(c.day) ? `<td class="is-hol">${c.day}</td>` : `<td>${c.day}</td>`)).join("")}</tr>`).join("");
  return `<div class="mini-month"><table aria-label="${name} ${year}"><caption>${href ? `<a href="${href}" title="${name} ${year} printable calendar">${name}</a>` : name}</caption><thead><tr>${WEEKDAYS.map((d) => `<th scope="col" title="${d}">${d[0]}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function yearPage(year: number, today: Date): DatedPage {
  const jan1 = WEEKDAYS[new Date(year, 0, 1).getDay()]!, dec31 = WEEKDAYS[new Date(year, 11, 31).getDay()]!, leap = isLeap(year);
  const isoWeeks = isoWeek(Date.UTC(year, 11, 28)).week, hols = holidaysForYear(year), years = datedYears(today);
  const planning = resolvePlanningYear(today);
  const evergreen = year === planning ? "/printable-calendars.html" : year === planning + 1 ? "/printable-yearly-calendar.html" : undefined;
  const c = crumbs(["Calendars", "/calendars/"], [`${year}`, yearPath(year)]);
  const posters = YEARLY_VARIANTS.map((v) => ({ label: v.label, base: `/assets/${year}/yearly/${v.id}`, image: yearSearchImage(year, v.id), alt: `${yearImageName(year, v)}. ${v.description.replace(/\.$/, "")}`, title: yearImageName(year, v) }));
  const same = sameCalendarYears(year), fed = federalDays(year), long = fed.filter((d) => d.weekend), f13 = fridayThe13ths(year);
  const prevJan = WEEKDAYS[new Date(year - 1, 0, 1).getDay()]!;
  const byStart = WEEKDAYS.map((d, g) => ({ d, months: Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => weekdayOf(utc(year, m, 1)) === g) })).filter((x) => x.months.length);
  const quarters = [1, 2, 3, 4].map((q) => {
    const ms = [q * 3 - 2, q * 3 - 1, q * 3], days = ms.reduce((n, m) => n + daysIn(year, m), 0);
    return [`Q${q}`, `${monthNumberToName(ms[0]!)} 1 to ${monthNumberToName(ms[2]!)} ${daysIn(year, ms[2]!)}`, `${days}`, `${ms.reduce((n, m) => n + workingDays(year, m).count, 0)}`];
  });
  const body = shell("dated-year", c, `
<h1>${year} calendar</h1>
<p class="tool-lead">${year} is a <strong>${leap ? "leap year with 366 days" : "common year with 365 days"}</strong>. It starts on a <strong>${jan1}</strong> and ends on a ${dec31}. Print the whole of ${year} on one page, or open any month for its own sheet.</p>
<div class="tool-today"><div><span>January 1</span><strong>${jan1}</strong></div><div><span>December 31</span><strong>${dec31}</strong></div><div><span>Days</span><strong>${leap ? "366, with February 29" : "365"}</strong></div><div><span>ISO weeks</span><strong>${isoWeeks}</strong></div></div>
<h2>All 12 months of ${year}</h2>
<div class="year-minis">${Array.from({ length: 12 }, (_, i) => miniMonth(year, i + 1, today)).join("")}</div>
<p class="tool-note">Shaded days are the ${year} US holidays listed further down, and each month name opens that month's printable page.</p>
<h2>Print ${year} on one page</h2>
<ul class="design-grid">${posters.map((p) => `<li><a class="dg-thumb" href="${p.base}/calendar.pdf" title="${year} yearly calendar, ${esc(p.label)}, PDF"><img src="${p.image.full}" srcset="${p.image.srcset}" sizes="${CARD_SIZES}" alt="${esc(p.alt)}" title="${esc(p.title)}" width="${p.image.width}" height="${p.image.height}" loading="lazy" decoding="async"></a><h3>${esc(p.label)}</h3><a class="btn btn-primary btn-sm" href="${p.base}/calendar.pdf" download>Download PDF</a><p class="dg-more"><a href="${p.base}/calendar.png" download>PNG</a></p></li>`).join("")}</ul>
<h2>Federal holidays and long weekends in ${year}</h2>
${ps([
    `${long.length === fed.length ? `All ${fed.length}` : `${word(long.length).replace(/^./, (ch) => ch.toUpperCase())} of the ${fed.length}`} federal holidays of ${year} join a weekend to make three days off.`,
    ...fed.filter((d) => d.observed !== d.date).map((d) => `${d.h.name} ${year} is a ${d.h.weekdayName}, which moves the federal day off to ${dayLabel(d.observed)}${new Date(d.observed).getUTCFullYear() !== year ? `, ${new Date(d.observed).getUTCFullYear()}` : ""}.`),
  ])}
${table(["Federal holiday", `${year} date`, "Day off", "Long weekend"], fed.map((d) => [`<a href="${holidayWhenIsPath(d.h.slug)}">${esc(d.h.name)}</a>`, dayLabel(d.date), d.observed === d.date ? "Same day" : `${dayLabel(d.observed)}${new Date(d.observed).getUTCFullYear() !== year ? `, ${new Date(d.observed).getUTCFullYear()}` : ""}`, d.weekend ? (new Date(d.weekend[0]).getUTCFullYear() !== year ? `${shortDay(d.weekend[0])}, ${year - 1} to ${shortDay(d.weekend[1])}` : rangeLabel(d.weekend[0], d.weekend[1])) : `No, a ${d.h.weekdayName}`]))}
<h2>${year} by quarter</h2>
${table(["Quarter", "Dates", "Days", "Working days"], quarters)}
${ps([
    `Working days are Monday to Friday with the federal days off above taken out, ${quarters.reduce((n, q) => n + Number(q[3]), 0)} across ${year}.`,
    f13.length ? `${year} has ${word(f13.length)} Friday the 13th${f13.length > 1 ? "s" : ""}, in ${listAnd(f13.map((m) => monthNumberToName(m)))}.` : "",
  ])}
<h2>Which weekday each month of ${year} starts on</h2>
${table(["First day", `Months of ${year}`], byStart.map((x) => [x.d, x.months.map((m) => monthNumberToName(m)).join(", ")]))}
<h2>Years with the same calendar as ${year}</h2>
${ps([
    same.before.length ? `The ${year} calendar matches ${listAnd(same.before.slice().reverse().map(String))} day for day, and the next years to repeat it are ${listAnd(same.after.map(String))}.` : `The next years to repeat the ${year} calendar are ${listAnd(same.after.map(String))}.`,
    `January 1, ${year - 1} was a ${prevJan}, so every date before March sits ${isLeap(year - 1) ? "two weekdays" : "one weekday"} later in ${year}.`,
  ])}
<h2>US holidays in ${year}</h2>
${table(["Holiday", `${year} date`, "Day of the year", "ISO week"], hols.map((h) => [`<a href="${holidayWhenIsPath(h.slug)}">${esc(h.name)}</a>`, `${h.weekdayName}, ${monthNumberToName(h.month)} ${h.day}`, `${dayOfYear(utc(h.year, h.month, h.day))}`, `${isoWeek(utc(h.year, h.month, h.day)).week}`]))}
<h2>Other years</h2>
<div class="du-chips">${years.map((y) => chip(yearHref(y, today), `${y} calendar`, y === year)).join("")}</div>
<nav class="tool-links" aria-label="Related pages"><a href="/uk-holidays/">UK bank holidays</a><a href="/canada-holidays/">Canada holidays</a><a href="/days-until/">Days until a holiday</a><a href="/calendar-tools/day-of-year/">Day of the year</a><a href="/calendar-tools/week-number/">Week numbers</a><a href="/guides/fiscal-year-calendar.html">Fiscal year guide</a><a href="/calendar-tools/business-days/">Business days</a></nav>`);
  return {
    id: `year-${year}`, path: yearPath(year),
    title: `Free Printable ${year} Calendar with Holidays and All 12 Months`,
    description: `Free printable ${year} calendar on one page as a PDF, with every month, US holidays and long weekends. ${year} starts on a ${jan1} and has ${leap ? 366 : 365} days.`,
    body, crumbs: c, canonicalPath: evergreen, sheet: { year },
  };
}

/** "By year" links for the library hubs and the evergreen pages. */
export function datedIndexNav(today: Date): string {
  const years = datedYears(today);
  return `<section class="concept-wrap dated-index" aria-label="Calendars by year"><h2>Calendars by year</h2>${years.map((y) => `<div class="dated-index-row"><a class="dated-index-year" href="${yearHref(y, today)}">${y}</a><div class="du-chips">${Array.from({ length: 12 }, (_, i) => chip(monthHref(y, i + 1, today), monthNumberToName(i + 1).slice(0, 3))).join("")}</div></div>`).join("")}</section>`;
}

export function datedPages(today: Date): DatedPage[] {
  const years = datedYears(today);
  return [...years.map((y) => yearPage(y, today)), ...years.flatMap((y) => Array.from({ length: 12 }, (_, i) => monthPage(y, i + 1, today)))];
}
