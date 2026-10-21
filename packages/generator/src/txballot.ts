/**
 * Texas ballot guide for /news/ (texas-ballot-2026-candidates-senate-governor-statewide-races):
 * the shared state hero and the one-page ballot checklist. Candidates and parties come from the
 * Secretary of State's ballot certification of Aug. 28, 2026, in its order. Nonpartisan.
 * Usage: pnpm fc news-txballot
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

const SLUG = "texas-ballot-2026-candidates-senate-governor-statewide-races";

const TX: StateSheet = {
  slug: "texas-ballot-checklist-2026", state: "Texas", accent: "#9a3412", site: `freshcalendars.com/news/${SLUG}/`,
  dates: [["Through Fri., Oct. 30", "Early voting at any site in your county"], ["Fri., Oct. 23", "Ballot by mail applications must be received"], ["Tue., Nov. 3, 7 a.m.-7 p.m.", "Election Day; mailed ballots due by 7 p.m. (postmarked by 7 p.m. and in by 5 p.m. Nov. 4 also counts)"]],
  offices: [], candidatesLabel: "Statewide races (certified candidates, Secretary of State order)", measureLabel: "Local propositions (if your county sample ballot has them)",
  note: "Source: Texas Secretary of State, ballot certification for the Nov. 3, 2026 general election (Aug. 28, 2026) and Offices up for Election in 2026. No statewide propositions this year; local ones are on your county sample ballot. No straight-ticket voting: choose in each race. Unopposed candidates stay on the ballot. Bring an accepted photo ID.",
  candidates: [
    ["U.S. senator", ["Ken Paxton (Rep.)", "James Talarico (Dem.)", "Ted Brown (Lib.)"]],
    ["Governor", ["Greg Abbott (Rep.)", "Gina Hinojosa (Dem.)", "Pat Dixon (Lib.)"]],
    ["Lieutenant governor", ["Dan Patrick (Rep.)", "Vikki Goodwin (Dem.)", "Anthony Cristo (Lib.)", "Kevin McCormick (Green)"]],
    ["Attorney general", ["Mayes Middleton (Rep.)", "Nathan Johnson (Dem.)", "Tom Oxford (Lib.)"]],
    ["Comptroller", ["Don Huffines (Rep.)", "Sarah Eckhardt (Dem.)", "V. Alonzo Echavarria-Garza (Lib.)", "Shehla Faizi (Green)"]],
    ["Land commissioner", ["Dawn Buckingham (Rep.)", "Benjamin Flores (Dem.)", "Neill Snider (Lib.)"]],
    ["Agriculture commissioner", ["Nate Sheets (Rep.)", "Clayton Tucker (Dem.)", "Austin R. Kelly (Lib.)"]],
    ["Railroad commissioner", ["Bo French (Rep.)", "Jon Rosenthal (Dem.)", "Arthur DiBianca (Lib.)"]],
    ["Supreme Court, chief justice", ["Jimmy Blacklock (Rep.)", "Maggie Ellis (Dem.)"]],
    ["Supreme Court, Place 2 (unexpired)", ["James P. Sullivan (Rep.)", "Chari Kelly (Dem.)"]],
    ["Supreme Court, Place 7", ["Kyle Hawkins (Rep.)", "Kristen Hawkins (Dem.)"]],
    ["Supreme Court, Place 8", ["Brett Busby (Rep.)", "Gisela D. Triana (Dem.)"]],
    ["Court of Criminal Appeals, Place 3", ["Thomas Smith (Rep.)", "Okey Anyiam (Dem.)", "Mark Ash (Lib.)"]],
    ["Court of Criminal Appeals, Place 4", ["Kevin Patrick Yeary (Rep.)", "Audra Riley (Dem.)"]],
    ["Court of Criminal Appeals, Place 9", ["John Messinger (Rep.)", "Holly Taylor (Dem.)"]],
    ["15th Court of Appeals, chief justice", ["Scott Brister (Rep.)", "Jerry Zimmerer (Dem.)"]],
    ["15th Court of Appeals, Place 2", ["Scott K. Field (Rep.)", "Tom Baker (Dem.)"]],
    ["15th Court of Appeals, Place 3", ["April Farris (Rep.)", "Marc M. Meyer (Dem.)"]],
  ],
  localLines: 6,
  measures: [["Local", "City, county or school district proposition"], ["Local", "City, county or school district proposition"]],
};

export async function buildTxBallot(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 2 });
    await page.setContent(stateHero(fonts, { state: "Texas", bg: "#9a3412", bg2: "#431407", accent: "#9a3412", kicker: "Texas · Nov. 3, 2026", title: "Who is on the Texas ballot", cardTop: "Early voting runs through", cardBig: "Fri., Oct. 30", cardBottom: "No straight-ticket option", lines: ["U.S. SENATOR", "GOVERNOR", "LT. GOVERNOR"], measure: "LOCAL PROPOSITION", seed: 61 }), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    const dir = path.join(ROOT, "apps/news/src/assets/news", SLUG);
    await fs.mkdir(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${SLUG}.jpg`));
    console.log(`${SLUG}.jpg`);
  } finally {
    await browser.close();
  }
  await renderPrintables("election-2026", [{ slug: TX.slug, size: LETTER, html: stateSheet(fonts, TX) }]);
}
