/**
 * Election Night 2026 live blog (/news/election-day-2026-results-map/): rebuilds the scoreboard,
 * the two tile maps and the race tables of that story from two JSON files, so the map, the tables
 * and the chamber counts can never disagree while editors update the page on election night.
 *
 *   packages/generator/data/election-live-2026.json         static: states, poll closing waves, seats, official links
 *   packages/generator/data/election-live-2026-status.json  what editors change: as-of time, race calls, House counts
 *
 * Usage: pnpm fc news-electionlive [--check] [--story <path>] [--status <path>]
 * It replaces only the text between `<!-- live:NAME:start -->` and `<!-- live:NAME:end -->` in the story.
 * Nothing here reads the clock: every time shown comes from `asOf`, so a rerun changes nothing.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./paths.js";
import { LETTER, doc } from "./julian.js";

const DATA = "packages/generator/data/election-live-2026.json";
const STATUS = "packages/generator/data/election-live-2026-status.json";
const STORY = "apps/news/src/content/articles/2026/11/election-day-2026-results-map.md";

type Party = "D" | "R" | "I" | "O";
type RaceStatus = "awaiting" | "counting" | "called" | "close";
type Race = { status?: RaceStatus; winner?: string; winnerParty?: Party; calledBy?: string[]; official?: boolean; at?: string; note?: string };
type Status = { asOf: string; headline: string; races: Record<string, Race>; house: Record<string, { D?: number; R?: number; O?: number }> };
type State = {
  abbr: string; name: string; closeLocal: string; closeEt: string; waveEt: string; closeNote: string; houseSeats: number;
  senate: { kind: string; holder: string; party: string } | null; governor: boolean; office: { name: string; url: string };
};
type Control = {
  senate: { seats: number; majority: number; vp: { name: string; party: string }; composition: Record<string, number>; up: Record<string, number>; notUp: Record<string, number> };
  house: { seats: number; majority: number; composition: Record<string, number>; fileDate: string };
};
type Data = { updated: string; control: Control; states: State[] };

const WAVES = ["6 p.m.", "7 p.m.", "7:30 p.m.", "8 p.m.", "8:30 p.m.", "9 p.m.", "10 p.m.", "11 p.m.", "midnight"];
const WAVE_MIN = [1080, 1140, 1170, 1200, 1230, 1260, 1320, 1380, 1440];
/** Sequential, color-blind-safe (viridis steps); the closing time is also printed on every tile. */
const WAVE_FILL = ["#fde725", "#b5de2b", "#6ece58", "#35b779", "#1f9e89", "#26828e", "#31688e", "#3e4989", "#482878"];
const WAVE_NAME = ["yellow", "lime", "green", "teal-green", "teal", "blue-teal", "blue", "indigo", "purple"];
const WAVE_DARK_TEXT = [true, true, true, true, true, false, false, false, false];
const PARTY_FILL: Record<Party, string> = { D: "#1d4f91", R: "#a8321c", I: "#5b3a8c", O: "#5b3a8c" };
const PARTY_NAME: Record<Party, string> = { D: "Democratic", R: "Republican", I: "independent", O: "other" };

/** Standard 11-column state tile grid: [row, column]. */
const GRID: Record<string, [number, number]> = {
  AK: [0, 0], ME: [0, 10], VT: [1, 9], NH: [1, 10],
  WA: [2, 0], ID: [2, 1], MT: [2, 2], ND: [2, 3], MN: [2, 4], IL: [2, 5], WI: [2, 6], MI: [2, 7], NY: [2, 8], RI: [2, 9], MA: [2, 10],
  OR: [3, 0], NV: [3, 1], WY: [3, 2], SD: [3, 3], IA: [3, 4], IN: [3, 5], OH: [3, 6], PA: [3, 7], NJ: [3, 8], CT: [3, 9],
  CA: [4, 0], UT: [4, 1], CO: [4, 2], NE: [4, 3], MO: [4, 4], KY: [4, 5], WV: [4, 6], VA: [4, 7], MD: [4, 8], DE: [4, 9],
  AZ: [5, 1], NM: [5, 2], KS: [5, 3], AR: [5, 4], TN: [5, 5], NC: [5, 6], SC: [5, 7], DC: [5, 8],
  OK: [6, 3], LA: [6, 4], MS: [6, 5], AL: [6, 6], GA: [6, 7],
  HI: [7, 0], TX: [7, 3], FL: [7, 8],
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lower = (s: string) => s.toLowerCase();
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.resolve(ROOT, file), "utf8")) as T;

/** Minutes since midnight Eastern on Nov. 3 (Nov. 4 counts 1440 more). */
function etMinutes(iso: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return (Number(p.day) - 3) * 1440 + (Number(p.hour) % 24) * 60 + Number(p.minute);
}
function clock(iso: string): string {
  const m = ((etMinutes(iso) % 1440) + 1440) % 1440, h = Math.floor(m / 60), mm = m % 60;
  return `${h % 12 || 12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${h < 12 ? "a.m." : "p.m."} ET`;
}
const dayLabel = (iso: string) => `Nov. ${3 + Math.floor(etMinutes(iso) / 1440)}`;
const waveIndex = (s: State) => WAVES.indexOf(s.waveEt);
const joinNames = (a: string[]) => (a.length <= 2 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

type Ctx = { data: Data; status: Status; asOf: number; closed: (s: State) => boolean };

function raceOf(ctx: Ctx, s: State, kind: "S" | "G"): Race | undefined {
  return ctx.status.races[`${s.abbr}-${kind}`];
}
/** Long wording for the race tables. Never "winning", "leading" or "projected" in our own voice. */
function longText(ctx: Ctx, s: State, r: Race | undefined): string {
  const st = r?.status ?? "awaiting";
  if (st === "called") {
    const who = r!.official ? "declared by the state election office" : `by ${joinNames(r!.calledBy ?? [])}`;
    return `Called for ${r!.winner} (${r!.winnerParty}) ${who}${r!.at ? ` at ${clock(r!.at)}` : ""}${r!.note ? `. ${r!.note}` : ""}`;
  }
  if (st === "close") return `Too close to call (${joinNames(r!.calledBy ?? [])})${r!.note ? `. ${r!.note}` : ""}`;
  if (st === "counting") return `Votes being counted${r!.note ? `. ${r!.note}` : ""}`;
  return ctx.closed(s) ? `Polls closed, awaiting results${r?.note ? `. ${r.note}` : ""}` : "Awaiting results";
}
function shortText(ctx: Ctx, s: State, r: Race | undefined): string {
  const st = r?.status ?? "awaiting";
  if (st === "called") return `Called: ${r!.winnerParty}`;
  if (st === "close") return "Too close to call";
  if (st === "counting") return "Counting";
  return ctx.closed(s) ? "Polls closed" : "Awaiting";
}

// ── Validation ───────────────────────────────────────────────────────────────
export function problems(data: Data, status: Status): string[] {
  const out: string[] = [];
  const st = data.states;
  if (st.length !== 51) out.push(`expected 51 jurisdictions, found ${st.length}`);
  if (st.filter((s) => s.senate).length !== 35) out.push("expected 35 Senate races");
  if (st.filter((s) => s.governor).length !== 36) out.push("expected 36 governor races");
  const seats = st.reduce((a, s) => a + s.houseSeats, 0);
  if (seats !== 435) out.push(`House seats sum to ${seats}, expected 435`);
  for (const s of st) {
    if (!WAVES.includes(s.waveEt)) out.push(`${s.abbr}: unknown wave "${s.waveEt}"`);
    if (!GRID[s.abbr]) out.push(`${s.abbr}: no tile`);
    if (!/^https:\/\//.test(s.office?.url ?? "")) out.push(`${s.abbr}: official link missing`);
  }
  if (Number.isNaN(Date.parse(status.asOf)) || !/[+-]\d{2}:\d{2}$|Z$/.test(status.asOf)) out.push("asOf must be an ISO time with offset");
  const ids = new Set(st.flatMap((s) => [s.senate ? `${s.abbr}-S` : "", s.governor ? `${s.abbr}-G` : ""].filter(Boolean)));
  for (const [id, r] of Object.entries(status.races)) {
    if (!ids.has(id)) out.push(`${id}: no such race`);
    const k = r.status ?? "awaiting";
    if (!["awaiting", "counting", "called", "close"].includes(k)) out.push(`${id}: bad status "${k}"`);
    if (k === "called" || k === "close") {
      const names = new Set(r.calledBy ?? []);
      if (!r.official && names.size < 2) out.push(`${id}: "${k}" needs two named news organizations in calledBy, or official: true`);
      if (r.at && Number.isNaN(Date.parse(r.at))) out.push(`${id}: bad time in "at"`);
    }
    if (k === "called" && (!r.winner || !r.winnerParty)) out.push(`${id}: called needs winner and winnerParty`);
  }
  for (const [ab, h] of Object.entries(status.house)) {
    const s = st.find((x) => x.abbr === ab);
    if (!s) out.push(`house ${ab}: no such state`);
    else if ((h.D ?? 0) + (h.R ?? 0) + (h.O ?? 0) > s.houseSeats) out.push(`house ${ab}: more called seats than the state has (${s.houseSeats})`);
  }
  return out;
}

// ── Blocks ───────────────────────────────────────────────────────────────────
function count(ctx: Ctx, kind: "S" | "G"): Record<Party | "total" | "open", number> {
  const states = ctx.data.states.filter((s) => (kind === "S" ? s.senate : s.governor));
  const c = { D: 0, R: 0, I: 0, O: 0, total: states.length, open: 0 };
  for (const s of states) {
    const r = raceOf(ctx, s, kind);
    if (r?.status === "called" && r.winnerParty) c[r.winnerParty]++;
  }
  c.open = c.total - c.D - c.R - c.I - c.O;
  return c;
}
function houseCount(ctx: Ctx) {
  const c = { D: 0, R: 0, O: 0 };
  for (const h of Object.values(ctx.status.house)) { c.D += h.D ?? 0; c.R += h.R ?? 0; c.O += h.O ?? 0; }
  return { ...c, open: ctx.data.control.house.seats - c.D - c.R - c.O };
}

function scoreboard(ctx: Ctx): string {
  const { senate, house } = ctx.data.control;
  const sen = count(ctx, "S"), gov = count(ctx, "G"), hou = houseCount(ctx);
  const demNotUp = senate.notUp.D + senate.notUp.I;
  const need = (party: string, notUp: number) => (party === senate.vp.party ? senate.majority - 1 : senate.majority) - notUp;
  const senText = `${senate.majority} seats, or 50 with Vice President ${senate.vp.name} (${senate.vp.party}) breaking a tie. Republicans hold ${senate.notUp.R} and Democrats and independents who caucus with them hold ${demNotUp} of the 65 seats not on the ballot, so Democrats need ${need("D", demNotUp)} of tonight's 35 and Republicans need ${need("R", senate.notUp.R)}.`;
  const rows = [
    `| U.S. Senate | 35 seats | ${sen.D} | ${sen.R} | ${sen.I + sen.O} | ${sen.open} | ${senText} |`,
    `| Governors | 36 seats | ${gov.D} | ${gov.R} | ${gov.I + gov.O} | ${gov.open} | Each governorship is decided separately. |`,
    `| U.S. House | ${house.seats} seats | ${hou.D} | ${hou.R} | ${hou.O} | ${hou.open} | ${house.majority} seats for a majority of ${house.seats}. |`,
  ];
  return [
    `**Data as of ${clock(ctx.status.asOf)} on ${dayLabel(ctx.status.asOf)}.** ${ctx.status.headline}`,
    "",
    "| Chamber | On the ballot | Called: Democratic | Called: Republican | Called: independent or other | Not yet called | What control takes |",
    "|---|---|---:|---:|---:|---:|---|",
    ...rows,
  ].join("\n");
}

const TS = 70, TILE = 64;
const svgOpen = (id: string, title: string, desc: string) =>
  `<svg viewBox="0 0 ${11 * TS} ${8 * TS}" width="100%" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg" font-family="Manrope, system-ui, sans-serif">\n<title id="${id}-title">${esc(title)}</title>\n<desc id="${id}-desc">${esc(desc)}</desc>`;

function statusMap(ctx: Ctx): string {
  const closedN = ctx.data.states.filter(ctx.closed).length;
  const sen = count(ctx, "S"), gov = count(ctx, "G");
  const lines = [svgOpen("map-status", "Race status by state", `Tile map of the 50 states and the District of Columbia. Each tile shows a Senate half on the left and a governor half on the right. Polls have closed in ${closedN} of 51 jurisdictions. Senate races called: ${sen.total - sen.open} of 35. Governor races called: ${gov.total - gov.open} of 36.`)];
  for (const s of ctx.data.states) {
    const [row, col] = GRID[s.abbr], x = col * TS + (TS - TILE) / 2, y = row * TS + (TS - TILE) / 2;
    const closed = ctx.closed(s);
    const label = `${s.name}: polls ${closed ? "closed" : `close ${s.closeEt} ET`}. Senate: ${s.senate ? longText(ctx, s, raceOf(ctx, s, "S")) : "no race"}. Governor: ${s.governor ? longText(ctx, s, raceOf(ctx, s, "G")) : "no race"}.`;
    const half = (kind: "S" | "G", present: boolean, hx: number) => {
      const w = 29, hy = y + 28, h = 32;
      if (!present) return `<rect x="${hx}" y="${hy}" width="${w}" height="${h}" rx="4" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      const r = raceOf(ctx, s, kind), k = r?.status ?? "awaiting", cx = hx + w / 2, cy = hy + h / 2 + 6;
      if (k === "called") return `<rect x="${hx}" y="${hy}" width="${w}" height="${h}" rx="4" fill="${PARTY_FILL[r!.winnerParty!]}"/><text x="${cx}" y="${cy}" text-anchor="middle" font-size="20" font-weight="800" fill="#ffffff">${r!.winnerParty === "O" ? "O" : r!.winnerParty}</text>`;
      if (k === "close") return `<rect x="${hx}" y="${hy}" width="${w}" height="${h}" rx="4" fill="#fff3c4" stroke="#8a6d00" stroke-width="2"/><text x="${cx}" y="${cy}" text-anchor="middle" font-size="20" font-weight="800" fill="#4a3a00">?</text>`;
      if (k === "counting") return `<rect x="${hx}" y="${hy}" width="${w}" height="${h}" rx="4" fill="#dbeafe" stroke="#1d4f91" stroke-width="1.5"/><circle cx="${hx + 7}" cy="${cy - 6}" r="2.6" fill="#1f2937"/><circle cx="${cx}" cy="${cy - 6}" r="2.6" fill="#1f2937"/><circle cx="${hx + w - 7}" cy="${cy - 6}" r="2.6" fill="#1f2937"/>`;
      return `<rect x="${hx}" y="${hy}" width="${w}" height="${h}" rx="4" fill="#e5e7eb"/><text x="${cx}" y="${cy}" text-anchor="middle" font-size="17" font-weight="700" fill="#374151">${kind}</text>`;
    };
    lines.push(
      `<a href="#state-${lower(s.abbr)}" aria-label="${esc(label)}"><rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="8" fill="#ffffff" stroke="#1f2937" stroke-width="2.5"${closed ? "" : ' stroke-dasharray="2 4" stroke-linecap="round"'}/>` +
        `<text x="${x + TILE / 2}" y="${y + 22}" text-anchor="middle" font-size="21" font-weight="800" fill="#111827">${s.abbr}</text>` +
        half("S", !!s.senate, x + 2) + half("G", s.governor, x + TILE - 2 - 29) + "</a>",
    );
  }
  lines.push("</svg>");
  return [
    lines.join("\n"),
    "",
    "| Mark on a tile | Meaning |",
    "|---|---|",
    "| Left half, letter S | U.S. Senate race, awaiting results |",
    "| Right half, letter G | Governor race, awaiting results |",
    "| Three dots | Votes being counted |",
    "| D, R or I in a filled half | Called for a Democratic, Republican or independent candidate by the sources named in the table below |",
    "| Question mark | Too close to call, per the sources named below |",
    "| Dashed half with no letter | No race of that kind in the state in 2026 |",
    "| Dotted tile border | Polls are still open at the data time |",
  ].join("\n");
}

function waveMap(ctx: Ctx): string {
  const lines = [svgOpen("map-waves", "When polls close, by state", "Tile map of the 50 states and the District of Columbia, colored by the Eastern Time hour at which most polls close, from 6 p.m. in Indiana and Kentucky to midnight in Alaska and Hawaii. The table below the map lists the same groups.")];
  for (const s of ctx.data.states) {
    const [row, col] = GRID[s.abbr], x = col * TS + (TS - TILE) / 2, y = row * TS + (TS - TILE) / 2, w = waveIndex(s);
    const ink = WAVE_DARK_TEXT[w] ? "#111827" : "#ffffff";
    lines.push(
      `<a href="#state-${lower(s.abbr)}" aria-label="${esc(`${s.name}: most polls close ${s.closeEt} ET`)}"><rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="8" fill="${WAVE_FILL[w]}"/>` +
        `<text x="${x + TILE / 2}" y="${y + 30}" text-anchor="middle" font-size="23" font-weight="800" fill="${ink}">${s.abbr}</text>` +
        `<text x="${x + TILE / 2}" y="${y + 52}" text-anchor="middle" font-size="16" font-weight="700" fill="${ink}">${esc(s.waveEt.replace(" p.m.", "").replace("midnight", "12"))}</text></a>`,
    );
  }
  lines.push("</svg>");
  return lines.join("\n");
}

function wavesTable(ctx: Ctx): string {
  const rows: string[] = [], notes: string[] = [];
  let cum = 0;
  WAVES.forEach((w, i) => {
    const list = ctx.data.states.filter((s) => s.waveEt === w);
    const seats = list.reduce((a, s) => a + s.houseSeats, 0);
    cum += seats;
    const names = list.map((s) => s.name + (s.closeNote || s.closeEt !== s.waveEt ? "*" : ""));
    list.filter((s) => s.closeNote || s.closeEt !== s.waveEt).forEach((s) => notes.push(`${s.name}: ${s.closeNote || `polls close ${s.closeEt} ET`}`));
    rows.push(`| ${w} | ${names.join(", ")} | ${list.filter((s) => s.senate).length} | ${list.filter((s) => s.governor).length} | ${seats} | ${cum} (${WAVE_NAME[i]} tiles) |`);
  });
  return [
    "| Eastern Time (ET) | Most polls close in | Senate races | Governor races | U.S. House seats | House seats with polls closed so far |",
    "|---|---|---:|---:|---:|---|",
    ...rows,
    "",
    `*Closing details for starred states: ${notes.join("; ")}.`,
  ].join("\n");
}

function senateTable(ctx: Ctx): string {
  const list = ctx.data.states.filter((s) => s.senate).sort((a, b) => waveIndex(a) - waveIndex(b) || a.name.localeCompare(b.name));
  return [
    "| Polls close (ET) | State | Seat | Now held by | Status |",
    "|---|---|---|---|---|",
    ...list.map((s) => `| ${s.closeEt} | <span id="senate-${lower(s.abbr)}"></span>${s.name} | ${s.senate!.kind === "special" ? "Special election" : "Regular election"} | ${s.senate!.holder} (${s.senate!.party}) | ${longText(ctx, s, raceOf(ctx, s, "S"))} |`),
  ].join("\n");
}
function governorsTable(ctx: Ctx): string {
  const list = ctx.data.states.filter((s) => s.governor).sort((a, b) => waveIndex(a) - waveIndex(b) || a.name.localeCompare(b.name));
  return [
    "| Polls close (ET) | State | Status |",
    "|---|---|---|",
    ...list.map((s) => `| ${s.closeEt} | <span id="gov-${lower(s.abbr)}"></span>${s.name} | ${longText(ctx, s, raceOf(ctx, s, "G"))} |`),
  ].join("\n");
}
function statesTable(ctx: Ctx): string {
  return [
    "| State | Polls close (ET) | Senate | Governor | U.S. House | Official source |",
    "|---|---|---|---|---|---|",
    ...ctx.data.states.map((s) => {
      const h = ctx.status.house[s.abbr] ?? {};
      const called = (h.D ?? 0) + (h.R ?? 0) + (h.O ?? 0);
      const house = s.houseSeats ? `${s.houseSeats} seat${s.houseSeats > 1 ? "s" : ""}: ${called} called (D ${h.D ?? 0}, R ${h.R ?? 0}, other ${h.O ?? 0})` : "Nonvoting delegate only";
      return `| <span id="state-${lower(s.abbr)}"></span>${s.name} | ${s.closeEt}${s.closeNote || s.closeEt !== s.waveEt ? "*" : ""} | ${s.senate ? shortText(ctx, s, raceOf(ctx, s, "S")) : "No race"} | ${s.governor ? shortText(ctx, s, raceOf(ctx, s, "G")) : "No race"} | ${house} | [${s.office.name}](${s.office.url}) |`;
    }),
  ].join("\n");
}

const BLOCKS: Record<string, (c: Ctx) => string> = {
  scoreboard, "map-status": statusMap, "map-waves": waveMap, waves: wavesTable, senate: senateTable, governors: governorsTable, states: statesTable,
};

function replaceBlock(text: string, name: string, body: string): string {
  const a = `<!-- live:${name}:start -->`, b = `<!-- live:${name}:end -->`;
  const i = text.indexOf(a), j = text.indexOf(b);
  if (i < 0 || j < 0 || j < i) throw new Error(`story is missing the marker pair for "${name}"`);
  return text.slice(0, i + a.length) + "\n" + body + "\n" + text.slice(j);
}

export function renderBlocks(story: string, data: Data, status: Status): string {
  const asOf = etMinutes(status.asOf);
  const ctx: Ctx = { data, status, asOf, closed: (s) => WAVE_MIN[waveIndex(s)] <= asOf };
  let out = story;
  for (const [name, fn] of Object.entries(BLOCKS)) out = replaceBlock(out, name, fn(ctx));
  return out;
}

export async function buildElectionLive(args: string[]): Promise<void> {
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const data = read<Data>(DATA), status = read<Status>(flag("--status") ?? STATUS);
  const bad = problems(data, status);
  if (bad.length) { console.error(bad.map((p) => `✗ ${p}`).join("\n")); process.exitCode = 1; return; }
  if (args.includes("--check")) { console.log("election live data OK"); return; }
  if (args.includes("--print")) { await buildElectionLivePrintables(); return; }
  const file = path.resolve(ROOT, flag("--story") ?? STORY);
  const before = fs.readFileSync(file, "utf8"), after = renderBlocks(before, data, status);
  if (after === before) console.log("story blocks unchanged");
  else { fs.writeFileSync(file, after); console.log(`story blocks updated: ${path.relative(ROOT, file)}`); }
}

// ── Printables ───────────────────────────────────────────────────────────────
// Two US Letter sheets built from the same data as the page: a scorecard with the control math, a
// 100-seat Senate grid and a 435-seat House grid, and a House tally by state grouped by closing wave.
const FOOT = "Free printable from Fresh Calendars · freshcalendars.com/news/election-day-2026-results-map/";
const INK = "#1e3a8a";

function scorecardSheet(fonts: string, data: Data): string {
  const { senate, house } = data.control;
  const demNotUp = senate.notUp.D + senate.notUp.I, onBallot = 35;
  const need = (party: string, notUp: number) => (party === senate.vp.party ? senate.majority - 1 : senate.majority) - notUp;
  // Senate: 34 solid squares (not on the ballot, Democratic caucus), 35 empty (on the ballot), 31 slashed (not on the ballot, Republican).
  const sq = (i: number) => {
    const x = (i % 10) * 26 + 2, y = Math.floor(i / 10) * 26 + 2;
    if (i < demNotUp) return `<rect x="${x}" y="${y}" width="22" height="22" fill="${INK}"/>`;
    if (i < demNotUp + onBallot) return `<rect x="${x}" y="${y}" width="22" height="22" fill="#ffffff" stroke="#111827" stroke-width="1.6" stroke-dasharray="4 2"/>`;
    return `<rect x="${x}" y="${y}" width="22" height="22" fill="#ffffff" stroke="${INK}" stroke-width="2"/><line x1="${x + 3}" y1="${y + 19}" x2="${x + 19}" y2="${y + 3}" stroke="${INK}" stroke-width="2"/>`;
  };
  const senateSvg = `<svg width="262" height="262" viewBox="0 0 262 262" role="img" aria-label="Senate seats: ${demNotUp} not on the ballot held by the Democratic caucus, ${onBallot} on the ballot, ${senate.notUp.R} not on the ballot held by Republicans">${Array.from({ length: 100 }, (_, i) => sq(i)).join("")}</svg>`;
  const dots = Array.from({ length: house.seats }, (_, i) => {
    const cx = 8 + (i % 25) * 14.4, cy = 8 + Math.floor(i / 25) * 14.4;
    return i + 1 === house.majority
      ? `<circle cx="${cx}" cy="${cy}" r="6" fill="#ffffff" stroke="#111827" stroke-width="3"/>`
      : `<circle cx="${cx}" cy="${cy}" r="5" fill="#ffffff" stroke="#374151" stroke-width="1.2"/>`;
  }).join("");
  const rowNums = Array.from({ length: 18 }, (_, r) => `<text x="${8 + 25 * 14.4 - 4}" y="${8 + r * 14.4 + 3}" font-size="8" fill="#374151" font-family="Manrope">${Math.min((r + 1) * 25, house.seats)}</text>`).join("");
  const houseSvg = `<svg width="392" height="268" viewBox="0 0 392 268" role="img" aria-label="${house.seats} House seats in rows of 25; the ${house.majority}th seat, the majority line, has a heavy ring">${dots}${rowNums}</svg>`;
  let cum = 0;
  const waveRows = WAVES.map((w) => {
    const list = data.states.filter((s) => s.waveEt === w);
    const seats = list.reduce((a, s) => a + s.houseSeats, 0);
    cum += seats;
    return `<tr><td class="t">${w}</td><td class="st">${list.map((s) => s.abbr).join(" ")}</td><td>${list.filter((s) => s.senate).length}</td><td>${list.filter((s) => s.governor).length}</td><td>${seats}</td><td>${cum}</td><td class="fill"></td></tr>`;
  }).join("");
  const css = `
  .sc{padding:28px 34px 0}
  .sc h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:${INK};line-height:1.05}
  .sc .sub{margin:5px 0 12px;font-size:10.5px;color:#37474f}
  .sc .boxes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .sc .box{border:1.5px solid ${INK};border-radius:8px;padding:8px 10px;font-size:10px;line-height:1.4;color:#1f2937}
  .sc .box b{display:block;font-family:Sora;font-size:12px;color:${INK};margin-bottom:2px}
  .sc .box .big{font-family:Sora;font-weight:800;font-size:19px;color:#111827}
  .sc .grids{display:grid;grid-template-columns:268px 1fr;gap:14px;margin-top:14px;align-items:start}
  .sc h2{font-family:Sora;font-size:12px;margin:0 0 4px;color:${INK}}
  .sc .key{font-size:9.5px;line-height:1.45;color:#1f2937;margin:5px 0 0}
  .sc table{width:100%;border-collapse:collapse;margin-top:14px;font-size:10px}
  .sc th{background:${INK};color:#fff;font-family:Sora;font-size:8.5px;padding:4px 5px;text-align:left}
  .sc td{padding:0 5px;height:33px;border-bottom:1px solid #cbd5e1;color:#111827}
  .sc td.t{font-weight:800;white-space:nowrap}
  .sc td.st{font-size:9.5px;letter-spacing:.02em}
  .sc td.fill{border-left:1.5px dashed #94a3b8;width:25%}
  .sc .note{margin-top:8px;font-size:8.5px;color:#374151;line-height:1.45}`;
  const page = `<section class="page sc"><h1>Election Night 2026 Scorecard</h1>
    <p class="sub">Tuesday, Nov. 3, 2026 · mark each seat as it is called by the sources you trust · times in Eastern Time (ET)</p>
    <div class="boxes">
      <div class="box"><b>U.S. House</b><span class="big">${house.majority} of ${house.seats}</span><br>seats make a majority. Seated today, per the Clerk's list published ${house.fileDate.replace("2026-10-01", "Oct. 1, 2026")}: Republicans ${house.composition.R}, Democrats ${house.composition.D}, independent ${house.composition.I}, vacant ${house.composition.vacant}.</div>
      <div class="box"><b>U.S. Senate</b><span class="big">${senate.majority} of ${senate.seats}</span><br>seats make a majority; at 50-50 Vice President ${senate.vp.name} (${senate.vp.party}) breaks the tie, so Republicans need ${senate.majority - 1} and Democrats ${senate.majority}.</div>
      <div class="box"><b>Not on the ballot: 65 seats</b>Republicans ${senate.notUp.R}, Democrats and caucusing independents ${demNotUp}. From tonight's ${onBallot}, Democrats need ${need("D", demNotUp)} and Republicans need ${need("R", senate.notUp.R)}. Arithmetic, not a forecast.</div>
    </div>
    <div class="grids">
      <div><h2>Senate: 100 seats</h2>${senateSvg}
        <p class="key">Solid square: not on the ballot, Democratic caucus (${demNotUp}). Slashed square: not on the ballot, Republican (${senate.notUp.R}). Dashed empty square: on the ballot tonight (${onBallot}); write D, R or I when called.</p></div>
      <div><h2>House: ${house.seats} seats, ${house.majority} to win</h2>${houseSvg}
        <p class="key">One circle per seat in rows of 25; the number at the end of a row is the running total. Fill a circle D, R or I as each seat is called. The heavy ring is seat ${house.majority}, the majority line.</p></div>
    </div>
    <table><thead><tr><th>Polls close (ET)</th><th>Most polls close in</th><th>Senate</th><th>Gov.</th><th>House</th><th>House so far</th><th>My tally: Senate D__ R__ · House D__ R__</th></tr></thead><tbody>${waveRows}</tbody></table>
    <p class="note">Source: U.S. Senate (party and class lists, senate.gov, read Nov. 3, 2026); Office of the Clerk of the U.S. House (member list file published Oct. 1, 2026); poll closing times from state election offices and 270toWin, for most polls in each state (part of some states closes later). A race counts as called when two named, independent news organizations call it or the state declares the winner; official results come from state election offices.</p>
    <div class="foot">${FOOT}</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

function tallySheet(fonts: string, data: Data): string {
  type Row = { head: string } | { name: string; seats: number };
  const rows: Row[] = [];
  let cum = 0;
  for (const w of WAVES) {
    const list = data.states.filter((s) => s.waveEt === w && s.houseSeats > 0);
    if (!list.length) continue;
    cum += list.reduce((a, s) => a + s.houseSeats, 0);
    rows.push({ head: `${w} ET · ${cum} seats once these polls close` });
    for (const s of list) rows.push({ name: s.name, seats: s.houseSeats });
  }
  const half = Math.ceil(rows.length / 2);
  const cut = rows.findIndex((_, i) => i >= half && "head" in rows[i]);
  const split = cut > 0 && cut < rows.length - 4 ? cut : half;
  const cell = (r: Row) =>
    "head" in r
      ? `<div class="wave">${r.head}</div>`
      : `<div class="row"><span class="n">${r.name}</span><span class="s">${r.seats}</span><span class="b">D</span><span class="b">R</span><span class="b">O</span></div>`;
  const css = `
  .tl{padding:28px 34px 0}
  .tl h1{font-family:Sora;font-weight:800;font-size:26px;margin:0;color:${INK};line-height:1.05}
  .tl .sub{margin:5px 0 10px;font-size:10.5px;color:#37474f}
  .tl .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .tl .wave{background:${INK};color:#fff;font-family:Sora;font-weight:800;font-size:9.5px;padding:4px 7px;margin-top:6px;border-radius:4px}
  .tl .row{display:grid;grid-template-columns:1fr 30px 42px 42px 42px;column-gap:6px;align-items:center;height:23.5px;border-bottom:1px solid #cbd5e1;font-size:10.5px;color:#111827}
  .tl .row .n{font-weight:700}
  .tl .row .s{text-align:center;font-weight:800}
  .tl .row .b{height:17px;border:1.4px solid #475569;border-radius:3px;font-size:8px;color:#475569;display:flex;align-items:flex-start;justify-content:flex-start;padding:1px 3px}
  .tl .hd{display:grid;grid-template-columns:1fr 30px 42px 42px 42px;column-gap:6px;font-family:Sora;font-size:8px;color:#374151;padding:0 0 2px}
  .tl .hd span+span{text-align:center}
  .tl .tot{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
  .tl .tot div{border:1.5px solid ${INK};border-radius:8px;padding:6px 10px;height:58px;font-size:9.5px;color:#1f2937}
  .tl .tot b{display:block;font-family:Sora;font-size:10px;color:${INK}}
  .tl .note{margin-top:8px;font-size:8.5px;color:#374151;line-height:1.45}`;
  const col = (list: Row[]) => `<div><div class="hd"><span>State</span><span>Seats</span><span>D</span><span>R</span><span>Other</span></div>${list.map(cell).join("")}</div>`;
  const page = `<section class="page tl"><h1>House Seats by State: Election Night 2026 Tally</h1>
    <p class="sub">All ${data.control.house.seats} voting seats, grouped by when most polls close (Eastern Time) · write the number of seats each party wins in the D, R and Other boxes</p>
    <div class="cols">${col(rows.slice(0, split))}${col(rows.slice(split))}</div>
    <div class="tot"><div><b>Democratic seats called</b></div><div><b>Republican seats called</b></div><div><b>Other seats called</b></div><div><b>Majority: ${data.control.house.majority} seats</b>DC has a nonvoting delegate, no voting seat.</div></div>
    <p class="note">Source: Office of the Clerk of the U.S. House (seats by state, member list file published ${data.control.house.fileDate.replace("2026-10-01", "Oct. 1, 2026")}); poll closing times from state election offices and 270toWin, for most polls in each state. Check your state election office for district results.</p>
    <div class="foot">${FOOT}</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildElectionLivePrintables(): Promise<void> {
  const [{ renderPrintables }, { fontFaces }] = await Promise.all([import("./printables.js"), import("./julian.js")]);
  const LETTER_SIZE = LETTER;
  const data = read<Data>(DATA), fonts = await fontFaces();
  const pages = await renderPrintables("election-2026", [
    { slug: "election-night-scorecard-2026", size: LETTER_SIZE, html: scorecardSheet(fonts, data) },
    { slug: "house-seats-by-state-tally-2026", size: LETTER_SIZE, html: tallySheet(fonts, data) },
  ]);
  console.log("pages:", JSON.stringify(pages));
}
