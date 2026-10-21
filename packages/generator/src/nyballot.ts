/**
 * New York ballot guide for /news/ (new-york-ballot-2026-sample-ballot-governor-nyc-proposals):
 * the shared state hero and the one-page ballot checklist. Candidates and party lines come from the
 * State Board of Elections certification of Oct. 7, 2026; the city questions from the NYC Board of
 * Elections. Nonpartisan: tickets listed in the certification's order. Usage: pnpm fc news-nyballot
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { type StateSheet, stateSheet } from "./election2026.js";
import { stateHero } from "./heroes4.js";
import { LETTER, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";
import { ROOT } from "./paths.js";

const SLUG = "new-york-ballot-2026-sample-ballot-governor-nyc-proposals";

const NY: StateSheet = {
  slug: "new-york-ballot-checklist-2026", state: "New York", accent: "#1e40af", site: `freshcalendars.com/news/${SLUG}/`,
  dates: [["Sat., Oct. 24", "Registration deadline; early voting opens; last day to apply online or by mail for a mail ballot"], ["Oct. 24-Nov. 1", "Early in-person voting (hours set by county)"], ["Mon., Nov. 2", "Last day to apply for a mail ballot in person"], ["Nov. 3, 6 a.m.-9 p.m.", "Polls open; mail ballots postmarked by today"]],
  offices: [], candidatesLabel: "Statewide races (certified candidates and their party lines)", measureLabel: "New York City charter questions (city voters only)",
  note: "Sources: New York State Board of Elections, certification for the Nov. 3, 2026 general election (amended Oct. 7, 2026) and certification of offices (July 31, 2026); NYC Board of Elections, ballot questions. Votes for a candidate on any of their party lines are added together. Also on every ballot: U.S. House, state Senate and Assembly; Supreme Court justices in some districts.",
  candidates: [
    ["Governor / Lieutenant governor", ["Kathy Hochul / Adrienne Adams (Dem., Working Families)", "Bruce Blakeman / Todd Hood (Rep., Conservative, Vote Affordable)"]],
    ["Attorney general", ["Letitia James (Dem., Working Families)", "Saritha Komatireddy (Rep., Conservative)"]],
    ["Comptroller", ["Thomas DiNapoli (Dem., Working Families)", "Joseph Hernandez (Rep., Conservative)"]],
    ["U.S. House (my district)", ["", ""]],
  ],
  measures: [["Question 1", "Faster process to use public space (ramps, planters, cafes)"], ["Question 2", "Less contractor paperwork; quarterly Procurement Policy Board meetings"], ["Question 3", "Faster street safety projects, city property sales and office leasing"], ["Question 4", "Central building permit hub; waterfront permits to Department of Buildings"], ["Question 5", "Target for the rainy day fund and other reserves"]],
};

export async function buildNyBallot(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 2 });
    await page.setContent(stateHero(fonts, { state: "New York", bg: "#1e3a8a", bg2: "#172554", accent: "#1e40af", kicker: "New York · Nov. 3, 2026", title: "Governor\u2019s race and 5 NYC questions", cardTop: "Registration deadline, early voting opens", cardBig: "Sat., Oct. 24", cardBottom: "Polls 6 a.m.-9 p.m. on Election Day", lines: ["GOVERNOR / LT. GOV.", "ATTORNEY GENERAL", "COMPTROLLER"], measure: "CITY QUESTION 1", seed: 59 }), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    const dir = path.join(ROOT, "apps/news/src/assets/news", SLUG);
    await fs.mkdir(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${SLUG}.jpg`));
    console.log(`${SLUG}.jpg`);
  } finally {
    await browser.close();
  }
  await renderPrintables("election-2026", [{ slug: NY.slug, size: LETTER, html: stateSheet(fonts, NY) }]);
}
