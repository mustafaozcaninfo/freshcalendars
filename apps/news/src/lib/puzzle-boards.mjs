/**
 * Rehype plugin for daily puzzle pages (see .claude/skills/news-puzzles/SKILL.md). Everything is
 * drawn at build time from the official data saved in src/content/puzzles/ and from the answer
 * lines that scripts/news-puzzle-check.mjs has matched against it, so a page cannot show a board
 * that disagrees with its own answers. Nothing depends on client JS (audit 02-NO-JS-CONTENT).
 *
 * - A shortcut bar under the first paragraph: skip to the answer, yesterday's page, the game's hub.
 * - Hints in "hints"/"clues" sections become tap-to-reveal <details>, so a glance does not spoil.
 * - The solved board inside the spoiler section: Wordle tiles, Connections groups, the Strands
 *   board with its word paths, each Pips board with dominoes, the Letter Boxed square with the
 *   Times' route (plus the other two-word solutions in its word list), and the Spelling Bee
 *   honeycomb in the hint grid section (letters only, no answers).
 * - Reader tools that start hidden and are switched on by the story page's script, so the page
 *   reads the same without JavaScript: a found-words tracker under the Spelling Bee honeycomb and
 *   a "has this word been the answer before?" checker above the Wordle spoiler.
 * - Yesterday's answer at the end, for readers who missed it (Spelling Bee pages already have it).
 * No <div> inside the story body: the audit reads prose up to the first </div>.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { GAMES, PUZZLE_DIR, addDays, beeScore, loadPuzzle, pipsValues, puzzleOf, slugDate, weekday } from "./puzzles.mjs";

const ARTICLES = path.resolve(import.meta.dirname, "../content/articles");
const SPOILER = /\bspoilers?\b/i;
const HINTS = /\b(hints?|clues?)\b/i;
const NOT_HINTS = /\b(how|works|read|tips|grid)\b/i;
const ANSWER_ID = "pz-answer";

let stories;
const files = new Map(); // slug -> markdown path
/**
 * Every story's slug and publishedAt, read once per build: yesterday's page is linked only when
 * it exists, and a game's hub only once it has MIN_TOPIC_STORIES (4) live pages (topics.ts).
 */
const allStories = () => {
  if (!stories) {
    const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    stories = new Map(walk(ARTICLES).filter((f) => /\.mdx?$/.test(f)).map((f) => [
      (files.set(path.basename(f).replace(/\.mdx?$/, ""), f), path.basename(f).replace(/\.mdx?$/, "")),
      Date.parse(readFileSync(f, "utf8").match(/^publishedAt: "([^"]+)"/m)?.[1] ?? "") || Infinity,
    ]));
  }
  return stories;
};
const HUB_MIN = 4;

export function rehypePuzzleBoards() {
  return (tree, file) => {
    const fp = file?.path ?? file?.history?.[0] ?? "";
    if (!/[\\/]content[\\/]articles[\\/]/.test(fp)) return;
    const p = puzzleOf(path.basename(fp).replace(/\.mdx?$/, ""));
    if (!p) return;
    const data = loadPuzzle(p.game, p.date);
    if (!data) return; // news:puzzle-check fails the build's CI run for this page
    const kids = tree.children;
    const sections = sectionsOf(kids);

    // Hints first (indexes of later nodes do not change: <li> contents are rewritten in place).
    for (const s of sections) if (s.h2 && HINTS.test(text(s.h2)) && !SPOILER.test(text(s.h2)) && !NOT_HINTS.test(text(s.h2))) {
      for (const i of s.range) revealHints(kids[i]);
    }

    // Boards, inserted from the bottom up so earlier indexes stay valid.
    const inserts = [];
    const spoiler = sections.find((s) => s.h2 && SPOILER.test(text(s.h2)));
    if (spoiler) {
      spoiler.h2.properties = { ...spoiler.h2.properties, id: spoiler.h2.properties?.id ?? ANSWER_ID };
      const after = (pred) => spoiler.range.find((i) => pred(kids[i]));
      if (p.game === "wordle") {
        const i = after((n) => n.tagName === "p" && /The answer to Wordle/.test(text(n)));
        if (i !== undefined) inserts.push([i + 1, wordleBoard(data) + wordleRepeat(data, p.date)]);
      } else if (p.game === "connections") {
        const i = after((n) => n.tagName === "ul");
        if (i !== undefined) inserts.push([i + 1, connectionsBoard(kids[i])]);
      } else if (p.game === "strands") {
        const i = after((n) => n.tagName === "ul");
        if (i !== undefined) inserts.push([i + 1, strandsBoard(data)]);
      } else if (p.game === "mini") {
        const i = after((n) => n.tagName === "table");
        if (i !== undefined) inserts.push([i + 1, miniBoard(data)]);
      } else if (p.game === "letterboxed") {
        const i = after((n) => n.tagName === "table" || (n.tagName === "div" && /table-scroll/.test(String(n.properties?.className))));
        if (i !== undefined) inserts.push([i + 1, letterBoxedBoard(data) + letterBoxedOthers(data)]);
      } else if (p.game === "pips") {
        for (const lvl of ["easy", "medium", "hard"]) {
          const name = lvl[0].toUpperCase() + lvl.slice(1);
          const head = after((n) => n.tagName === "p" && text(n).trim().startsWith(`${name}, by`));
          const ul = head === undefined ? undefined : spoiler.range.find((i) => i > head && kids[i].tagName === "ul");
          if (ul !== undefined) inserts.push([ul + 1, pipsBoard(data[lvl], name)]);
        }
      }
    }
    if (p.game === "bee") {
      const grid = sections.find((s) => s.h2 && /hint grid/i.test(text(s.h2)));
      const i = grid?.range.find((j) => kids[j].tagName === "p");
      if (i !== undefined) inserts.push([i + 1, beeBoard(data) + beeTracker(data, p.date)]);
    }
    if (p.game === "wordle" && spoiler) {
      const h = kids.indexOf(spoiler.h2);
      const tool = wordleChecker();
      if (tool) inserts.push([h, tool]);
    }

    // Shortcut bar under the opening paragraph.
    const first = kids.findIndex((n) => n.type === "element" && n.tagName === "p");
    if (first >= 0) inserts.push([first + 1, shortcuts(p, spoiler ? `#${spoiler.h2.properties.id}` : null)]);

    inserts.sort((a, b) => b[0] - a[0]).forEach(([i, html]) => kids.splice(i, 0, { type: "raw", value: html }));
    const y = yesterday(p);
    if (y) kids.push({ type: "raw", value: y });
  };
}

/** Top-level nodes grouped under their H2 (the part before the first H2 has h2: null). */
function sectionsOf(kids) {
  const out = [{ h2: null, range: [] }];
  kids.forEach((n, i) => {
    if (n.type === "element" && n.tagName === "h2") out.push({ h2: n, range: [] });
    else if (n.type === "element") out.at(-1).range.push(i);
  });
  return out;
}

function text(n) {
  if (!n) return "";
  if (n.type === "text") return n.value;
  if (n.type === "raw") return n.value.replace(/<[^>]*>/g, " ");
  return (n.children ?? []).map(text).join("");
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shortcuts(p, answer) {
  const g = GAMES[p.game];
  const y = addDays(p.date, -1);
  const prefix = `${g.prefix}-${slugDate(y)}`;
  const now = Date.now();
  const live = [...allStories()].filter(([s, at]) => s.startsWith(`${g.prefix}-`) && at <= now).map(([s]) => s);
  const ySlug = live.find((s) => s === prefix || s.startsWith(`${prefix}-`));
  const links = [
    answer && `<a class="pz-go" href="${answer}">Skip to the answer ↓</a>`,
    ySlug && `<a href="/news/${ySlug}/">Yesterday's ${esc(g.name)}</a>`,
    live.length >= HUB_MIN && `<a href="/news/topic/${g.hub}/">All ${esc(g.name)} answers</a>`,
  ].filter(Boolean);
  // A list, so the links read as navigation and stay out of the prose checks.
  return `<nav class="pz-nav" aria-label="${esc(g.name)} shortcuts"><ul>${links.map((a) => `<li>${a}</li>`).join("")}</ul></nav>`;
}

/**
 * "Label: hint text" list items become <details>: the label stays visible as the summary and the
 * hint opens on tap. Items without a colon are left as they are.
 */
function revealHints(node) {
  if (node?.type !== "element" || !/^(ul|ol)$/.test(node.tagName)) return;
  for (const li of node.children) {
    if (li.type !== "element" || li.tagName !== "li") continue;
    const kids = li.children.filter((c) => !(c.type === "text" && !c.value.trim()));
    let label, rest; // label: the nodes shown as the summary
    const t = (value) => ({ type: "text", value });
    if (kids[0]?.tagName === "strong") {
      // "**Part of speech:** it is a noun.", "**Pangram** (8 letters, starts with P): clue." or
      // "**1-Across** (5 letters), *clue*: hint." (the summary keeps the quoted clue in italics).
      const strong = text(kids[0]).trim();
      const tail = kids.slice(1);
      const k = tail.findIndex((n) => n.type === "text" && n.value.includes(":"));
      if (strong.endsWith(":")) { label = [t(strong.slice(0, -1))]; rest = tail; }
      else if (k >= 0) {
        const at = tail[k].value.indexOf(":");
        label = [t(`${strong}`), ...tail.slice(0, k), t(tail[k].value.slice(0, at).replace(/,\s*$/, ""))];
        rest = [t(tail[k].value.slice(at + 1)), ...tail.slice(k + 1)];
      }
    } else if (kids[0]?.type === "text") {
      const m = kids[0].value.match(/^\s*([^:]{2,40}):\s*/);
      if (m) { label = [t(m[1])]; rest = [t(kids[0].value.slice(m[0].length)), ...kids.slice(1)]; }
    }
    if (!label || !rest?.length || !text({ children: rest }).trim()) continue;
    if (rest[0].type === "text") rest[0] = { ...rest[0], value: rest[0].value.replace(/^\s+/, "") };
    li.children = [{
      type: "element", tagName: "details", properties: { className: ["pz-hint"] },
      children: [
        { type: "element", tagName: "summary", properties: {}, children: label },
        { type: "element", tagName: "span", properties: {}, children: rest },
      ],
    }];
  }
}

const figure = (cls, body, caption) =>
  `<figure class="pz-board ${cls}">${body}<figcaption>${caption}</figcaption></figure>`;
const FROM_DATA = "Drawn from the official puzzle data published by The New York Times.";

function wordleBoard(d) {
  const w = d.solution.toUpperCase();
  const tiles = [...w].map((c) => `<li>${c}</li>`).join("");
  return figure("pz-wordle", `<ol class="pz-tiles" aria-label="Wordle #${d.days_since_launch} answer: ${w}">${tiles}</ol>`, `Wordle #${d.days_since_launch}, solved. ${FROM_DATA}`);
}

/** The solved Connections board, in the game's colors, from the answer list the checker verified. */
function connectionsBoard(ul) {
  const COLOR = { Yellow: "pz-y", Green: "pz-g", Blue: "pz-b", Purple: "pz-p" };
  const rows = ul.children.filter((li) => li.type === "element" && li.tagName === "li").map((li) => {
    const m = text(li).trim().match(/^(Yellow|Green|Blue|Purple), (.+?):\s*(.+)$/);
    return m && `<li class="${COLOR[m[1]]}"><strong>${esc(m[2])}</strong><span>${esc(m[3])}</span></li>`;
  }).filter(Boolean);
  return figure("pz-connections", `<ol class="pz-groups" aria-label="Solved Connections board">${rows.join("")}</ol>`, `The four groups as the solved board shows them, easiest to hardest. ${FROM_DATA}`);
}

/** Strands board with the spangram (yellow) and theme words (blue) traced through their letters. */
function strandsBoard(d) {
  const S = 56, R = 22, rows = d.startingBoard.length, cols = d.startingBoard[0].length;
  const at = ([r, c]) => [c * S + S / 2, r * S + S / 2];
  const color = new Map();
  const paths = [];
  const trace = (coords, fill) => {
    coords.forEach((rc) => color.set(rc.join(","), fill));
    paths.push(`<polyline points="${coords.map((rc) => at(rc).join(",")).join(" ")}" fill="none" stroke="${fill}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`);
  };
  for (const coords of Object.values(d.themeCoords)) trace(coords, "#aedfee");
  trace(d.spangramCoords, "#f8cd05");
  const cells = [];
  d.startingBoard.forEach((row, r) => [...row].forEach((ch, c) => {
    const [x, y] = at([r, c]);
    cells.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="${color.get(`${r},${c}`) ?? "#fff"}"/><text x="${x}" y="${y + 8}" text-anchor="middle">${ch}</text>`);
  }));
  const label = `Solved Strands board: spangram ${d.spangram} in yellow, theme words ${d.themeWords.join(", ")} in blue`;
  const svg = `<svg class="pz-svg" viewBox="0 0 ${cols * S} ${rows * S}" role="img" aria-label="${esc(label)}"><g>${paths.join("")}</g><g font-family="Sora,sans-serif" font-weight="700" font-size="22" fill="#1a1a1a">${cells.join("")}</g></svg>`;
  return figure("pz-strands", svg, `The solved board: the spangram in yellow and the theme words in blue, each traced through its letters. ${FROM_DATA}`);
}

/** Pips board: colored regions with their conditions, and every domino in place with its pips. */
function pipsBoard(L, name) {
  // 72px cells, dominoes inset 12px: the region color shows around each domino and the badge in
  // the cell corner clears the nearest pip.
  const S = 72, PAD = 12;
  const PALETTE = ["#f9c6d0", "#c9e4b4", "#b9d7f2", "#f6dd9c", "#d8c6f0", "#f5c9a8", "#b8e3dc", "#e7d1b0", "#cfd8e3", "#f2b8e0"];
  const cells = L.regions.flatMap((r) => r.indices);
  const rows = Math.max(...cells.map(([r]) => r)) + 1, cols = Math.max(...cells.map(([, c]) => c)) + 1;
  const values = pipsValues(L);
  const regionOf = new Map();
  L.regions.forEach((rg, k) => rg.indices.forEach((c) => regionOf.set(c.join(","), k)));
  const out = [];
  // Region backgrounds.
  for (const [k, rg] of L.regions.entries()) {
    const fill = rg.type === "empty" ? "#eceff3" : PALETTE[k % PALETTE.length];
    for (const [r, c] of rg.indices) out.push(`<rect x="${c * S}" y="${r * S}" width="${S}" height="${S}" fill="${fill}"/>`);
  }
  // Dominoes: a white tile over both cells, a divider, and pips.
  L.solution.forEach(([a, b], i) => {
    const x = Math.min(a[1], b[1]) * S + PAD, y = Math.min(a[0], b[0]) * S + PAD;
    const w = (a[0] === b[0] ? 2 * S : S) - 2 * PAD, h = (a[0] === b[0] ? S : 2 * S) - 2 * PAD;
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="#1f2937" stroke-width="2.5"/>`);
    out.push(a[0] === b[0]
      ? `<line x1="${Math.max(a[1], b[1]) * S}" y1="${y + 8}" x2="${Math.max(a[1], b[1]) * S}" y2="${y + h - 8}" stroke="#9ca3af" stroke-width="2"/>`
      : `<line x1="${x + 8}" y1="${Math.max(a[0], b[0]) * S}" x2="${x + w - 8}" y2="${Math.max(a[0], b[0]) * S}" stroke="#9ca3af" stroke-width="2"/>`);
    for (const [r, c] of [a, b]) out.push(pips(c * S + S / 2, r * S + S / 2, values.get(`${r},${c}`)));
  });
  // Condition badges on each region's first cell.
  const SYM = { equals: "=", unequal: "≠" };
  for (const rg of L.regions) {
    if (rg.type === "empty") continue;
    const [r, c] = [...rg.indices].sort((p, q) => p[0] - q[0] || p[1] - q[1])[0];
    const lbl = SYM[rg.type] ?? (rg.type === "less" ? `<${rg.target}` : rg.type === "greater" ? `>${rg.target}` : String(rg.target));
    const bx = c * S + 1, by = r * S + 1, bw = 8 + 8 * lbl.length;
    out.push(`<rect x="${bx}" y="${by}" width="${bw}" height="16" rx="5" fill="#1f2937"/><text x="${bx + bw / 2}" y="${by + 12.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${esc(lbl)}</text>`);
  }
  const label = `Solved Pips ${name} board by ${L.constructors}: ${L.dominoes.length} dominoes on ${values.size} cells`;
  const svg = `<svg class="pz-svg" viewBox="-2 -2 ${cols * S + 4} ${rows * S + 4}" role="img" aria-label="${esc(label)}" font-family="Sora,sans-serif">${out.join("")}</svg>`;
  return figure("pz-pips", svg, `${name} board, solved: each colored region with its condition, and every domino in place. ${FROM_DATA}`);
}

/** Domino pips for a value 0-6, drawn in a square half centered on (cx, cy). */
function pips(cx, cy, v) {
  const o = 13;
  const SPOTS = { 0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  return (SPOTS[v] ?? []).map(([dx, dy]) => `<circle cx="${cx + dx * o}" cy="${cy + dy * o}" r="5.5" fill="#1f2937"/>`).join("");
}

/** The solved Mini grid: black squares, clue numbers and every answer letter. */
function miniBoard(d) {
  const S = 64;
  const num = new Map(d.clues.map((c) => [c.cells[0], c.label]));
  const cells = d.cells.map((ch, i) => {
    const x = (i % d.width) * S, y = Math.floor(i / d.width) * S;
    if (ch === null) return `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="#1a1a1a"/>`;
    const n = num.has(i) ? `<text x="${x + 5}" y="${y + 16}" font-size="13" font-weight="600">${num.get(i)}</text>` : "";
    return `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>${n}<text x="${x + S / 2}" y="${y + S / 2 + 12}" text-anchor="middle" font-size="32" font-weight="700">${esc(ch)}</text>`;
  }).join("");
  const label = `Solved Mini Crossword grid, ${d.width} by ${d.height}`;
  const svg = `<svg class="pz-svg pz-mini" viewBox="-2 -2 ${d.width * S + 4} ${d.height * S + 4}" role="img" aria-label="${esc(label)}"><g font-family="Sora,sans-serif" fill="#1a1a1a">${cells}</g></svg>`;
  return figure("pz-minigrid", svg, `The filled grid, with each clue number in its first square. ${FROM_DATA}`);
}

/** Spelling Bee honeycomb: the center letter in yellow, the six outer letters around it. */
function beeBoard(d) {
  const R = 46, H = R * Math.sqrt(3);
  const hex = (cx, cy, fill, ch) => {
    const pts = Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k; return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`; }).join(" ");
    return `<polygon points="${pts}" fill="${fill}" stroke="#fff" stroke-width="6"/><text x="${cx}" y="${cy + 11}" text-anchor="middle">${ch}</text>`;
  };
  const cx = 150, cy = 150;
  const ring = [[0, -H], [1.5 * R, -H / 2], [1.5 * R, H / 2], [0, H], [-1.5 * R, H / 2], [-1.5 * R, -H / 2]];
  const outer = d.outer_letters.toUpperCase().split("");
  const body = [hex(cx, cy, "#f7da21", d.center_letter.toUpperCase()), ...ring.map(([dx, dy], k) => hex(cx + dx, cy + dy, "#e6e6e6", outer[k]))].join("");
  const label = `Spelling Bee letters: center ${d.center_letter.toUpperCase()}, outer ${outer.join(", ")}`;
  const svg = `<svg class="pz-svg pz-hive" viewBox="0 0 300 300" role="img" aria-label="${esc(label)}"><g font-family="Sora,sans-serif" font-weight="800" font-size="30" fill="#1a1a1a">${body}</g></svg>`;
  return figure("pz-bee", svg, "Today's seven letters, from the official puzzle data published by The New York Times; every word must use the yellow center letter.");
}

const MON_AP = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
/** "Thursday, Oct. 29, 2026" for a YYYY-MM-DD date. */
const apDate = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return `${weekday(date)}, ${MON_AP[m - 1]} ${d}, ${y}`;
};
const SMALL = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);
/** NYT data spells answers in capitals; pages print them in title case (runs of capitals fail the audit). */
const title = (s) => s.toLowerCase().replace(/[a-z][a-z']*/g, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
const todayET = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

/**
 * Yesterday's answer from its saved data, with a link to yesterday's page when that page is live.
 * Comes after today's spoiler section, so it never sits above today's hints.
 */
function yesterday(p) {
  const date = addDays(p.date, -1);
  const d = loadPuzzle(p.game, date);
  if (!d || p.game === "bee" || p.game === "pips") return "";
  const g = GAMES[p.game];
  const prefix = `${g.prefix}-${slugDate(date)}`;
  const now = Date.now();
  const ySlug = [...allStories()].find(([s, at]) => (s === prefix || s.startsWith(`${prefix}-`)) && at <= now)?.[0];
  const more = ySlug ? ` <a href="/news/${ySlug}/">Yesterday's hints and full solution</a>.` : "";
  let body = "";
  if (p.game === "wordle") body = `<p>Wordle #${d.days_since_launch} on ${apDate(date)} was <strong>${title(d.solution)}</strong>.${more}</p>`;
  else if (p.game === "connections") {
    const COLORS = ["Yellow", "Green", "Blue", "Purple"];
    body = `<p>The four groups in Connections on ${apDate(date)}, easiest to hardest:</p><ul>${d.categories.map((c, i) => `<li><strong>${COLORS[i]}, ${esc(title(c.title))}:</strong> ${c.cards.map((x) => esc(title(x.content))).join(", ")}</li>`).join("")}</ul>${more ? `<p>${more.trim()}</p>` : ""}`;
  } else if (p.game === "strands") {
    body = `<p>Strands on ${apDate(date)} had the theme clue "${esc(d.clue)}". The spangram was <strong>${esc(title(d.spangram))}</strong>, and the theme words were ${d.themeWords.map(title).join(", ")}.${more}</p>`;
  } else if (p.game === "letterboxed") {
    body = `<p>The Times' own solution to Letter Boxed on ${apDate(date)} was <strong>${d.ourSolution.map(title).join(", then ")}</strong>, with sides ${d.sides.map((x) => [...x].join("/")).join(", ")}.${more}</p>`;
  } else if (p.game === "mini") {
    // Spelled as yesterday's checked answer table prints them ("DSA" stays in capitals), else title case.
    const page = ySlug ? readFileSync(files.get(ySlug), "utf8") : "";
    const ans = (cl) => {
      const w = cl.cells.map((i) => d.cells[i]).join("");
      const row = page.match(new RegExp(`^\\| ${cl.label}-${cl.direction} \\| (.+?) \\|$`, "m"))?.[1];
      if (!row || row.toUpperCase().replace(/[^A-Z]/g, "") !== w) return title(w);
      if (row !== row.toUpperCase()) return row;
      // An abbreviation answer: reuse the expansion yesterday's page gives it ("Full Name (DSA)"),
      // since every abbreviation is spelled out on first use (audit 08-ABBREV).
      const m = page.match(new RegExp(`((?:(?:[A-Z][\\w'-]*|of|the|and|for|in|on|to|a) )+)\\(${row}\\)`));
      const full = m?.[1].trim().replace(/^(?:(?:of|the|and|for|in|on|to|a) )+/, "");
      return full ? `${full} (${row})` : title(w);
    };
    const dir = (k) => d.clues.filter((c) => c.direction === k).map((c) => `${c.label} ${esc(ans(c))}`).join(", ");
    body = `<p>The Mini on ${apDate(date)}: Across ${dir("Across")}; Down ${dir("Down")}.${more}</p>`;
  }
  if (!body) return "";
  return `<h2 id="pz-yesterday">Yesterday's ${esc(g.name)} answer</h2>${body}`;
}

/** Each word's letters must be in the box, and no two letters in a row may share a side. */
function letterBoxedOk(word, sideOf) {
  for (let i = 0; i < word.length; i++) {
    const s = sideOf.get(word[i]);
    if (s === undefined || (i > 0 && s === sideOf.get(word[i - 1]))) return false;
  }
  return true;
}

/** The box with its twelve letters and the Times' solution drawn as a path, one color per word. */
function letterBoxedBoard(d) {
  const W = 320, O = 50, E = O + W; // square from (O, O) to (E, E)
  const pos = new Map();
  d.sides.forEach((side, k) => [...side].forEach((ch, j) => {
    const t = O + (W * (j + 1)) / 4;
    pos.set(ch, [[t, O], [E, t], [E - (t - O), E], [O, E - (t - O)]][k]);
  }));
  const OUT = 28; // letters sit outside the square, dots on its edge
  const label = (ch) => {
    const [x, y] = pos.get(ch);
    const dx = x === O ? -OUT : x === E ? OUT : 0, dy = y === O ? -OUT : y === E ? OUT : 0;
    return `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#1a1a1a" stroke-width="3"/><text x="${x + dx}" y="${y + dy + 9}" text-anchor="middle">${ch}</text>`;
  };
  const COLORS = ["#d9534f", "#2f6db5", "#3f7a3a", "#8a4fb0", "#b8860b"];
  const paths = d.ourSolution.map((w, i) => `<polyline points="${[...w].map((c) => pos.get(c).join(",")).join(" ")}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`).join("");
  const sol = d.ourSolution.map(title).join(", then ");
  const svg = `<svg class="pz-svg pz-lbox" viewBox="0 0 ${E + O} ${E + O}" role="img" aria-label="${esc(`Letter Boxed square with the Times' solution traced: ${sol}`)}"><rect x="${O}" y="${O}" width="${W}" height="${W}" fill="#fbe9e4" stroke="#1a1a1a" stroke-width="3"/>${paths}<g font-family="Sora,sans-serif" font-weight="800" font-size="26" fill="#1a1a1a">${[...pos.keys()].map(label).join("")}</g></svg>`;
  const key = d.ourSolution.map((w, i) => `${["red", "blue", "green", "purple", "gold"][i % 5]} for ${title(w)}`).join(", ");
  return figure("pz-letterboxed", svg, `The Times' solution traced through the box: ${key}. ${FROM_DATA}`);
}

/**
 * Every other pair of words from the puzzle's own word list that solves the box in two: the second
 * starts with the last letter of the first, both keep the side rule, and together they use all
 * twelve letters. Shortest pairs first.
 */
function letterBoxedOthers(d) {
  const sideOf = new Map(d.sides.flatMap((s, i) => [...s].map((c) => [c, i])));
  const letters = [...sideOf.keys()];
  const words = d.dictionary.filter((w) => letterBoxedOk(w, sideOf));
  const byFirst = new Map();
  for (const w of words) byFirst.set(w[0], [...(byFirst.get(w[0]) ?? []), w]);
  const ours = d.ourSolution.join(" ");
  const pairs = [];
  for (const a of words) for (const b of byFirst.get(a.at(-1)) ?? []) {
    const used = new Set(a + b);
    if (letters.every((c) => used.has(c)) && `${a} ${b}` !== ours) pairs.push([a, b]);
  }
  if (!pairs.length) return `<p>No other pair of words in the puzzle's own word list solves this box in two.</p>`;
  pairs.sort((x, y) => x[0].length + x[1].length - (y[0].length + y[1].length) || (x[0] + x[1]).localeCompare(y[0] + y[1]));
  const shown = pairs.slice(0, 10);
  const n = pairs.length;
  const intro = n === 1 ? "One other pair of words from the puzzle's own word list also solves the box in two:" : `${n.toLocaleString("en-US")} other pairs of words from the puzzle's own word list also solve the box in two.${n > shown.length ? ` The ${shown.length} shortest:` : ""}`;
  return `<p>${intro}</p><ul class="pz-lbox-others">${shown.map(([a, b]) => `<li>${title(a)}, then ${title(b)}</li>`).join("")}</ul>`;
}

/**
 * Found-words tracker for the Spelling Bee. The word list rides in a data attribute (the same words
 * are printed in the spoiler section further down); the story page's script checks each word the
 * reader types, keeps the score and saves progress on the reader's device for this date only.
 */
function beeTracker(d, date) {
  const words = [...new Set([...d.answers, ...d.pangrams])].map((w) => w.toUpperCase()).sort();
  const sc = beeScore(d);
  return `<form class="tool-box pz-track" data-bee-tracker data-date="${date}" data-words="${words.join(" ")}" data-pangrams="${d.pangrams.map((w) => w.toUpperCase()).join(" ")}" data-genius="${sc.genius}" data-total="${sc.total}" hidden novalidate>`
    + `<p class="tool-title">Track the words you have found</p>`
    + `<label for="pz-bee-in">Type a word you found in today's puzzle</label>`
    + `<span class="pz-track-row"><input id="pz-bee-in" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20"><button type="submit">Add</button></span>`
    + `<span class="tool-out" aria-live="polite"></span>`
    + `<span class="pz-track-tools"><button type="button" data-bee-reset>Clear my list</button></span>`
    + `</form>`;
}

let wordleHist;
/**
 * Every Wordle answer before today (America/New_York), from the saved history plus the daily data
 * files, so the checker never shows an answer whose day has not come.
 */
function wordleHistory() {
  if (wordleHist !== undefined) return wordleHist;
  const f = `${PUZZLE_DIR}/wordle-history.json`;
  if (!existsSync(f)) return (wordleHist = null);
  const h = JSON.parse(readFileSync(f, "utf8"));
  const answers = [...h.answers];
  const today = todayET();
  for (let d = addDays(h.first, answers.length); d < today; d = addDays(d, 1)) {
    const w = loadPuzzle("wordle", d);
    if (!w) break;
    answers.push(w.solution.toUpperCase());
  }
  while (answers.length && addDays(h.first, answers.length - 1) >= today) answers.pop();
  return (wordleHist = { first: h.first, answers });
}

/** In the spoiler: earlier days with the same answer (Wordle has reused past answers since 2026). */
function wordleRepeat(d, date) {
  const h = wordleHistory();
  if (!h) return "";
  const w = d.solution.toUpperCase();
  const before = h.answers.flatMap((a, i) => (a === w && addDays(h.first, i) < date ? [i] : []));
  if (!before.length) return "";
  return `<p>${title(w)} has been the answer before: ${before.map((i) => `Wordle #${i} on ${apDate(addDays(h.first, i))}`).join(", ")}.</p>`;
}

/** "Has this word been the Wordle answer before?" Placed above the spoiler, so it can never show today's answer. */
function wordleChecker() {
  const h = wordleHistory();
  if (!h?.answers.length) return "";
  const last = addDays(h.first, h.answers.length - 1);
  return `<form class="tool-box pz-track" data-wordle-check data-first="${h.first}" data-answers="${h.answers.join(" ")}" hidden novalidate>`
    + `<p class="tool-title">Has a word been the Wordle answer before?</p>`
    + `<label for="pz-wc-in">Type a five-letter word to check it against ${h.answers.length.toLocaleString("en-US")} past answers, #0 to #${h.answers.length - 1} (${MON_AP[Number(last.slice(5, 7)) - 1]} ${Number(last.slice(8))}, ${last.slice(0, 4)})</label>`
    + `<span class="pz-track-row"><input id="pz-wc-in" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="5"><button type="submit">Check</button></span>`
    + `<span class="tool-out" aria-live="polite"></span>`
    + `</form>`;
}
