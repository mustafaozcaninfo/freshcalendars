/**
 * puzzle-month kit: a whole month of a daily puzzle's answers as a calendar, with a blank solving
 * grid in the game's shape on the next page. For "Wordle answers October 2026"-style stories.
 *
 * The answers are never typed: the kit loads the official saved data for every day of the month from
 * apps/news/src/content/puzzles/<game>/<date>.json (the same files news:puzzle-check verifies) and
 * refuses when a day is missing. The saved data is the source, so no src/quote is asked for; the
 * printed answers and their dates are returned in `computed` so the audit's fact check accepts them.
 * Portrait; the solving section continues on a second page when the calendar fills the first.
 *
 * data:
 *   game: wordle            # wordle or connections (strands, mini, spelling-bee refused for now)
 *   month: "2026-10"        # the month to lay out, YYYY-MM
 *   through: "2026-11-15"   # optional, for a month still being played: answers are required up to
 *                           # this date; later days print "Not yet played" in words (no answer)
 */
import { baseCss, header, notes, page, sizeOf } from "./components.js";
import { MON, MONTHS, Problems, esc, isObj, type Kit } from "./kit.js";
// The official puzzle loaders the site already uses; the saved files are the source of every answer.
import { GAMES, loadPuzzle, puzzleNumber } from "../../../../apps/news/src/lib/puzzles.mjs";

/** Games this kit can draw. The data model names more, but only these two are built. */
const SUPPORTED = ["wordle", "connections"] as const;
type Game = (typeof SUPPORTED)[number];
const NAMED = ["wordle", "connections", "strands", "mini", "spelling-bee"];

type Day = { day: number; iso: string; number: number | null; solution?: string; groups?: string[] };
export type PuzzleMonth = { game: Game; year: number; month: number; days: Day[]; through?: number };

const pad2 = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
/** Weekday (0 = Sunday) of the first of the month. */
const firstDow = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).getUTCDay();

export const puzzleMonth: Kit<PuzzleMonth> = {
  name: "puzzle-month",
  validate(data, _ctx) {
    const pr = new Problems("puzzle-month");
    if (!isObj(data)) { pr.add("data: needs game and month"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const game = d.game as string;
    if (!NAMED.includes(game)) pr.add(`game: one of ${NAMED.join(", ")}`);
    else if (!SUPPORTED.includes(game as Game)) pr.add(`game "${game}" is not built yet; this kit draws ${SUPPORTED.join(" and ")}`);
    const mm = typeof d.month === "string" ? /^(\d{4})-(\d{2})$/.exec(d.month) : null;
    if (!mm || Number(mm[2]) < 1 || Number(mm[2]) > 12) pr.add('month: "YYYY-MM", the month to lay out');
    // Stop here if the game or month is unusable: loading the data would be meaningless.
    let throughDay: number | undefined;
    if (d.through !== undefined) {
      const th = typeof d.through === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.through) : null;
      if (!th || `${th[1]}-${th[2]}` !== d.month) pr.add(`through: "YYYY-MM-DD" inside ${String(d.month)}, the last day already played`);
      else throughDay = Number(th[3]);
    }
    if (pr.list.length) pr.throwIfAny();

    const year = Number(mm![1]), month = Number(mm![2]) - 1;
    const total = daysInMonth(year, month);
    const days: Day[] = [];
    const missing: string[] = [];
    for (let dd = 1; dd <= (throughDay ?? total); dd++) {
      const iso = `${year}-${pad2(month + 1)}-${pad2(dd)}`;
      const raw = loadPuzzle(game, iso);
      if (!raw) { missing.push(iso); continue; }
      const number = puzzleNumber(game, iso, raw);
      if (game === "wordle") {
        if (typeof raw.solution !== "string") { pr.add(`${iso}: saved Wordle data has no solution`); continue; }
        days.push({ day: dd, iso, number, solution: raw.solution.toUpperCase() });
      } else {
        const cats = Array.isArray(raw.categories) ? raw.categories : [];
        if (cats.length !== 4) { pr.add(`${iso}: saved Connections data needs four groups`); continue; }
        days.push({ day: dd, iso, number, groups: cats.map((c: { title: string }) => String(c.title)) });
      }
    }
    if (missing.length) pr.add(`no saved ${GAMES[game].name} data for ${missing.length} day(s): ${missing.join(", ")}. Save each with "pnpm news:puzzle-data <date>" first (answers are never typed).`);
    pr.throwIfAny();
    return { game: game as Game, year, month, days, through: throughDay };
  },

  render(k, p, ctx) {
    const t = ctx.theme, size = sizeOf(false, ctx.paper);
    const total = daysInMonth(k.year, k.month);
    const byDay = new Map(k.days.map((x) => [x.day, x]));
    const lead = firstDow(k.year, k.month);

    // One cell per calendar square; the answer and puzzle number sit in the day's cell.
    const cell = (dd: number): string => {
      const x = byDay.get(dd);
      // A day after `through` has not been played yet: said in words, no answer drawn.
      if (!x) return `<div class="c later"><span class="d">${dd}</span><span class="nyp">Not yet played</span></div>`;
      const num = x.number != null ? `<span class="num">No. ${x.number}</span>` : "";
      const ans = k.game === "wordle"
        ? `<span class="ans">${esc(x.solution!)}</span>`
        : `<ul class="grp">${x.groups!.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>`;
      return `<div class="c"><span class="d">${dd}</span>${num}${ans}</div>`;
    };
    // Weeks are the movable units: a busy Connections month overflows onto a second page week by week.
    const weeks: string[] = [];
    let row: string[] = [];
    for (let i = 0; i < lead; i++) row.push(`<div class="c empty"></div>`);
    for (let dd = 1; dd <= total; dd++) {
      row.push(cell(dd));
      if (row.length === 7) { weeks.push(row.join("")); row = []; }
    }
    if (row.length) { while (row.length < 7) row.push(`<div class="c empty"></div>`); weeks.push(row.join("")); }
    const dw = ["S", "M", "T", "W", "T", "F", "S"].map((x) => `<i>${x}</i>`).join("");
    const cal = `<div class="dw blk">${dw}</div><div class="cal flow">${weeks.map((w) => `<div class="wk blk">${w}</div>`).join("")}</div>`;

    // Blank solving section in the game's shape, drawn with borders (vector), one unit so it can move.
    const solve = k.game === "wordle" ? wordleSolver() : connectionsSolver();

    const css = `${baseCss(t, false)}
    .dw{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:2px}
    .dw i{font-style:normal;font-family:Sora;font-weight:700;font-size:max(9px,calc(10px*var(--s)));color:${t.primary}}
    .cal{display:flex;flex-direction:column;gap:0}
    .wk{display:grid;grid-template-columns:repeat(7,1fr)}
    .c .nyp{display:block;margin-top:calc(8px*var(--s));font-size:9px;color:${t.muted}}
    .c{border:1px solid ${t.line};min-height:calc(${k.game === "wordle" ? 56 : 74}px*var(--s));padding:3px 4px;display:flex;flex-direction:column;gap:1px;overflow:hidden}
    .c.empty{background:${t.soft}}
    .c .d{font-family:Sora;font-weight:800;font-size:max(9px,calc(11px*var(--s)));color:${t.ink};line-height:1}
    .c .num{font-size:max(8px,calc(8.5px*var(--s)));color:${t.muted};line-height:1.1}
    .c .ans{font-family:Sora;font-weight:800;font-size:max(10px,calc(14px*var(--s)));letter-spacing:.06em;color:${t.primary};margin-top:auto}
    .c .grp{list-style:none;margin:1px 0 0;padding:0}
    .c .grp li{font-size:max(8px,calc(8.5px*var(--s)));line-height:1.18;color:${t.ink};font-weight:700}
    .solve{border:1.4px solid ${t.line};border-radius:10px;padding:calc(8px*var(--s)) 12px;margin-top:calc(10px*var(--s))}
    .solve h3{font-family:Sora;font-size:calc(11px*var(--s));margin:0 0 7px;color:${t.primary}}
    .sgrid{display:grid;gap:5px;justify-content:start}
    .sgrid .cell{width:calc(26px*var(--s));height:calc(26px*var(--s));border:1.6px solid ${t.primary};border-radius:4px}
    .wgrids{display:flex;gap:26px;flex-wrap:wrap}
    .trk{display:grid;grid-template-columns:repeat(13,1fr);gap:4px;margin-top:9px;max-width:420px}
    .trk span{border:1px solid ${t.line};border-radius:3px;text-align:center;font-family:Sora;font-weight:700;font-size:max(9px,calc(10px*var(--s)));color:${t.ink};padding:2px 0}
    .glines p{display:flex;gap:9px;align-items:flex-end;margin:9px 0 0;font-size:max(9px,calc(10px*var(--s)))}
    .glines p span{font-family:Sora;font-weight:700;color:${t.primary};white-space:nowrap}
    .glines p i{flex:1;border-bottom:1px solid ${t.muted};height:13px}`;

    const sub = `${GAMES[k.game].name} answers for ${MONTHS[k.month]} 1 to ${total}, ${k.year}, from the official saved data`;
    const body = `${header(t, p.title, sub)}${cal}${solve}${notes(p.notesLabel)}`;
    // Dates and answers the sheet shows, so 10-PDF-FACTS accepts them (the saved data is the source).
    const computed = k.days.map((x) => `${MON[k.month]} ${x.day}, ${k.year}: ${k.game === "wordle" ? x.solution : x.groups!.join("; ")}`);
    return { html: page(ctx, size, css, body, p.note), size, computed, warnings: [] };
  },
};

/** Wordle: two blank six-by-five guess grids and an A-Z letter tracker. */
function wordleSolver(): string {
  const grid = `<div class="sgrid" style="grid-template-columns:repeat(5,auto)">${"<div class=\"cell\"></div>".repeat(30)}</div>`;
  const tracker = `<div class="trk">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => `<span>${l}</span>`).join("")}</div>`;
  return `<div class="solve blk"><h3>Blank solving grids and letter tracker</h3><div class="wgrids">${grid}${grid}</div>${tracker}</div>`;
}

/** Connections: a blank four-by-four board and four lines to write the groups found. */
function connectionsSolver(): string {
  const grid = `<div class="sgrid" style="grid-template-columns:repeat(4,auto)">${"<div class=\"cell\" style=\"width:58px;height:58px\"></div>".repeat(16)}</div>`;
  const lines = `<div class="glines">${[1, 2, 3, 4].map((n) => `<p><span>Group ${n}</span><i></i></p>`).join("")}</div>`;
  return `<div class="solve blk"><h3>Blank board and your four groups</h3>${grid}${lines}</div>`;
}
