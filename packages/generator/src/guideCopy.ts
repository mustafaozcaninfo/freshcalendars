/**
 * Body text of the four how-to guides (print, Monday vs Sunday start, fiscal year, classroom).
 *
 * Each guide was a few lines pointing at downloads. Here every guide carries a table worked out
 * from the calendar itself (rows a month needs in each layout, fiscal-year and quarter dates, the
 * weekdays in each school month, the scale that fits Letter on A4), so the page answers the
 * question before it offers a file. Dates come from the engine; rules that are not arithmetic
 * are linked to the agency that sets them.
 */
import { buildMonthGrid, holidaysForYear, monthNumberToName, resolvePlanningYear, schoolYearStartYear } from "@freshcalendars/engine";
import { esc } from "@freshcalendars/site-chrome";
import { monthHref } from "./datedPages.js";
import { weekdaysBetween } from "./toolPages.js";

const DAY = 864e5;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const short = (t: number) => { const d = new Date(t); return `${WEEKDAYS[d.getUTCDay()]!.slice(0, 3)}, ${monthNumberToName(d.getUTCMonth() + 1).slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const table = (label: string, head: string[], rows: string[][]) =>
  `<div class="tool-scroll"><table class="dates-table tool-table guide-table" aria-label="${esc(label)}"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const monthLink = (y: number, m: number, today: Date) => { const href = monthHref(y, m, today), label = `${monthNumberToName(m)} ${y}`; return href ? `<a href="${href}">${label}</a>` : label; };
/** The twelve months that start with the current one. */
function nextTwelve(today: Date): [number, number][] {
  return Array.from({ length: 12 }, (_, i) => { const d = new Date(today.getFullYear(), today.getMonth() + i, 1); return [d.getFullYear(), d.getMonth() + 1] as [number, number]; });
}

export function mondayGuideBody(today: Date): string {
  const months = nextTwelve(today);
  const rows = months.map(([y, m]) => {
    const sun = buildMonthGrid({ year: y, month: m, weekStartsOn: 0 }).weeks.length, mon = buildMonthGrid({ year: y, month: m, weekStartsOn: 1 }).weeks.length;
    return { y, m, sun, mon, start: WEEKDAYS[new Date(y, m - 1, 1).getDay()]! };
  });
  const six = (k: "sun" | "mon") => rows.filter((r) => r[k] === 6).map((r) => `${monthNumberToName(r.m)} ${r.y}`);
  const list = (a: string[]) => (a.length ? a.join(", ") : "none");
  return `
  <h2>The short answer</h2>
  <p>Print a Monday-start calendar if you plan around the working or school week and want Saturday and Sunday side by side at the end of each row. Print a Sunday-start calendar if the calendars around you (wall calendars sold in the United States, a phone set to US defaults, a church or sports schedule) put Sunday first, because a sheet that disagrees with them is the one you misread.</p>
  <p>The dates are the same on both. Only the column a date sits in changes, and that is what causes mistakes: on a Monday-start sheet the first column is Monday, so a glance that expects Sunday there lands a day early.</p>
  <h2>Where each layout is the norm</h2>
  <p>The international date standard, ISO 8601, counts Monday as day one of the week and numbers weeks on that basis. That is why week numbers on a payroll or project plan follow Monday-start weeks, and why most of Europe prints calendars that way. In the United States and Canada the printed calendar usually starts on Sunday. Our <a href="/calendar-tools/week-number/">week number table</a> shows both counts for today.</p>
  <h2>How many rows each month needs</h2>
  <p>A month fits in four, five or six rows depending on the weekday it starts on, and the answer differs between the two layouts. A six-row month has shorter boxes on the same sheet of paper, so if you write a lot, pick the layout that keeps the month to five rows.</p>
  ${table("Rows each month needs in a Sunday-start and a Monday-start calendar", ["Month", "Starts on", "Sunday start", "Monday start"], rows.map((r) => [monthLink(r.y, r.m, today), r.start, `${r.sun} rows`, `${r.mon} rows`]))}
  <p>In the next twelve months, six rows are needed on a Sunday-start sheet for: ${list(six("sun"))}. On a Monday-start sheet: ${list(six("mon"))}.</p>
  <h2>Choose Monday start when</h2>
  <ul>
    <li>You plan work shifts, lessons or deliveries from Monday to Friday and treat the weekend as one block.</li>
    <li>You use week numbers, which are counted from Monday.</li>
    <li>Your phone or work calendar already shows Monday first, so paper and screen match.</li>
  </ul>
  <h2>Choose Sunday start when</h2>
  <ul>
    <li>The household's other calendars start on Sunday and several people read the same sheet.</li>
    <li>Your week has a fixed Sunday commitment that you want at the front of the row.</li>
    <li>You are copying dates from a US school, league or pay calendar laid out Sunday first.</li>
  </ul>
  <h2>Which files to print</h2>
  <p>Every monthly design comes in both layouts: open a month, choose a Monday start and download. The <a href="/printable-monday-start-calendar.html">Monday-start page</a> has this month and next month ready, the <a href="/blank-calendars.html#template-monday-start">undated Monday blank</a> works for any month, and the <a href="/printable-weekly-calendar.html#template-monday-start">Monday weekly planner</a> matches it for the week.</p>`;
}

export function fiscalGuideBody(today: Date): string {
  const y = today.getFullYear(), t = utc(y, today.getMonth() + 1, today.getDate());
  // US federal fiscal year: Oct 1 to Sep 30, named for the year it ends in.
  const fy = t >= utc(y, 10, 1) ? y + 1 : y;
  const ukStart = t >= utc(y, 4, 6) ? y : y - 1, school = schoolYearStartYear(today);
  const span = (a: number, b: number) => [short(a), short(b), `${Math.round((b - a) / DAY) + 1}`];
  const kinds = [
    ["Calendar year", ...span(utc(y, 1, 1), utc(y, 12, 31))],
    [`US federal government, fiscal year ${fy}`, ...span(utc(fy - 1, 10, 1), utc(fy, 9, 30))],
    [`UK tax year ${ukStart} to ${ukStart + 1}`, ...span(utc(ukStart, 4, 6), utc(ukStart + 1, 4, 5))],
    [`School year sheet ${school}-${school + 1}`, ...span(utc(school, 8, 1), utc(school + 1, 7, 31))],
  ];
  const quarters = [[fy - 1, 10, fy - 1, 12], [fy, 1, fy, 3], [fy, 4, fy, 6], [fy, 7, fy, 9]].map(([y1, m1, y2, m2], i) => {
    const a = utc(y1!, m1!, 1), b = Date.UTC(y2!, m2!, 0);
    return [`Q${i + 1}`, short(a), short(b), `${Math.round((b - a) / DAY) + 1}`, `${weekdaysBetween(a - DAY, b)}`];
  });
  return `
  <h2>The difference in one line</h2>
  <p>A calendar year always runs from January 1 to December 31. A fiscal year is any other twelve-month period an organization uses for its budget and accounts, so it starts in one calendar year and ends in the next, and it is usually named for the year it ends in.</p>
  <h2>Common years and their dates</h2>
  ${table("Calendar year, US federal fiscal year, UK tax year and school year dates", ["Kind of year", "First day", "Last day", "Days"], kinds)}
  <p>The United States government's fiscal year runs from October 1 of one calendar year through September 30 of the next (<a href="https://www.usa.gov/federal-budget-process" rel="noopener">USA.gov, federal budget process</a>), so fiscal year ${fy} began on ${short(utc(fy - 1, 10, 1))}. The United Kingdom's tax year for individuals runs from April 6 to April 5 (<a href="https://www.gov.uk/income-tax-rates" rel="noopener">GOV.UK</a>). The school-year row is the span our printable overview covers, August to July; a district's own first and last days are set locally.</p>
  <h2>Quarters of US fiscal year ${fy}</h2>
  <p>Quarter one of a fiscal year is its first three months, not January to March. For the federal year that puts Q1 in the autumn.</p>
  ${table(`Quarters of US federal fiscal year ${fy}`, ["Quarter", "First day", "Last day", "Days", "Weekdays"], quarters)}
  <p>Weekdays are Monday to Friday and include public holidays. To count working days between two of your own dates, use the <a href="/calendar-tools/business-days/">business days calculator</a>.</p>
  <h2>Fiscal years for a business</h2>
  <p>For US tax purposes the Internal Revenue Service (IRS) defines a fiscal year as twelve consecutive months ending on the last day of any month except December. It also allows a 52-53-week year that always ends on the same weekday, which some retailers use so that every year closes on, say, a Saturday. The rules on who may adopt or change a tax year are in <a href="https://www.irs.gov/publications/p538" rel="noopener">IRS Publication 538</a>; this page is a calendar guide and not tax advice.</p>
  <h2>Printing a calendar for a fiscal year</h2>
  <ul>
    <li><strong>One page for the whole year:</strong> print the <a href="/printable-blank-yearly-calendar.html">blank yearly calendar</a> and write your fiscal months into the twelve boxes in order, starting with month one.</li>
    <li><strong>A dated wall set:</strong> print the twelve monthly sheets of your span. For federal fiscal year ${fy} that is ${monthLink(fy - 1, 10, today)} through ${monthLink(fy, 9, today)}.</li>
    <li><strong>An academic year:</strong> the <a href="/printable-school-calendar.html">school year calendar</a> already runs August to July on one sheet.</li>
    <li><strong>A calendar year:</strong> the <a href="/printable-calendars.html">yearly calendar</a> covers January to December.</li>
  </ul>
  <p>Mark the first day of each quarter and your closing dates by hand: they depend on your own year, which is why no printed fiscal calendar fits everyone.</p>`;
}

export function classroomGuideBody(today: Date): string {
  const start = schoolYearStartYear(today);
  const months: [number, number][] = Array.from({ length: 12 }, (_, i) => (i < 5 ? [start, 8 + i] : [start + 1, i - 4]));
  const federal = [...holidaysForYear(start, { federalOnly: true }), ...holidaysForYear(start + 1, { federalOnly: true })];
  let total = 0;
  const rows = months.map(([y, m]) => {
    const days = new Date(y, m, 0).getDate(), wd = weekdaysBetween(utc(y, m, 1) - DAY, utc(y, m, days));
    total += wd;
    const hol = federal.filter((h) => h.year === y && h.month === m).map((h) => `${esc(h.name)} (${WEEKDAYS[h.date.getDay()]!.slice(0, 3)} ${h.day})`).join(", ");
    return [monthLink(y, m, today), `${days}`, `${wd}`, hol || "None"];
  });
  return `
  <h2>What to print for a classroom</h2>
  <p>Three sheets cover most rooms: one year overview for the wall, one month sheet that changes each month, and a weekly sheet for routines. All of them are free to print and photocopy for your class.</p>
  <ul>
    <li><strong>The year on one page:</strong> the <a href="/printable-school-calendar.html">${start}-${start + 1} school year calendar</a> runs August to July. Highlight breaks, report-card dates and testing windows from your district's calendar.</li>
    <li><strong>The current month, large:</strong> a monthly sheet in the Minimal design prints clean on a copier and leaves the boxes free for writing. Use the Planner design if you want a notes column for the week's objectives.</li>
    <li><strong>The week:</strong> the <a href="/printable-weekly-calendar.html">weekly planner</a> has a habit tracker layout that works as a class jobs or reading log.</li>
  </ul>
  <h2>Weekdays in each month of ${start}-${start + 1}</h2>
  <p>Use this table to pace a unit or split a reading list. It counts Monday to Friday in each month and lists the US federal holidays that fall in it. It does not know your district's breaks, teacher work days or weather days, so subtract those to get instructional days.</p>
  ${table(`Weekdays and federal holidays in each month of the ${start}-${start + 1} school year`, ["Month", "Days", "Weekdays", "Federal holidays"], rows)}
  <p>August to July has ${total} weekdays in all. A holiday that falls on a Saturday or Sunday is usually observed on the nearest weekday; your district's calendar has the day schools close.</p>
  <h2>Calendar time with younger students</h2>
  <ul>
    <li>Print the <a href="/blank-calendars.html#template-kids">kids blank calendar</a> and let students write the month name, the weekday letters and the numbers themselves. Writing the grid teaches the pattern better than reading a finished one.</li>
    <li>Circle today, cross off yesterday, and count on to the next event: "How many days until the field trip?" The <a href="/days-until/">days-until pages</a> give the answer for holidays.</li>
    <li>Keep the same layout all year. Switching between Sunday-start and Monday-start sheets confuses children who are still learning the order of the days; the <a href="/guides/monday-start-calendar.html">Monday or Sunday start guide</a> explains the choice.</li>
  </ul>
  <h2>Sheets to send home</h2>
  <p>A month sheet with test dates, spirit days and early dismissals filled in is the handout families keep on the fridge. Fill in one copy by hand or type on the PNG, then photocopy. The Minimal design uses the least toner. For families who read dates day-first, write the month name in words on anything you add.</p>
  <h2>Holidays and observances</h2>
  <p>The Holidays design prints US holidays in the date boxes. The full list with dates is on the <a href="/holidays/">US holidays page</a>, with separate lists for the <a href="/uk-holidays/">United Kingdom</a> and <a href="/canada-holidays/">Canada</a>. School closures are decided by each district, so check its calendar before you mark a day off.</p>
  <h2>Printing a class set</h2>
  <p>Print one copy from the PDF at actual size, check that the grid is not clipped, then photocopy it. Copying a master is cheaper per page than printing thirty originals on an inkjet. The <a href="/print-guide.html">print guide</a> covers paper size and scaling.</p>`;
}

/** Sections of the print guide that follow the numbered basics. */
export function printGuideExtra(today: Date): string {
  const pct = (n: number) => `${(Math.floor(n * 1000) / 10).toFixed(1)}%`;
  // Largest scale at which one sheet fits inside the other, before the printer's own margins.
  const letter = [215.9, 279.4] as const, a4 = [210, 297] as const;
  const fit = (src: readonly [number, number], dst: readonly [number, number]) => Math.min(dst[0] / src[0], dst[1] / src[1]);
  const y = resolvePlanningYear(today);
  return `
  <h2>Letter and A4 side by side</h2>
  <p>US Letter is wider and A4 is taller, so a file made for one never fills the other exactly. Download the file made for your paper. If you only have the other one, print it at the scale below and it will fit with a slightly larger margin on two sides.</p>
  ${table("US Letter and A4 paper sizes and the scale that fits one on the other", ["Paper", "Inches", "Millimeters", "Fits on the other size at"], [
    ["US Letter", "8.5 × 11", "215.9 × 279.4", `${pct(fit(letter, a4))} on A4`],
    ["A4", "8.27 × 11.69", "210 × 297", `${pct(fit(a4, letter))} on Letter`],
  ])}
  <p>These are the largest scales before your printer's own margin. Most home printers cannot print the outer few millimeters of a sheet, so "Fit to printable area" picks a slightly smaller number for you.</p>
  <h2>Settings in the print dialog</h2>
  <ul>
    <li><strong>Scale:</strong> "Actual size" or 100% keeps the grid as drawn. Choose "Fit" only if an edge is cut off.</li>
    <li><strong>Paper size:</strong> set it to match the file and the paper in the tray. A Letter file sent to a printer set to A4 is the usual reason a calendar prints off-center.</li>
    <li><strong>Orientation:</strong> leave it on automatic. The Landscape design and the landscape year poster are wide pages; the rest are tall.</li>
    <li><strong>Two-sided:</strong> turn it off for wall sheets. For a booklet of twelve months, choose two-sided with "flip on long edge".</li>
    <li><strong>Headers and footers:</strong> if you print from the browser instead of the PDF, switch these off so the date and address do not print on the sheet.</li>
  </ul>
  <h2>Paper that suits a calendar</h2>
  <ul>
    <li><strong>Everyday copy paper</strong> (20 lb, about 75 gsm) is fine for a month you will replace.</li>
    <li><strong>Heavier paper</strong> (28 to 32 lb, about 105 to 120 gsm) stops marker ink from showing through and hangs flatter on a wall.</li>
    <li><strong>Cardstock</strong> (65 lb cover, about 176 gsm) suits a year poster or a desk calendar. Check your printer's manual for the heaviest paper it feeds.</li>
    <li>Matte paper takes pencil and pen. Glossy photo paper looks sharp but most pens smear on it.</li>
  </ul>
  <h2>When the print looks wrong</h2>
  <ul>
    <li><strong>An edge is cut off:</strong> switch from "Actual size" to "Fit", and turn off borderless printing.</li>
    <li><strong>The calendar is small with wide margins:</strong> the paper size in the dialog does not match the file. Pick the matching size or download the other file.</li>
    <li><strong>Lines look gray or broken:</strong> turn off draft mode for the final copy, or print the PDF instead of the PNG.</li>
    <li><strong>Colors look dull:</strong> set the paper type in the dialog to the paper you loaded; plain-paper mode uses less ink.</li>
    <li><strong>It prints on two pages:</strong> the scale is above 100%. Set it back to "Fit".</li>
  </ul>
  <h2>Printing bigger than your printer</h2>
  <p>A copy shop can print the PDF on tabloid (11 × 17 in) or A3 paper; the grid and the type in the PDF are vector, so the lines stay sharp at any size. At home, the "Poster" option in Adobe Acrobat Reader's print dialog splits one page across several sheets that you trim and tape together. The <a href="/printable-calendars.html">${y} yearly calendar</a> is the sheet most people enlarge.</p>`;
}
