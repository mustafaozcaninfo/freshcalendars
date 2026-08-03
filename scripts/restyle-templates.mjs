#!/usr/bin/env node
/**
 * One-shot restyle: strip ItsCalendar cream/terracotta/Fraunces from print HTML
 * and apply Fresh Calendars tokens (blue / gold / red / cool wash).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packages", "templates");

const FONT_LINK =
  `<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Manrope:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />`;

function stripGoogleFontLinks(html) {
  return html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"\s*\/?>\s*/g, "")
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/g, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet"\s*\/?>\s*/g, "");
}

function injectFontLink(html) {
  if (html.includes("family=Sora")) return html;
  return html.replace(/<title>{{title}}<\/title>\s*/, `<title>{{title}}</title>\n  ${FONT_LINK}\n  `);
}

function commonFontSwap(html) {
  return html
    .replace(/font-family:\s*Fraunces,\s*serif/g, 'font-family: Sora, "IBM Plex Sans", sans-serif')
    .replace(/font-family:\s*"DM Sans",\s*sans-serif/g, 'font-family: Manrope, "IBM Plex Sans", sans-serif')
    .replace(/font-family:\s*"Source Serif 4",\s*serif/g, 'font-family: Sora, "IBM Plex Sans", sans-serif')
    .replace(/font-family:\s*Literata,\s*serif/g, 'font-family: Sora, "IBM Plex Sans", sans-serif')
    .replace(/font-family:\s*Outfit,\s*sans-serif/g, 'font-family: Manrope, "IBM Plex Sans", sans-serif')
    .replace(/font-variation-settings:\s*"opsz"\s*144;\s*/g, "");
}

/** Per-file Fresh palettes — diverge by family, never ItsCalendar cream. */
const PALETTES = {
  "yearly/print.html": {
    root: ":root { --ink:#0b3d66; --accent:#007bff; --gold:#fccc00; --paper:#e8eef3; --line:#c5d3dc; }",
    bodyBg: "background: linear-gradient(165deg, #e8eef3 0%, #c5d8e4 55%, #a8c8de 100%);",
  },
  "yearly/classic.html": {
    root: ":root { --ink:#0b3d66; --accent:#007bff; --gold:#fccc00; --paper:#e8eef3; --line:#c5d3dc; }",
    bodyBg: "background: linear-gradient(165deg, #e8eef3 0%, #c5d8e4 55%, #a8c8de 100%);",
  },
  "yearly/landscape-wall.html": {
    root: ":root { --ink:#0b3d66; --accent:#007bff; --gold:#fccc00; --paper:#dce8f4; --line:#b8c9d8; }",
    bodyBg: "background: linear-gradient(120deg, #dce8f4 0%, #b8d4ec 50%, #9ec4e8 100%);",
  },
  "yearly/holidays.html": {
    root: ":root { --ink:#14212b; --accent:#ec1d00; --blue:#007bff; --paper:#ffffff; --line:#d0d7de; --we:#eef5fb; }",
    bodyBg: "background: #e8eef3;",
  },
  "yearly/monday-start.html": {
    root: ":root { --ink:#0b3d66; --accent:#004a7f; --line:#c5d3dc; }",
  },
  "yearly/ink-compact.html": {
    root: ":root { --ink:#1c2430; --accent:#007bff; --line:#c5d3dc; }",
  },
  "monthly/color-modern.html": {
    root: ":root { --ink:#1c2430; --accent:#007bff; --warm:#ec1d00; --gold:#fccc00; --soft:#eef5fb; --line:#c5d8db; }",
  },
  "monthly/notes-planner.html": {
    root: ":root { --ink:#1c2430; --accent:#0092d1; --line:#c5d3dc; --rule:#e8eef3; --paper:#f4f7fa; }",
    bodyBg: "background: var(--paper);",
  },
  "monthly/landscape-soft.html": {
    root: ":root { --ink:#1c2430; --moss:#007bff; --blush:#ec1d00; --sand:#e8eef3; --line:#c5d3dc; }",
  },
  "monthly/holidays.html": {
    root: ":root { --ink:#1b2430; --red:#ec1d00; --blue:#007bff; --line:#d0d7e0; --week:#eef5fb; }",
  },
  "monthly/classic-bw.html": {
    root: ":root { --ink:#1c2430; --accent:#37474f; --line:#c5d3dc; }",
  },
  "monthly/monday-start.html": {
    root: ":root { --ink:#0b3d66; --accent:#007bff; --line:#c5d3dc; }",
  },
  "monthly/print.html": {
    root: ":root { --ink:#1c2430; --accent:#0092d1; --line:#c5d3dc; }",
  },
  "blank/classic.html": {
    root: ":root { --ink:#2a3439; --accent:#5a6b75; --paper:#f2f4f6; --line:#d0d7de; }",
    bodyBg:
      "background: repeating-linear-gradient(-12deg, transparent, transparent 18px, rgba(90,107,117,.05) 18px, rgba(90,107,117,.05) 19px), var(--paper);",
  },
  "blank/print.html": {
    root: ":root { --ink:#2a3439; --accent:#5a6b75; --paper:#f2f4f6; --line:#d0d7de; }",
  },
  "blank/yearly-classic.html": {
    root: ":root { --ink:#2a3439; --accent:#5a6b75; --paper:#f2f4f6; --line:#d0d7de; }",
  },
  "blank/monday-start.html": {
    root: ":root { --ink:#2a3439; --accent:#37474f; --paper:#eef3f6; --line:#c5d3dc; }",
  },
  "blank/landscape.html": {
    root: ":root { --ink:#2a3439; --accent:#5a6b75; --paper:#f2f4f6; --line:#d0d7de; }",
  },
  "blank/kids.html": {
    root: ":root { --ink:#1c2430; --accent:#007bff; --gold:#fccc00; --red:#ec1d00; --paper:#ffffff; --line:#d0d7de; }",
  },
  "blank/notes.html": {
    root: ":root { --ink:#2a3439; --line:#c8c8c8; --rule:#d8d8d8; }",
  },
  "weekly/priorities.html": {
    root: ":root { --ink:#1c2430; --accent:#007bff; --line:#c5d3dc; }",
    bodyBg: "background: #e8eef3; color: var(--ink); font-family: Manrope, \"IBM Plex Sans\", sans-serif;",
  },
  "weekly/classic-sun.html": {
    root: ":root { --ink:#14212b; --accent:#007bff; --line:#c5d3dc; }",
  },
  "weekly/habit.html": {
    root: ":root { --ink:#1c2430; --accent:#0092d1; --line:#c5d3dc; }",
  },
  "weekly/monday-start.html": {
    root: ":root { --ink:#0b3d66; --accent:#004a7f; --line:#c5d3dc; }",
  },
  "weekly/hourly.html": {
    root: ":root { --ink:#1c2430; --accent:#007bff; --line:#c5d3dc; }",
  },
  "school/overview.html": {
    root: ":root { --ink:#0b3d66; --accent:#007bff; --gold:#fccc00; --paper:#e8eef3; --line:#c5d3dc; }",
    bodyBg: "background: linear-gradient(165deg, #e8eef3 0%, #c5d8e4 55%, #b0cfe6 100%);",
  },
};

async function walk(dir, rel = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(path.join(dir, e.name), r)));
    else if (e.name.endsWith(".html")) out.push(r);
  }
  return out;
}

function applyRoot(html, root) {
  return html.replace(/:root\s*\{[^}]+\}/, root);
}

function applyBodyBg(html, bodyBg) {
  // Replace first background: inside body { ... } block only when provided
  return html.replace(/(body\s*\{[^}]*?)background:[^;]+;/, `$1${bodyBg}`);
}

async function main() {
  const files = await walk(ROOT);
  let n = 0;
  for (const rel of files) {
    if (rel === "og.html") continue;
    const full = path.join(ROOT, rel);
    let html = await fs.readFile(full, "utf8");
    html = stripGoogleFontLinks(html);
    html = injectFontLink(html);
    html = commonFontSwap(html);

    const pal = PALETTES[rel];
    if (pal?.root) html = applyRoot(html, pal.root);
    if (pal?.bodyBg) html = applyBodyBg(html, pal.bodyBg);

    // Kill leftover cream/terracotta hexes that aren't in :root
    html = html
      .replace(/#f7f1e8/gi, "#e8eef3")
      .replace(/#e8d9c4/gi, "#c5d8e4")
      .replace(/#dcc9ae/gi, "#a8c8de")
      .replace(/#f4efe6/gi, "#dce8f4")
      .replace(/#fffdf9/gi, "#ffffff")
      .replace(/#fff8f0/gi, "#ffffff")
      .replace(/#faf7f2/gi, "#f4f7fa")
      .replace(/#f3eee6/gi, "#e8eef3")
      .replace(/#f6f3ec/gi, "#f2f4f6")
      .replace(/#ebe2d2/gi, "#c5d8e4")
      .replace(/#e2d6c2/gi, "#b0cfe6")
      .replace(/#8a3a15/gi, "#007bff")
      .replace(/#9a4118/gi, "#ec1d00")
      .replace(/#c45c26/gi, "#007bff")
      .replace(/#8b5a2b/gi, "#0092d1");

    // Gold hairline under yearly hero borders where accent was used alone
    if (rel.startsWith("yearly/") && html.includes("border-bottom: 3px solid var(--accent)")) {
      html = html.replace(
        "border-bottom: 3px solid var(--accent);",
        "border-bottom: 3px solid var(--gold, var(--accent));",
      );
    }

    await fs.writeFile(full, html);
    n++;
    console.log("restyled", rel);
  }
  console.log(`done — ${n} templates`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
