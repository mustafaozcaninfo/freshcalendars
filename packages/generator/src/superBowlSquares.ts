/**
 * Super Bowl LXI squares sheet for /news/ (super-bowl-lxi-squares-2027).
 * One portrait US Letter page: a 10x10 fill-in grid with blank team names and blank number cells,
 * a quarter-by-quarter score box with a winner line and a short how-to-play strip. The watch-guide
 * kit draws a schedule table, not a fill-in grid, so this story owns its generator.
 * Usage: pnpm fc news-super-bowl-squares
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "super-bowl-lxi-squares-2027";

function sheet(fonts: string): string {
  const css = `
  .sq{padding:26px 30px 0}
  .sq header{border-bottom:3px solid #b45309;padding-bottom:5px}
  .sq h1{font-family:Sora;font-weight:800;font-size:23px;margin:0;color:#1e293b;line-height:1.1}
  .sq .sub{font-size:11px;font-weight:700;color:#334155;margin-top:4px}
  .sq .wrap{display:flex;margin-top:8px}
  .sq .side{width:26px;display:flex;align-items:center;justify-content:center;padding-top:34px}
  .sq .side div{writing-mode:vertical-rl;transform:rotate(180deg);font-family:Sora;font-weight:700;font-size:10px;color:#1e293b;white-space:nowrap}
  .sq .tn{display:flex;align-items:flex-end;gap:6px;font-family:Sora;font-weight:700;font-size:10px;color:#1e293b;margin:0 0 3px 34px;height:18px}
  .sq .tn s{flex:1;border-bottom:1.5px solid #334155;height:14px;text-decoration:none}
  .sq table{border-collapse:collapse;table-layout:fixed}
  .sq td{border:1px solid #64748b}
  .sq td.n{width:34px;height:34px;background:#fef3c7;border:1.5px solid #b45309}
  .sq td.nl{width:34px;height:60px;background:#fef3c7;border:1.5px solid #b45309}
  .sq td.t{width:69px;height:34px;background:#fef3c7;border:1.5px solid #b45309}
  .sq td.c{width:69px;height:60px}
  .sq td.k{width:34px;height:34px;border:1.5px solid #b45309;background:#b45309;font-family:Sora;font-weight:800;font-size:8.5px;color:#fff;text-align:center}
  .sq .low{display:grid;grid-template-columns:1.15fr 1fr;gap:14px;margin-top:10px}
  .sq .box{border:1.5px solid #1e293b;border-radius:8px;padding:6px 10px}
  .sq .box h2{font-family:Sora;font-size:9.6px;text-transform:uppercase;letter-spacing:.06em;color:#b45309;margin:0 0 4px}
  .sq .box ol{margin:0;padding-left:14px}
  .sq .box li,.sq .box p{font-size:9.6px;line-height:1.4;color:#1e293b;margin:0}
  .sq .sc{width:100%;border-collapse:collapse;table-layout:fixed}
  .sq .sc th{font-family:Sora;font-size:8.6px;color:#1e293b;text-align:left;padding:0 3px 2px}
  .sq .sc td{height:31px;border:1px solid #64748b;font-size:9.4px;font-weight:700;padding:0 4px;color:#1e293b}
  .sq .sc td.q{width:92px;background:#fef3c7}
  .sq .note{margin-top:7px;font-size:8.4px;color:#5a6b75;line-height:1.4}`;
  const rows = Array.from({ length: 10 }, () => `<tr><td class="nl"></td>${'<td class="c"></td>'.repeat(10)}</tr>`).join("");
  const grid = `<table><tbody><tr><td class="k"></td>${'<td class="t"></td>'.repeat(10)}</tr>${rows}</tbody></table>`;
  const quarters = ["Q1", "Halftime (Q2)", "Q3", "Final, with overtime"]
    .map((q) => `<tr><td class="q">${q}</td><td></td><td></td><td></td></tr>`).join("");
  const page = `<section class="page sq"><header><h1>Super Bowl LXI Squares 2027: 10x10 Grid</h1>
    <div class="sub">Super Bowl LXI · Sunday, Feb. 14, 2027 · SoFi Stadium, Inglewood, Calif.</div></header>
    <div class="tn"><span>Team across the top:</span><s></s></div>
    <div class="wrap"><div class="side"><div>Team down the side (write the name here)</div></div>${grid}</div>
    <div class="low"><div class="box"><h2>Scores and winners</h2>
      <table class="sc"><thead><tr><th>Quarter</th><th>Top team</th><th>Side team</th><th>Winner</th></tr></thead><tbody>${quarters}</tbody></table></div>
    <div class="box"><h2>How to play</h2><ol><li>Everyone writes a name in a square until all 100 are filled.</li><li>Draw the digits 0 to 9 at random for the top and for the side, and write one in each blank cell.</li><li>At the end of each quarter, find the last digit of each team's score. The square where that column and row meet wins.</li><li>The teams are set on Jan. 31, 2027. Agree before kickoff that the final square counts overtime.</li></ol></div></div>
    <p class="note">Source: NFL Football Operations, 2026 Important NFL Dates (Super Bowl LXI, Feb. 14, SoFi Stadium); NFL 2026 Official Playing Rules. Party game for fun; local laws on pools vary.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildSuperBowlSquaresDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("super-bowl-lxi-squares-2027", [{ slug: "super-bowl-lxi-squares-2027-grid", size: LETTER, html: sheet(fonts) }]);
}
