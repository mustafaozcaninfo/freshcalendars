/**
 * Keeps the 2026 NFL schedule CSV current: flexed kickoffs, network changes, Week 18 times and final scores.
 * Reads ESPN's public scoreboard feed (times, networks, scores) and the schedule pages of the 32 club sites
 * (each publishes schema.org events with the official kickoff), then compares both with the CSV.
 *
 * A kickoff change is applied only when a club site confirms it (the club is the official source; ESPN alone
 * is reported, never applied). A network change is applied with a confirmed time change; on its own it is
 * reported. Final scores come from ESPN once a game is final. Every run writes sync-report.txt next to the CSV.
 *
 * Usage: pnpm fc nfl-sync            # report only
 *        pnpm fc nfl-sync --write    # apply confirmed changes to the CSV
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { NFL_CSV, type Row, dayOf, et, readSchedule, timeOf, writeCsv } from "./nflData.js";

const ESPN = (w: number) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${w}&dates=2026`;
/** Club schedule pages; three clubs do not publish the schema.org events, so their games rely on the opponent's page. */
const CLUB: Record<string, string> = {
  ARI: "azcardinals.com", ATL: "atlantafalcons.com", BAL: "baltimoreravens.com", BUF: "buffalobills.com", CAR: "panthers.com", CHI: "chicagobears.com",
  CIN: "bengals.com", CLE: "clevelandbrowns.com", DAL: "dallascowboys.com", DEN: "denverbroncos.com", DET: "detroitlions.com", GB: "packers.com",
  HOU: "houstontexans.com", IND: "colts.com", JAX: "jaguars.com", KC: "chiefs.com", LV: "raiders.com", LAC: "chargers.com", LAR: "therams.com",
  MIA: "miamidolphins.com", MIN: "vikings.com", NE: "patriots.com", NO: "neworleanssaints.com", NYG: "giants.com", NYJ: "newyorkjets.com",
  PHI: "philadelphiaeagles.com", PIT: "steelers.com", SF: "49ers.com", SEA: "seahawks.com", TB: "buccaneers.com", TEN: "tennesseetitans.com", WAS: "commanders.com",
};
/** ESPN network names to the CSV's spelling. */
const NET: Record<string, string> = { Fox: "FOX", FOX: "FOX", CBS: "CBS", NBC: "NBC", ESPN: "ESPN", ESPN2: "ESPN2", ABC: "ABC", "Prime Video": "Prime Video", Netflix: "NETFLIX", "NFL Net": "NFL NETWORK", "NFL Network": "NFL NETWORK" };
const ENGLISH = new Set(Object.values(NET));

const key = (w: number | string, away: string, home: string) => `${w}|${away}|${home}`;
const sameInstant = (a: string, b: string) => Boolean(a && b) && new Date(a).getTime() === new Date(b).getTime();
const label = (utc: string) => (utc ? `${dayOf(utc)} ${timeOf(utc)} ET` : "not set");

async function get(url: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (FreshCalendars schedule check)" }, signal: AbortSignal.timeout(25_000) });
      if (r.ok) return await r.text();
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  return "";
}

type Espn = { utc: string; timeValid: boolean; nets: string[]; final: boolean; awayScore: string; homeScore: string };

export async function nflSync(write: boolean): Promise<void> {
  const { head, rows } = readSchedule();
  const nickToAbbr = new Map<string, string>();
  for (const r of rows) {
    nickToAbbr.set(r.away_team_name!.split(" ").pop()!.toLowerCase(), r.away_team_abbr!);
    nickToAbbr.set(r.home_team_name!.split(" ").pop()!.toLowerCase(), r.home_team_abbr!);
  }

  const espn = new Map<string, Espn>();
  for (let w = 1; w <= 18; w++) {
    const text = await get(ESPN(w));
    if (!text) { console.warn(`ESPN week ${w}: no answer`); continue; }
    for (const e of JSON.parse(text).events ?? []) {
      const c = e.competitions[0];
      const side = (h: string) => c.competitors.find((x: { homeAway: string }) => x.homeAway === h);
      const ab = (x: { team: { abbreviation: string } }) => (x.team.abbreviation === "WSH" ? "WAS" : x.team.abbreviation);
      const a = side("away"), h = side("home");
      espn.set(key(w, ab(a), ab(h)), {
        utc: new Date(e.date).toISOString().replace(".000", ""), timeValid: Boolean(c.timeValid),
        nets: (c.broadcasts ?? []).flatMap((b: { names: string[] }) => b.names).map((n: string) => NET[n] ?? n),
        final: e.status?.type?.completed === true, awayScore: String(a.score ?? ""), homeScore: String(h.score ?? ""),
      });
    }
  }

  // Club pages: "@id":"https://www.raiders.com/schedule/#raiders-at-49ers-2026-reg-9", "startDate":"2026-11-08T21:25:00" (UTC).
  const club = new Map<string, { utc: string; site: string }>();
  for (const [abbr, site] of Object.entries(CLUB)) {
    const html = await get(`https://www.${site}/schedule/`);
    for (const m of html.matchAll(/#([a-z0-9]+)-at-([a-z0-9]+)-2026-reg-(\d+)","sport":"Football","startDate":"([0-9T:-]+)"/g)) {
      const a = nickToAbbr.get(m[1]!), h = nickToAbbr.get(m[2]!);
      if (!a || !h) continue;
      const k = key(m[3]!, a, h);
      if (!club.has(k)) club.set(k, { utc: `${m[4]}Z`, site });
    }
    if (!html) console.warn(`${abbr} ${site}: no answer`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const applied: string[] = [], reported: string[] = [], scores: string[] = [];
  for (const r of rows) {
    const k = key(r.week!, r.away_team_abbr!, r.home_team_abbr!);
    const name = `Week ${r.week}: ${r.away_team_name} at ${r.home_team_name}`;
    const e = espn.get(k), c = club.get(k);
    if (!e) { reported.push(`${name}: not in ESPN's feed`); continue; }
    const csvUtc = r.kickoff_utc!;
    const espnUtc = e.timeValid ? e.utc : "";
    // Kickoff: apply only with a club confirmation that matches ESPN.
    if (espnUtc && !sameInstant(espnUtc, csvUtc)) {
      if (c && sameInstant(c.utc, espnUtc)) {
        const nets = e.nets.filter((n) => ENGLISH.has(n));
        const was = `${label(csvUtc)} (${r.broadcast})`;
        apply(r, espnUtc, nets.length ? nets.join(" / ") : r.broadcast!);
        r.notes_or_discrepancy = `Kickoff changed from ${was} to ${label(espnUtc)} (${r.broadcast}); confirmed by ${c.site} and ESPN on ${today}.`;
        r.last_verified_date = today;
        applied.push(`${name}: ${was} -> ${label(espnUtc)} (${r.broadcast}) [${c.site}, ESPN]`);
      } else {
        reported.push(`${name}: CSV ${label(csvUtc)}, ESPN ${label(espnUtc)}, club ${c ? label(c.utc) : "no page"}; not applied`);
      }
    } else if (c && csvUtc && !sameInstant(c.utc, csvUtc)) {
      reported.push(`${name}: CSV and ESPN ${label(csvUtc)}, but ${c.site} says ${label(c.utc)}; check NFL.com`);
    }
    // Network change without a time change: report only (one source).
    const csvNets = new Set(r.broadcast!.split(" / ").map((b) => b.trim()).filter((b) => ENGLISH.has(b)));
    const espnNets = new Set(e.nets.filter((n) => ENGLISH.has(n)));
    if (espnNets.size && [...espnNets].some((n) => !csvNets.has(n)) && !applied.some((x) => x.startsWith(name))) {
      reported.push(`${name}: network CSV ${[...csvNets].join("/") || "none"}, ESPN ${[...espnNets].join("/")}; not applied`);
    }
    if (e.final && r.status !== "completed") {
      r.status = "completed"; r.away_score = e.awayScore; r.home_score = e.homeScore; r.last_verified_date = today;
      scores.push(`${name}: ${e.awayScore}-${e.homeScore}`);
    } else if (e.final && (r.away_score !== e.awayScore || r.home_score !== e.homeScore) && r.away_score) {
      reported.push(`${name}: score CSV ${r.away_score}-${r.home_score}, ESPN ${e.awayScore}-${e.homeScore}; not applied`);
    } else if (e.final && !r.away_score) {
      r.away_score = e.awayScore; r.home_score = e.homeScore;
      scores.push(`${name}: ${e.awayScore}-${e.homeScore}`);
    }
  }

  const report = [
    `NFL schedule sync, ${new Date().toISOString()} (${write ? "written" : "report only"})`,
    `Sources: ESPN scoreboard feed (18 weeks, ${espn.size} games); club schedule pages (${club.size} games confirmed by at least one club).`,
    "", `Kickoff changes confirmed by a club site (${applied.length}):`, ...applied.map((x) => `  ${x}`),
    "", `Final scores added (${scores.length}):`, ...scores.map((x) => `  ${x}`),
    "", `Differences not applied (${reported.length}):`, ...reported.map((x) => `  ${x}`), "",
  ].join("\n");
  writeFileSync(path.join(path.dirname(NFL_CSV), "sync-report.txt"), report);
  console.log(report);
  if (write) writeCsv(NFL_CSV, head, rows);
  else if (applied.length || scores.length) console.log("Run with --write to apply these changes.");
}

function apply(r: Row, utc: string, broadcast: string) {
  const t = et(utc);
  r.kickoff_utc = utc;
  r.game_date = `${t.y}-${String(t.m + 1).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
  r.kickoff_time = `${t.h % 12 || 12}:${String(t.min).padStart(2, "0")} ${t.h < 12 ? "AM" : "PM"}`;
  r.broadcast = broadcast;
}
