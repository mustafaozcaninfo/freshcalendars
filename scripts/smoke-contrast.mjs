#!/usr/bin/env node
/**
 * WCAG 2.1 AA contrast smoke:
 * 1) Static CSS token pairs from :root
 * 2) Live DOM sample of text + buttons on key pages
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.SMOKE_BASE || "https://freshcalendars.com";

const PATHS = [
  "/",
  "/printable-calendar.html",
  "/printable-august-calendar.html",
  "/printable-blank-calendar.html",
  "/printable-weekly-calendar.html",
  "/print-guide.html",
  "/holidays.html",
  "/when-is/easter.html",
  "/page/contact.html",
];

function lin(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function relL(rgb) {
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}
function parseCssColor(input) {
  if (!input || input === "transparent" || input === "rgba(0, 0, 0, 0)") return null;
  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = input.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  const a = m[4] == null ? 1 : Number(m[4]);
  if (a < 0.2) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function contrast(a, b) {
  const la = relL(a);
  const lb = relL(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function extractRootTokens(css) {
  const block = css.match(/:root\{([\s\S]*?)\}/);
  if (!block) throw new Error(":root block missing");
  const tokens = {};
  for (const m of block[1].matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

function staticAudit(tokens) {
  const t = tokens;
  const need = [
    ["ink", "paper", 4.5],
    ["ink", "panel", 4.5],
    ["muted", "paper", 4.5],
    ["muted", "panel", 4.5],
    ["accent", "paper", 4.5],
    ["accent", "panel", 4.5],
    ["line", "paper", 3],
    ["line", "panel", 3],
    ["home-accent", "btn-on-dark", 4.5],
    ["yearly-accent", "btn-on-dark", 4.5],
    ["monthly-accent", "btn-on-dark", 4.5],
    ["blank-accent", "btn-on-dark", 4.5],
    ["ink", "btn-on-dark", 4.5],
    ["home-muted", "ink", 4.5], // vs darkest ink as proxy; live checks hero
    ["home-eyebrow", "ink", 4.5],
    ["danger", "paper", 4.5],
    ["blank-accent", "paper", 4.5],
    ["focus", "paper", 3],
    ["yearly-ink", "panel", 4.5],
    ["monthly-ink", "panel", 4.5],
    ["blank-ink", "panel", 4.5],
  ];
  const fails = [];
  for (const [a, b, min] of need) {
    if (!t[a] || !t[b]) {
      fails.push(`missing token ${a} or ${b}`);
      continue;
    }
    const r = contrast(hexToRgb(t[a]), hexToRgb(t[b]));
    if (r + 1e-9 < min) fails.push(`${a}/${b} ${r.toFixed(2)} < ${min}`);
  }
  return fails;
}

function findPlaywrightIndex() {
  const pnpm = path.join(ROOT, "node_modules/.pnpm");
  if (fs.existsSync(pnpm)) {
    for (const name of fs.readdirSync(pnpm)) {
      if (!name.startsWith("playwright@")) continue;
      const idx = path.join(pnpm, name, "node_modules/playwright/index.mjs");
      if (fs.existsSync(idx)) return idx;
    }
  }
  const flat = path.join(ROOT, "node_modules/playwright/index.mjs");
  return fs.existsSync(flat) ? flat : null;
}

const sitePages = fs.readFileSync(path.join(ROOT, "packages/generator/src/sitePages.ts"), "utf8");
const cssMatch = sitePages.match(/const CSS = `\n([\s\S]*?)\n`;/);
if (!cssMatch) {
  console.error("Could not extract CSS from sitePages.ts");
  process.exit(1);
}
const tokens = extractRootTokens(cssMatch[1]);
const staticFails = staticAudit(tokens);
console.log("Static token audit");
if (staticFails.length) {
  for (const f of staticFails) console.error("FAIL", f);
  process.exit(1);
}
console.log("OK  all required token pairs");

const idx = findPlaywrightIndex();
if (!idx) {
  console.error("playwright not found");
  process.exit(1);
}
const { chromium } = await import(pathToFileURL(idx).href);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

let fail = 0;
console.log(`Live contrast smoke against ${BASE}`);

for (const p of PATHS) {
  const url = `${BASE}${p}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch {
    fail = 1;
    console.error(`FAIL navigate ${url}`);
    continue;
  }
  await page.waitForTimeout(350);
  const report = await page.evaluate(() => {
    function parseColor(input) {
      if (!input || input === "transparent" || input === "rgba(0, 0, 0, 0)") return null;
      const m = input.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
      if (!m) return null;
      const a = m[4] == null ? 1 : Number(m[4]);
      if (a < 0.35) return null;
      return [Number(m[1]), Number(m[2]), Number(m[3]), a];
    }
    function lin(c) {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }
    function relL(rgb) {
      return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
    }
    function contrast(a, b) {
      const la = relL(a);
      const lb = relL(b);
      const [hi, lo] = la > lb ? [la, lb] : [lb, la];
      return (hi + 0.05) / (lo + 0.05);
    }
    function blend(fg, bg) {
      const a = fg[3] ?? 1;
      if (a >= 0.999) return [fg[0], fg[1], fg[2]];
      return [
        fg[0] * a + bg[0] * (1 - a),
        fg[1] * a + bg[1] * (1 - a),
        fg[2] * a + bg[2] * (1 - a),
      ];
    }
    function heroFallback() {
      const html = document.documentElement;
      if (html.classList.contains("family-home")) return [21, 32, 40];
      if (html.classList.contains("family-yearly")) return [197, 216, 228];
      if (html.classList.contains("family-monthly")) return [232, 217, 196];
      if (html.classList.contains("family-blank")) return [211, 226, 215];
      return [243, 239, 230];
    }
    function bgBehind(el) {
      let node = el;
      let acc = null;
      while (node && node !== document.documentElement) {
        if (node.classList?.contains("hero")) {
          const heroBg = heroFallback();
          return acc ? blend([acc[0], acc[1], acc[2], 1], heroBg) : heroBg;
        }
        const s = getComputedStyle(node);
        const bg = parseColor(s.backgroundColor);
        if (bg) {
          acc = acc ? blend([bg[0], bg[1], bg[2], bg[3]], acc) : [bg[0], bg[1], bg[2]];
          if ((bg[3] ?? 1) >= 0.95) return acc;
        }
        node = node.parentElement;
      }
      const bodyBg = parseColor(getComputedStyle(document.body).backgroundColor);
      if (bodyBg) return acc ? blend([bodyBg[0], bodyBg[1], bodyBg[2], bodyBg[3]], acc) : [bodyBg[0], bodyBg[1], bodyBg[2]];
      return acc || [243, 239, 230];
    }
    function isLargeText(el, style) {
      const px = parseFloat(style.fontSize) || 16;
      const weight = parseInt(style.fontWeight, 10) || 400;
      const bold = weight >= 700;
      return px >= 24 || (bold && px >= 18.66);
    }
    const selectors = [
      "h1",
      "h2",
      "h3",
      ".lead",
      ".eyebrow",
      ".btn",
      ".nav a",
      ".nav-toggle",
      ".brand",
      ".prose a",
      ".prose p",
      ".site-footer",
      ".site-footer a",
      ".side-card p",
      ".side-links a",
      ".month-chips a",
      ".school-months a",
      ".showcase-card .meta .label",
      ".showcase-card .meta p",
      ".gallery-copy p",
      ".hol-table th",
      ".hol-table td",
      ".hol-table a",
      ".kind-pill",
      ".faq summary",
      ".week-print .dow",
      ".week-print .dom",
      ".today-card",
      ".contact-form label",
      ".lightbox-close",
    ];
    const fails = [];
    const seen = new Set();
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const fg = parseColor(style.color);
        if (!fg) continue;
        let bg = bgBehind(el);
        // Buttons: use own background when opaque
        if (el.classList.contains("btn") || el.classList.contains("nav-toggle") || el.classList.contains("lightbox-close")) {
          const btnBg = parseColor(style.backgroundColor);
          if (btnBg && (btnBg[3] ?? 1) >= 0.5) {
            bg = blend([btnBg[0], btnBg[1], btnBg[2], btnBg[3] ?? 1], bg);
          }
        }
        const ratio = contrast([fg[0], fg[1], fg[2]], bg);
        const large = isLargeText(el, style);
        const min = large ? 3 : 4.5;
        const key = `${sel}|${style.color}|${bg.map((n) => Math.round(n)).join(",")}|${el.textContent.trim().slice(0, 24)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (ratio + 1e-9 < min) {
          fails.push({
            sel,
            text: (el.textContent || "").trim().slice(0, 40),
            ratio: Number(ratio.toFixed(2)),
            min,
            color: style.color,
            bg: `rgb(${bg.map((n) => Math.round(n)).join(",")})`,
          });
        }
      }
    }
    // Hero special: sample eyebrow/lead/h1 against approximated hero fill via canvas-less midpoint
    const hero = document.querySelector(".hero");
    if (hero) {
      const hs = getComputedStyle(hero);
      // Use a dark fallback for home, light for others based on class on html
      const html = document.documentElement;
      let heroBg = [243, 239, 230];
      if (html.classList.contains("family-home")) heroBg = [21, 32, 40];
      else if (html.classList.contains("family-yearly")) heroBg = [197, 216, 228];
      else if (html.classList.contains("family-monthly")) heroBg = [232, 217, 196];
      else if (html.classList.contains("family-blank")) heroBg = [211, 226, 215];
      for (const sel of [".hero h1", ".hero .lead", ".hero .eyebrow", ".hero .btn-primary", ".hero .btn-ghost"]) {
        for (const el of hero.querySelectorAll(sel)) {
          const style = getComputedStyle(el);
          const fg = parseColor(style.color);
          if (!fg) continue;
          let bg = heroBg;
          const own = parseColor(style.backgroundColor);
          if (own && (own[3] ?? 1) >= 0.35) bg = blend([own[0], own[1], own[2], own[3] ?? 1], heroBg);
          const ratio = contrast([fg[0], fg[1], fg[2]], bg);
          const large = isLargeText(el, style) || sel.includes("h1");
          const min = large ? 3 : 4.5;
          if (ratio + 1e-9 < min) {
            fails.push({
              sel,
              text: (el.textContent || "").trim().slice(0, 40),
              ratio: Number(ratio.toFixed(2)),
              min,
              color: style.color,
              bg: `rgb(${bg.join(",")})`,
              note: "hero-sample",
            });
          }
        }
      }
    }
    return fails.slice(0, 40);
  });

  if (report.length) {
    fail = 1;
    console.error(`FAIL ${url}`);
    for (const f of report) {
      console.error(
        `  ${f.sel} “${f.text}” ${f.ratio}:1 < ${f.min} fg=${f.color} bg=${f.bg}${f.note ? " (" + f.note + ")" : ""}`,
      );
    }
  } else {
    console.log(`OK  ${url}`);
  }
}

await browser.close();
if (fail) {
  console.error("Contrast smoke FAILED");
  process.exit(1);
}
console.log("Contrast smoke OK");
