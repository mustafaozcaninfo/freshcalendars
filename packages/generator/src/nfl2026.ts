/**
 * NFL 2026-2027 schedule tables for /news/ (printable-nfl-schedule-2026-2027-pdf).
 * Reads the verified 272-game dataset in data/nfl-2026/ (reconciled with NFL.com's 18 weekly and
 * 32 team pages on Oct. 23, 2026; see master-qa-report.txt) and rewrites the story's week-by-week
 * section between the nfl-weeks markers, plus the team list the team finder reads (data-teams).
 * Kickoffs are converted from the UTC timestamps, so the ET times carry the Nov. 1 clock change.
 * The printable PDFs in public/downloads/nfl-2026-2027 come from the same dataset.
 * Usage: pnpm exec tsx packages/generator/src/nfl2026.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./paths.js";

const DATA = path.join(ROOT, "packages/generator/data/nfl-2026/nfl-2026-canonical-schedule.csv");
const STORY = path.join(ROOT, "apps/news/src/content/articles/2026/10/printable-nfl-schedule-2026-2027-pdf.md");

/** Neutral-site cities, as listed in the NFL's international schedule (Pro Football Hall of Fame copy). */
const CITY: Record<string, string> = {
  "SF@LAR": "Melbourne", "BAL@DAL": "Rio de Janeiro", "IND@WAS": "London", "PHI@JAX": "London", "HOU@JAX": "London",
  "PIT@NO": "Paris", "CIN@ATL": "Madrid", "NE@DET": "Munich", "MIN@SF": "Mexico City",
};
const DIVISION: Record<string, string> = {
  BUF: "AFC East", MIA: "AFC East", NE: "AFC East", NYJ: "AFC East", BAL: "AFC North", CIN: "AFC North", CLE: "AFC North", PIT: "AFC North",
  HOU: "AFC South", IND: "AFC South", JAX: "AFC South", TEN: "AFC South", DEN: "AFC West", KC: "AFC West", LV: "AFC West", LAC: "AFC West",
  DAL: "NFC East", NYG: "NFC East", PHI: "NFC East", WAS: "NFC East", CHI: "NFC North", DET: "NFC North", GB: "NFC North", MIN: "NFC North",
  ATL: "NFC South", CAR: "NFC South", NO: "NFC South", TB: "NFC South", ARI: "NFC West", LAR: "NFC West", SF: "NFC West", SEA: "NFC West",
};
/** English-language US networks; the Spanish simulcasts stay in the CSV. */
const TV: Record<string, string> = { FOX: "FOX", CBS: "CBS", NBC: "NBC", ESPN: "ESPN", ESPN2: "ESPN2", ABC: "ABC", "Prime Video": "Prime Video", NETFLIX: "Netflix", "NFL NETWORK": "NFL Network" };

const MON = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
const WD = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];

type Game = { week: number; utc: string; away: string; awayName: string; home: string; homeName: string; tv: string; neutral: boolean };

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head!.map((h, i) => [h, r[i] ?? ""])));
}

/** Wall-clock parts of an instant in New York. */
function et(utc: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23", weekday: "short" })
    .formatToParts(new Date(utc)).map((x) => [x.type, x.value]));
  return { y: +p.year!, m: +p.month! - 1, d: +p.day!, h: +p.hour!, min: +p.minute! };
}
const dayOf = (utc: string) => { const t = et(utc); return `${WD[new Date(Date.UTC(t.y, t.m, t.d)).getUTCDay()]}, ${MON[t.m]} ${t.d}`; };
const timeOf = (utc: string) => { const { h, min } = et(utc); return `${h % 12 || 12}${min ? ":" + String(min).padStart(2, "0") : ""} ${h < 12 ? "a.m." : "p.m."}`; };
const nick = (name: string) => name.split(" ").pop()!;

const games: Game[] = parseCsv(readFileSync(DATA, "utf8")).map((r) => ({
  week: +r.week!, utc: r.kickoff_utc!, away: r.away_team_abbr!, awayName: r.away_team_name!, home: r.home_team_abbr!, homeName: r.home_team_name!,
  tv: r.broadcast!.split(" / ").map((b) => TV[b]).filter(Boolean).join(", "), neutral: r.neutral_site === "True",
}));
if (games.length !== 272) throw new Error(`expected 272 games, found ${games.length}`);
const teams = [...new Map(games.flatMap((g) => [[g.away, g.awayName], [g.home, g.homeName]] as [string, string][])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
if (teams.length !== 32) throw new Error(`expected 32 teams, found ${teams.length}`);

const out: string[] = [];
for (let w = 1; w <= 18; w++) {
  const list = games.filter((g) => g.week === w).sort((a, b) => (a.utc || "9").localeCompare(b.utc || "9") || a.awayName.localeCompare(b.awayName));
  const dated = list.filter((g) => g.utc);
  // Week 18 days are set after Week 17 (NFL.com); its weekend is Jan. 9-10, 2027.
  const span = dated.length ? `${dayOf(dated[0]!.utc)} to ${dayOf(dated.at(-1)!.utc)}` : "Sat., Jan. 9 and Sun., Jan. 10, 2027";
  const playing = new Set(list.flatMap((g) => [g.away, g.home]));
  const bye = teams.filter(([a]) => !playing.has(a)).map(([, n]) => nick(n));
  out.push(`### Week ${w}: ${span}`, "", "| Day | Kickoff (ET) | Game | TV |", "|---|---|---|---|");
  for (const g of list) {
    const city = CITY[`${g.away}@${g.home}`];
    if (g.neutral !== Boolean(city)) throw new Error(`neutral-site city missing or unexpected: ${g.away}@${g.home}`);
    const game = city ? `${nick(g.awayName)} vs. ${nick(g.homeName)} (${city})` : `${nick(g.awayName)} at ${nick(g.homeName)}`;
    out.push(`| ${g.utc ? dayOf(g.utc) : "Not set"} | ${g.utc ? timeOf(g.utc) : "Not set"} | ${game} | ${g.tv || "Not set"} |`);
  }
  out.push("", bye.length ? `**On bye:** ${bye.join(", ")}.` : "**On bye:** no teams.", "");
}

const teamAttr = teams.map(([a, n]) => `${n}|${DIVISION[a]}`).join(";");
let md = readFileSync(STORY, "utf8");
const start = "<!-- nfl-weeks:start -->", end = "<!-- nfl-weeks:end -->";
if (!md.includes(start)) throw new Error("story has no nfl-weeks markers");
md = md.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n\n${out.join("\n")}\n${end}`);
md = md.replace(/data-teams="[^"]*"/, `data-teams="${teamAttr}"`);
writeFileSync(STORY, md);
console.log(`Wrote 18 weeks, ${games.length} games (${games.filter((g) => !g.utc).length} without a date) to ${path.relative(ROOT, STORY)}`);
