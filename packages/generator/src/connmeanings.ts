/**
 * In-article cards for the "Connections answers explained" stories on /news/: one 1600×900 PNG per
 * group, in the group's color, with the category and each word's meaning. The cards show answers,
 * so stories place them inside the spoiler section. Groups come from the NYT Connections puzzle
 * data for the day; meanings are written per story in MEANINGS.
 * Usage: pnpm fc news-connections-meanings
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";

type Group = { color: "yellow" | "green" | "blue" | "purple"; title: string; words: [string, string][] };
type Story = { slug: string; puzzle: string; date: string; groups: Group[] };

const FILL = { yellow: "#f9df6d", green: "#a0c35a", blue: "#b0c4ef", purple: "#ba81c5" } as const;

/** One entry per story: [word, short meaning] in the order the story explains them. */
export const MEANINGS: Story[] = [
  {
    slug: "nyt-connections-answers-meanings-october-25-2026-1232",
    puzzle: "Connections #1232",
    date: "Sun., Oct. 25, 2026",
    groups: [
      { color: "yellow", title: "Steal", words: [["Boost", "Slang for shoplifting or stealing a car"], ["Palm", "Hide a small item in your hand and take it"], ["Pocket", "Take something and keep it for yourself"], ["Swipe", "Grab something quickly, without asking"]] },
      { color: "green", title: "Pasta shapes", words: [["Bow tie", "Farfalle, pinched in the middle"], ["Elbow", "Short curved tubes, as in macaroni"], ["Shell", "Conchiglie, shaped like seashells"], ["Wagon wheel", "Round pasta with spokes, or rotelle"]] },
      { color: "blue", title: "Fictional Toms", words: [["Ripley", "Patricia Highsmith's con man"], ["Sawyer", "Mark Twain's fence-painting boy"], ["Swift", "Boy inventor of adventure novels"], ["Thumb", "Tiny hero of English folk tales"]] },
      { color: "purple", title: "Things that can be snapped", words: [["Fingers", "Snapped to keep a beat"], ["Football", "Snapped to the quarterback"], ["Glow stick", "Snapped to start the glow"], ["Rubber band", "Snapped against the skin"]] },
    ],
  },
];

const W = 1600, H = 900;
function card(fonts: string, s: Story, g: Group): string {
  const tiles = g.words.map(([w, m]) => `<div class="t"><b>${w}</b><span>${m}</span></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;background:#faf9f4;font-family:Manrope,sans-serif;color:#111827;padding:56px 64px}
  .k{font-weight:800;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#4b5563}
  .h{display:flex;align-items:center;gap:22px;margin:14px 0 34px}
  .chip{width:64px;height:64px;border-radius:16px;background:${FILL[g.color]}}
  .h b{font-family:Sora;font-size:62px;line-height:1;letter-spacing:-.01em}
  .g{display:grid;grid-template-columns:1fr 1fr;gap:26px}
  .t{background:${FILL[g.color]};border-radius:22px;padding:30px 34px;height:270px;display:flex;flex-direction:column;justify-content:center;gap:14px;box-shadow:0 10px 24px rgba(17,24,39,.08)}
  .t b{font-family:Sora;font-weight:800;font-size:52px;text-transform:uppercase;letter-spacing:.02em}
  .t span{font-size:28px;font-weight:600;line-height:1.3;color:#1f2937}
  .brand{position:absolute;right:40px;bottom:22px;font-size:20px;font-weight:700;letter-spacing:.06em;color:#6b7280}</style></head><body>
  <div class="k">${s.puzzle} · ${s.date} · ${g.color} group</div>
  <div class="h"><div class="chip"></div><b>${g.title}</b></div>
  <div class="g">${tiles}</div><div class="brand">freshcalendars.com/news</div></body></html>`;
}

export async function buildConnectionsMeanings(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const s of MEANINGS) {
      const dir = path.join(ROOT, "apps/news/src/assets/news", s.slug);
      await fs.mkdir(dir, { recursive: true });
      for (const g of s.groups) {
        const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
        await page.setContent(card(fonts, s, g), { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const png = await page.screenshot({ type: "png" });
        await page.close();
        const file = path.join(dir, `${s.slug}-${g.color}.png`);
        await sharp(png).png({ compressionLevel: 9, palette: true }).toFile(file);
        console.log(path.basename(file));
      }
    }
  } finally {
    await browser.close();
  }
}
