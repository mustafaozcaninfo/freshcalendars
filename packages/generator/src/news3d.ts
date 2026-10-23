/**
 * Hero renderer shared by illustrated, 3D and photo heroes. A hero is two layers in one page:
 *   #art  the picture (3D canvas from render3d/, an SVG scene from art.ts, or a licensed photo)
 *   #ui   the kicker, title, date tile, card and brand line
 * The art is shot first and finished in fx.ts (bloom, grade, vignette, grain); the UI is shot on a
 * transparent page and laid on top, so text and cards stay crisp and never glow.
 *
 * The page is served from a private origin (http://fc.render/) so the 3D modules can import
 * three.js from node_modules; nothing is fetched from the network.
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { Browser } from "playwright";
import sharp from "sharp";
import { finish, type FxOptions } from "./fx.js";
import { ROOT } from "./paths.js";
import { rng, tint } from "./art.js";

export const W = 1200, H = 675;
const ORIGIN = "http://fc.render";
const THREE_DIR = path.join(ROOT, "packages/generator/node_modules/three");
const R3D_DIR = path.join(ROOT, "packages/generator/render3d");

/** Scenes drawn in 3D, with the rim/glow accent and whether the backdrop is a night sky. */
export const SCENES_3D: Record<string, { accent: string; night?: boolean }> = {
  calendar: { accent: "#ffd27a" },
  election: { accent: "#ffd9a0" },
  halloween: { accent: "#ff9a3c", night: true },
  "halloween-party": { accent: "#a3e635", night: true },
  thanksgiving: { accent: "#ffcf87" },
  "winter-holidays": { accent: "#fde68a" },
  "night-sky": { accent: "#c7d2fe", night: true },
  "time-change": { accent: "#fde68a" },
  shopping: { accent: "#fecdd3" },
  school: { accent: "#fef3c7" },
  money: { accent: "#fde68a" },
  puzzle: { accent: "#e9d5ff" },
  gaming: { accent: "#8b5cf6", night: true },
  sports: { accent: "#fef9c3" },
  phone: { accent: "#34d399" },
};

export interface HeroDoc {
  css: string;
  art: string;
  ui: string;
  /** Set for 3D heroes: the scene and its options for render3d/stage.js. */
  three?: { scene: string; color: string; accent: string; seed: string; date?: string };
}

const MIME: Record<string, string> = { ".js": "text/javascript", ".html": "text/html" };

function pageHtml(doc: HeroDoc): string {
  const boot = doc.three
    ? `<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">import { render } from "/r3d/stage.js"; render(${JSON.stringify({ ...doc.three, width: W, height: H })}).catch((e) => { window.__error = String(e && e.stack || e); });</script>`
    : `<script>document.fonts.ready.then(() => { window.__rendered = true; });</script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${doc.css}
  *{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;position:relative}
  #art,#ui{position:absolute;inset:0}#gl{position:absolute;inset:0;width:${W}px;height:${H}px}
  body.ui-only{background:transparent!important}body.ui-only #art{display:none}body.art-only #ui{display:none}</style>${boot}</head>
  <body class="art-only"><div id="art">${doc.art}${doc.three ? `<canvas id="gl" width="${W * 2}" height="${H * 2}"></canvas><div class="scrim"></div>` : ""}</div><div id="ui">${doc.ui}</div></body></html>`;
}

/** Renders a hero to a 2400×1350 PNG: finished art with the UI layer on top. */
export async function shootHero(browser: Browser, doc: HeroDoc, fx: FxOptions): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  try {
    const html = pageHtml(doc);
    await page.route(`${ORIGIN}/**`, async (route) => {
      const p = new URL(route.request().url()).pathname;
      if (p === "/index.html") return route.fulfill({ body: html, contentType: "text/html" });
      const file = p.startsWith("/three/") ? path.join(THREE_DIR, p.slice(7)) : p.startsWith("/r3d/") ? path.join(R3D_DIR, p.slice(5)) : "";
      if (!file || !file.startsWith(p.startsWith("/three/") ? THREE_DIR : R3D_DIR)) return route.fulfill({ status: 404, body: "" });
      try {
        return route.fulfill({ body: await fs.readFile(file), contentType: MIME[path.extname(file)] ?? "application/octet-stream" });
      } catch {
        return route.fulfill({ status: 404, body: "" });
      }
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${ORIGIN}/index.html`, { waitUntil: "load" });
    await page.waitForFunction(() => (window as any).__rendered || (window as any).__error, null, { timeout: 120_000 });
    const err = await page.evaluate(() => (window as any).__error);
    if (err || errors.length) throw new Error(`hero render failed: ${err ?? errors.join("; ")}`);
    const art = await finish(await page.screenshot({ type: "png" }), fx);
    await page.evaluate(() => { document.body.className = "ui-only"; });
    const ui = await page.screenshot({ type: "png", omitBackground: true });
    return sharp(art).composite([{ input: ui }]).png().toBuffer();
  } finally {
    await page.close();
  }
}

/** Backdrop for a 3D scene: deep gradient in the story color, a glow behind the subject, bokeh, stars at night. */
export function backdrop3d(color: string, accent: string, seed: string, night = false, x = 0.68): string {
  const r = rng(`bg:${seed}`);
  const dots = Array.from({ length: 16 }, () => {
    const s = Math.round(18 + r() * 70);
    return `<i style="left:${Math.round(380 + r() * 820)}px;top:${Math.round(r() * 640)}px;width:${s}px;height:${s}px;opacity:${(0.04 + r() * 0.1).toFixed(2)}"></i>`;
  }).join("");
  const stars = night
    ? Array.from({ length: 90 }, () => `<b style="left:${Math.round(360 + r() * 840)}px;top:${Math.round(r() * 430)}px;width:${(1 + r() * 2).toFixed(1)}px;height:${(1 + r() * 2).toFixed(1)}px;opacity:${(0.35 + r() * 0.6).toFixed(2)}"></b>`).join("")
    : "";
  const deep = tint(color, night ? -0.78 : -0.62), mid = tint(color, night ? -0.45 : -0.18), lit = tint(color, night ? -0.1 : 0.22);
  return `<div class="bg" style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 85% at ${x * 100}% 52%, ${lit} 0%, ${mid} 42%, ${deep} 100%)"></div>
  <div style="position:absolute;left:${x * 100 - 26}%;top:8%;width:52%;height:84%;background:radial-gradient(circle, ${accent}55 0%, ${accent}00 62%);filter:blur(10px)"></div>
  <div class="bokeh">${dots}${stars}</div>
  <style>.bokeh i{position:absolute;border-radius:50%;background:#fff;filter:blur(7px)}.bokeh b{position:absolute;border-radius:50%;background:#fff}
  .scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.22) 38%,rgba(0,0,0,0) 62%)}</style>`;
}
