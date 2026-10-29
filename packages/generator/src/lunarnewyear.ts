/**
 * Lunar New Year 2027 printables for /news/ (four independent Fresh Calendars templates).
 *
 *   1. lunar-new-year-2027-calendar     — New Year's Eve (Feb. 5) to the Lantern Festival (Feb. 20), day by day
 *   2. chinese-zodiac-chart             — every zodiac year 1924–2031 with the exact date it began (landscape)
 *   3. chinese-lunar-calendar-2027      — 2027 year at a glance with the lunar date under every day
 *   4. lunar-festivals-solar-terms-2027 — traditional festivals and the 24 solar terms of 2027
 *
 * Lunar dates and solar terms come from the Hong Kong Observatory conversion tables in data/
 * (Hong Kong time, UTC+8). Usage: pnpm fc news-lunar
 */
import fs from "node:fs/promises";
import path from "node:path";
import { LETTER, LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { DOW3, DOWFULL, MON3, MONTHS, daysIn, renderPrintables, utc } from "./printables.js";

const SITE = "freshcalendars.com/news/lunar-new-year-2027-year-of-the-goat/";
const RED = "#b3131b", GOLD = "#d9a520", INK = "#3b0d0d";

type LunarDay = { date: Date; month: number; day: number; term?: string };
const ANIMAL: Record<string, string> = { Mouse: "Rat", Ox: "Ox", Tiger: "Tiger", Rabbit: "Rabbit", Dragon: "Dragon", Snake: "Snake", Horse: "Horse", Goat: "Goat", Monkey: "Monkey", Rooster: "Rooster", Dog: "Dog", Pig: "Pig" };
const ORDER = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
const ELEMENT: Record<string, string> = { Jia: "Wood", Yi: "Wood", Bing: "Fire", Ding: "Fire", Wu: "Earth", Ji: "Earth", Geng: "Metal", Xin: "Metal", Ren: "Water", Gui: "Water" };
// HKO English names → pinyin and the common English name.
const TERMS: Record<string, [string, string]> = {
  "Moderate Cold": ["Xiaohan", "Minor Cold"], "Severe Cold": ["Dahan", "Major Cold"], "Spring Commences": ["Lichun", "Start of Spring"],
  "Spring Showers": ["Yushui", "Rain Water"], "Insects Waken": ["Jingzhe", "Awakening of Insects"], "Vernal Equinox": ["Chunfen", "Spring Equinox"],
  "Bright & Clear": ["Qingming", "Pure Brightness"], "Corn Rain": ["Guyu", "Grain Rain"], "Summer Commences": ["Lixia", "Start of Summer"],
  "Corn Forms": ["Xiaoman", "Grain Buds"], "Corn on Ear": ["Mangzhong", "Grain in Ear"], "Summer Solstice": ["Xiazhi", "Summer Solstice"],
  "Moderate Heat": ["Xiaoshu", "Minor Heat"], "Great Heat": ["Dashu", "Major Heat"], "Autumn Commences": ["Liqiu", "Start of Autumn"],
  "End of Heat": ["Chushu", "End of Heat"], "White Dew": ["Bailu", "White Dew"], "Autumnal Equinox": ["Qiufen", "Autumn Equinox"],
  "Cold Dew": ["Hanlu", "Cold Dew"], "Frost": ["Shuangjiang", "Frost's Descent"], "Winter Commences": ["Lidong", "Start of Winter"],
  "Light Snow": ["Xiaoxue", "Minor Snow"], "Heavy Snow": ["Daxue", "Major Snow"], "Winter Solstice": ["Dongzhi", "Winter Solstice"],
};

async function lunar2027(): Promise<LunarDay[]> {
  const txt = await fs.readFile(path.join(ROOT, "packages/generator/data/hko-lunar-2027.txt"), "utf8");
  const out: LunarDay[] = [];
  let month = 11; // Jan. 1, 2027 is the 24th day of the 11th lunar month (HKO)
  for (const line of txt.split("\n")) {
    const m = line.match(/^(\d{4})\/(\d+)\/(\d+)\s+(.+?)\s{2,}(\w+day)\s*(.*)$/);
    if (!m) continue;
    let day: number;
    const mm = m[4]!.match(/^(\d+)(?:st|nd|rd|th) Lunar Month/i);
    if (mm) { month = Number(mm[1]); day = 1; } else day = Number(m[4]);
    out.push({ date: utc(Number(m[1]), Number(m[2]) - 1, Number(m[3])), month, day, term: m[6]!.trim() || undefined });
  }
  if (out.length !== 365) throw new Error(`HKO 2027 table: ${out.length} days`);
  return out;
}
const find = (days: LunarDay[], month: number, day: number, after = 0) => days.find((d, i) => i >= after && d.month === month && d.day === day)!;
const long = (d: Date) => `${DOWFULL[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
const short = (d: Date) => `${DOW3[d.getUTCDay()]}, ${MON3[d.getUTCMonth()]} ${d.getUTCDate()}`;
const ord = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** Simple vector goat mark for headers (original drawing). */
const goat = (size: number, c = GOLD) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="M41 30C35 12 15 10 13 26c-1 9 8 13 13 8M59 30c6-18 26-20 28-4 1 9-8 13-13 8" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M33 40l-15-4 6 10zM67 40l15-4-6 10z" fill="${c}"/><path d="M50 30c-11 0-17 8-17 18 0 12 7 26 17 30 10-4 17-18 17-30 0-10-6-18-17-18z" fill="${c}"/><path d="M45 80l5 14 5-14z" fill="${c}"/><circle cx="43" cy="48" r="3" fill="${INK}"/><circle cx="57" cy="48" r="3" fill="${INK}"/><ellipse cx="50" cy="68" rx="5" ry="3" fill="${INK}" opacity=".35"/></svg>`;

// ── 1. Festival calendar, Eve to Lantern Festival ───────────────────────────
function festivalCalendar(days: LunarDay[], fonts: string): string {
  const ny = days.findIndex((d) => d.month === 1 && d.day === 1);
  const customs: Record<number, [string, string]> = {
    0: ["New Year's Eve", "Reunion dinner; families stay up to see the new year in"],
    1: ["Lunar New Year", "Year of the Goat begins; visits to family, red envelopes"],
    2: ["Second day", "Married daughters traditionally visit their parents"],
    3: ["Third day", "Chikou, a quiet day at home in many families"],
    5: ["Fifth day", "Po Wu: welcoming the God of Wealth; many shops reopen"],
    7: ["Renri", "“Everyone's birthday” in Chinese tradition"],
    9: ["Ninth day", "Jade Emperor's birthday, marked in Hokkien communities"],
    15: ["Lantern Festival", "Lanterns, riddles and tangyuan rice balls end the season"],
  };
  const cells: string[] = [];
  for (let i = ny - 1; i <= ny + 14; i++) {
    const d = days[i]!, n = i - ny + 1;
    const [t, s] = customs[n === 0 ? 0 : n] ?? [`${ord(n)} day`, ""];
    const big = n === 1 || n === 15 || n === 0;
    cells.push(`<div class="c${big ? " big" : ""}"><span class="ld">${n === 0 ? "Eve" : `Day ${n}`}</span><b>${MON3[d.date.getUTCMonth()]} ${d.date.getUTCDate()}</b><i>${DOWFULL[d.date.getUTCDay()]}</i><h3>${t}</h3>${s ? `<p>${s}</p>` : `<div class="lines"><span></span><span></span><span></span></div>`}</div>`);
  }
  const css = `
  .l1{padding:34px 34px 0;background:#fff8ee}
  .l1 header{background:${RED};color:#fff;border-radius:16px;padding:18px 22px;display:flex;align-items:center;gap:16px;margin-bottom:14px}
  .l1 h1{font-family:Sora;font-weight:800;font-size:34px;margin:0;line-height:1.05}
  .l1 h1 span{color:#ffd76a}
  .l1 header p{margin:4px 0 0;font-size:12px;color:#ffe8d0}
  .l1 .grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:168px;gap:8px}
  .l1 .c{background:#fff;border:1.5px solid #f0d9b5;border-radius:12px;padding:9px 10px}
  .l1 .c .ld{font-family:Sora;font-weight:700;font-size:10px;color:${RED};text-transform:uppercase;letter-spacing:.08em}
  .l1 .c b{display:block;font-family:Sora;font-weight:800;font-size:22px;color:${INK};margin-top:2px}
  .l1 .c i{display:block;font-style:normal;font-size:10.5px;color:#7a5a4a}
  .l1 .c h3{font-family:Sora;font-weight:700;font-size:12.5px;margin:8px 0 2px;color:${INK}}
  .l1 .c p{margin:0;font-size:10.3px;line-height:1.3;color:#5a3a2a}
  .l1 .c .lines span{display:block;border-bottom:1px dotted #d9b98a;height:19px}
  .l1 .c.big{background:${RED};border-color:${RED}}.l1 .c.big *{color:#fff}.l1 .c.big .ld,.l1 .c.big h3{color:#ffd76a}
  .l1 .note{margin-top:10px;font-size:10px;color:#6b5040;line-height:1.45}`;
  const page = `<section class="page l1">
    <header>${goat(70, "#ffd76a")}<div><h1>Lunar New Year <span>2027</span></h1><p>Year of the Goat (Fire Goat) · Saturday, Feb. 6, 2027 · 15 days to the Lantern Festival on Feb. 20</p></div></header>
    <div class="grid">${cells.join("")}</div>
    <p class="note">Dates follow the Chinese calendar as published by the Hong Kong Observatory. Korea's Seollal falls on Sunday, Feb. 7, 2027, because the new moon arrives after midnight Korean time; Vietnam's Tet is expected on Feb. 6. Customs vary by region and family.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 2. Chinese zodiac chart 1924–2031 ────────────────────────────────────────
async function zodiacChart(fonts: string): Promise<string> {
  const data = JSON.parse(await fs.readFile(path.join(ROOT, "packages/generator/data/lunar-new-year-1924-2032.json"), "utf8")).years as Record<string, { lny: string; animal: string; stem: string }>;
  const rows = ORDER.map((animal) => {
    const cells = Object.entries(data).filter(([y, v]) => Number(y) <= 2031 && ANIMAL[v.animal] === animal).map(([y, v]) => {
      const [, m, d] = v.lny.split("-").map(Number);
      return `<td class="${y === "2027" ? "now" : ""}"><b>${y}</b><span>from ${MON3[m! - 1]} ${d}</span><i>${ELEMENT[v.stem]}</i></td>`;
    }).join("");
    return `<tr><th>${animal}</th>${cells}</tr>`;
  }).join("");
  const css = `
  .l2{padding:28px 30px 0;background:#fff8ee}
  .l2 h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:${RED}}
  .l2 .sub{margin:3px 0 12px;font-size:11px;color:#5a3a2a}
  .l2 table{width:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed}
  .l2 th{font-family:Sora;font-weight:800;font-size:13px;color:#fff;background:${RED};border-radius:8px;width:78px;text-align:left;padding:0 9px}
  .l2 td{background:#fff;border:1px solid #f0d9b5;border-radius:8px;padding:5px 6px;line-height:1.15}
  .l2 td b{display:block;font-family:Sora;font-weight:800;font-size:13px;color:${INK}}
  .l2 td span{display:block;font-size:9.6px;color:#5a3a2a}
  .l2 td i{display:block;font-style:normal;font-size:8.8px;color:#9a6a20;font-weight:700}
  .l2 td.now{background:${GOLD};border-color:${GOLD}}.l2 td.now *{color:${INK}}
  .l2 .note{margin-top:8px;font-size:9.6px;color:#6b5040}`;
  const page = `<section class="page l2">
    <h1>Chinese Zodiac Chart, 1924 to 2031</h1>
    <p class="sub">Each zodiac year starts on Lunar New Year, not Jan. 1. If you were born in January or early February, check the start date: a birthday before it belongs to the previous animal.</p>
    <table><tbody>${rows}</tbody></table>
    <p class="note">Start dates: Hong Kong Observatory Gregorian-Lunar conversion tables. The element (Wood, Fire, Earth, Metal, Water) follows the year's heavenly stem; 2027 is a Fire Goat year. The Goat is also called the Sheep or Ram.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

// ── 3. Chinese lunar calendar 2027, year at a glance ────────────────────────
function lunarYear(days: LunarDay[], fonts: string): string {
  const fest = festivals(days);
  const festDay = new Map(fest.map((f) => [f.date.getTime(), f.name]));
  const months = MONTHS.map((name, m) => {
    const lead = utc(2027, m, 1).getUTCDay();
    const cells: string[] = Array.from({ length: lead }, () => `<td></td>`);
    for (let d = 1; d <= daysIn(2027, m); d++) {
      const ld = days.find((x) => x.date.getTime() === utc(2027, m, d).getTime())!;
      const f = festDay.get(ld.date.getTime());
      const lab = ld.day === 1 ? `M${ld.month}` : String(ld.day);
      cells.push(`<td class="${ld.day === 1 ? "m1" : ""}${f ? " f" : ""}${ld.term ? " t" : ""}"${f ? ` title="${f}"` : ""}><b>${d}</b><span>${lab}</span></td>`);
    }
    while (cells.length % 7) cells.push(`<td></td>`);
    const rows: string[] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join("")}</tr>`);
    return `<div class="mo"><h2>${name}</h2><table><thead><tr>${["S", "M", "T", "W", "T", "F", "S"].map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }).join("");
  const css = `
  .l3{padding:30px 30px 0}
  .l3 header{display:flex;align-items:center;gap:12px;border-bottom:4px solid ${RED};padding-bottom:8px;margin-bottom:12px}
  .l3 h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:${RED};line-height:1}
  .l3 .sub{margin:4px 0 0;font-size:10.8px;color:#5a3a2a}
  .l3 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 14px}
  .l3 h2{font-family:Sora;font-weight:700;font-size:13px;margin:0 0 2px;color:${INK}}
  .l3 table{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums}
  .l3 th{font-family:Sora;font-weight:700;font-size:8.4px;color:#7a5a4a;padding:2px 0}
  .l3 td{text-align:center;padding:1.5px 0;height:30px;vertical-align:top}
  .l3 td b{display:block;font-size:11px;color:${INK}}
  .l3 td span{display:block;font-size:8px;color:#9a6a20}
  .l3 td.m1 span{color:#fff;background:${RED};border-radius:3px;margin:0 2px;font-weight:700}
  .l3 td.f{background:#ffe2a8;border-radius:4px}
  .l3 td.t b{text-decoration:underline;text-decoration-color:${RED};text-underline-offset:2px}
  .l3 .legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:9.6px;color:#5a3a2a}
  .l3 .legend i{display:inline-block;width:14px;height:11px;border-radius:3px;vertical-align:-2px;margin-right:5px}`;
  const page = `<section class="page l3">
    <header>${goat(46, RED)}<div><h1>Chinese Lunar Calendar 2027</h1><p class="sub">Gregorian dates with the lunar day under each one · Year of the Goat begins Saturday, Feb. 6 · no leap month in 2027</p></div></header>
    <div class="grid">${months}</div>
    <div class="legend"><span><i style="background:${RED}"></i>M1, M2 … first day of a lunar month</span><span><i style="background:#ffe2a8"></i>Traditional festival</span><span><u style="text-decoration-color:${RED}">12</u> solar term begins</span><span>Source: Hong Kong Observatory</span></div>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function festivals(days: LunarDay[]): { name: string; date: Date; lunar: string }[] {
  const ny = days.findIndex((d) => d.month === 1 && d.day === 1);
  const after = (m: number, d: number) => find(days, m, d, ny);
  const term = (t: string) => days.find((d) => d.term === t)!;
  return [
    { name: "Laba Festival", date: find(days, 12, 8).date, lunar: "8th day, 12th month" },
    { name: "Little New Year (north)", date: find(days, 12, 23).date, lunar: "23rd day, 12th month" },
    { name: "Lunar New Year's Eve", date: days[ny - 1]!.date, lunar: "Last day, 12th month" },
    { name: "Lunar New Year", date: days[ny]!.date, lunar: "1st day, 1st month" },
    { name: "Lantern Festival", date: after(1, 15).date, lunar: "15th day, 1st month" },
    { name: "Qingming (Tomb-Sweeping Day)", date: term("Bright & Clear").date, lunar: "Solar term" },
    { name: "Dragon Boat Festival", date: after(5, 5).date, lunar: "5th day, 5th month" },
    { name: "Qixi Festival", date: after(7, 7).date, lunar: "7th day, 7th month" },
    { name: "Ghost Festival", date: after(7, 15).date, lunar: "15th day, 7th month" },
    { name: "Mid-Autumn Festival", date: after(8, 15).date, lunar: "15th day, 8th month" },
    { name: "Double Ninth Festival", date: after(9, 9).date, lunar: "9th day, 9th month" },
    { name: "Dongzhi (Winter Solstice Festival)", date: term("Winter Solstice").date, lunar: "Solar term" },
  ];
}

// ── 4. Festivals and the 24 solar terms ──────────────────────────────────────
function festivalsAndTerms(days: LunarDay[], fonts: string): string {
  const f = festivals(days).map((x) => `<tr><td class="n">${x.name}</td><td>${long(x.date)}</td><td class="l">${x.lunar}</td></tr>`).join("");
  const terms = days.filter((d) => d.term).map((d) => { const [py, en] = TERMS[d.term!] ?? [d.term!, d.term!]; return `<tr><td class="n">${py}</td><td>${en}</td><td>${short(d.date)}</td></tr>`; });
  const half = Math.ceil(terms.length / 2);
  const tt = (r: string[]) => `<table class="t"><thead><tr><th>Term</th><th>Meaning</th><th>Date</th></tr></thead><tbody>${r.join("")}</tbody></table>`;
  const css = `
  .l4{padding:36px 36px 0;background:#fff8ee}
  .l4 header{display:flex;align-items:center;gap:14px;margin-bottom:10px}
  .l4 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${RED};line-height:1.05}
  .l4 .sub{margin:4px 0 0;font-size:11px;color:#5a3a2a}
  .l4 h2{font-family:Sora;font-weight:700;font-size:15px;color:${INK};margin:14px 0 6px}
  .l4 table{width:100%;border-collapse:collapse;font-size:11.2px}
  .l4 th{background:${RED};color:#fff;font-family:Sora;font-weight:700;font-size:10px;padding:6px;text-align:left}
  .l4 td{padding:5.4px 6px;border-bottom:1px solid #f0d9b5;background:#fff}
  .l4 td.n{font-family:Sora;font-weight:700;color:${INK}}
  .l4 td.l{color:#7a5a4a}
  .l4 table.fe tr:nth-child(4) td{background:#ffe2a8}
  .l4 .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .l4 table.t{font-size:10.4px}.l4 table.t td{padding:4.2px 6px}
  .l4 .note{margin-top:10px;font-size:9.6px;color:#6b5040;line-height:1.45}`;
  const page = `<section class="page l4">
    <header>${goat(56, RED)}<div><h1>Chinese Festivals and Solar Terms 2027</h1><p class="sub">Traditional festival dates for the Year of the Goat, and the 24 solar terms that divide the farming year</p></div></header>
    <h2>Traditional festivals in 2027</h2>
    <table class="fe"><thead><tr><th>Festival</th><th>Date</th><th>Lunar date</th></tr></thead><tbody>${f}</tbody></table>
    <h2>The 24 solar terms of 2027</h2>
    <div class="two">${tt(terms.slice(0, half))}${tt(terms.slice(half))}</div>
    <p class="note">Dates are for China and Hong Kong (UTC+8), from the Hong Kong Observatory. In U.S. time zones a solar term can fall on the previous calendar day; the March equinox, for example, is March 21 in Hong Kong and March 20 in New York. The Lantern Festival and Mid-Autumn Festival fall at or next to the full moon.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildLunarNewYearDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const days = await lunar2027();
  await renderPrintables("lunar-new-year-2027", [
    { slug: "lunar-new-year-2027-calendar", size: LETTER, html: festivalCalendar(days, fonts) },
    { slug: "chinese-zodiac-chart", size: LETTER_LANDSCAPE, html: await zodiacChart(fonts) },
    { slug: "chinese-lunar-calendar-2027", size: LETTER, html: lunarYear(days, fonts) },
    { slug: "lunar-festivals-solar-terms-2027", size: LETTER, html: festivalsAndTerms(days, fonts) },
  ]);
}
