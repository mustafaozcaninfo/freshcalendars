/**
 * Ramadan 2027 printables for /news/ (four independent Fresh Calendars templates).
 *
 *   1. ramadan-calendar-2027          — Ramadan day grid, Feb. 8–Mar. 8, last ten nights and Eid marked
 *   2. ramadan-timetable-new-york-2027 — suhoor (Fajr) and iftar (Maghrib) times, ISNA method
 *   3. ramadan-daily-tracker-2027     — fast, five prayers, taraweeh, Quran juz and charity check boxes
 *   4. islamic-calendar-2027          — Hijri month starts in 2027 and key Islamic dates
 *
 * Dates follow the Fiqh Council of North America calculated calendar (identical to Umm al-Qura
 * for these months). Times come from packages/generator/data/ramadan-2027-new-york.json.
 * Usage: pnpm fc news-ramadan
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { LETTER, doc, fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";

const OUT_PUBLIC = path.join(ROOT, "apps/news/public/downloads/ramadan-calendar-2027");
const OUT_ASSETS = path.join(ROOT, "apps/news/src/assets/news/ramadan-calendar-2027");
const SITE = "freshcalendars.com/news/ramadan-2027-calendar-dates-timetable/";
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 1 Ramadan 1448 = Mon Feb. 8, 2027; 29 days; 1 Shawwal (Eid al-Fitr) = Tue Mar. 9 (FCNA).
const START = Date.UTC(2027, 1, 8);
const FAST_DAYS = 29;
const dayDate = (n: number) => new Date(START + (n - 1) * 86_400_000);
const fmt = (d: Date) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
const to12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, "0")}`; };

const crescent = (size: number, color: string) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="M62 8a42 42 0 1 0 30 70A34 34 0 1 1 62 8z" fill="${color}"/><circle cx="78" cy="30" r="6" fill="${color}"/></svg>`;

// ── 1. Ramadan calendar grid ───────────────────────────────────────────────
function calendarGrid(fonts: string): string {
  const cells: string[] = [];
  const lead = dayDate(1).getUTCDay(); // Monday → 1 blank (Sunday Feb. 7)
  cells.push(`<div class="c pre"><b>Feb 7</b><span>Sunday</span><em>Sha'ban 30 · moon sighting evening</em></div>`.repeat(lead ? 1 : 0));
  for (let i = 1; i < lead; i++) cells.push(`<div class="c empty"></div>`);
  for (let n = 1; n <= FAST_DAYS; n++) {
    const d = dayDate(n);
    // Islamic nights begin at sunset: odd night N starts on the evening of Ramadan day N−1.
    const last10 = n >= 20, oddEve = n >= 20 && n <= 28 && n % 2 === 0;
    const eve = oddEve ? `<em class="odd">★ Tonight: ${n + 1}${n + 1 === 21 ? "st" : n + 1 === 23 ? "rd" : "th"} night${n + 1 === 27 ? " (Laylat al-Qadr)" : ""}</em>` : "";
    cells.push(`<div class="c${last10 ? " ten" : ""}"><span class="r">${n}</span><b>${fmt(d)}</b><span>${DOW[d.getUTCDay()]}</span>${eve}</div>`);
  }
  cells.push(`<div class="c eid"><span class="r">Eid</span><b>Mar 9</b><span>Tuesday</span><em>Eid al-Fitr · 1 Shawwal</em></div>`);
  while (cells.length % 7) cells.push(`<div class="c empty"></div>`);
  const css = `
  .r1{padding:38px 40px 0;background:#fbf7ec}
  .r1 header{display:flex;align-items:center;gap:16px;margin-bottom:8px}
  .r1 h1{font-family:Sora;font-weight:800;font-size:38px;margin:0;color:#0b4f3c;line-height:1.05}
  .r1 .sub{margin:2px 0 0;font-size:12.5px;color:#37474f}
  .r1 .dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:14px 0 6px}
  .r1 .dow span{text-align:center;font-family:Sora;font-weight:700;font-size:11px;color:#0b4f3c;text-transform:uppercase;letter-spacing:.06em}
  .r1 .grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:150px;gap:7px}
  .r1 .c{background:#fff;border:1.5px solid #d6e6dc;border-radius:10px;padding:7px 8px;position:relative}
  .r1 .c.empty{background:transparent;border:1.5px dashed #e8e1cc}
  .r1 .c .r{display:block;font-family:Sora;font-weight:800;font-size:30px;color:#0b4f3c;line-height:1}
  .r1 .c b{display:block;font-size:13px;margin-top:6px;color:#1d2a3a}
  .r1 .c span:not(.r){font-size:10.5px;color:#5a6b75}
  .r1 .c span:not(.r){display:block}
  .r1 .c em{display:block;margin-top:8px;font-style:normal;font-size:9.8px;line-height:1.25;font-weight:700}
  .r1 .c.ten{border-color:#c9a227;background:#fffaf0}
  .r1 .c .odd{color:#8a6b00}
  .r1 .c.pre{background:#f1efe6;border-color:#e3dcc4}.r1 .c.pre b{font-size:15px}.r1 .c.pre em{color:#5a6b75;font-weight:500}
  .r1 .c.eid{background:#0b4f3c;border-color:#0b4f3c}.r1 .c.eid *{color:#fff!important}.r1 .c.eid .r{font-size:22px;color:#fccc00!important}
  .r1 .legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:10.5px;color:#37474f}
  .r1 .legend i{display:inline-block;width:14px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:5px}
  .r1 .note{margin-top:8px;font-size:10px;color:#5a6b75}`;
  const page = `<section class="page r1">
    <header>${crescent(64, "#c9a227")}<div><h1>Ramadan 2027 Calendar</h1><p class="sub">Ramadan 1448 AH · Monday, Feb. 8 to Monday, Mar. 8, 2027 · Eid al-Fitr Tuesday, Mar. 9</p></div></header>
    <div class="dow">${DOW.map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="grid">${cells.join("")}</div>
    <div class="legend"><span><i style="background:#fffaf0;border:1.5px solid #c9a227"></i>Last ten nights (from sunset Feb. 27)</span><span>★ An odd night of the last ten begins that evening at sunset</span><span><i style="background:#0b4f3c"></i>Eid al-Fitr</span></div>
    <p class="note">Dates follow the Fiqh Council of North America calculated calendar. Communities that wait for a local moon sighting may start or end a day later. Islamic days begin at sunset the evening before.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 2. New York suhoor & iftar timetable ───────────────────────────────────
type Day = { date: string; hijri: string; Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string };
function timetable(fonts: string, data: { days: Day[] }): string {
  const rows = data.days.slice(0, FAST_DAYS).map((d, i) => {
    const dt = new Date(`${d.date}T12:00:00Z`);
    const n = i + 1;
    return `<tr class="${n >= 20 ? "ten" : ""}${dt.getUTCDay() === 5 ? " fri" : ""}"><td class="n">${n}</td><td>${DOW[dt.getUTCDay()]}, ${fmt(dt)}</td><td class="k">${to12(d.Fajr)} am</td><td>${to12(d.Sunrise)}</td><td>${to12(d.Dhuhr)}</td><td>${to12(d.Asr)}</td><td class="k ift">${to12(d.Maghrib)} pm</td><td>${to12(d.Isha)}</td></tr>`;
  });
  const css = `
  .r2{padding:34px 36px 0}
  .r2 header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:5px solid #0b4f3c;padding-bottom:8px;margin-bottom:10px}
  .r2 h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#1d2a3a}
  .r2 .city{font-family:Sora;font-weight:800;font-size:18px;color:#0b4f3c}
  .r2 .sub{margin:3px 0 0;font-size:11px;color:#37474f}
  .r2 table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:11.4px}
  .r2 th{background:#0b4f3c;color:#fff;font-family:Sora;font-weight:700;font-size:10.5px;padding:6px 4px}
  .r2 th.k{background:#c9a227;color:#1d2a3a}
  .r2 td{padding:4.6px 4px;border-bottom:1px solid #e3ece6;text-align:center}
  .r2 td:nth-child(2){text-align:left;font-weight:700}
  .r2 td.n{font-family:Sora;font-weight:800;color:#0b4f3c}
  .r2 td.k{font-weight:800;font-size:12.4px}
  .r2 td.ift{color:#0b4f3c}
  .r2 tr.ten td{background:#fffaf0}
  .r2 tr.fri td:nth-child(2)::after{content:" · Jumu'ah";font-weight:500;color:#5a6b75}
  .r2 .eid{margin-top:8px;background:#0b4f3c;color:#fff;border-radius:8px;padding:8px 12px;font-size:12px}
  .r2 .eid b{color:#fccc00}
  .r2 .note{margin-top:8px;font-size:9.6px;line-height:1.45;color:#5a6b75}`;
  const page = `<section class="page r2">
    <header><div><h1>Ramadan 2027 Timetable</h1><p class="sub">Suhoor ends at Fajr · Iftar at Maghrib · Eastern Standard Time · Ramadan 1448 AH</p></div><div class="city">New York City</div></header>
    <table><thead><tr><th>Day</th><th>Date</th><th class="k">Suhoor ends (Fajr)</th><th>Sunrise</th><th>Dhuhr</th><th>Asr</th><th class="k">Iftar (Maghrib)</th><th>Isha</th></tr></thead><tbody>${rows.join("")}</tbody></table>
    <div class="eid"><b>Eid al-Fitr: Tuesday, March 9, 2027</b> (1 Shawwal 1448). If your community completes 30 days, Eid is Wednesday, March 10.</div>
    <p class="note">Times are calculated for New York City with the Islamic Society of North America (ISNA) method (Fajr and Isha at 15° below the horizon; standard Asr) and rounded to the minute. Many mosques stop eating a few minutes before Fajr; follow your local masjid's timetable. Highlighted rows are the last ten nights. Daylight saving time begins March 14, after Ramadan.</p>
    <div class="foot">Fresh Calendars · Ramadan 2027 New York timetable · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 3. Daily tracker ───────────────────────────────────────────────────────
function tracker(fonts: string): string {
  const box = `<i class="b"></i>`;
  const rows = Array.from({ length: 30 }, (_, i) => {
    const n = i + 1, d = dayDate(n);
    const label = n === 30 ? `<td class="d">Mar 9 <small>(if 30 days)</small></td>` : `<td class="d">${DOW[d.getUTCDay()]} ${fmt(d)}</td>`;
    return `<tr${n >= 20 ? ' class="ten"' : ""}><td class="n">${n}</td>${label}<td>${box}</td><td>${box.repeat(5)}</td><td>${box}</td><td class="j">${n}</td><td>${box}</td><td class="line"></td></tr>`;
  });
  const css = `
  .r3{padding:34px 34px 0}
  .r3 h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:#0d5e75}
  .r3 .sub{margin:3px 0 10px;font-size:11px;color:#37474f}
  .r3 table{width:100%;border-collapse:collapse;font-size:10.8px}
  .r3 th{font-family:Sora;font-weight:700;font-size:9.8px;color:#fff;background:#0d5e75;padding:5px 3px}
  .r3 td{border-bottom:1px solid #dbe9ee;padding:3.3px 3px;text-align:center;height:26px}
  .r3 td.n{font-family:Sora;font-weight:800;color:#0d5e75;width:26px}
  .r3 td.d{text-align:left;font-weight:700;width:96px;white-space:nowrap}
  .r3 td.d small{font-weight:500;color:#5a6b75}
  .r3 td.j{font-weight:700;color:#0d5e75}
  .r3 td.line{width:150px;border-bottom:1px solid #b9d3dc}
  .r3 .b{display:inline-block;width:13px;height:13px;border:1.6px solid #0d5e75;border-radius:3px;margin:0 1.5px;vertical-align:middle}
  .r3 tr.ten td{background:#f2f8fa}
  .r3 .legend{margin-top:8px;font-size:10px;color:#37474f}`;
  const page = `<section class="page r3">
    <h1>Ramadan 2027 Daily Tracker</h1>
    <p class="sub">Tick each box as you go · Five prayers: Fajr, Dhuhr, Asr, Maghrib, Isha · Juz: reading one part a day completes the Quran in 30 days</p>
    <table><thead><tr><th>Day</th><th>Date</th><th>Fast</th><th>Five prayers</th><th>Taraweeh</th><th>Juz</th><th>Charity</th><th>Notes and goals</th></tr></thead><tbody>${rows.join("")}</tbody></table>
    <p class="legend">Shaded rows are the last ten nights. Ramadan 1448 is expected to last 29 days (Feb. 8 to Mar. 8, 2027); day 30 applies only if your community completes 30 days.</p>
    <div class="foot">Fresh Calendars · Ramadan 2027 daily tracker · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 4. Islamic calendar 2027 ───────────────────────────────────────────────
function islamicCalendar(fonts: string): string {
  const months: [string, string, string][] = [
    ["Rajab 1448", "Thu, Dec 10, 2026", "Isra and Mi'raj (27 Rajab): Tue, Jan 5, 2027"],
    ["Sha'ban 1448", "Sat, Jan 9, 2027", "Mid-Sha'ban (15 Sha'ban): Sat, Jan 23"],
    ["Ramadan 1448", "Mon, Feb 8, 2027", "Last ten nights from sunset Sat, Feb 27 · 27th night: evening of Fri, Mar 5"],
    ["Shawwal 1448", "Tue, Mar 9, 2027", "Eid al-Fitr: Tue, Mar 9"],
    ["Dhu al-Qa'dah 1448", "Thu, Apr 8, 2027", ""],
    ["Dhu al-Hijjah 1448", "Fri, May 7, 2027", "Day of Arafah: Sat, May 15 · Eid al-Adha: Sun, May 16"],
    ["Muharram 1449", "Sun, Jun 6, 2027", "Islamic New Year 1449: Sun, Jun 6 · Ashura (10 Muharram): Tue, Jun 15"],
    ["Safar 1449", "Mon, Jul 5, 2027", ""],
    ["Rabi' al-Awwal 1449", "Tue, Aug 3, 2027", "Mawlid an-Nabi (12 Rabi' al-Awwal): Sat, Aug 14"],
    ["Rabi' al-Thani 1449", "Thu, Sep 2, 2027", ""],
    ["Jumada al-Ula 1449", "Fri, Oct 1, 2027", ""],
    ["Jumada al-Akhirah 1449", "Sun, Oct 31, 2027", ""],
    ["Rajab 1449", "Mon, Nov 29, 2027", ""],
    ["Sha'ban 1449", "Wed, Dec 29, 2027", ""],
  ];
  const rows = months.map(([m, s, e]) => `<tr${m.startsWith("Ramadan") ? ' class="ram"' : ""}><td class="m">${m}</td><td>${s}</td><td class="e">${e}</td></tr>`).join("");
  const key: [string, string][] = [
    ["Ramadan begins", "Monday, Feb. 8"], ["Laylat al-Qadr (27th night)", "Evening of Friday, Mar. 5"], ["Eid al-Fitr", "Tuesday, Mar. 9"],
    ["Day of Arafah", "Saturday, May 15"], ["Eid al-Adha", "Sunday, May 16"], ["Islamic New Year 1449", "Sunday, June 6"], ["Ashura", "Tuesday, June 15"],
  ];
  const css = `
  .r4{padding:38px 40px 0}
  .r4 header{display:flex;align-items:center;gap:14px}
  .r4 h1{font-family:Sora;font-weight:800;font-size:36px;margin:0;color:#1d2a3a}
  .r4 .sub{margin:2px 0 0;font-size:12px;color:#37474f}
  .r4 .keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0 14px}
  .r4 .keys div{border-radius:10px;padding:9px 10px;background:#eef4fb;border-top:4px solid #007bff}
  .r4 .keys div:nth-child(3),.r4 .keys div:nth-child(5){background:#fff6d6;border-top-color:#c9a227}
  .r4 .keys b{display:block;font-family:Sora;font-weight:700;font-size:11px;color:#0b3d66}
  .r4 .keys span{font-size:12.5px;font-weight:700}
  .r4 table{width:100%;border-collapse:collapse;font-size:11.5px}
  .r4 th{background:#0b3d66;color:#fff;font-family:Sora;font-weight:700;font-size:10.5px;padding:6px;text-align:left}
  .r4 td{padding:7px 6px;border-bottom:1px solid #dfe7f1;vertical-align:top}
  .r4 td.m{font-family:Sora;font-weight:700;color:#0b3d66;width:170px}
  .r4 td.e{color:#37474f}
  .r4 tr.ram td{background:#fff6d6}
  .r4 .note{margin-top:10px;font-size:10px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page r4">
    <header>${crescent(52, "#007bff")}<div><h1>Islamic Calendar 2027</h1><p class="sub">Hijri months beginning in 2027 · Rajab 1448 to Sha'ban 1449 · first day of each month (Gregorian)</p></div></header>
    <div class="keys">${key.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join("")}<div><b>Hijri year</b><span>1448 AH → 1449 AH</span></div></div>
    <table><thead><tr><th>Hijri month</th><th>Begins</th><th>Key dates</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note">Month starts follow the Fiqh Council of North America calculated calendar, which matches the Umm al-Qura calendar for these months. Each Hijri day begins at sunset the evening before the Gregorian date shown. Communities that rely on local moon sighting may differ by a day.</p>
    <div class="foot">Fresh Calendars · Islamic calendar 2027 · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildRamadanDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const data = JSON.parse(await fs.readFile(path.join(ROOT, "packages/generator/data/ramadan-2027-new-york.json"), "utf8"));
  const templates: [string, string][] = [
    ["ramadan-calendar-2027", calendarGrid(fonts)],
    ["ramadan-timetable-new-york-2027", timetable(fonts, data)],
    ["ramadan-daily-tracker-2027", tracker(fonts)],
    ["islamic-calendar-2027", islamicCalendar(fonts)],
  ];
  await fs.mkdir(OUT_PUBLIC, { recursive: true });
  await fs.mkdir(OUT_ASSETS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, html] of templates) {
      const page = await browser.newPage({ viewport: LETTER, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const pdf = path.join(OUT_PUBLIC, `${slug}.pdf`), png = path.join(OUT_PUBLIC, `${slug}.png`);
      await page.pdf({ path: pdf, width: `${LETTER.width}px`, height: `${LETTER.height}px`, printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
      await page.screenshot({ path: png, type: "png", clip: { x: 0, y: 0, ...LETTER } });
      await fs.copyFile(png, path.join(OUT_ASSETS, `${slug}.png`));
      await page.close();
      console.log(slug, "ok");
    }
  } finally {
    await browser.close();
  }
}
