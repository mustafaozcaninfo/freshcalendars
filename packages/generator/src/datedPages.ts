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
 * Years that leave the range are redirected by the Worker (cloudflare/legacy-redirects.js).
 */
import {
  buildMonthGrid, holidayWhenIsPath, holidaysForMonth, holidaysForYear, monthNumberToName, monthNumberToSlug,
  resolveAllMonthYears, resolvePlanningYear,
} from "@freshcalendars/engine";
import { breadcrumbNavHtml, esc } from "@freshcalendars/site-chrome";
import { YEARLY_VARIANTS } from "./catalog.js";
import { STUDIO_STYLES, studioAssets } from "./studio.js";
import { isoWeek } from "./toolPages.js";

export type DatedPage = {
  id: string; path: string; title: string; description: string; body: string;
  crumbs: { name: string; url: string }[];
  /** Set when an evergreen page shows the same month or year today. */
  canonicalPath?: string;
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

/** The month as a table with holidays ringed and the ISO week number of each row. */
function monthTable(year: number, month: number): string {
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

function designCards(year: number, month: number): string {
  const name = monthNumberToName(month);
  return `<ul class="design-grid">${STUDIO_STYLES.map((s) => {
    const sun = studioAssets(year, month, s.id), mon = studioAssets(year, month, s.id, "letter", "monday"), a4 = studioAssets(year, month, s.id, "a4");
    const wide = s.id === "landscape-soft";
    return `<li><a class="dg-thumb" href="${sun.pdf}" title="${name} ${year} calendar, ${s.label} design, PDF"><img src="${sun.preview}" alt="${name} ${year} printable calendar, ${s.label} design, Sunday start" width="500" height="${wide ? 386 : 647}" loading="lazy" decoding="async"></a><h3>${s.label}</h3><p>${esc(s.description)}</p><a class="btn btn-primary btn-sm" href="${sun.pdf}" download>Download PDF</a><p class="dg-more"><a href="${mon.pdf}" download>Monday start</a><a href="${a4.pdf}" download>A4</a><a href="${sun.png}" download>PNG</a></p></li>`;
  }).join("")}</ul>`;
}

function monthPage(year: number, month: number, today: Date): DatedPage {
  const name = monthNumberToName(month), f = monthFacts(year, month), hols = holidaysForMonth(year, month), years = datedYears(today);
  const prev = month === 1 ? [year - 1, 12] as const : [year, month - 1] as const, next = month === 12 ? [year + 1, 1] as const : [year, month + 1] as const;
  const prevHref = monthHref(prev[0], prev[1], today), nextHref = monthHref(next[0], next[1], today), yHref = yearHref(year, today);
  const evergreen = resolveAllMonthYears(today)[month] === year ? `/${monthNumberToSlug(month)}-calendars.html` : undefined;
  const c = crumbs(["Monthly calendars", "/monthly-calendars/"], [`${name} ${year}`, monthYearPath(year, month)]);
  const weeks = f.w1 === f.w2 ? `${f.w1}` : `${f.w1} to ${f.w2}`;
  const body = shell("dated-month", c, `
<h1>${name} ${year} calendar</h1>
<p class="tool-lead">${name} ${year} starts on a <strong>${f.start}</strong> and has <strong>${f.days} days</strong>. Print it free as a PDF in seven designs, on US Letter or A4, with a Sunday or a Monday start.</p>
<nav class="month-pager" aria-label="Other months">${prevHref ? `<a href="${prevHref}" rel="prev">← ${monthNumberToName(prev[1])} ${prev[0]}</a>` : "<span></span>"}${nextHref ? `<a href="${nextHref}" rel="next">${monthNumberToName(next[1])} ${next[0]} →</a>` : "<span></span>"}</nav>
<div class="dated-top">
  ${monthTable(year, month)}
  <div class="tool-today dated-facts"><div><span>First day</span><strong>${f.start}, ${name} 1</strong></div><div><span>Last day</span><strong>${f.end}, ${name} ${f.days}</strong></div><div><span>Weekdays</span><strong>${f.weekdays} weekdays, ${f.weekendDays} weekend days</strong></div><div><span>Week numbers</span><strong>${weeks}</strong></div></div>
</div>
<p class="tool-note">Week numbers follow ISO 8601: a week runs Monday to Sunday, so the Sunday that opens a row belongs to the week before.</p>
<h2>Print ${name} ${year}: seven designs</h2>
${designCards(year, month)}
<h2>Holidays in ${name} ${year}</h2>
${hols.length
    ? `<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Holiday</th><th scope="col">Date</th></tr></thead><tbody>${hols.map((h) => `<tr><th scope="row"><a href="${holidayWhenIsPath(h.slug)}">${esc(h.name)}</a></th><td>${esc(h.formatted)}</td></tr>`).join("")}</tbody></table></div>`
    : `<p>No holiday on our <a href="/holidays/">US holiday list</a> falls in ${name} ${year}.</p>`}
<h2>${name} in other years</h2>
<div class="du-chips">${years.map((y) => chip(monthHref(y, month, today), `${name} ${y}`, y === year)).join("")}</div>
<h2>Every month of ${year}</h2>
<div class="du-chips">${Array.from({ length: 12 }, (_, i) => chip(monthHref(year, i + 1, today), monthNumberToName(i + 1), i + 1 === month)).join("")}${yHref ? `<a href="${yHref}">${year} on one page →</a>` : ""}</div>
<p>Need a count instead of a sheet? The <a href="/calendar-tools/days-between-dates/">days between dates calculator</a> and the <a href="/calendar-tools/week-number/">week number table</a> use the same calendar.</p>`);
  return {
    id: `month-${year}-${monthNumberToSlug(month)}`, path: monthYearPath(year, month),
    title: `${name} ${year} Calendar · Free Printable PDF`,
    description: `Free printable ${name} ${year} calendar: PDF in seven designs, Letter or A4, Sunday or Monday start. ${name} ${year} starts on a ${f.start} and has ${f.days} days.`,
    body, crumbs: c, canonicalPath: evergreen, sheet: { year, month },
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
  const posters = [...YEARLY_VARIANTS.map((v) => ({ label: v.label, base: `/assets/${year}/yearly/${v.id}`, wide: v.id === "landscape-wall" }))];
  const body = shell("dated-year", c, `
<h1>${year} calendar</h1>
<p class="tool-lead">${year} is a <strong>${leap ? "leap year with 366 days" : "common year with 365 days"}</strong>. It starts on a <strong>${jan1}</strong> and ends on a ${dec31}. Print the whole year on one page, or open any month for its own sheet.</p>
<div class="tool-today"><div><span>January 1</span><strong>${jan1}</strong></div><div><span>December 31</span><strong>${dec31}</strong></div><div><span>Days</span><strong>${leap ? "366, with February 29" : "365"}</strong></div><div><span>ISO weeks</span><strong>${isoWeeks}</strong></div></div>
<h2>All 12 months of ${year}</h2>
<div class="year-minis">${Array.from({ length: 12 }, (_, i) => miniMonth(year, i + 1, today)).join("")}</div>
<p class="tool-note">Shaded days are US holidays. Select a month name for its printable page.</p>
<h2>Print ${year} on one page</h2>
<ul class="design-grid">${posters.map((p) => `<li><a class="dg-thumb" href="${p.base}/calendar.pdf" title="${year} yearly calendar, ${esc(p.label)}, PDF"><img src="${p.base}/calendar-preview.webp" alt="${year} printable yearly calendar, ${esc(p.label)}" width="500" height="${p.wide ? 344 : 645}" loading="lazy" decoding="async"></a><h3>${esc(p.label)}</h3><a class="btn btn-primary btn-sm" href="${p.base}/calendar.pdf" download>Download PDF</a><p class="dg-more"><a href="${p.base}/calendar.png" download>PNG</a></p></li>`).join("")}</ul>
<h2>US holidays in ${year}</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Holiday</th><th scope="col">Date</th></tr></thead><tbody>${hols.map((h) => `<tr><th scope="row"><a href="${holidayWhenIsPath(h.slug)}">${esc(h.name)}</a></th><td>${esc(h.formatted)}</td></tr>`).join("")}</tbody></table></div>
<h2>Other years</h2>
<div class="du-chips">${years.map((y) => chip(yearHref(y, today), `${y} calendar`, y === year)).join("")}</div>`);
  return {
    id: `year-${year}`, path: yearPath(year),
    title: `${year} Calendar · Free Printable Yearly PDF and All 12 Months`,
    description: `Free printable ${year} calendar: the year on one page as a PDF, every month with week numbers, and US holidays. ${year} starts on a ${jan1} and has ${leap ? 366 : 365} days.`,
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
