/**
 * Printable pumpkin carving stencils for /news/printable-pumpkin-carving-templates/:
 * 18 original designs drawn here as vector shapes, one US Letter PDF each plus a pack with all of them.
 * Convention on every sheet: cut out the black areas, keep the white.
 * Before rendering, each design is rasterized and checked for pieces that would fall out
 * (white islands) and for bridges narrower than about 1/4 inch at actual size.
 * Usage: pnpm fc news-pumpkins
 */
import { chromium } from "playwright";
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

type Level = "Easy" | "Medium";
type Group = "Easy faces" | "Cute" | "Scary" | "Silhouettes and words";
type Design = { id: string; name: string; level: Level; group: Group; tip: string; svg: string };

const poly = (pts: [number, number][]) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="#000"/>`;
const path = (d: string) => `<path d="${d}" fill="#000"/>`;
const circle = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000"/>`;
const line = (d: string, w: number, extra = ` stroke-linecap="round"`) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${w}" stroke-linejoin="round"${extra}/>`;
const mirror = (svg: string) => `<g transform="translate(600,0) scale(-1,1)">${svg}</g>`;
function star(cx: number, cy: number, r: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push([+(cx + rr * Math.cos(a)).toFixed(1), +(cy + rr * Math.sin(a)).toFixed(1)]);
  }
  return poly(pts);
}

/** Drawing space: 600×600, pumpkin face ellipse centered at (300, 330), rx 285, ry 255. */
export const DESIGNS: Design[] = [
  {
    id: "classic-jack-o-lantern", name: "Classic Jack-o'-Lantern", level: "Easy", group: "Easy faces",
    tip: "Cut the two square teeth last so the mouth keeps its strength while you work.",
    svg: poly([[140, 265], [250, 265], [195, 170]]) + poly([[350, 265], [460, 265], [405, 170]]) + poly([[268, 342], [332, 342], [300, 290]])
      + path("M115 372 L180 396 L180 432 L222 432 L222 404 L378 404 L378 432 L420 432 L420 396 L485 372 Q470 470 340 500 L340 468 L260 468 L260 500 Q130 470 115 372 Z"),
  },
  {
    id: "happy-pumpkin-face", name: "Happy Face", level: "Easy", group: "Easy faces",
    tip: "Round eyes are easiest with a small saw moved in short strokes around the curve.",
    svg: circle(200, 245, 48) + circle(400, 245, 48) + path("M140 365 Q300 535 460 365 Q300 450 140 365 Z"),
  },
  {
    id: "goofy-grin", name: "Goofy Grin", level: "Easy", group: "Easy faces",
    tip: "The mismatched eyes are the joke; keep the big eye round and the small one small.",
    svg: circle(195, 240, 58) + circle(400, 255, 32) + circle(300, 330, 20)
      + path("M130 372 L270 394 L270 440 L322 440 L322 388 L470 352 Q440 520 290 515 Q170 505 130 372 Z"),
  },
  {
    id: "winking-pumpkin", name: "Winking Face", level: "Easy", group: "Easy faces",
    tip: "Carve the wink as one curved slot, about as wide as a pencil.",
    svg: poly([[140, 265], [250, 265], [195, 175]]) + line("M345 240 Q405 198 465 240", 28) + poly([[275, 335], [325, 335], [300, 295]])
      + path("M150 375 Q300 530 450 375 Q300 445 150 375 Z"),
  },
  {
    id: "surprised-pumpkin", name: "Surprised Face", level: "Easy", group: "Easy faces",
    tip: "Leave a full inch of pumpkin between each eyebrow and its eye.",
    svg: line("M155 188 Q205 158 255 188", 24) + line("M345 188 Q395 158 445 188", 24) + ellipse(205, 280, 38, 56) + ellipse(395, 280, 38, 56) + ellipse(300, 445, 50, 60),
  },
  {
    id: "sleepy-pumpkin", name: "Sleepy Face", level: "Medium", group: "Cute",
    tip: "The closed eyes and Z's are narrow slots; cut them slowly with the saw upright.",
    svg: line("M140 270 Q200 312 260 270", 26) + line("M340 270 Q400 312 460 270", 26) + line("M235 420 Q300 462 365 420", 28)
      + line("M385 150 L425 150 L385 192 L425 192", 15) + line("M440 210 L468 210 L440 240 L468 240", 13),
  },
  {
    id: "cute-cat-face", name: "Cute Cat Face", level: "Medium", group: "Cute",
    tip: "Cut the whiskers as single straight slots and keep them apart from the mouth.",
    svg: path("M140 255 Q200 192 260 255 Q200 305 140 255 Z") + path("M340 255 Q400 192 460 255 Q400 305 340 255 Z") + poly([[272, 322], [328, 322], [300, 352]])
      + line("M300 352 L300 380", 14) + line("M236 385 Q268 418 300 382 Q332 418 364 385", 18)
      + line("M92 330 L215 346", 12) + line("M98 385 L215 372", 12) + line("M508 330 L385 346", 12) + line("M502 385 L385 372", 12),
  },
  {
    id: "owl-face", name: "Owl Face", level: "Medium", group: "Cute",
    tip: "Carve the beak before the eyes so the wood between them stays firm.",
    svg: circle(200, 275, 60) + circle(400, 275, 60) + poly([[280, 318], [320, 318], [300, 362]])
      + line("M190 420 L225 452 L260 420", 16) + line("M340 420 L375 452 L410 420", 16) + line("M265 480 L300 512 L335 480", 16),
  },
  {
    id: "friendly-ghost", name: "Friendly Ghost", level: "Easy", group: "Cute",
    tip: "The whole ghost comes out as one piece; draw a face on the leftover pumpkin with a marker.",
    svg: path("M300 140 C200 140 175 230 175 300 L175 470 L215 440 L255 480 L300 440 L345 480 L385 440 L425 470 L425 300 C425 230 400 140 300 140 Z"),
  },
  {
    id: "flying-bat", name: "Flying Bat", level: "Medium", group: "Cute",
    tip: "Follow the wing scallops in small cuts and turn the pumpkin, not the saw.",
    svg: `<g transform="translate(0,40)">${path("M300 232 L315 205 L325 245 Q370 240 400 210 Q440 240 490 230 Q460 280 470 322 Q430 302 410 332 Q385 307 360 337 Q340 312 315 342 L300 372 L285 342 Q260 312 240 337 Q215 307 190 332 Q170 302 130 322 Q140 280 110 230 Q160 240 200 210 Q230 240 275 245 L285 205 Z")}</g>`,
  },
  {
    id: "jagged-grin", name: "Jagged Grin", level: "Medium", group: "Scary",
    tip: "Cut each tooth point as two straight cuts that meet; do not saw around the tip.",
    svg: poly([[140, 222], [260, 265], [162, 290]]) + poly([[460, 222], [340, 265], [438, 290]]) + poly([[280, 335], [320, 335], [300, 300]])
      + path("M110 362 L150 386 L175 362 L205 400 L235 370 L265 408 L300 376 L335 408 L365 370 L395 400 L425 362 L450 386 L490 362 L465 432 L430 418 L400 458 L365 438 L335 472 L300 448 L265 472 L235 438 L200 458 L170 418 L135 432 Z"),
  },
  {
    id: "vampire-grin", name: "Vampire Grin", level: "Medium", group: "Scary",
    tip: "Leave the two fangs thick at the top where they join the pumpkin.",
    svg: path("M150 232 L260 262 Q205 305 150 232 Z") + path("M450 232 L340 262 Q395 305 450 232 Z")
      + path("M130 372 Q178 390 208 396 L225 428 L242 400 Q300 410 358 400 L375 428 L392 396 Q422 390 470 372 Q300 580 130 372 Z"),
  },
  {
    id: "skull-face", name: "Skull Face", level: "Medium", group: "Scary",
    tip: "Cut the teeth one at a time from the middle outward.",
    svg: circle(200, 255, 56) + circle(400, 255, 56) + poly([[300, 305], [332, 362], [300, 346], [268, 362]])
      + [155, 211, 267, 323, 379, 435].map((x) => `<rect x="${x}" y="402" width="34" height="52" rx="8" fill="#000"/>`).join(""),
  },
  {
    id: "zombie-pumpkin", name: "Zombie Face", level: "Medium", group: "Scary",
    tip: "The gaps in the mouth are the stitches; keep each one at least as wide as your pinkie.",
    svg: line("M165 215 L250 292", 26) + line("M250 215 L165 292", 26) + circle(400, 258, 44) + ellipse(276, 335, 11, 19) + ellipse(324, 335, 11, 19)
      + line("M150 425 Q300 462 450 410", 30, ` stroke-dasharray="58 26" stroke-linecap="butt"`),
  },
  {
    id: "black-cat-silhouette", name: "Black Cat Silhouette", level: "Easy", group: "Silhouettes and words",
    tip: "Cut the tail curl as one smooth slot so it stays joined to the body.",
    svg: path("M235 525 C205 470 215 400 255 350 C240 330 238 300 248 280 L240 215 L280 245 C293 241 307 241 320 245 L360 215 L352 280 C362 300 360 330 345 350 C385 400 395 470 365 525 Z")
      + line("M355 512 C430 515 452 470 428 428", 22),
  },
  {
    id: "witch-hat", name: "Witch Hat", level: "Easy", group: "Silhouettes and words",
    tip: "Cut the brim first, then the cone, so the bent tip is the last small cut.",
    svg: path("M330 135 Q362 170 340 202 L388 432 Q300 445 212 432 L270 230 Q285 162 330 135 Z") + path("M110 428 Q300 398 490 428 Q495 472 300 472 Q105 472 110 428 Z"),
  },
  {
    id: "moon-and-stars", name: "Moon and Stars", level: "Medium", group: "Silhouettes and words",
    tip: "Cut the star points as straight cuts toward the center of each star.",
    svg: `<mask id="moonCut"><rect width="600" height="600" fill="#fff"/><circle cx="315" cy="295" r="130" fill="#000"/></mask><circle cx="250" cy="330" r="150" fill="#000" mask="url(#moonCut)"/>`
      + star(420, 200, 45) + star(455, 330, 30) + star(430, 452, 36),
  },
  {
    id: "boo-letters", name: "Boo Letters", level: "Medium", group: "Silhouettes and words",
    tip: "The gaps in the B and O letters hold the centers in place; do not cut through them.",
    svg: line("M90 255 L90 405", 28) + line("M146 255 Q191 255 191 292 Q191 328 146 330 Q201 333 201 368 Q201 405 146 405", 28)
      + [305, 450].map((c) => line(`M${c - 28} 255 Q${c - 44} 255 ${c - 44} 330 Q${c - 44} 405 ${c - 28} 405`, 28) + line(`M${c + 28} 255 Q${c + 44} 255 ${c + 44} 330 Q${c + 44} 405 ${c + 28} 405`, 28)).join(""),
  },
];

const OUTLINE = `<g fill="none" stroke="#9ca3af" stroke-width="3" stroke-dasharray="10 8"><ellipse cx="300" cy="330" rx="285" ry="255"/><path d="M276 80 L284 30 Q302 22 318 32 L326 80"/></g>`;
const art = (d: Design, outline = true) => `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">${outline ? OUTLINE : ""}${d.svg}</svg>`;

/**
 * Rasterizes each design and fails on cut-outs that would leave a loose piece (a white island),
 * on bridges narrower than about 1/4 inch at actual size, and on cuts too close to the pumpkin's edge (inside 3/8 inch of the outline).
 * At print size 600 units are 6.25 inches, so 1/4 inch is 24 units and a bridge is checked by
 * eroding the white by 12 units and looking for parts that lose their connection to the rim.
 */
export async function checkStencils(designs = DESIGNS): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
    // tsx wraps named inner functions in __name(); define it so the evaluated function runs as written.
    await page.evaluate("window.__name = (f) => f");
    const problems: string[] = [];
    for (const d of designs) {
      const url = "data:image/svg+xml;base64," + Buffer.from(art(d, false)).toString("base64");
      const res = await page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const W = 600, H = 600, cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const g = cv.getContext("2d")!;
        g.drawImage(img, 0, 0, W, H);
        const px = g.getImageData(0, 0, W, H).data;
        const inside = (x: number, y: number, rx: number, ry: number) => ((x - 300) / rx) ** 2 + ((y - 330) / ry) ** 2 <= 1;
        const black = new Uint8Array(W * H);
        let nearEdge = 0;
        for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > 100) { black[i] = 1; if (!inside(i % W, (i / W) | 0, 250, 220)) nearEdge++; }
        const flood = (white: Uint8Array) => {
          const seen = new Uint8Array(W * H), st: number[] = [];
          for (let i = 0; i < W * H; i++) if (white[i] && !inside(i % W, (i / W) | 0, 270, 240)) { seen[i] = 1; st.push(i); }
          while (st.length) {
            const i = st.pop()!, x = i % W;
            for (const j of [i - 1, i + 1, i - W, i + W]) {
              if (j < 0 || j >= W * H || seen[j] || !white[j]) continue;
              if ((j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue;
              seen[j] = 1; st.push(j);
            }
          }
          let left = 0;
          for (let i = 0; i < W * H; i++) if (white[i] && !seen[i]) left++;
          return left;
        };
        const white = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) white[i] = inside(i % W, (i / W) | 0, 285, 255) && !black[i] ? 1 : 0;
        const islands = flood(white);
        // Erode the white: a pixel stays only if no black pixel is within R.
        const R = 12, eroded = new Uint8Array(W * H), offs: number[][] = [];
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R) offs.push([dx, dy]);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (!white[i]) continue;
          let ok = 1;
          for (const [dx, dy] of offs) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && black[yy * W + xx]) { ok = 0; break; } }
          eroded[i] = ok;
        }
        return { islands, thin: flood(eroded), nearEdge };
      }, url);
      const bad = [res.islands > 30 && `${res.islands} px of loose pieces`, res.thin > 30 && `${res.thin} px held by bridges under 1/4 in`, res.nearEdge > 0 && `${res.nearEdge} px too close to the edge`].filter(Boolean);
      console.log(`${d.id}: ${bad.length ? bad.join(", ") : "ok"}`);
      if (bad.length) problems.push(`${d.id}: ${bad.join(", ")}`);
    }
    if (problems.length) throw new Error(`stencil check failed:\n${problems.join("\n")}`);
  } finally {
    await browser.close();
  }
}

const STORY = "printable-pumpkin-carving-templates";
const FOOT = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/</div>`;
export const stencilSlug = (d: Design) => `pumpkin-carving-stencil-${d.id}-2026`;
export const PACK_SLUG = "pumpkin-carving-stencils-all-18-designs-2026";

const CSS = `
  .st{padding:46px 48px 0}
  .st header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #ea580c;padding-bottom:8px}
  .st h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#7c2d12;line-height:1.1}
  .st .sub{margin:5px 0 0;font-size:11.5px;color:#374151}
  .st .lvl{font-family:Sora;font-weight:800;font-size:13px;color:#fff;background:#7c2d12;border-radius:8px;padding:7px 12px}
  .st .lvl.Medium{background:#c2410c}
  .st .art{width:600px;height:600px;margin:14px auto 0;display:block}
  .st .art svg{width:600px;height:600px;display:block}
  .st .how{display:grid;grid-template-columns:1.1fr 1fr 1.2fr;gap:12px;margin-top:10px}
  .st .how div{border:1.5px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:9px 11px;font-size:10.5px;line-height:1.4;color:#1f2937}
  .st .how b{display:block;font-family:Sora;font-size:11px;color:#7c2d12;margin-bottom:3px}
  .st .bar{display:block;width:192px;height:8px;background:#111;margin:6px 0 2px}
  .st .note{margin-top:9px;font-size:9px;color:#6b7280;line-height:1.45}
  .cv{padding:46px 48px 0}
  .cv h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:#7c2d12;border-bottom:4px solid #ea580c;padding-bottom:8px}
  .cv .sub{font-size:12px;color:#374151;margin:8px 0 12px}
  .cv .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
  .cv figure{margin:0;border:1.5px solid #fed7aa;border-radius:8px;padding:5px;text-align:center}
  .cv figure svg{width:100%;height:auto;display:block}
  .cv figcaption{font-size:8.6px;font-weight:700;line-height:1.2;color:#1f2937;margin-top:2px}
  .cv figcaption i{font-style:normal;color:#c2410c;display:block}
  .cv h2{font-family:Sora;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#c2410c;margin:16px 0 6px}
  .cv ol{margin:0;padding-left:18px;font-size:11px;line-height:1.5;color:#1f2937}
  .cv .note{margin-top:12px;font-size:9px;color:#6b7280;line-height:1.45}
  .cv .lines p{border-bottom:1px solid #fed7aa;height:26px;margin:0}`;

const SOURCE_NOTE = "Safety: U.S. Consumer Product Safety Commission (CPSC) Halloween tips: adults do the carving, children can scoop and trace, and battery-operated lights are safer than candles. Designs original to Fresh Calendars, free for personal and classroom use.";

function stencilPage(d: Design): string {
  return `<section class="page st"><header><div><h1>${d.name} Pumpkin Stencil</h1><p class="sub">${d.group} · free printable pumpkin carving template · US Letter</p></div><div class="lvl ${d.level}">${d.level}</div></header>
    <div class="art">${art(d)}</div>
    <div class="how"><div><b>Cut out the black areas</b>Keep the white parts of the pumpkin. The gray dashed line shows the pumpkin's edge and stem; do not cut it.</div>
    <div><b>Print at 100% (Actual size)</b>This bar should measure 2 inches:<span class="bar"></span>For a small pumpkin, print smaller and check the cuts stay apart.</div>
    <div><b>Tip</b>${d.tip} Tape the sheet on, poke dots along the lines, then remove it and carve. An adult does the cutting.</div></div>
    <p class="note">${SOURCE_NOTE} Every design on this sheet was checked for loose pieces and for bridges narrower than 1/4 inch at actual size.</p>${FOOT}</section>`;
}

function coverPage(): string {
  const cells = DESIGNS.map((d) => `<figure>${art(d)}<figcaption>${d.name}<i>${d.level}</i></figcaption></figure>`).join("");
  return `<section class="page cv"><h1>Pumpkin Carving Stencils: All 18 Designs</h1>
    <p class="sub">8 Easy and 10 Medium free printable pumpkin carving templates, one design per page after this one. On every page: cut out the black areas, keep the white.</p>
    <div class="grid">${cells}</div>
    <h2>How to use a stencil</h2>
    <ol><li>Print the page at 100% (Actual size) on US Letter paper. The 2-inch bar on each page checks the scale.</li>
    <li>An adult cuts the lid and scoops out the seeds; children can scoop with a spoon.</li>
    <li>Tape the stencil to the smoothest side. Make small folds so the paper lies flat on the curve.</li>
    <li>Poke holes about 1/8 inch apart along every line with a pushpin or poking tool, or trace firmly with a ballpoint pen.</li>
    <li>Remove the paper, connect the dots with a washable marker, then an adult carves out the black areas.</li>
    <li>Light it with a battery-operated light instead of a candle.</li></ol>
    <h2>My pumpkins and designs</h2><div class="lines">${"<p></p>".repeat(7)}</div>
    <p class="note">${SOURCE_NOTE}</p>${FOOT}</section>`;
}

export async function buildPumpkinStencils(): Promise<void> {
  await checkStencils();
  const fonts = await fontFaces();
  await renderPrintables("pumpkin-carving-templates", [
    { slug: PACK_SLUG, size: LETTER, html: doc(fonts, LETTER, CSS, [coverPage(), ...DESIGNS.map(stencilPage)]) },
    ...DESIGNS.map((d) => ({ slug: stencilSlug(d), size: LETTER, html: doc(fonts, LETTER, CSS, [stencilPage(d)]) })),
  ]);
}
