/**
 * Print-safety checks for /news/ printables, run in Chromium on the laid-out sheet before it is
 * printed (renderPrintables, the Julian and Ramadan renderers). They catch what used to be found
 * only by looking at the PNG: a row that runs off the page, a note under the footer, a glyph from a
 * system font, type too small or too pale to print. Rules: "Printable PDF rules" in
 * .claude/skills/news-article/SKILL.md.
 *
 * Errors stop the render. `FC_PRINT_DRY=1` runs the checks without writing any file.
 */
import type { Page } from "playwright";

/** 0.25 in at 96 px/in: text stays this far from every edge (home inkjets and lasers lose 0.12 to 0.25 in). */
export const SAFE_PX = 24;
/** 1/6 in: the footer and anything marked data-print-edge may come this close, no closer. */
export const EDGE_PX = 16;
/** 6 pt: nothing smaller prints legibly. */
export const MIN_FONT_PX = 8;
/** Text under 3:1 against its background fades out on a home printer; under 4.5:1 (WCAG AA) is a warning. */
export const MIN_CONTRAST = 3;
export const GOOD_CONTRAST = 4.5;
const FONTS = /^(Sora|Manrope)\b/;

export type PrintReport = { errors: string[]; warnings: string[]; clearance: number | null };

/** Same options for every printable PDF: exact page size, no margins, tagged (structure tree for screen readers). */
export const pdfOptions = (size: { width: number; height: number }) =>
  ({ width: `${size.width}px`, height: `${size.height}px`, printBackground: true, tagged: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });

export const dryRun = () => process.env.FC_PRINT_DRY === "1";

/** In-page measuring script, kept as a string so the TypeScript loader cannot inject helpers into it. */
const MEASURE = String.raw`({ SAFE, EDGE, MIN_PX, MIN_C, GOOD_C, fontsRe }) => {
    const errors = [], warnings = [];
    // One line per repeated problem (a size or a color pair), with the first text that has it.
    const small = new Map(), pale = new Map();
    const fonts = new RegExp(fontsRe);
    const say = (t) => JSON.stringify(t.trim().replace(/\s+/g, " ").slice(0, 36));
    const rgba = (s) => (s.match(/[\d.]+/g) ?? ["0", "0", "0", "0"]).map(Number);
    const lum = ([r, g, b]) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    /** Background behind an element, blended down to white; null when an image or gradient is in the way. */
    const backdrop = (el) => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage !== "none") return null;
        const c = rgba(cs.backgroundColor);
        const a = c.length > 3 ? c[3] : 1;
        if (a > 0) layers.push([c[0], c[1], c[2], a]);
        if (a >= 1) break;
      }
      let out = [255, 255, 255];
      for (const [r, g, b, a] of layers.reverse()) out = [r * a + out[0] * (1 - a), g * a + out[1] * (1 - a), b * a + out[2] * (1 - a)];
      return out;
    };
    const pages = [...document.querySelectorAll(".page")];
    if (!pages.length) errors.push("no .page element: build the sheet with doc() from julian.ts");
    let clearance = null, fontIx = 0;
    pages.forEach((pg, pi) => {
      const P = pg.getBoundingClientRect(), at = pages.length > 1 ? "page " + (pi + 1) + ": " : "";
      const foot = pg.querySelector(".foot")?.getBoundingClientRect();
      const walker = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent ?? "";
        if (!text.trim()) continue;
        const el = n.parentElement;
        const range = document.createRange();
        range.selectNodeContents(n);
        const b = range.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
        const inFoot = !!el.closest(".foot");
        const m = inFoot || el.closest("[data-print-edge]") ? EDGE : SAFE;
        const gaps = [["left", b.left - P.left], ["top", b.top - P.top], ["right", P.right - b.right], ["bottom", P.bottom - b.bottom]];
        for (const [side, d] of gaps) if (d < m - 0.5) errors.push(at + say(text) + " is " + Math.round(d) + " px from the " + side + " edge (min " + m + " px)");
        if (foot && !inFoot) {
          if (b.bottom > foot.top && b.top < foot.bottom && b.right > foot.left && b.left < foot.right) errors.push(at + say(text) + " runs into the footer");
          else if (b.bottom <= foot.top + 0.5) clearance = Math.min(clearance ?? Infinity, foot.top - b.bottom);
        }
        for (let a = el; a && a !== document.body; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (s.overflowX === "visible" && s.overflowY === "visible") continue;
          const A = a.getBoundingClientRect();
          if (b.left < A.left - 1 || b.top < A.top - 1 || b.right > A.right + 1 || b.bottom > A.bottom + 1) { errors.push(at + say(text) + " is cut off by its box (<" + a.tagName.toLowerCase() + ' class="' + (a.getAttribute("class") ?? "") + '">)'); break; }
        }
        const px = parseFloat(cs.fontSize);
        if (px < MIN_PX && !small.has(px)) small.set(px, say(text));
        // Outlined letters (coloring sheets) print their stroke, not their fill.
        const stroked = parseFloat(cs.webkitTextStrokeWidth) >= 1;
        const bg = backdrop(el), fg = rgba(stroked ? cs.webkitTextStrokeColor : cs.color);
        if (bg && (fg.length < 4 || fg[3] >= 1)) {
          const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
          const ratio = (hi + 0.05) / (lo + 0.05), large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
          const key = (stroked ? cs.webkitTextStrokeColor : cs.color) + " on rgb(" + bg.map(Math.round).join(", ") + ")";
          if (ratio < (large ? MIN_C : GOOD_C) - 0.005 && !pale.has(key)) pale.set(key, { ratio, text: say(text), large });
        }
        // Glyphs outside the embedded fonts fall back to a system font that differs per machine.
        if (/[^\x20-\x7e]/.test(text) || !fonts.test(cs.fontFamily.replace(/["']/g, ""))) el.setAttribute("data-fc-font", String(fontIx++));
      }
    });
    for (const [px, t] of small) errors.push(t + " and other text at " + px + " px; the minimum is " + MIN_PX + " px (6 pt)");
    for (const [key, p] of pale) (p.ratio < MIN_C ? errors : warnings).push(p.text + " and other text in " + key + ": contrast " + p.ratio.toFixed(2) + ":1, " + (p.ratio < MIN_C ? "needs " + MIN_C + ":1" : "aim for " + (p.large ? MIN_C : GOOD_C) + ":1"));
    return { errors, warnings, clearance };
}`;

/** Measures every text node on every `.page`; returns errors (must fix) and warnings. */
export async function checkPrintLayout(page: Page): Promise<PrintReport> {
  const r = (await page.evaluate(`(${MEASURE})(${JSON.stringify({ SAFE: SAFE_PX, EDGE: EDGE_PX, MIN_PX: MIN_FONT_PX, MIN_C: MIN_CONTRAST, GOOD_C: GOOD_CONTRAST, fontsRe: FONTS.source })})`)) as PrintReport;

  // Which fonts Chromium really used, for the elements flagged above (CDP knows per text run).
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-fc-font]" });
    const bad = new Map<string, string>();
    for (const nodeId of nodeIds) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      for (const f of fonts) if (!FONTS.test(f.familyName) && !bad.has(f.familyName)) {
        const { outerHTML } = await cdp.send("DOM.getOuterHTML", { nodeId });
        bad.set(f.familyName, outerHTML.replace(/<[^>]+>/g, "").trim().slice(0, 36));
      }
    }
    for (const [family, sample] of bad) r.errors.push(`"${sample}" uses the system font ${family}; use only Sora and Manrope glyphs (draw symbols as SVG)`);
  } finally {
    await cdp.detach();
  }
  await page.evaluate(() => document.querySelectorAll("[data-fc-font]").forEach((e) => e.removeAttribute("data-fc-font")));
  if (r.clearance !== null && r.clearance < 6) r.warnings.push(`only ${Math.round(r.clearance)} px between the content and the footer; one more row will collide`);
  const height = await page.evaluate("document.querySelector('.page')?.getBoundingClientRect().height ?? 0") as number;
  if (r.clearance !== null && r.clearance > height / 4) r.warnings.push(`the bottom ${Math.round((r.clearance / height) * 100)}% of the page is empty; fill it (notes area, a second table) or scale the content up`);
  return r;
}

/** Runs the checks and throws with every error, so a sheet that will not print right is never written. */
export async function assertPrintable(page: Page, slug: string): Promise<void> {
  const { errors, warnings, clearance } = await checkPrintLayout(page);
  for (const w of warnings) console.warn(`${slug}: ${w}`);
  if (errors.length) throw new Error(`${slug}: ${errors.length} print problem(s)\n  ${errors.slice(0, 12).join("\n  ")}${errors.length > 12 ? `\n  … and ${errors.length - 12} more` : ""}`);
  if (clearance !== null) console.log(`${slug}: print checks pass, ${Math.round(clearance)} px above the footer`);
}

/**
 * Raster images in a printed PDF. Chromium turns a box-shadow, a CSS filter, an SVG <pattern> and
 * some repeating gradients into bitmaps at screen resolution, which print soft; a printable should
 * be all vector unless a picture is the point of it.
 */
export function rasterImages(pdf: Uint8Array): string[] {
  const text = Buffer.from(pdf).toString("latin1");
  return [...text.matchAll(/<<[^>]*?\/Subtype\s*\/Image[^>]*>>/g)].map((m) => `${/\/Width\s+(\d+)/.exec(m[0])?.[1] ?? "?"}x${/\/Height\s+(\d+)/.exec(m[0])?.[1] ?? "?"}`);
}

export function warnRaster(slug: string, pdf: Uint8Array): void {
  const imgs = rasterImages(pdf);
  if (imgs.length) console.warn(`${slug}: ${imgs.length} raster image(s) in the PDF (${imgs.slice(0, 4).join(", ")} px); draw rules, hatching and shadows with borders or plain SVG shapes so the sheet stays vector`);
}
