/**
 * Shared reader and writer for the verified 2026 NFL schedule (data/nfl-2026/nfl-2026-canonical-schedule.csv).
 * nflSync.ts updates the CSV from ESPN and the 32 club sites; pickem.ts and nfl2026.ts read it.
 * Kickoffs are stored in UTC, so Eastern Time (ET) labels follow the Nov. 1 clock change by themselves.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./paths.js";

export const NFL_CSV = path.join(ROOT, "packages/generator/data/nfl-2026/nfl-2026-canonical-schedule.csv");

export type Row = Record<string, string>;

export function parseCsv(text: string): { head: string[]; rows: Row[] } {
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
  return { head: head!, rows: body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head!.map((h, i) => [h, r[i] ?? ""]))) };
}

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
/** Keeps the file's line endings (the dataset ships with CRLF) so a sync diff shows only real changes. */
export function writeCsv(file: string, head: string[], rows: Row[]): void {
  const eol = readFileSync(file, "utf8").includes("\r\n") ? "\r\n" : "\n";
  writeFileSync(file, [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h] ?? "")).join(","))].join(eol) + eol);
}

export function readSchedule(): { head: string[]; rows: Row[] } {
  const data = parseCsv(readFileSync(NFL_CSV, "utf8"));
  if (data.rows.length !== 272) throw new Error(`expected 272 games, found ${data.rows.length}`);
  return data;
}

export const MON = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
export const WD = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];

/** Wall-clock parts of an instant in New York. */
export function et(utc: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(utc)).map((x) => [x.type, x.value]));
  return { y: +p.year!, m: +p.month! - 1, d: +p.day!, h: +p.hour!, min: +p.minute! };
}
export const dayOf = (utc: string) => { const t = et(utc); return `${WD[new Date(Date.UTC(t.y, t.m, t.d)).getUTCDay()]}, ${MON[t.m]} ${t.d}`; };
/** "8:15 p.m." style, always with minutes, to match the sheets' columns. */
export const timeOf = (utc: string) => { const { h, min } = et(utc); return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`; };
export const etDate = (utc: string) => { const t = et(utc); return `${t.y}-${String(t.m + 1).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`; };
export const nick = (name: string) => name.split(" ").pop()!;

/** English-language US networks; the Spanish simulcasts stay in the CSV. */
const TV: Record<string, string> = { FOX: "FOX", CBS: "CBS", NBC: "NBC", ESPN: "ESPN", ESPN2: "ESPN2", ABC: "ABC", "Prime Video": "Prime Video", NETFLIX: "Netflix", "NFL NETWORK": "NFL Network" };
export const tvOf = (broadcast: string) => broadcast.split(" / ").map((b) => TV[b.trim()]).filter(Boolean).join(", ");

/** Neutral-site cities, as listed in the NFL's international schedule. */
export const CITY: Record<string, string> = {
  "SF@LAR": "Melbourne", "BAL@DAL": "Rio de Janeiro", "IND@WAS": "London", "PHI@JAX": "London", "HOU@JAX": "London",
  "PIT@NO": "Paris", "CIN@ATL": "Madrid", "NE@DET": "Munich", "MIN@SF": "Mexico City",
};

export type Game = {
  week: number; utc: string; away: string; awayName: string; home: string; homeName: string; tv: string;
  city?: string; status: string; awayScore: string; homeScore: string;
};

export function games(): Game[] {
  return readSchedule().rows.map((r) => ({
    week: +r.week!, utc: r.kickoff_utc!, away: r.away_team_abbr!, awayName: r.away_team_name!, home: r.home_team_abbr!, homeName: r.home_team_name!,
    tv: tvOf(r.broadcast!), city: CITY[`${r.away_team_abbr}@${r.home_team_abbr}`], status: r.status!, awayScore: r.away_score!, homeScore: r.home_score!,
  }));
}
