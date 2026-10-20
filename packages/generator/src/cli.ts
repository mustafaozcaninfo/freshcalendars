#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { generateAll, refreshEvergreen, refreshMeta, rollover, shutdown, verifyDist } from "./gen.js";
import { buildJulianDownloads } from "./julian.js";
import { buildRamadanDownloads } from "./ramadan.js";
import { buildWeekNumberDownloads } from "./weeknumbers.js";
import { buildMoonDownloads } from "./moon.js";
import { buildLunarNewYearDownloads } from "./lunarnewyear.js";
import { buildSocialSecurityDownloads } from "./socialsecurity.js";
import { buildNovemberDownloads } from "./diwali.js";
import { buildAdventDownloads } from "./advent.js";
import { buildFallDownloads } from "./fall2026.js";
import { buildDateListDownloads } from "./datelists.js";
import { buildDateList2Downloads } from "./datelists2.js";
import { buildDateList3Downloads } from "./datelists3.js";
import { buildHeroes3 } from "./heroes3.js";
import { buildElection2026Downloads } from "./election2026.js";
import { buildGta6Downloads } from "./gta6.js";
import { buildVeteransDownloads } from "./veterans.js";
import { buildHeroes4 } from "./heroes4.js";
import { ROOT } from "./paths.js";
import { purgeDoCdn, syncCdnAssets } from "./spaces.js";

function loadRootEnv(): void {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function argFlag(name: string): boolean {
  return process.argv.includes(name);
}

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i >= 0) return process.argv[i + 1];
  return undefined;
}

async function deploy(opts: { confirm: boolean; changed: boolean }): Promise<void> {
  if (!opts.confirm) throw new Error("Pass --confirm to deploy");
  const script = path.join(ROOT, "scripts/deploy.sh");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("bash", [script, opts.changed ? "--changed" : "--all"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`deploy exit ${code}`))));
  });
}

async function main(): Promise<void> {
  loadRootEnv();
  const cmd = process.argv[2] ?? "help";
  try {
    if (cmd === "gen") {
      const year = Number(argValue("--year") ?? new Date().getFullYear());
      const family = argValue("--family") as
        | "yearly"
        | "monthly"
        | "blank"
        | "weekly"
        | "school"
        | undefined;
      await generateAll({
        years: [year, year + 1],
        families: family ? [family] : undefined,
      });
      console.log("gen complete");
    } else if (cmd === "gen-meta" || cmd === "build") {
      const year = Number(argValue("--year") ?? new Date().getFullYear());
      await generateAll({
        years: [year, year + 1],
        skipAssets: argFlag("--skip-assets") || cmd === "gen-meta",
      });
      console.log(`${cmd} complete`);
    } else if (cmd === "refresh-evergreen") {
      await refreshEvergreen();
    } else if (cmd === "refresh-meta" || cmd === "gen-meta-daily") {
      await refreshMeta();
    } else if (cmd === "news-julian") {
      const years = (argValue("--years") ?? "2026,2027").split(",").map(Number);
      await buildJulianDownloads(years);
    } else if (cmd === "news-ramadan") {
      await buildRamadanDownloads();
    } else if (cmd === "news-weeks") {
      await buildWeekNumberDownloads();
    } else if (cmd === "news-moon") {
      await buildMoonDownloads();
    } else if (cmd === "news-lunar") {
      await buildLunarNewYearDownloads();
    } else if (cmd === "news-ssa") {
      await buildSocialSecurityDownloads();
    } else if (cmd === "news-november") {
      await buildNovemberDownloads();
    } else if (cmd === "news-advent") {
      await buildAdventDownloads();
    } else if (cmd === "news-fall") {
      await buildFallDownloads();
    } else if (cmd === "news-datelists") {
      await buildDateListDownloads();
    } else if (cmd === "news-datelists2") {
      await buildDateList2Downloads();
    } else if (cmd === "news-datelists3") {
      await buildDateList3Downloads();
    } else if (cmd === "news-heroes3") {
      await buildHeroes3();
    } else if (cmd === "news-election2026") {
      await buildElection2026Downloads();
    } else if (cmd === "news-heroes4") {
      await buildHeroes4();
    } else if (cmd === "news-gta6") {
      await buildGta6Downloads();
    } else if (cmd === "news-veterans") {
      await buildVeteransDownloads();
    } else if (cmd === "rollover") {
      const to = Number(argValue("--to"));
      if (!to) throw new Error("--to YYYY required");
      await rollover(to, argFlag("--confirm"));
    } else if (cmd === "verify") {
      await verifyDist();
    } else if (cmd === "sync-cdn") {
      await syncCdnAssets();
    } else if (cmd === "purge-cdn") {
      await purgeDoCdn();
    } else if (cmd === "deploy") {
      if (argFlag("--with-cdn")) {
        await syncCdnAssets();
        try {
          await purgeDoCdn();
        } catch (e) {
          console.warn("CDN purge warning:", e);
        }
      }
      await deploy({ confirm: argFlag("--confirm"), changed: argFlag("--changed") });
    } else {
      console.log(`Usage:
  pnpm fc gen --year 2026 [--family monthly|yearly|blank|weekly|school]
  pnpm fc build [--skip-assets]
  pnpm fc gen-meta          # meta + HTML only (skips PNG/PDF render)
  pnpm fc refresh-meta      # daily: Eastern bake date, HTML only, no PNG/OG
  pnpm fc news-julian [--years 2026,2027]  # /news/ Julian date printables (PDF + PNG)
  pnpm fc news-ramadan                     # /news/ Ramadan 2027 printables (PDF + PNG)
  pnpm fc news-weeks                       # /news/ week number 2027 printables (PDF + PNG)
  pnpm fc news-moon                        # /news/ moon phases 2027 printables (PDF + PNG)
  pnpm fc news-lunar                       # /news/ Lunar New Year 2027 printables (PDF + PNG)
  pnpm fc news-ssa                         # /news/ Social Security 2027 printables (PDF + PNG)
  pnpm fc news-november                    # /news/ Diwali 2026 and Election 2026 printables (PDF + PNG)
  pnpm fc news-advent                      # /news/ Advent calendar 2026 printables (PDF + PNG)
  pnpm fc news-fall                        # /news/ Halloween, ACA enrollment, November sky printables
  pnpm fc news-datelists                   # /news/ NYC and Chicago school calendars, UK bank holidays 2027
  pnpm fc news-datelists2                  # /news/ 2027 holidays, Florida school calendars, MCAT/SAT/ACT/LSAT
  pnpm fc news-election2026                # /news/ poll times, mail deadlines, results tracker, state ballot checklists
  pnpm fc news-heroes4                     # /news/ hero illustrations for the Election 2026 batch
  pnpm fc news-gta6                        # /news/ GTA 6 launch countdown calendar
  pnpm fc news-veterans                    # /news/ Veterans Day free meals cheat sheet
  pnpm fc news-heroes3                     # /news/ hero illustrations for the Oct. 20, 2026 batch
  pnpm fc news-datelists3                  # /news/ sunset times, Hunter's Moon, 2027 tax calendar, late October, winter break
  pnpm fc refresh-evergreen
  pnpm fc rollover --to 2027 --confirm
  pnpm fc verify
  pnpm fc sync-cdn          # upload assets/ + og/ (hash-deduped)
  pnpm fc purge-cdn
  pnpm fc deploy --confirm [--changed] [--with-cdn]`);
    }
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
