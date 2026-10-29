/**
 * NFL pick'em sheets for the /news/ story printable-nfl-pickem-sheets-2026: three formats (classic
 * winner picks, confidence pool, office pool grid) per week, each in US Letter and A4. Games come
 * from the NFL.com schedule as published in our week stories; team names in plain text, no logos.
 * Usage: pnpm fc news-pickem
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables, type Printable, type Size } from "./printables.js";

const STORY = "printable-nfl-pickem-sheets-2026";
const GROUP = "nfl-pickem-2026";
const A4: Size = { width: 794, height: 1123 };

type Game = { day: string; time: string; away: string; home: string; tv: string; note?: string };
type Week = { n: number; range: string; byes: string; checked: string; games: Game[] };

/** Source: NFL.com schedule, as checked for our Week 8 and Week 9 stories (Oct. 28, 2026). */
const WEEKS: Week[] = [
  {
    n: 8, range: "Thu., Oct. 29 to Mon., Nov. 2, 2026", byes: "Texans, Saints, Giants, 49ers", checked: "Oct. 28, 2026",
    games: [
      { day: "Thu., Oct. 29", time: "8:15 p.m.", away: "Panthers", home: "Packers", tv: "Prime Video" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Ravens", home: "Bills", tv: "CBS" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Titans", home: "Bengals", tv: "CBS" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Colts", home: "Jaguars", tv: "CBS" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Browns", home: "Steelers", tv: "CBS" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Cardinals", home: "Cowboys", tv: "FOX" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Vikings", home: "Lions", tv: "FOX" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Raiders", home: "Jets", tv: "FOX" },
      { day: "Sun., Nov. 1", time: "1:00 p.m.", away: "Falcons", home: "Buccaneers", tv: "FOX" },
      { day: "Sun., Nov. 1", time: "4:05 p.m.", away: "Chargers", home: "Rams", tv: "FOX" },
      { day: "Sun., Nov. 1", time: "4:25 p.m.", away: "Chiefs", home: "Broncos", tv: "CBS" },
      { day: "Sun., Nov. 1", time: "4:25 p.m.", away: "Patriots", home: "Dolphins", tv: "CBS" },
      { day: "Sun., Nov. 1", time: "8:20 p.m.", away: "Eagles", home: "Commanders", tv: "NBC" },
      { day: "Mon., Nov. 2", time: "8:15 p.m.", away: "Bears", home: "Seahawks", tv: "ESPN" },
    ],
  },
  {
    n: 9, range: "Thu., Nov. 5 to Mon., Nov. 9, 2026", byes: "Steelers, Titans", checked: "Oct. 28, 2026",
    games: [
      { day: "Thu., Nov. 5", time: "8:15 p.m.", away: "Jaguars", home: "Ravens", tv: "Prime Video" },
      { day: "Sun., Nov. 8", time: "9:30 a.m.", away: "Bengals", home: "Falcons", tv: "NFL Network", note: "Madrid" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Browns", home: "Saints", tv: "CBS" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Cowboys", home: "Colts", tv: "FOX" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Broncos", home: "Panthers", tv: "CBS" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Lions", home: "Dolphins", tv: "FOX" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Rams", home: "Commanders", tv: "FOX" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Giants", home: "Eagles", tv: "FOX" },
      { day: "Sun., Nov. 8", time: "1:00 p.m.", away: "Jets", home: "Chiefs", tv: "CBS" },
      { day: "Sun., Nov. 8", time: "4:05 p.m.", away: "Texans", home: "Chargers", tv: "CBS" },
      { day: "Sun., Nov. 8", time: "4:05 p.m.", away: "Raiders", home: "49ers", tv: "CBS" },
      { day: "Sun., Nov. 8", time: "4:25 p.m.", away: "Cardinals", home: "Seahawks", tv: "FOX" },
      { day: "Sun., Nov. 8", time: "4:25 p.m.", away: "Packers", home: "Patriots", tv: "FOX" },
      { day: "Sun., Nov. 8", time: "8:20 p.m.", away: "Buccaneers", home: "Bears", tv: "NBC" },
      { day: "Mon., Nov. 9", time: "8:15 p.m.", away: "Bills", home: "Vikings", tv: "ESPN, ABC" },
    ],
  },
];

type Format = "classic" | "confidence" | "pool";
const FORMAT_NAME: Record<Format, string> = { classic: "Pick'em Sheet", confidence: "Confidence Pool Sheet", pool: "Office Pool Grid" };

const CSS = `
.sheet{padding:44px 46px 40px;height:100%;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #0f2a4a;padding-bottom:10px}
.kick{font:800 10.5px Manrope;letter-spacing:.16em;text-transform:uppercase;color:#b4232c}
h1{font:800 27px/1.05 Sora;margin:4px 0 0;color:#0f2a4a;letter-spacing:-.01em}
.sub{font:700 11.5px Manrope;color:#46566a;margin-top:5px}
.wk{font:800 44px/1 Sora;color:#0f2a4a;text-align:right}.wk small{display:block;font:800 10px Manrope;letter-spacing:.14em;color:#46566a}
.fields{display:flex;gap:18px;margin:12px 0 6px;font:700 11.5px Manrope;color:#0f2a4a}
.fields span{flex:1;border-bottom:1.2px solid #0f2a4a;padding-bottom:3px;white-space:nowrap}
.due{font:700 10.5px Manrope;color:#b4232c;margin:2px 0 8px}
table{width:100%;border-collapse:collapse;font:700 11.5px Manrope;color:#0f2a4a}
th{font:800 9px Manrope;letter-spacing:.12em;text-transform:uppercase;color:#46566a;text-align:left;padding:5px 6px;border-bottom:1.5px solid #0f2a4a}
td{padding:0 6px;border-bottom:.8px solid #b9c3cf;height:var(--rh)}
tr:nth-child(even) td{background:#f4f6f9}
.when{font:700 10px Manrope;color:#46566a;white-space:nowrap}.when b{display:block;color:#0f2a4a;font-size:11px}
.team{display:flex;align-items:center;gap:7px;white-space:nowrap}
.box{display:inline-block;width:15px;height:15px;border:1.6px solid #0f2a4a;border-radius:3px;flex:none}
.at{font:800 9px Manrope;color:#8a96a6;text-align:center;width:22px}
.tv{font:700 9.5px Manrope;color:#46566a}
.line{display:inline-block;border-bottom:1.2px solid #0f2a4a;width:var(--w,34px);height:14px;vertical-align:bottom}
.pts{text-align:center}
.grid td{border-right:.8px solid #b9c3cf;padding:0 5px}.grid td:last-child{border-right:0}
.grid .gm{white-space:nowrap}.grid .gm b{font-size:11px}.grid .gm i{display:block;font:700 9px Manrope;color:#46566a;font-style:normal}
.grid th.p{text-align:center;height:34px;vertical-align:bottom;border-right:.8px solid #b9c3cf}
.grid tr.tot td{background:#e8edf3;font:800 10px Manrope;letter-spacing:.06em;text-transform:uppercase}
.tie{margin-top:12px;display:flex;gap:16px;align-items:center;border:1.6px solid #0f2a4a;border-radius:8px;padding:9px 12px;font:700 11.5px Manrope;color:#0f2a4a}
.tie b{font:800 10px Manrope;letter-spacing:.12em;text-transform:uppercase;color:#b4232c}
.rules{margin-top:10px;font:700 10px/1.45 Manrope;color:#46566a}
.rules b{color:#0f2a4a}
.src{margin-top:auto;font:700 9px/1.4 Manrope;color:#5a6b75;padding-top:8px}
.ink tr:nth-child(even) td,.ink .grid tr.tot td{background:none}.ink .top{border-bottom-width:1.5px}.ink .kick,.ink .due,.ink .tie b{color:#0f2a4a}
`;

const box = '<span class="box"></span>';

function sheet(w: Week, f: Format, size: Size, ink: boolean): string {
  const last = w.games[w.games.length - 1]!;
  const first = w.games[0]!;
  const n = w.games.length;
  const name = FORMAT_NAME[f];
  const title = `NFL Week ${w.n} ${name} 2026`;
  // Row height fills the page: the table gets what the header, tiebreaker and notes leave.
  const avail = size.height - (f === "pool" ? 370 : 360);
  const rh = Math.max(28, Math.min(46, Math.floor(avail / (n + (f === "pool" ? 3 : 1)))));
  const when = (g: Game) => `<td class="when"><b>${g.day}</b>${g.time} ET</td>`;
  const matchup = (g: Game) => `<td><span class="team">${box}${g.away}</span></td><td class="at">at</td><td><span class="team">${box}${g.home}${g.note ? ` <span class="tv">(${g.note})</span>` : ""}</span></td>`;
  let table = "";
  if (f === "classic") {
    table = `<table style="--rh:${rh}px"><tr><th>Kickoff</th><th>Away</th><th></th><th>Home</th><th>TV</th><th>Final score</th></tr>${w.games.map((g) => `<tr>${when(g)}${matchup(g)}<td class="tv">${g.tv}</td><td><span class="line" style="--w:28px"></span> – <span class="line" style="--w:28px"></span></td></tr>`).join("")}</table>`;
  } else if (f === "confidence") {
    table = `<table style="--rh:${rh}px"><tr><th>Kickoff</th><th>Away</th><th></th><th>Home</th><th>TV</th><th style="text-align:center">Points (1-${n})</th><th style="text-align:center">Won?</th></tr>${w.games.map((g) => `<tr>${when(g)}${matchup(g)}<td class="tv">${g.tv}</td><td class="pts"><span class="line" style="--w:44px"></span></td><td class="pts">${box}</td></tr>`).join("")}</table>`;
  } else {
    const players = size.width > 800 ? 8 : 7;
    table = `<table class="grid" style="--rh:${rh}px"><tr><th>Game (away at home) · ET</th>${Array.from({ length: players }, (_, i) => `<th class="p">Player ${i + 1}<br><span class="line" style="--w:52px"></span></th>`).join("")}</tr>${w.games.map((g) => `<tr><td class="gm"><b>${g.away} at ${g.home}</b><i>${g.day} · ${g.time}</i></td>${"<td></td>".repeat(players)}</tr>`).join("")}<tr class="tot"><td>Tiebreaker: total points</td>${"<td></td>".repeat(players)}</tr><tr class="tot"><td>Correct picks</td>${"<td></td>".repeat(players)}</tr></table>`;
  }
  const rules = f === "classic"
    ? "<b>How to play:</b> tick one team in every game before its kickoff. Each correct winner scores 1 point. Ties go to the closest tiebreaker guess; your pool can set its own rules."
    : f === "confidence"
      ? `<b>How to play:</b> tick a winner in every game, then give each game a different number from 1 to ${n}: ${n} for the pick you trust most, 1 for the least. A correct pick scores its number. Use each number once.`
      : "<b>How to play:</b> each player writes a name at the top of a column and the team they pick in every row before kickoff. Count correct picks at the bottom; the closest tiebreaker guess breaks a tie.";
  const head = `<div class="top"><div><div class="kick">2026 NFL season · ${f === "pool" ? "office pool" : f === "confidence" ? "confidence pool" : "weekly picks"}</div><h1>${title}</h1><div class="sub">${n} games · ${w.range} · Kickoff times Eastern Time (ET) · Byes: ${w.byes}</div></div><div class="wk"><small>WEEK</small>${w.n}</div></div>`;
  const fields = f === "pool"
    ? `<div class="fields"><span>Pool name:</span><span>Organizer:</span></div>`
    : `<div class="fields"><span>Name:</span><span>Pool:</span><span style="flex:.6">Score:</span></div>`;
  const due = `<div class="due">Picks due before the first kickoff: ${first.day}, ${first.time} ET (${first.away} at ${first.home}).</div>`;
  const tie = f === "pool" ? "" : `<div class="tie"><b>Tiebreaker</b><span>Total points in the last game, ${last.away} at ${last.home} (${last.day}): <span class="line" style="--w:70px"></span></span></div>`;
  const src = `<div class="src">Source: National Football League schedule at NFL.com, checked ${w.checked}. Times can change; check NFL.com before kickoff. Fresh Calendars is not affiliated with the NFL.</div>`;
  const page = `<div class="page${ink ? " ink" : ""}"><div class="sheet">${head}${fields}${due}${table}${tie}<div class="rules">${rules}</div>${src}</div><div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/</div></div>`;
  return page;
}

export async function buildPickem(): Promise<void> {
  const fonts = await fontFaces();
  const list: Printable[] = [];
  for (const w of WEEKS) {
    for (const f of ["classic", "confidence", "pool"] as Format[]) {
      for (const [tag, size] of [["", LETTER], ["-a4", A4]] as const) {
        const slug = `nfl-week-${w.n}-${f === "classic" ? "pick-em-sheet" : f === "confidence" ? "confidence-pool-sheet" : "office-pool-grid"}-2026${tag}`;
        list.push({ slug, size, html: doc(fonts, size, CSS, [sheet(w, f, size, true)]) });
      }
    }
  }
  await renderPrintables(GROUP, list);
}
