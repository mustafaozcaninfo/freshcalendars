/**
 * Diwali 2026 and Election 2026 printables for /news/.
 *
 *   downloads/diwali-2026/
 *     1. diwali-2026-calendar          — the five days, Nov. 6 to 10, with what each one marks
 *     2. lakshmi-puja-times-us-2026    — sunset and Pradosh Kaal (sunset + 2 h 24 min) on Nov. 8 in 12 U.S. cities
 *     3. diwali-planner-2026           — five-day checklist: shopping, cleaning, rangoli, sweets, gifts, visits
 *   downloads/election-2026/
 *     4. my-ballot-worksheet-2026      — blank, nonpartisan worksheet to copy choices from your sample ballot
 *     5. voting-plan-2026              — when, where, ID and transport plan with key dates
 *
 * Sunsets: USNO snapshot in data/diwali-2026-sunsets.json. Usage: pnpm fc news-november
 */
import fs from "node:fs/promises";
import path from "node:path";
import { LETTER, doc, fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { renderPrintables } from "./printables.js";

const DIWALI_SITE = "freshcalendars.com/news/diwali-2026-date-lakshmi-puja-time-usa/";
const BALLOT_SITE = "freshcalendars.com/news/sample-ballot-by-zip-code-2026-texas-ballot/";
const SAFFRON = "#c2410c", MAROON = "#7a1f1f", GOLD = "#d99a00", INK = "#2b1a12";

const diya = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8c10 14 12 24 0 36C38 32 40 22 50 8z" fill="#f59e0b"/><path d="M50 20c5 8 5 14 0 20-5-6-5-12 0-20z" fill="#fde68a"/><path d="M8 54h84c-4 20-20 32-42 32S12 74 8 54z" fill="${SAFFRON}"/><path d="M8 54h84" stroke="${MAROON}" stroke-width="4"/><circle cx="30" cy="68" r="3" fill="#fde68a"/><circle cx="50" cy="72" r="3" fill="#fde68a"/><circle cx="70" cy="68" r="3" fill="#fde68a"/></svg>`;

const plus = (t: string, mins: number) => { const [h, m] = t.split(":").map(Number); const x = h! * 60 + m! + mins; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const to12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h! < 12 ? "a.m." : "p.m."}`; };

const DAYS = [
  { d: "Fri, Nov. 6", name: "Dhanteras", what: "Buying gold, silver or new utensils; lamps lit for Lord Dhanvantari and Yama" },
  { d: "Sat, Nov. 7", name: "Naraka Chaturdashi", what: "Choti Diwali: early oil bath, the first rows of diyas, rangoli at the door" },
  { d: "Sun, Nov. 8", name: "Diwali · Lakshmi Puja", what: "Main night: Lakshmi and Ganesha puja after sunset, diyas, fireworks, sweets" },
  { d: "Mon, Nov. 9", name: "Govardhan Puja", what: "Annakut food offerings; Gujarati New Year (Bestu Varas) for many families" },
  { d: "Tue, Nov. 10", name: "Bhai Dooj", what: "Sisters pray for brothers, apply tilak; brothers give gifts" },
];

function calendar(fonts: string, cities: { city: string; zone: string; sunset: string }[]): string {
  const css = `
  .d1{padding:34px 36px 0;background:#fff8ef}
  .d1 header{display:flex;align-items:center;gap:16px;background:${MAROON};color:#fff;border-radius:16px;padding:16px 22px;margin-bottom:16px}
  .d1 h1{font-family:Sora;font-weight:800;font-size:36px;margin:0;line-height:1.05}.d1 h1 span{color:#fcd34d}
  .d1 header p{margin:4px 0 0;font-size:12.5px;color:#fde7d0}
  .d1 .days{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
  .d1 .day{background:#fff;border:1.5px solid #f3d4b0;border-radius:12px;padding:12px 11px 14px;min-height:330px}
  .d1 .day.main{background:${SAFFRON};border-color:${SAFFRON}}.d1 .day.main *{color:#fff!important}
  .d1 .day b{display:block;font-family:Sora;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${SAFFRON}}
  .d1 .day h2{font-family:Sora;font-weight:800;font-size:16px;line-height:1.2;margin:6px 0 8px;color:${INK}}
  .d1 .day p{margin:0;font-size:12px;line-height:1.4;color:#5b3a28}
  .d1 h3{font-family:Sora;font-size:15px;color:${MAROON};margin:18px 0 8px}
  .d1 table{width:100%;border-collapse:collapse;font-size:11.6px;font-variant-numeric:tabular-nums}
  .d1 th{background:${MAROON};color:#fff;font-family:Sora;font-size:10px;padding:6px;text-align:left}
  .d1 td{padding:10px 6px;border-bottom:1px solid #f0dcc4;background:#fff}
  .d1 .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .d1 .note{margin-top:10px;font-size:9.8px;color:#6b4a38;line-height:1.45}`;
  const rows = (list: typeof cities) => list.map((c) => `<tr><td><b>${c.city}</b></td><td>${to12(c.sunset)}</td><td>${to12(c.sunset)} to ${to12(plus(c.sunset, 144))}</td></tr>`).join("");
  const half = Math.ceil(cities.length / 2);
  const table = (r: string) => `<table><thead><tr><th>City</th><th>Sunset</th><th>Pradosh Kaal</th></tr></thead><tbody>${r}</tbody></table>`;
  const page = `<section class="page d1">
    <header>${diya(64)}<div><h1>Diwali <span>2026</span> Calendar</h1><p>The five days of Deepavali, Friday, Nov. 6 to Tuesday, Nov. 10 · main Lakshmi Puja night: Sunday, Nov. 8</p></div></header>
    <div class="days">${DAYS.map((x, i) => `<div class="day${i === 2 ? " main" : ""}"><b>${x.d}</b><h2>${x.name}</h2><p>${x.what}</p></div>`).join("")}</div>
    <h3>Lakshmi Puja evening, Sunday, Nov. 8, 2026 (local standard time)</h3>
    <div class="two">${table(rows(cities.slice(0, half)))}${table(rows(cities.slice(half)))}</div>
    <p class="note">Pradosh Kaal is counted here as the 2 hours 24 minutes after local sunset; sunsets are from the U.S. Naval Observatory. Temples and family priests often name a narrower muhurat inside this window, so check with yours. The Amavasya (new moon) that Diwali night belongs to ends at 2:02 a.m. EST on Nov. 9. Customs differ by region and community.</p>
    <div class="foot">Free printable from Fresh Calendars · ${DIWALI_SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function pujaTimes(fonts: string, cities: { city: string; zone: string; sunrise: string; sunset: string }[]): string {
  const css = `
  .d2{padding:38px 40px 0}
  .d2 header{display:flex;align-items:center;gap:14px;border-bottom:4px solid ${SAFFRON};padding-bottom:10px;margin-bottom:16px}
  .d2 h1{font-family:Sora;font-weight:800;font-size:31px;margin:0;color:${MAROON};line-height:1.1}
  .d2 .sub{margin:4px 0 0;font-size:12px;color:#5b3a28}
  .d2 table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
  .d2 th{background:${MAROON};color:#fff;font-family:Sora;font-size:11px;padding:9px 8px;text-align:left}
  .d2 td{padding:15px 8px;border-bottom:1px solid #f0dcc4}
  .d2 tr:nth-child(even) td{background:#fff8ef}
  .d2 td.p{font-weight:700;color:${SAFFRON}}
  .d2 .box{margin-top:16px;padding:12px 16px;border-radius:12px;background:#fff8ef;border:1.5px solid #f3d4b0;font-size:11.5px;line-height:1.5;color:#4a2f22}
  .d2 .box b{color:${MAROON}}`;
  const rows = cities.map((c) => `<tr><td><b>${c.city}</b></td><td>${c.zone === "MT" ? "MST" : c.zone[0] + "ST"}</td><td>${to12(c.sunrise)}</td><td>${to12(c.sunset)}</td><td class="p">${to12(c.sunset)} – ${to12(plus(c.sunset, 144))}</td></tr>`).join("");
  const page = `<section class="page d2">
    <header>${diya(56)}<div><h1>Lakshmi Puja Times in the U.S., Diwali 2026</h1><p class="sub">Sunday, Nov. 8, 2026 · sunset and the Pradosh Kaal evening window in 12 cities</p></div></header>
    <table><thead><tr><th>City</th><th>Time zone</th><th>Sunrise</th><th>Sunset</th><th>Pradosh Kaal</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="box"><b>How to use this table.</b> Lakshmi Puja is traditionally performed during Pradosh Kaal, the period that begins at sunset on Amavasya. Here it is counted as 2 hours 24 minutes from sunset. Many temples and family priests choose a shorter muhurat inside it, so follow their timing when they give one. All times are local standard time: U.S. clocks fall back on Nov. 1, a week before Diwali. Sunrise and sunset: U.S. Naval Observatory. New moon: 2:02 a.m. EST, Monday, Nov. 9 (07:02 UTC).</div>
    <div class="foot">Free printable from Fresh Calendars · ${DIWALI_SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function planner(fonts: string): string {
  const tasks: Record<string, string[]> = {
    "Before Nov. 6": ["Deep-clean and declutter the home", "Buy or make diyas, candles and wicks", "Order sweets or plan what to cook", "Shop for new clothes", "Plan gifts and make a gift list"],
    "Dhanteras · Nov. 6": ["Buy gold, silver or a new utensil", "Light a diya at the entrance", "Clean the puja area"],
    "Choti Diwali · Nov. 7": ["Draw the rangoli", "Hang lights and torans", "Prepare puja items and flowers"],
    "Diwali · Nov. 8": ["Lakshmi and Ganesha puja after sunset", "Light diyas in every room", "Share sweets with neighbors", "Call family far away"],
    "Nov. 9 and 10": ["Govardhan Puja / Annakut offering", "Bhai Dooj tilak and gifts", "Thank-you messages and photos"],
  };
  const css = `
  .d3{padding:36px 40px 0;background:#fffdf8}
  .d3 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${MAROON}}
  .d3 .sub{margin:4px 0 14px;font-size:12px;color:#5b3a28}
  .d3 .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .d3 .card{border:1.5px solid #f3d4b0;border-radius:12px;padding:12px 14px;background:#fff}
  .d3 .card h2{font-family:Sora;font-size:14px;margin:0 0 8px;color:${SAFFRON}}
  .d3 li{list-style:none;display:flex;gap:9px;align-items:flex-start;font-size:12.5px;padding:5px 0;border-bottom:1px dotted #ecd5bb}
  .d3 ul{margin:0;padding:0}
  .d3 li i{flex:none;width:15px;height:15px;border:2px solid ${SAFFRON};border-radius:4px;margin-top:1px}
  .d3 .notes{grid-column:span 2}
  .d3 .notes div{border-bottom:1px solid #ecd5bb;height:26px}`;
  const cards = Object.entries(tasks).map(([h, l]) => `<div class="card"><h2>${h}</h2><ul>${l.map((t) => `<li><i></i>${t}</li>`).join("")}<li><i></i></li><li><i></i></li></ul></div>`).join("");
  const page = `<section class="page d3">
    <h1>Diwali 2026 Planner</h1>
    <p class="sub">A five-day checklist from Dhanteras on Friday, Nov. 6 to Bhai Dooj on Tuesday, Nov. 10 · blank lines for your own traditions</p>
    <div class="grid">${cards}<div class="card"><h2>Gifts and guests</h2><ul>${Array.from({ length: 7 }, () => "<li><i></i></li>").join("")}</ul></div><div class="card notes"><h2>Notes</h2>${"<div></div>".repeat(4)}</div></div>
    <div class="foot">Free printable from Fresh Calendars · ${DIWALI_SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── Election 2026 ─────────────────────────────────────────────────────────────
const NAVY = "#1f3a5f", RED = "#b42318";
function ballotWorksheet(fonts: string): string {
  const offices = ["U.S. Senate", "U.S. House", "Governor", "Lieutenant Governor", "Attorney General", "State Senate", "State House / Assembly", "County offices", "Judges", "School board", "City council / mayor", "Other"];
  const css = `
  .b1{padding:36px 40px 0}
  .b1 header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid ${NAVY};padding-bottom:10px;margin-bottom:14px}
  .b1 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${NAVY}}
  .b1 .sub{margin:4px 0 0;font-size:12px;color:#37474f}
  .b1 .date{font-family:Sora;font-weight:800;font-size:15px;color:#fff;background:${RED};border-radius:10px;padding:8px 12px;text-align:center;line-height:1.15}
  .b1 table{width:100%;border-collapse:collapse;font-size:12.5px}
  .b1 th{background:${NAVY};color:#fff;font-family:Sora;font-size:10.5px;padding:7px 8px;text-align:left}
  .b1 td{border-bottom:1px solid #cfd8e3;height:36px;padding:0 8px}
  .b1 td:first-child{font-weight:700;color:${NAVY};width:190px}
  .b1 h2{font-family:Sora;font-size:14px;color:${NAVY};margin:16px 0 6px}
  .b1 .props td{height:30px}
  .b1 .note{margin-top:10px;font-size:9.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page b1">
    <header><div><h1>My Ballot Worksheet, 2026</h1><p class="sub">Copy your choices from your official sample ballot, then take this sheet with you to vote</p></div><div class="date">Election Day<br>Tue, Nov. 3</div></header>
    <table><thead><tr><th>Office or race</th><th>My choice</th></tr></thead><tbody>${offices.map((o) => `<tr><td>${o}</td><td></td></tr>`).join("")}</tbody></table>
    <h2>Ballot measures and propositions</h2>
    <table class="props"><thead><tr><th>Measure</th><th>Yes / No</th><th>Notes</th></tr></thead><tbody>${Array.from({ length: 5 }, () => "<tr><td></td><td style=\"width:90px\"></td><td></td></tr>").join("")}</tbody></table>
    <p class="note">Nonpartisan worksheet. Your sample ballot lists only the races for your address; skip lines that do not apply. Some states, including Texas, do not allow phones or other wireless devices to be used in the voting room, so a paper list is the easy way to bring your notes. Ballot selfies and recording are restricted in many states.</p>
    <div class="foot">Free printable from Fresh Calendars · ${BALLOT_SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}
function votingPlan(fonts: string): string {
  const q = [
    ["Am I registered at my current address?", "Checked on ____ / ____"],
    ["How will I vote?", "Early in person · By mail · On Election Day"],
    ["When will I vote?", "Date ____________  Time ____________"],
    ["Where is my polling place or vote center?", ""],
    ["Which ID will I bring?", ""],
    ["How will I get there?", "Drive · Transit · Walk · Ride from ____________"],
    ["Who can watch the kids / cover my shift?", ""],
    ["If voting by mail: request deadline / return deadline", ""],
  ];
  const css = `
  .b2{padding:36px 40px 0}
  .b2 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${NAVY}}
  .b2 .sub{margin:4px 0 14px;font-size:12px;color:#37474f}
  .b2 .row{border:1.5px solid #cfd8e3;border-radius:10px;padding:10px 14px;margin-bottom:9px}
  .b2 .row b{display:block;font-family:Sora;font-size:13px;color:${NAVY}}
  .b2 .row span{display:block;font-size:12px;color:#5a6b75;margin-top:6px;border-bottom:1px solid #cfd8e3;min-height:20px}
  .b2 h2{font-family:Sora;font-size:15px;color:${NAVY};margin:16px 0 8px}
  .b2 table{width:100%;border-collapse:collapse;font-size:12px}
  .b2 td{padding:7px 8px;border-bottom:1px solid #e1e8ef}
  .b2 td:first-child{font-weight:700;color:${RED};width:170px}`;
  const page = `<section class="page b2">
    <h1>My Voting Plan, Nov. 3, 2026</h1>
    <p class="sub">Fill it in once, put it on the fridge · Nonpartisan</p>
    ${q.map(([a, b]) => `<div class="row"><b>${a}</b><span>${b}</span></div>`).join("")}
    <h2>Key dates</h2>
    <table><tbody>
      <tr><td>Oct. 19 to 30</td><td>In-person early voting in Texas (other states differ)</td></tr>
      <tr><td>Sunday, Nov. 1</td><td>Clocks fall back one hour at 2 a.m.</td></tr>
      <tr><td>Tuesday, Nov. 3</td><td>Election Day; if you are in line when polls close, stay in line</td></tr>
    </tbody></table>
    <div class="foot">Free printable from Fresh Calendars · ${BALLOT_SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildNovemberDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const data = JSON.parse(await fs.readFile(path.join(ROOT, "packages/generator/data/diwali-2026-sunsets.json"), "utf8"));
  await renderPrintables("diwali-2026", [
    { slug: "diwali-2026-calendar", size: LETTER, html: calendar(fonts, data.cities) },
    { slug: "lakshmi-puja-times-us-2026", size: LETTER, html: pujaTimes(fonts, data.cities) },
    { slug: "diwali-planner-2026", size: LETTER, html: planner(fonts) },
  ]);
  await renderPrintables("election-2026", [
    { slug: "my-ballot-worksheet-2026", size: LETTER, html: ballotWorksheet(fonts) },
    { slug: "voting-plan-2026", size: LETTER, html: votingPlan(fonts) },
  ]);
}
