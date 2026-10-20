/**
 * Second batch of one-page date printables (2027 holidays, Florida school calendars, admission tests).
 * Weekdays are computed from ISO dates so they can never disagree with the date.
 * Sources are named on each sheet. Usage: pnpm fc news-datelists2
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { list, type Row } from "./datelists.js";
import { renderPrintables } from "./printables.js";

const AP = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const p = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y!, m! - 1, d!)); };
/** "2027-01-01" → "Jan. 1" (year added when it differs from `y`). */
export const ap = (iso: string, y?: number) => { const t = p(iso); return `${AP[t.getUTCMonth()]} ${t.getUTCDate()}${y && t.getUTCFullYear() !== y ? `, ${t.getUTCFullYear()}` : ""}`; };
export const dow = (iso: string) => DOW[p(iso).getUTCDay()]!;
/** Single date or a range "a..b". */
const r = (when: string, what: string, kind?: Row["kind"], y?: number): Row => {
  const [a, b] = when.split("..");
  if (!b) return { date: ap(a!, y), day: dow(a!), what, kind };
  const sa = p(a!), sb = p(b);
  const date = sa.getUTCMonth() === sb.getUTCMonth() && sa.getUTCFullYear() === sb.getUTCFullYear() ? `${ap(a!, y)}–${sb.getUTCDate()}` : `${ap(a!, y)}–${ap(b, y)}`;
  return { date, day: `${dow(a!)}–${dow(b)}`, what, kind };
};

export const FEDERAL_2027: [string, string, string?][] = [
  ["2027-01-01", "New Year's Day"],
  ["2027-01-18", "Birthday of Martin Luther King, Jr."],
  ["2027-02-15", "Washington's Birthday (Presidents' Day)"],
  ["2027-05-31", "Memorial Day"],
  ["2027-06-18", "Juneteenth National Independence Day", "observed; June 19 is a Saturday"],
  ["2027-07-05", "Independence Day", "observed; July 4 is a Sunday"],
  ["2027-09-06", "Labor Day"],
  ["2027-10-11", "Columbus Day"],
  ["2027-11-11", "Veterans Day"],
  ["2027-11-25", "Thanksgiving Day"],
  ["2027-12-24", "Christmas Day", "observed; Dec. 25 is a Saturday"],
  ["2027-12-31", "New Year's Day 2028", "observed; Jan. 1, 2028 is a Saturday"],
];
export const NYSE_2027: [string, string, string?][] = [
  ["2027-01-01", "New Year's Day"], ["2027-01-18", "Martin Luther King, Jr. Day"], ["2027-02-15", "Washington's Birthday"],
  ["2027-03-26", "Good Friday"], ["2027-05-31", "Memorial Day"], ["2027-06-18", "Juneteenth (observed)"],
  ["2027-07-05", "Independence Day (observed)"], ["2027-09-06", "Labor Day"], ["2027-11-25", "Thanksgiving Day"],
  ["2027-12-24", "Christmas Day (observed)"],
];
export const CANADA_2027: [string, string][] = [
  ["2027-01-01", "New Year's Day"], ["2027-03-26", "Good Friday"], ["2027-05-24", "Victoria Day"], ["2027-07-01", "Canada Day"],
  ["2027-09-06", "Labour Day"], ["2027-09-30", "National Day for Truth and Reconciliation"], ["2027-10-11", "Thanksgiving Day"],
  ["2027-11-11", "Remembrance Day"], ["2027-12-25", "Christmas Day"], ["2027-12-26", "Boxing Day"],
];
export const MCAT_2027: [string, string, string, string][] = [
  // test date, 60-day deadline, 10-day deadline, score release (AAMC U.S. testing calendar)
  ["2027-01-15", "2026-11-16", "2027-01-05", "2027-02-16"], ["2027-01-16", "2026-11-17", "2027-01-06", "2027-02-16"],
  ["2027-01-21", "2026-11-22", "2027-01-11", "2027-02-23"], ["2027-01-29", "2026-11-30", "2027-01-19", "2027-03-02"],
  ["2027-01-30", "2026-12-01", "2027-01-20", "2027-03-02"], ["2027-02-12", "2026-12-14", "2027-02-02", "2027-03-16"],
  ["2027-03-06", "2027-01-05", "2027-02-24", "2027-04-06"], ["2027-03-19", "2027-01-18", "2027-03-09", "2027-04-20"],
  ["2027-04-09", "2027-02-08", "2027-03-30", "2027-05-11"], ["2027-04-10", "2027-02-09", "2027-03-31", "2027-05-11"],
  ["2027-04-16", "2027-02-15", "2027-04-06", "2027-05-18"], ["2027-04-17", "2027-02-16", "2027-04-07", "2027-05-18"],
  ["2027-05-01", "2027-03-02", "2027-04-21", "2027-06-02"], ["2027-05-07", "2027-03-08", "2027-04-27", "2027-06-08"],
  ["2027-05-08", "2027-03-09", "2027-04-28", "2027-06-08"], ["2027-05-13", "2027-03-14", "2027-05-03", "2027-06-15"],
  ["2027-05-14", "2027-03-15", "2027-05-04", "2027-06-15"], ["2027-05-21", "2027-03-22", "2027-05-11", "2027-06-23"],
  ["2027-05-29", "2027-03-30", "2027-05-19", "2027-06-29"], ["2027-06-11", "2027-04-12", "2027-06-01", "2027-07-13"],
  ["2027-06-12", "2027-04-13", "2027-06-02", "2027-07-13"], ["2027-06-25", "2027-04-26", "2027-06-15", "2027-07-27"],
  ["2027-06-26", "2027-04-27", "2027-06-16", "2027-07-27"], ["2027-07-09", "2027-05-10", "2027-06-29", "2027-08-10"],
  ["2027-07-10", "2027-05-11", "2027-06-30", "2027-08-10"], ["2027-07-23", "2027-05-24", "2027-07-13", "2027-08-24"],
  ["2027-07-30", "2027-05-31", "2027-07-20", "2027-08-31"], ["2027-08-14", "2027-06-15", "2027-08-04", "2027-09-14"],
  ["2027-08-20", "2027-06-21", "2027-08-10", "2027-09-21"], ["2027-08-21", "2027-06-22", "2027-08-11", "2027-09-21"],
  ["2027-08-28", "2027-06-29", "2027-08-18", "2027-09-28"], ["2027-09-02", "2027-07-04", "2027-08-23", "2027-10-05"],
  ["2027-09-03", "2027-07-05", "2027-08-24", "2027-10-05"], ["2027-09-10", "2027-07-12", "2027-08-31", "2027-10-12"],
  ["2027-09-11", "2027-07-13", "2027-09-01", "2027-10-12"],
];
/** Test dates offered only at select U.S. centers. */
export const MCAT_SELECT = new Set(["2027-01-30", "2027-05-14", "2027-07-09", "2027-08-28"]);

const PBC: Row[] = [
  r("2026-08-10", "First day of school for students", "key"),
  r("2026-09-07", "Labor Day, no school", "off"),
  r("2026-09-21", "Fall Holiday, no school", "off"),
  r("2026-10-12", "Teacher duty/PD day, no students", "half"),
  r("2026-11-03", "Teacher PD/duty day, no students", "half"),
  r("2026-11-11", "Fall Holiday (Veterans Day), no school", "off"),
  r("2026-11-23..2026-11-27", "Thanksgiving Holiday, no school", "break"),
  r("2026-12-21..2027-01-01", "Winter Break, no school", "break", 2026),
  r("2027-01-04", "Teacher duty/PD day, no students", "half"),
  r("2027-01-18", "M. L. King's Birthday, no school", "off"),
  r("2027-02-15", "Teacher PD/duty day, no students", "half"),
  r("2027-03-10", "Spring Holiday, no school", "off"),
  r("2027-03-22..2027-03-26", "Spring Break, no school", "break"),
  r("2027-03-29", "Teacher duty/PD day, no students", "half"),
  r("2027-05-27", "Last day of school for students", "key"),
  r("2027-05-31", "Memorial Day", "off"),
];
const MDCPS: Row[] = [
  r("2026-08-13", "First day of school", "key"),
  r("2026-09-07", "Labor Day, holiday", "off"),
  r("2026-09-21", "Teacher planning day, no students", "half"),
  r("2026-10-16", "End of first grading period"),
  r("2026-11-03", "District-wide professional learning day, no students", "half"),
  r("2026-11-11", "Veterans' Day, holiday", "off"),
  r("2026-11-23..2026-11-27", "Fall recess (Nov. 23-25), Thanksgiving (Nov. 26), recess (Nov. 27)", "break"),
  r("2026-12-18", "Teacher planning day, no students", "half"),
  r("2026-12-21..2027-01-01", "Winter recess", "break", 2026),
  r("2027-01-14", "End of second grading period"),
  r("2027-01-15", "Teacher planning day, no students", "half"),
  r("2027-01-18", "Dr. Martin Luther King, Jr.'s birthday, holiday", "off"),
  r("2027-02-15", "All Presidents Day, holiday", "off"),
  r("2027-03-10", "Teacher planning day, no students", "half"),
  r("2027-03-19", "End of third grading period"),
  r("2027-03-22..2027-03-26", "Spring recess", "break"),
  r("2027-03-29", "Teacher planning day, no students", "half"),
  r("2027-05-31", "Memorial Day, holiday", "off"),
  r("2027-06-03", "Last day of school", "key"),
];
const SATACT: Row[] = [
  { ...r("2026-11-07", "SAT · register by Oct. 23, late by Oct. 27"), kind: "key" },
  { ...r("2026-12-05", "SAT · register by Nov. 20, late by Nov. 24"), kind: "key" },
  r("2026-12-12", "ACT · register by Nov. 6, late by Nov. 29, standby by Dec. 7"),
  r("2027-02-27", "ACT · register by Jan. 22, late by Feb. 9, standby by Feb. 22"),
  { ...r("2027-03-06", "SAT · register by Feb. 19, late by Feb. 23"), kind: "key" },
  r("2027-04-10", "ACT · register by March 5, late by March 23, standby by April 5"),
  { ...r("2027-05-01", "SAT · register by April 16, late by April 20"), kind: "key" },
  { ...r("2027-06-05", "SAT · register by May 21, late by May 25"), kind: "key" },
  r("2027-06-12", "ACT · register by May 7, late by May 25, standby by June 7"),
  r("2027-07-10", "ACT · register by June 4, late by June 22, standby by July 5"),
];
const LSAT: Row[] = [
  r("2026-11-11..2026-11-14", "November LSAT · registration closed Oct. 1 · scores Dec. 2", "key"),
  r("2027-01-13..2027-01-16", "January LSAT · register by Dec. 1, 2026 · scores Feb. 3", "key"),
  r("2027-02-12..2027-02-13", "February LSAT · register by Dec. 29, 2026 · scores March 3", "key"),
  r("2027-02-18..2027-02-20", "February LSAT, Puerto Rico · register by Jan. 5 · scores March 10"),
  r("2027-04-08..2027-04-10", "April LSAT · register by Feb. 25 · scores April 28", "key"),
  r("2027-06-09..2027-06-12", "June LSAT · register by April 29 · scores June 30", "key"),
];

function mcatSheet(fonts: string): string {
  const rows = MCAT_2027.map(([t, d60, d10, s]) => `<tr${MCAT_SELECT.has(t) ? ' class="sel"' : ""}><td class="d">${dow(t)}, ${ap(t)}${MCAT_SELECT.has(t) ? "*" : ""}</td><td>${ap(d60, 2027)}</td><td>${ap(d10)}</td><td>${ap(s)}</td></tr>`);
  const half = Math.ceil(rows.length / 2);
  const tbl = (x: string[]) => `<table><thead><tr><th>Test date</th><th>60-day deadline</th><th>10-day deadline</th><th>Scores</th></tr></thead><tbody>${x.join("")}</tbody></table>`;
  const css = `
  .mc{padding:30px 32px 0}
  .mc h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#0f4c81}
  .mc .sub{margin:4px 0 12px;font-size:11px;color:#37474f}
  .mc .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .mc table{width:100%;border-collapse:collapse;font-size:10.2px;font-variant-numeric:tabular-nums}
  .mc th{background:#0f4c81;color:#fff;font-family:Sora;font-size:8.8px;padding:5px;text-align:left}
  .mc td{padding:5.4px 5px;border-bottom:1px solid #e3e8ee}
  .mc td.d{font-weight:700}
  .mc tr.sel td{background:#f1f5f9}
  .mc .note{margin-top:10px;font-size:9.4px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page mc"><h1>MCAT 2027 Test Dates and Deadlines (U.S.)</h1>
    <p class="sub">35 test dates, Jan. 15 to Sept. 11, 2027 · registration opens Oct. 20-22, 2026 by region, noon ET · deadlines 11:59 p.m. local test-center time</p>
    <div class="cols">${tbl(rows.slice(0, half))}${tbl(rows.slice(half))}</div>
    <p class="note">* Offered only at select U.S. test centers. The 30-day deadline falls between the two shown. Scores are released by 5 p.m. ET. Source: AAMC U.S. MCAT testing calendar; confirm in the MCAT Registration System before you pay.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/mcat-2027-test-dates-registration-opens-october-20/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildDateList2Downloads(): Promise<void> {
  const fonts = await fontFaces();
  const fed: Row[] = FEDERAL_2027.map(([d, n, note]) => ({ ...r(d, note ? `${n} (${note})` : n, note ? "break" : "off", 2027) }));
  const nyse: Row[] = [...NYSE_2027.map(([d, n]) => r(d, `Closed: ${n}`, "off")), { ...r("2027-11-26", "Early close at 1 p.m. ET (day after Thanksgiving)"), kind: "half" }];
  const can: Row[] = CANADA_2027.map(([d, n]) => r(d, n, ["2027-12-25", "2027-12-26"].includes(d) ? "break" : "off"));
  await renderPrintables("federal-holidays-2027", [{ slug: "federal-holidays-2027", size: LETTER, html: list(fonts, { title: "Federal Holidays 2027", sub: "11 holidays in the 2027 schedule, plus New Year's Day 2028 observed on Friday, Dec. 31, 2027 · gold rows are observed days", accent: "#1e3a8a", rows: fed, note: "Source: U.S. Office of Personnel Management 2027 and 2028 holiday schedules. When a holiday falls on a Saturday, most federal employees get the Friday before; on a Sunday, the Monday after (5 U.S.C. 6103(b); Executive Order 11582).", legend: [["off", "Federal holiday"], ["break", "Observed on a nearby weekday"]], site: "freshcalendars.com/news/federal-holidays-2027-observed-dates-list/" }) }]);
  await renderPrintables("stock-market-holidays-2027", [{ slug: "nyse-holidays-2027", size: LETTER, html: list(fonts, { title: "Stock Market Holidays 2027 (NYSE)", sub: "10 full-day closures and one early close · NYSE, NYSE American, NYSE Arca, NYSE National and NYSE Texas", accent: "#0f766e", rows: nyse, note: "Source: NYSE Group holiday and early closings calendar (Dec. 23, 2025). Because Jan. 1, 2028 is a Saturday, NYSE observes no New Year's holiday for it, so markets are open on Friday, Dec. 31, 2027.", legend: [["off", "Markets closed"], ["half", "Early close"]], site: "freshcalendars.com/news/stock-market-holidays-2027-nyse-closed-dates/" }) }]);
  await renderPrintables("canada-holidays-2027", [{ slug: "canada-general-holidays-2027", size: LETTER, html: list(fonts, { title: "Canada General Holidays 2027 (Federal)", sub: "The 10 paid general holidays under the Canada Labour Code · provinces and territories set their own lists", accent: "#b91c1c", rows: can, note: "Source: Government of Canada, federal labour standards. Christmas Day and Boxing Day fall on a weekend in 2027; for employees not scheduled to work, the Code gives a holiday with pay on the working day immediately before or after.", legend: [["off", "General holiday"], ["break", "Falls on a weekend"]], site: "freshcalendars.com/news/canada-statutory-holidays-2027-federal-general-holidays/" }) }]);
  await renderPrintables("palm-beach-schools-2026-27", [{ slug: "palm-beach-county-school-calendar-2026-27", size: LETTER, html: list(fonts, { title: "Palm Beach County Schools Calendar 2026–27", sub: "School District of Palm Beach County · first day Monday, Aug. 10, 2026 · last day Thursday, May 27, 2027", accent: "#0e7490", rows: PBC, note: "Source: School District of Palm Beach County, 2026-2027 key dates. District offices also close Friday, March 26, 2027 and on Fridays in June 2027.", site: "freshcalendars.com/news/palm-beach-county-school-calendar-2026-27/" }) }]);
  await renderPrintables("miami-dade-schools-2026-27", [{ slug: "miami-dade-school-calendar-2026-27", size: LETTER, html: list(fonts, { title: "Miami-Dade County Public Schools Calendar 2026–27", sub: "Elementary and secondary · first day Thursday, Aug. 13, 2026 · last day Thursday, June 3, 2027 · 180 student days", accent: "#1d4ed8", rows: MDCPS, note: "Source: M-DCPS 2026-2027 school calendar, elementary and secondary. Elementary (grades 2-5) and K-8 (grades 2-8) students are released one hour early every Wednesday.", site: "freshcalendars.com/news/miami-dade-school-calendar-2026-27-breaks/" }) }]);
  await renderPrintables("mcat-2027", [{ slug: "mcat-2027-test-dates", size: LETTER, html: mcatSheet(fonts) }]);
  await renderPrintables("sat-act-2026-27", [{ slug: "sat-act-test-dates-2026-27", size: LETTER, html: list(fonts, { title: "SAT and ACT Test Dates 2026–27", sub: "Remaining U.S. national test dates from November 2026 · green rows are SAT, white rows ACT", accent: "#7c3aed", rows: SATACT, note: "Sources: College Board SAT dates and deadlines; ACT national test dates. SAT deadlines are 11:59 p.m. ET; ACT deadlines 11:59 p.m. CT. Students borrowing a College Board device must register at least 30 days before test day.", legend: [["key", "SAT"], ["plain", "ACT"]], site: "freshcalendars.com/news/sat-act-test-dates-2026-27-registration-deadlines/" }) }]);
  await renderPrintables("lsat-2026-27", [{ slug: "lsat-test-dates-2026-27", size: LETTER, html: list(fonts, { title: "LSAT Test Dates 2026–27", sub: "U.S. and Canada administrations from November 2026 to June 2027 · all times Eastern", accent: "#334155", rows: LSAT, note: "Source: LSAC test dates, deadlines and score release. The registration deadline is usually also the last day for a free test date change or a full refund. Dates are subject to change.", legend: [["key", "U.S. and Canada"], ["plain", "Puerto Rico"]], site: "freshcalendars.com/news/lsat-test-dates-2026-27-registration-deadlines/" }) }]);
}
