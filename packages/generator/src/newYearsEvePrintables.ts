/**
 * New Year's Eve 2026 printable pack for /news/ (new-years-eve-2026-printables-bingo-resolution-cards).
 * One four-page portrait US Letter PDF: 25-square party bingo, four resolution cards with a
 * Jan. to Dec. 2027 check-in grid (weekday of each 1st computed), a 2026 look-back sheet and a
 * midnight countdown card. news-assets draws one page per printable and no kit draws a bingo card
 * or a check-in grid, so this story owns its generator.
 * Usage: pnpm fc news-new-years-eve-printables
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "new-years-eve-2026-printables-bingo-resolution-cards";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Weekday of the 1st of each month of 2027, computed. */
const firstWd = (m: number) => WD[new Date(Date.UTC(2027, m, 1)).getUTCDay()];

const css = `
  .pg{padding:34px 40px 0}
  .pg header{border-bottom:3px solid #1e3a8a;padding-bottom:7px}
  .pg .kick{font-family:Sora;font-weight:700;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#92400e;margin:0 0 3px}
  .pg h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#172554;line-height:1.1}
  .pg .sub{font-size:11.5px;color:#334155;margin:4px 0 0;line-height:1.4}
  .pg h2{font-family:Sora;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#1e3a8a;margin:0 0 5px}
  .pg .note{font-size:9px;line-height:1.45;color:#475569;margin-top:10px}
  .pg .ln{display:flex;align-items:flex-end;gap:8px;font-size:11px;font-weight:700;color:#172554;margin-top:8px}
  .pg .ln s{flex:1;border-bottom:1.5px solid #475569;height:16px;text-decoration:none}
  .pg table.bingo{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:14px}
  .pg table.bingo th{font-family:Sora;font-weight:800;font-size:26px;color:#172554;padding:0 0 4px;letter-spacing:.2em}
  .pg table.bingo td{border:2px solid #1e3a8a;height:118px;padding:8px;text-align:center;vertical-align:middle;font-size:12.5px;line-height:1.3;color:#172554;font-weight:600}
  .pg table.bingo td.free{background:#e0e7ff;font-family:Sora;font-weight:800;font-size:15px}
  .pg .tip{margin-top:12px;border-left:4px solid #1d4ed8;background:#eff6ff;padding:7px 12px;font-size:11px;line-height:1.5;color:#172554}
  .pg .card{border:1.5px solid #1e3a8a;border-radius:9px;padding:8px 13px 9px;margin-top:10px}
  .pg .card h2{display:flex;justify-content:space-between;margin-bottom:0}
  .pg .card .ln{margin-top:6px}
  .pg table.chk{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}
  .pg table.chk th{font-family:Sora;font-weight:700;font-size:9px;color:#172554;padding:0 0 2px;text-align:center}
  .pg table.chk th i{display:block;font-style:normal;font-family:Manrope;font-weight:600;font-size:8.5px;color:#334155}
  .pg table.chk td{border:1px solid #64748b;height:20px}
  .pg .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .pg .q{border:1.5px solid #1e3a8a;border-radius:9px;padding:9px 13px 10px;margin-top:13px}
  .pg .q .area{border-bottom:1px solid #64748b;height:26px}
  .pg .ten{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:16px}
  .pg .ten div{border:2px solid #1e3a8a;border-radius:10px;height:100px;position:relative;text-align:center}
  .pg .ten b{font-family:Sora;font-weight:800;font-size:44px;color:#172554;line-height:100px}
  .pg .ten i{position:absolute;right:8px;bottom:8px;width:14px;height:14px;border:1.5px solid #475569;border-radius:3px}
  .pg .hny{margin-top:18px;border:3px solid #1e3a8a;border-radius:14px;text-align:center;padding:22px 10px}
  .pg .hny b{font-family:Sora;font-weight:800;font-size:38px;color:#172554;display:block;line-height:1.15}
  .pg .hny span{font-size:13px;color:#334155}
  .pg .zone{display:flex;gap:16px;align-items:center;margin-top:16px;font-size:12px;font-weight:700;color:#172554}
  .pg .zone span.o{display:inline-flex;align-items:center;gap:5px}
  .pg .zone i{display:inline-block;width:14px;height:14px;border:1.5px solid #475569;border-radius:50%}
`;
const foot = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div>`;
const area = (n: number) => Array.from({ length: n }, () => `<div class="area"></div>`).join("");

const SQUARES = [
  "Someone says “Happy New Year” early", "A toast", "A resolution is shared", "Confetti", "Countdown from 10",
  "Party hats", "Balloons", "A group photo", "A hug at midnight", "Someone yawns",
  "A sparkling drink is poured", "Noisemakers", "A song everyone sings along to",
  "Someone asks what time it is", "Fireworks, outside or on a screen", "A snack tray is refilled",
  "A card or board game", "A call or text to someone far away", "Someone checks the clock",
  "Someone dances", "Glow sticks", "A midnight countdown on a screen", "Streamers", "A story about this year",
];

function bingo(): string {
  let rows = "";
  let k = 0;
  for (let r = 0; r < 5; r++) {
    let tds = "";
    for (let c = 0; c < 5; c++) {
      tds += r === 2 && c === 2 ? `<td class="free">FREE<br>Happy 2027!</td>` : `<td>${SQUARES[k++]}</td>`;
    }
    rows += `<tr>${tds}</tr>`;
  }
  return `<section class="page pg"><header><p class="kick">New Year's Eve 2026 printables · page 1 of 4</p><h1>New Year's Eve 2026 Bingo</h1>
    <p class="sub">Thursday, Dec. 31, 2026. Mark a square when you see it happen; five in a row, across, down or corner to corner, wins.</p></header>
    <table class="bingo"><thead><tr>${[..."BINGO"].map((l) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
    <div class="tip">Print one copy per guest. Cut the squares apart and draw them from a bowl for a caller game, or let everyone watch and mark their own.</div>
    ${foot}</section>`;
}

function cards(): string {
  const head = MONTHS.map((m, i) => `<th>${m}<i>${firstWd(i)} 1</i></th>`).join("");
  const grid = `<table class="chk"><thead><tr>${head}</tr></thead><tbody><tr>${MONTHS.map(() => "<td></td>").join("")}</tr></tbody></table>`;
  const card = (n: number) => `<div class="card"><h2><span>Resolution ${n}</span><span>My 2027 check-in: tick each month</span></h2>
    <div class="ln">I will <s></s></div><div class="ln">Why it matters <s></s></div><div class="ln">My first step <s></s></div>${grid}</div>`;
  return `<section class="page pg"><header><p class="kick">New Year's Eve 2026 printables · page 2 of 4</p><h1>2027 Resolution Cards</h1>
    <p class="sub">Four cards. Each has a 12-month check-in row for 2027, with the weekday of the 1st of every month printed above its box.</p></header>
    ${[1, 2, 3, 4].map(card).join("")}
    <p class="note">Weekdays are computed: Jan. 1, 2027 is a Friday. Source: U.S. Office of Personnel Management (OPM), Federal Holidays, 2027 table.</p>
    ${foot}</section>`;
}

function lookBack(): string {
  const box = (h: string) => `<div class="q"><h2>${h}</h2>${area(2)}</div>`;
  return `<section class="page pg"><header><p class="kick">New Year's Eve 2026 printables · page 3 of 4</p><h1>My 2026 Look-Back</h1>
    <p class="sub">Fill it in before midnight on Thursday, Dec. 31, 2026, or read it aloud around the table.</p></header>
    ${box("My best day of 2026")}${box("A new place I went")}${box("A book or song I loved")}
    ${box("Something I learned")}${box("What I am proudest of")}${box("People I want to thank")}
    <div class="q"><h2>One word for 2026</h2><div class="ln"><s></s></div></div>
    ${foot}</section>`;
}

function countdown(): string {
  const tiles = Array.from({ length: 10 }, (_, i) => `<div><b>${10 - i}</b><i></i></div>`).join("");
  return `<section class="page pg"><header><p class="kick">New Year's Eve 2026 printables · page 4 of 4</p><h1>Midnight Countdown Card</h1>
    <p class="sub">Tick each number out loud as you count down from 10. Then read the banner together.</p></header>
    <div class="ten">${tiles}</div>
    <div class="hny"><b>Happy New Year 2027</b><span>Friday, Jan. 1, 2027</span></div>
    <div class="zone"><span>Our time zone:</span><span class="o"><i></i>ET</span><span class="o"><i></i>CT</span><span class="o"><i></i>MT</span><span class="o"><i></i>PT</span><span class="o"><i></i>Other</span></div>
    <div class="ln">Where we watched the countdown <s></s></div>
    <div class="ln">Who counted with us <s></s></div>
    <div class="ln">My first wish for 2027 <s></s></div>
    <p class="note">Midnight arrives at different moments in different time zones; check your local clock for the countdown.</p>
    ${foot}</section>`;
}

export async function buildNewYearsEvePrintablesDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const html = doc(fonts, LETTER, css, [bingo(), cards(), lookBack(), countdown()]);
  await renderPrintables(SLUG, [{ slug: "new-years-eve-2026-printables", size: LETTER, html }]);
}
