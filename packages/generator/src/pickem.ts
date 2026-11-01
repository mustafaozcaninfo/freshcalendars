/**
 * NFL pick'em hub for the /news/ story printable-nfl-pickem-sheets-2026. Everything comes from the verified
 * schedule CSV (nflData.ts; refresh it first with `pnpm fc nfl-sync --write`):
 *  - weekly sheets for the current week and the next three (classic, confidence pool, office pool grid; Letter and A4),
 *  - two season sheets (survivor pool with every team's bye week, season standings tracker),
 *  - the story's tables between the pickem:* markers, its `downloads:` block and `updatedAt`.
 * Sheets of weeks that have rolled off are deleted; each week story keeps its own sheet.
 * Usage: pnpm fc news-pickem [--weeks 9-12]
 */
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LETTER, LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { renderPrintables, type Printable, type Size } from "./printables.js";
import { ROOT } from "./paths.js";
import { MON, dayOf, games as allGames, nick, timeOf } from "./nflData.js";

const STORY = "printable-nfl-pickem-sheets-2026";
const STORY_FILE = path.join(ROOT, "apps/news/src/content/articles/2026/10", `${STORY}.md`);
const GROUP = "nfl-pickem-2026";
const A4: Size = { width: 794, height: 1123 };
const ARTICLES = path.join(ROOT, "apps/news/src/content/articles");

type Game = { day: string; time: string; away: string; home: string; tv: string; note?: string; utc: string; result?: string };
type Week = { n: number; range: string; byes: string; byeList: string[]; checked: string; games: Game[]; first: string; last: string; done: boolean };

const now = new Date();
const checkedLabel = (() => { const d = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now); const g = (t: string) => +d.find((x) => x.type === t)!.value; return `${MON[g("month") - 1]} ${g("day")}, ${g("year")}`; })();
const yearOf = (utc: string) => +new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric" }).format(new Date(utc));

/** Weeks 1-18 from the CSV, in kickoff order; games without a kickoff (Week 18 until it is set) go last. */
function loadWeeks(): Week[] {
  const all = allGames();
  const teams = [...new Set(all.flatMap((g) => [g.awayName, g.homeName]))].sort();
  const weeks: Week[] = [];
  for (let n = 1; n <= 18; n++) {
    const list = all.filter((g) => g.week === n).sort((a, b) => (a.utc || "9").localeCompare(b.utc || "9") || a.awayName.localeCompare(b.awayName));
    const playing = new Set(list.flatMap((g) => [g.awayName, g.homeName]));
    const byeList = teams.filter((t) => !playing.has(t)).map(nick);
    const dated = list.filter((g) => g.utc);
    const first = dated[0]?.utc ?? "", last = dated.at(-1)?.utc ?? "";
    const y1 = first ? yearOf(first) : 2027, y2 = last ? yearOf(last) : 2027;
    const range = first ? (y1 === y2 ? `${dayOf(first)} to ${dayOf(last)}, ${y2}` : `${dayOf(first)}, ${y1} to ${dayOf(last)}, ${y2}`) : "Sat., Jan. 9 and Sun., Jan. 10, 2027";
    weeks.push({
      n, range, byeList, byes: byeList.length ? byeList.join(", ") : "none", checked: checkedLabel, first, last,
      done: list.every((g) => g.status === "completed"),
      games: list.map((g) => ({
        day: g.utc ? dayOf(g.utc) : "Not set", time: g.utc ? timeOf(g.utc) : "Not set", away: nick(g.awayName), home: nick(g.homeName),
        tv: g.tv || "Not set", note: g.city, utc: g.utc,
        result: g.status === "completed" && g.awayScore !== "" ? `${nick(g.awayName)} ${g.awayScore}, ${nick(g.homeName)} ${g.homeScore}` : undefined,
      })),
    });
  }
  return weeks;
}

/** The week in play: the first one whose last game is not over (kickoff plus five hours). */
function currentWeek(weeks: Week[]): number {
  for (const w of weeks) if (!w.last || new Date(w.last).getTime() + 5 * 3600_000 > now.getTime() || w.games.some((g) => !g.utc)) return w.n;
  return 18;
}

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
.at{font:800 9px Manrope;color:#5a6b75;text-align:center;width:22px}
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
.season h1{font-size:25px}
.sv td{height:var(--rh)}.sv .wkn{font:800 12px Sora;width:44px}.sv .dates{font:700 10px Manrope;color:#46566a;width:170px}
.teams{display:grid;grid-template-columns:repeat(4,1fr);gap:0 14px;margin-top:12px;font:700 10.5px Manrope;color:#0f2a4a}
.teams div{display:flex;align-items:center;gap:6px;border-bottom:.8px solid #b9c3cf;height:22px}
.teams i{font-style:normal;font:700 9px Manrope;color:#46566a;margin-left:auto}
.h2{font:800 10px Manrope;letter-spacing:.12em;text-transform:uppercase;color:#46566a;margin-top:12px}
.trk th{text-align:center;padding:4px 2px}.trk th small{display:block;font:700 8px Manrope;letter-spacing:0;color:#46566a;text-transform:none}
.trk td{border-right:.8px solid #b9c3cf}.trk td:first-child{width:150px}
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
  const src = `<div class="src">Source: National Football League schedule (NFL.com and club sites) and ESPN, checked ${w.checked}. Times can change; check NFL.com before kickoff. Fresh Calendars is not affiliated with the NFL.</div>`;
  const page = `<div class="page${ink ? " ink" : ""}"><div class="sheet">${head}${fields}${due}${table}${tie}<div class="rules">${rules}</div>${src}</div><div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/</div></div>`;
  return page;
}

const SRC = (checked: string) => `<div class="src">Source: National Football League schedule (NFL.com and club sites) and ESPN, checked ${checked}. Times can change; check NFL.com before kickoff. Fresh Calendars is not affiliated with the NFL.</div>`;
const FOOT = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/</div>`;
const short = (utc: string) => { const d = dayOf(utc); return d.replace(/^\w+\., /, ""); };

/** Survivor pool: one pick a week, never the same team twice; the team list carries each bye week. */
function survivor(weeks: Week[]): string {
  const rh = 30;
  const rows = weeks.map((w) => `<tr><td class="wkn">${w.n}</td><td class="dates">${w.first ? `${short(w.first)} to ${short(w.last)}` : "Jan. 9-10"}</td><td><span class="line" style="--w:190px"></span></td><td class="pts">${box}</td><td class="pts">${box}</td></tr>`).join("");
  const byeOf = new Map<string, number>();
  for (const w of weeks) for (const t of w.byeList) byeOf.set(t, w.n);
  const teams = [...new Set(weeks.flatMap((w) => w.games.flatMap((g) => [g.away, g.home])))].sort();
  const list = teams.map((t) => `<div>${box}<span>${t}</span><i>bye ${byeOf.get(t) ?? "-"}</i></div>`).join("");
  const head = `<div class="top"><div><div class="kick">2026 NFL season · survivor pool</div><h1>NFL Survivor Pool Sheet 2026</h1><div class="sub">Weeks 1 to 18 · ${short(weeks[0]!.first)}, 2026 to Jan. 10, 2027 · Bye weeks from the NFL schedule</div></div><div class="wk"><small>WEEKS</small>18</div></div>`;
  const body = `<div class="fields"><span>Name:</span><span>Pool:</span><span style="flex:.6">Weeks alive:</span></div>
  <table class="sv" style="--rh:${rh}px"><tr><th>Week</th><th>Dates (ET)</th><th>Your pick</th><th style="text-align:center">Won</th><th style="text-align:center">Lost</th></tr>${rows}</table>
  <div class="h2">Teams used · tick a team when you pick it</div><div class="teams">${list}</div>
  <div class="rules"><b>How to play:</b> pick one team to win each week before its kickoff. If it wins, you survive to the next week; if it loses or ties, you are out, unless your pool allows a second entry. You can use each team only once all season, and a team on its bye week cannot be picked.</div>`;
  return `<div class="page ink season"><div class="sheet">${head}${body}${SRC(checkedLabel)}</div>${FOOT}</div>`;
}

/** Season standings tracker: points per player per week and a season total, landscape. */
function tracker(weeks: Week[]): string {
  const players = 14;
  const th = weeks.map((w) => `<th>W${w.n}<small>${w.first ? short(w.first).replace(/\.? /, " ").replace(/^(\w{3})\w*/, "$1") : "Jan 9"}</small></th>`).join("");
  const rows = Array.from({ length: players }, () => `<tr><td></td>${"<td></td>".repeat(18)}<td></td></tr>`).join("");
  const head = `<div class="top"><div><div class="kick">2026 NFL season · pool standings</div><h1>NFL Season Pick'em Standings Tracker 2026</h1><div class="sub">Write each player's weekly points; add the total after Week 18 · Week start dates in Eastern Time (ET)</div></div><div class="wk"><small>WEEKS</small>18</div></div>`;
  const body = `<div class="fields"><span>Pool name:</span><span>Scoring (1 point a win, or confidence points):</span></div>
  <table class="trk grid" style="--rh:34px"><tr><th style="text-align:left">Player</th>${th}<th>Total</th></tr>${rows}<tr class="tot"><td>Weekly winner</td>${"<td></td>".repeat(19)}</tr></table>
  <div class="rules"><b>How to use it:</b> after Monday's game, copy each player's score from the weekly sheet into that week's column. The closest tiebreaker guess can decide each week's winner; the season total decides the pool.</div>`;
  return `<div class="page ink season"><div class="sheet">${head}${body}${SRC(checkedLabel)}</div>${FOOT}</div>`;
}

// ---------- story ----------
type Dl = { group: string; title: string; description: string; slug: string; alt: string };

function etStamp(d: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "longOffset" }).formatToParts(d).map((x) => [x.type, x.value]));
  const off = parts.timeZoneName!.replace("GMT", "") || "+00:00";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00${off}`;
}

function weekStory(n: number): string | undefined {
  const re = new RegExp(`^nfl-week-${n}-schedule-2026.*\\.md$`);
  for (const y of readdirSync(ARTICLES)) for (const m of readdirSync(path.join(ARTICLES, y))) {
    const f = readdirSync(path.join(ARTICLES, y, m)).find((x) => re.test(x));
    if (f) return f.replace(/\.md$/, "");
  }
  return undefined;
}

function sections(weeks: Week[], window: number[]): Record<string, string> {
  const cur = weeks[window[0]! - 1]!;
  const tie = (w: Week) => w.games.at(-1)!;
  const nowRows = cur.games.map((g) => `| ${g.day} | ${g.time} | ${g.away} ${g.note ? "vs." : "at"} ${g.home}${g.note ? ` (${g.note})` : ""} | ${g.tv} | ${g.result ?? ""} |`).join("\n");
  const story = weekStory(cur.n);
  const now = [
    `**Week ${cur.n}: ${cur.range}.** ${cur.games.length} games; picks are due before ${cur.games[0]!.away} at ${cur.games[0]!.home}, ${cur.games[0]!.day} at ${cur.games[0]!.time} ET. The tiebreaker on the sheets is the total points in ${tie(cur).away} at ${tie(cur).home} (${tie(cur).day}, ${tie(cur).time} ET). On bye: ${cur.byes}.${story ? ` Local times in every U.S. time zone are in our [Week ${cur.n} schedule story](/news/${story}/).` : ""}`,
    "", "| Day | Kickoff (ET) | Game | TV | Final |", "|---|---|---|---|---|", nowRows, "",
    ...window.slice(1).map((n) => {
      const w = weeks[n - 1]!, s = weekStory(n), f = w.games[0]!;
      return `- **Week ${n}, ${w.range}:** ${w.games.length} games, first kickoff ${f.away} ${f.note ? "vs." : "at"} ${f.home} ${f.day} at ${f.time} ET; tiebreaker ${tie(w).away} at ${tie(w).home}; on bye: ${w.byes}.${s ? ` [Week ${n} schedule](/news/${s}/).` : ""}`;
    }),
  ].join("\n");
  const idx = ["| Week | Dates (ET) | Games | Teams on bye | Status |", "|---|---|---|---|---|", ...weeks.map((w) => {
    const s = weekStory(w.n);
    const status = w.done ? "Final" : window.includes(w.n) ? "Sheets on this page" : "Sheets added as the week nears";
    return `| ${s ? `[Week ${w.n}](/news/${s}/)` : `Week ${w.n}`} | ${w.range} | ${w.games.length} | ${w.byeList.length ? w.byes : "None"} | ${status} |`;
  })].join("\n");
  const byeOf: [string, Week][] = [];
  for (const w of weeks) for (const t of w.byeList) byeOf.push([t, w]);
  byeOf.sort((a, b) => a[0].localeCompare(b[0]));
  const byes = ["| Team | Bye week | That week's games |", "|---|---|---|", ...byeOf.map(([t, w]) => `| ${t} | Week ${w.n} | ${w.range} |`)].join("\n");
  return { now, index: idx, byes };
}

function yamlStr(s: string) { return JSON.stringify(s); }

function updateStory(weeks: Week[], window: number[], dls: Dl[]): boolean {
  let md = readFileSync(STORY_FILE, "utf8");
  const before = md;
  for (const [k, v] of Object.entries(sections(weeks, window))) {
    const a = `<!-- pickem:${k}:start -->`, b = `<!-- pickem:${k}:end -->`;
    if (!md.includes(a)) throw new Error(`story has no ${a} marker`);
    md = md.replace(new RegExp(`${a}[\\s\\S]*?${b}`), `${a}\n\n${v}\n\n${b}`);
  }
  const block = "downloads:\n" + dls.map((d) => [
    `  - group: ${yamlStr(d.group)}`, `    title: ${yamlStr(d.title)}`, `    description: ${yamlStr(d.description)}`,
    `    preview: ../../../../assets/news/${GROUP}/${d.slug}.png`, `    alt: ${yamlStr(d.alt)}`,
    `    pdf: "/news/downloads/${GROUP}/${d.slug}.pdf"`, `    png: "/news/downloads/${GROUP}/${d.slug}.png"`, "    pages: 1",
  ].join("\n")).join("\n") + "\n";
  md = md.replace(/^downloads:\n[\s\S]*?(?=^---$)/m, block);
  if (md === before) return false;
  md = md.replace(/^updatedAt: .*$/m, `updatedAt: "${etStamp(now)}"`);
  writeFileSync(STORY_FILE, md);
  return true;
}

export async function buildPickem(weeksArg?: string): Promise<void> {
  const weeks = loadWeeks();
  const cur = currentWeek(weeks);
  const [from, to] = weeksArg ? weeksArg.split("-").map(Number) as [number, number] : [cur, Math.min(18, cur + 3)];
  const window = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const fonts = await fontFaces();
  const list: Printable[] = [];
  const dls: Dl[] = [];
  const fslug: Record<Format, string> = { classic: "pick-em-sheet", confidence: "confidence-pool-sheet", pool: "office-pool-grid" };
  const fdesc: Record<Format, string> = {
    classic: "classic pick'em sheet: tick the winner of each game, final score blanks and a tiebreaker",
    confidence: "confidence pool sheet: tick a winner and give each game a different point value",
    pool: "office pool grid: one column per player, tiebreaker and correct-picks rows",
  };
  for (const n of window) {
    const w = weeks[n - 1]!;
    for (const f of ["classic", "confidence", "pool"] as Format[]) {
      for (const [tag, size, sz] of [["", LETTER, "US Letter"], ["-a4", A4, "A4"]] as const) {
        const slug = `nfl-week-${n}-${fslug[f]}-2026${tag}`;
        list.push({ slug, size, html: doc(fonts, size, CSS, [sheet(w, f, size, true)]) });
        dls.push({
          group: `NFL Week ${n} Pick'em Sheets 2026`, slug,
          title: `NFL Week ${n} ${FORMAT_NAME[f]} 2026${tag ? " (A4)" : ""}`,
          description: `Free one-page NFL Week ${n} ${fdesc[f]}. ${w.games.length} games, ${w.range}, kickoff times in ET. ${sz} size.`,
          alt: `Printable NFL Week ${n} ${FORMAT_NAME[f].toLowerCase()} for 2026 listing every game with tick boxes, ${sz} size`,
        });
      }
    }
  }
  list.push({ slug: "nfl-survivor-pool-sheet-2026", size: LETTER, html: doc(fonts, LETTER, CSS, [survivor(weeks)]) });
  dls.push({ group: "NFL Season Pick'em Sheets 2026", slug: "nfl-survivor-pool-sheet-2026", title: "NFL Survivor Pool Sheet 2026",
    description: "Free one-page NFL survivor pool sheet for 2026: a pick line for Weeks 1 to 18 with dates, won and lost boxes, and all 32 teams with their bye weeks. US Letter size.",
    alt: "Printable NFL survivor pool sheet for 2026 with Weeks 1 to 18 and a checklist of 32 teams with bye weeks" });
  list.push({ slug: "nfl-season-pick-em-tracker-2026", size: LETTER_LANDSCAPE, html: doc(fonts, LETTER_LANDSCAPE, CSS, [tracker(weeks)]) });
  dls.push({ group: "NFL Season Pick'em Sheets 2026", slug: "nfl-season-pick-em-tracker-2026", title: "NFL Season Pick'em Standings Tracker 2026",
    description: "Free one-page NFL season pick'em standings tracker for 2026: 14 players, a column for each of Weeks 1 to 18 with start dates, a total and a weekly winner row. US Letter landscape.",
    alt: "Printable NFL season pick'em standings tracker for 2026 with 14 player rows and columns for Weeks 1 to 18" });

  // Sheets of weeks before the window roll off; the week stories keep their own sheets.
  for (const dir of [path.join(ROOT, "apps/news/public/downloads", GROUP), path.join(ROOT, "apps/news/src/assets/news", GROUP)]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      const m = f.match(/^nfl-week-(\d+)-/);
      if (m && +m[1]! < from) { unlinkSync(path.join(dir, f)); console.log(`removed ${f}`); }
    }
  }
  await renderPrintables(GROUP, list);
  const changed = updateStory(weeks, window, dls);
  console.log(`Weeks ${from}-${to} (current week ${cur}), ${list.length} sheets; story ${changed ? "updated" : "unchanged"}.`);
}
