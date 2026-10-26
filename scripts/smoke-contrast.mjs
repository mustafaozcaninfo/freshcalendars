#!/usr/bin/env node
/**
 * WCAG 2.1 AA text contrast gate for the built site.
 *
 * Serves dist/site (and dist/news at /news/ when it exists) on a local port and, in Chromium,
 * checks every visible text element and input placeholder on every page against 4.5:1
 * (3:1 for large text: 24px+, or 18.66px+ bold). Runs at desktop and phone width, with the
 * phone menu open on the home pages, then hovers and focuses every link and button on a few
 * representative pages. Semi-transparent backgrounds are composited and every stop of a
 * gradient background is checked, so the worst point of a hero counts.
 *
 * Exit code 1 lists each failing color pair once with the pages it appears on.
 *
 * Usage: pnpm fc gen-meta && pnpm news:build && pnpm smoke:contrast
 *        CONTRAST_MAX_PAGES=40 pnpm smoke:contrast   (quick local run: first 40 pages per site)
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "dist/site");
const NEWS = path.join(ROOT, "dist/news");
const PORT = Number(process.env.CONTRAST_PORT || 4398);
const MAX = Number(process.env.CONTRAST_MAX_PAGES || Infinity);
const HOVER_PAGES = ["/", "/october-calendars.html", "/printable-calendars.html", "/when-is/thanksgiving/", "/holidays/", "/page/contact/", "/news/"];

if (!fs.existsSync(path.join(SITE, "index.html"))) {
  console.error("dist/site is missing: run `pnpm fc gen-meta` first");
  process.exit(1);
}
const require = createRequire(path.join(ROOT, "packages/generator/package.json"));
const { chromium } = require("playwright");

const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif",
  ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json", ".xml": "application/xml",
};
function fileFor(url) {
  let p = decodeURIComponent(new URL(url, "http://x").pathname);
  let base = SITE;
  if (p.startsWith("/news/")) { base = NEWS; p = p.slice("/news".length); }
  let f = path.join(base, p);
  if (!f.startsWith(base)) return null;
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  return fs.existsSync(f) ? f : null;
}
const server = http
  .createServer((req, res) => {
    const f = fileFor(req.url);
    if (!f) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  })
  .listen(PORT);

/** Every HTML page under dir, as URL paths; assets, OG images and admin tools are skipped. */
function pagesIn(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (d, pre) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!["assets", "og", "meta", "_astro", "downloads", "admin", "api", "news", "fonts", "img", "icons"].includes(e.name)) {
          walk(path.join(d, e.name), `${pre}${e.name}/`);
        }
      } else if (e.name.endsWith(".html") && !e.name.startsWith("google") && e.name !== "404.html") {
        out.push(pre + (e.name === "index.html" ? "" : e.name));
      }
    }
  };
  walk(dir, prefix);
  return out.sort().slice(0, MAX);
}
const pages = [...pagesIn(SITE, "/"), ...pagesIn(NEWS, "/news/")];

/** Runs in the page: contrast of one element against the backgrounds actually behind it. */
function measureFn() {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const parse = (s) => {
    // color-mix() resolves to color(srgb r g b / a) with 0-1 channels, not rgb().
    const c = s && s.match(/color\(srgb ([^)]+)\)/);
    if (c) { const v = c[1].split(/[ /]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v[3] ?? 1]; }
    const m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [v[0], v[1], v[2], v[3] ?? 1];
  };
  const blend = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const backgrounds = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        const stops = (cs.backgroundImage.match(/(?:rgba?|color)\([^)]+\)/g) || []).map(parse);
        if (stops.length) { layers.push({ stops }); break; }
      }
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push({ c }); if (c[3] >= 1) break; }
    }
    const last = layers[layers.length - 1];
    let bases = [[255, 255, 255]];
    if (last && last.stops) bases = last.stops.map((s) => blend(s, [255, 255, 255]));
    else if (last && last.c[3] >= 1) bases = [last.c.slice(0, 3)];
    const overlays = layers.filter((l) => l.c && l.c[3] < 1).reverse();
    return bases.map((b) => overlays.reduce((acc, l) => blend(l.c, acc), b));
  };
  const selector = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 3; e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id) s += `#${e.id}`;
      else if (e.classList.length) s += `.${[...e.classList].slice(0, 2).join(".")}`;
      parts.unshift(s);
    }
    return parts.join(" > ");
  };
  window.__contrast = (el, colorOverride) => {
    const cs = getComputedStyle(el);
    let opacity = 1;
    for (let e = el; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
    const fg = parse(colorOverride || cs.color);
    if (!fg) return null;
    const bases = backgrounds(el);
    let worst = 99;
    for (const b of bases) worst = Math.min(worst, ratio(blend([fg[0], fg[1], fg[2], fg[3] * opacity], b), b));
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
    return {
      ratio: Math.round(worst * 100) / 100,
      need: large ? 3 : 4.5,
      fg: colorOverride || cs.color,
      bg: bases.map((b) => `rgb(${b.map(Math.round).join(", ")})`).join(" → "),
      sel: selector(el),
      text: (el.innerText || el.placeholder || el.value || "").trim().replace(/\s+/g, " ").slice(0, 50),
    };
  };
}

function auditTextFn() {
  const out = [];
  for (const el of document.querySelectorAll("body *:not(script):not(style):not(noscript)")) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const field = el.matches("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select");
    if (!hasText && !field) continue;
    if (el.closest("svg") || el.closest("[aria-hidden=true]")) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || cs.visibility === "hidden") continue;
    // Screen-reader-only text is clipped to a 1px box; nobody sees its colors.
    if (r.width <= 1 && r.height <= 1) continue;
    const m = window.__contrast(el);
    if (m && m.ratio < m.need) out.push({ kind: "text", ...m });
    if (field && el.placeholder) {
      const ph = window.__contrast(el, getComputedStyle(el, "::placeholder").color);
      if (ph && ph.ratio < 4.5) out.push({ kind: "placeholder", ...ph, need: 4.5 });
    }
  }
  return out;
}

const failures = new Map();
function record(page, mode, items) {
  for (const it of items) {
    const key = `${it.kind} | ${it.sel} | ${it.fg} on ${it.bg}`;
    const f = failures.get(key) ?? { ...it, mode, pages: new Set() };
    f.ratio = Math.min(f.ratio, it.ratio);
    f.pages.add(`${mode} ${page}`);
    failures.set(key, f);
  }
}

const browser = await chromium.launch();
try {
  for (const vp of [{ name: "desktop", width: 1280, height: 900 }, { name: "phone", width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
    // Ads, fonts CDN and analytics stay offline: only our own CSS decides colors.
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
    if (process.env.CONTRAST_THEME === "dark") await ctx.addInitScript(() => localStorage.setItem("fc-theme", "dark"));
    await ctx.addInitScript(measureFn);
    let page = await ctx.newPage();
    let visited = 0;
    for (const p of pages) {
      // Release accumulated document/image state during the full archive crawl.
      if (visited && visited % 40 === 0) { await page.close(); page = await ctx.newPage(); }
      const url = `http://localhost:${PORT}${p}`;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      } catch (error) {
        if (error.name !== "TimeoutError") throw error;
        console.warn(`Retrying timed-out ${vp.name} page in a fresh tab: ${p}`);
        await page.close(); page = await ctx.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      }
      record(p, vp.name, await page.evaluate(auditTextFn));
      visited++;
      if (visited % 100 === 0) console.log(`Contrast ${vp.name}: ${visited}/${pages.length}`);
      if (vp.name === "phone" && (p === "/" || p === "/news/")) {
        const toggle = page.locator("summary.nav-toggle").first();
        if (await toggle.isVisible().catch(() => false)) {
          await toggle.click();
          await page.waitForTimeout(250);
          record(p, "phone menu", await page.evaluate(auditTextFn));
        }
      }
      if (HOVER_PAGES.includes(p)) {
        // Transitions off so hover colors apply at once; one element per distinct style.
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
        const picks = await page.evaluate(() => {
          const seen = new Set();
          const idx = [];
          document.querySelectorAll("a, button, summary").forEach((el, i) => {
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1 || !(el.innerText || "").trim()) return;
            const key = `${el.tagName}.${el.className}|${el.parentElement?.className}|${getComputedStyle(el).color}|${getComputedStyle(el).backgroundColor}`;
            if (!seen.has(key)) { seen.add(key); idx.push(i); }
          });
          return idx;
        });
        const all = page.locator("a, button, summary");
        for (const i of picks) {
          const h = all.nth(i);
          for (const state of ["hover", "focus"]) {
            try {
              if (state === "hover") await h.hover({ timeout: 1500, force: true });
              else await h.focus({ timeout: 1500 });
            } catch { continue; }
            const m = await h.evaluate((el) => window.__contrast(el));
            if (m && m.ratio < m.need) record(p, `${vp.name} ${state}`, [{ kind: state, ...m }]);
          }
          await page.mouse.move(0, 0);
        }
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`Contrast audit: ${pages.length} pages × desktop + phone, hover/focus on ${HOVER_PAGES.length} pages`);
if (!failures.size) {
  console.log("OK  no text under WCAG AA");
  process.exit(0);
}
const rows = [...failures.values()].sort((a, b) => b.pages.size - a.pages.size);
for (const f of rows) {
  const where = [...f.pages];
  console.error(
    `FAIL ${f.ratio.toFixed(2)}:1 (needs ${f.need}) ${f.kind} ${f.sel}  "${f.text}"\n` +
      `     ${f.fg} on ${f.bg}\n` +
      `     ${where.length} page(s): ${where.slice(0, 4).join(", ")}${where.length > 4 ? ", …" : ""}`,
  );
}
console.error(`\n${rows.length} failing color pair(s). Fix the tokens in packages/site-chrome/src/index.ts or the component CSS.`);
process.exit(1);
