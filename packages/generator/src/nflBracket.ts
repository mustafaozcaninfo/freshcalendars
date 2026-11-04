/**
 * NFL Playoff Bracket 2027 fill-in printable for /news/
 * (nfl-playoff-schedule-2027-wild-card-divisional-championship-super-bowl-lxi).
 * One US Letter landscape page: seven blank seed lines per conference, Wild Card, Divisional and
 * Conference Championship boxes with the round dates, and the Super Bowl LXI box in the center.
 * Dates: NFL.com, "2026-27 National Football League important dates". Format (seeds 1-4 division
 * winners, 5-7 wild cards, only No. 1 byes, 2v7, 3v6, 4v5, lowest remaining seed visits the highest):
 * NBC Sports (Jan. 7, 2026) and CBS Sports (Jan. 6, 2025), as of Nov. 3, 2026. No logos, no team
 * names: the seeds are set after Week 18. Usage: pnpm fc news-nfl-bracket
 */
import { LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "nfl-playoff-bracket-2027";

const seedLines = () =>
  [1, 2, 3, 4, 5, 6, 7]
    .map((n) => `<div class="sd"><b>No. ${n}</b><i></i><em>${n <= 4 ? "Division winner" : "Wild card"}</em></div>`)
    .join("");
/** A game box: two team lines with a score box each. Labels are the seeds that meet (or blank). */
const game = (a: string, b: string, tag = "") =>
  `<div class="g">${tag ? `<span class="tg">${tag}</span>` : ""}<div class="t"><b>${a}</b><i></i><u></u></div><div class="t"><b>${b}</b><i></i><u></u></div></div>`;

function side(name: string, rtl: boolean): string {
  const cols = [
    `<div class="col seeds"><h3>${name}<br><span>Seeds</span></h3><div class="bd sdl">${seedLines()}</div></div>`,
    `<div class="col"><h3>Wild Card<br><span>Sat., Jan. 16 to Mon., Jan. 18</span></h3><div class="bd">${game("No. 2", "No. 7")}${game("No. 3", "No. 6")}${game("No. 4", "No. 5")}<p class="bye">No. 1 seed has a bye</p></div></div>`,
    `<div class="col"><h3>Divisional<br><span>Sat., Jan. 23 to Sun., Jan. 24</span></h3><div class="bd">${game("No. 1", "")}${game("", "")}<p class="bye">No. 1 seed hosts the lowest remaining seed</p></div></div>`,
    `<div class="col"><h3>Conference Championship<br><span>Sun., Jan. 31</span></h3><div class="bd">${game("", "")}</div></div>`,
  ];
  return `<div class="side ${rtl ? "rtl" : ""}">${cols.join("")}</div>`;
}

function sheet(fonts: string): string {
  const css = `
  .nb{padding:30px 28px 0}
  .nb header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #1e3a8a;padding-bottom:6px;margin-right:0}
  .nb h1{font-family:Sora;font-weight:800;font-size:27px;margin:0;color:#14213d;line-height:1.05}
  .nb .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .nb .main{display:flex;gap:12px;margin-top:10px;height:630px}
  .nb .side{display:flex;flex:1;gap:8px}
  .nb .side.rtl{flex-direction:row-reverse}
  .nb .col{flex:1;display:flex;flex-direction:column}
  .nb .col.seeds{flex:1.25}
  .nb h3{font-family:Sora;font-weight:700;font-size:10.5px;line-height:1.25;margin:0 0 6px;padding:4px 5px;background:#1e3a8a;color:#fff;border-radius:5px;text-align:center;min-height:42px}
  .nb .rtl h3,.nb .side:not(.rtl) h3{}
  .nb h3 span{font-family:Manrope;font-weight:700;font-size:9px}
  .nb .bd{flex:1;display:flex;flex-direction:column;justify-content:space-around;align-items:stretch}
  .nb .g{border:1.6px solid #334155;border-radius:7px;padding:5px 6px;background:#f8fafc}
  .nb .t{display:flex;align-items:flex-end;gap:4px;height:24px}
  .nb .t b{font-family:Sora;font-size:10px;color:#14213d;min-width:30px}
  .nb .t i{flex:1;border-bottom:1.2px solid #475569;height:15px}
  .nb .t u{width:22px;height:18px;border:1.4px solid #334155;border-radius:3px;text-decoration:none}
  .nb .bye{margin:0;font-size:9.5px;line-height:1.3;color:#1e293b;font-weight:700;text-align:center;border:1.4px dashed #64748b;border-radius:6px;padding:4px 5px}
  .nb .sdl{justify-content:space-between}
  .nb .sd{display:flex;align-items:flex-end;gap:4px;height:50px;padding-bottom:2px;flex-wrap:wrap}
  .nb .sd b{font-family:Sora;font-size:11px;color:#14213d;width:36px}
  .nb .sd i{flex:1;border-bottom:1.4px solid #475569;height:22px}
  .nb .sd em{font-style:normal;font-size:9px;color:#475569;width:100%;font-weight:700;margin-left:40px}
  .nb .center{width:190px;display:flex;flex-direction:column;justify-content:center;gap:10px;text-align:center}
  .nb .sb{border:3px solid #b91c1c;border-radius:12px;padding:12px 10px;background:#fff7f7}
  .nb .sb h2{font-family:Sora;font-weight:800;font-size:20px;color:#b91c1c;margin:0 0 4px;line-height:1.1}
  .nb .sb p{margin:0 0 8px;font-size:11px;line-height:1.4;color:#1e293b;font-weight:700}
  .nb .sb .t b{min-width:auto;font-size:9.5px}
  .nb .champ{margin-top:8px;font-family:Sora;font-weight:700;font-size:10.5px;color:#14213d;text-align:left}
  .nb .champ i{display:block;border-bottom:1.4px solid #475569;height:24px}
  .nb .how{border:1.5px solid #cbd5e1;border-radius:8px;padding:6px 8px;font-size:10px;line-height:1.4;color:#1e293b;text-align:left}
  .nb .how b{font-family:Sora;color:#14213d;font-size:10.5px}
  .nb .note{margin-top:8px;font-size:9px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page nb"><header><div><h1>NFL Playoff Bracket 2027</h1><p class="sub">Fill in the seeds after Week 18 (Jan. 10, 2027) · Super Bowl LXI is Sun., Feb. 14, 2027</p></div></header>
  <div class="main">${side("American Football Conference", false)}
    <div class="center"><div class="sb"><h2>Super Bowl LXI</h2><p>Sun., Feb. 14, 2027<br>SoFi Stadium, Inglewood, California</p><div class="t"><b>AFC</b><i></i><u></u></div><div class="t"><b>NFC</b><i></i><u></u></div><div class="champ">Champion<i></i></div></div>
      <div class="how"><b>How it works</b><br>Seven teams per conference: seeds 1-4 are division winners, 5-7 are wild cards. Only No. 1 gets a bye. In the Divisional round the lowest remaining seed visits the highest.</div></div>
    ${side("National Football Conference", true)}</div>
  <p class="note">Source: NFL.com, 2026-27 National Football League important dates (round dates); NBC Sports, Jan. 7, 2026, and CBS Sports, Jan. 6, 2025 (format). Kickoff times and TV not yet announced.</p>
  <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/nfl-playoff-schedule-2027-wild-card-divisional-championship-super-bowl-lxi/</div></section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

export async function buildNflBracketDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("nfl-2026", [{ slug: SLUG, size: LETTER_LANDSCAPE, html: sheet(fonts) }]);
}
