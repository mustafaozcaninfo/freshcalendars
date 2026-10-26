#!/usr/bin/env node
/**
 * Daily puzzle pages vs the official puzzle data saved in apps/news/src/content/puzzles/
 * (scripts/news-puzzle-data.mjs). Offline, so CI runs it on every push: a wrong answer, number,
 * weekday or Pips placement fails the build before it can publish. Scheduled pages are checked too.
 *
 * Checks per page: data file exists; weekday, date and puzzle number in title and slug; answers in
 * the spoiler section and spoiler FAQ (Wordle answer, Connections groups, Strands spangram and
 * theme words, every Pips placement, Spelling Bee letters, counts, points and word lists, today's
 * and yesterday's); named editors and constructors; published before the puzzle day ends.
 * Usage: node scripts/news-puzzle-check.mjs [slug-substring]
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { GAMES, addDays, beeScore, loadPuzzle, pipsRegionOk, pipsValues, puzzleNumber, puzzleOf, weekday } from "../apps/news/src/lib/puzzles.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const ART = path.join(ROOT, "apps/news/src/content/articles");
const only = process.argv[2];

const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, June: 6, July: 7, Aug: 8, Sept: 9, Oct: 10, Nov: 11, Dec: 12 };
const MON_RE = "(Jan|Feb|Mar|Apr|May|June|July|Aug|Sept|Oct|Nov|Dec)\\.?";
/** "Tuesday, Nov. 10, 2026" style dates in a string, as YYYY-MM-DD with the weekday written before them. */
const datesIn = (s) => [...s.matchAll(new RegExp(`(?:(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),? )?${MON_RE} (\\d{1,2}), (\\d{4})`, "g"))]
  .map((m) => ({ wd: m[1], date: `${m[4]}-${String(MON[m[2]]).padStart(2, "0")}-${m[3].padStart(2, "0")}` }));

/** Case, quotes, parenthetical notes ("Arial (Ariel)") and spacing do not count as differences. */
const norm = (s) => s.toLowerCase().replace(/[’‘“”"']/g, "").replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
const letters = (s) => s.toUpperCase().replace(/[^A-Z]/g, "");
const sameSet = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
const list = (s) => s.split(/,\s*(?:and\s+)?|\s+and\s+/).map(norm).filter(Boolean);

function parse(file) {
  const src = readFileSync(file, "utf8");
  const [, fm, body] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  const field = (k) => fm.match(new RegExp(`^${k}: "(.*)"$`, "m"))?.[1] ?? "";
  const faq = [...fm.matchAll(/^ {2}- q: "(.*)"\n {4}a: "(.*)"$/gm)].map((m) => ({ q: m[1], a: m[2] }));
  // Sections keyed by H2 text; the text before the first H2 is the lede.
  const sections = [];
  let cur = { h: "", lines: [] };
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) { sections.push(cur); cur = { h: line.slice(3), lines: [] }; } else cur.lines.push(line);
  }
  sections.push(cur);
  return { title: field("title"), publishedAt: field("publishedAt"), faq, body, sections };
}

const CHECK = {
  wordle(page, d, p, err) {
    const ans = page.body.match(/The answer to Wordle #(\d+) is ([A-Za-z]+)\./);
    if (!ans) return err("no 'The answer to Wordle #N is X.' line");
    if (Number(ans[1]) !== d.days_since_launch) err(`answer line says #${ans[1]}, data #${d.days_since_launch}`);
    if (ans[2].toUpperCase() !== d.solution.toUpperCase()) err(`answer ${ans[2]}, data ${d.solution}`);
    const f = page.faq.find((x) => /^Spoiler: /.test(x.a));
    if (f && letters(f.a.replace(/^Spoiler: /, "")) !== d.solution.toUpperCase()) err(`FAQ answer "${f.a}", data ${d.solution}`);
    const ed = page.body.match(/edited by ([A-Z][A-Za-z'-]+(?: [A-Z][A-Za-z'-]+)+)/)?.[1];
    if (ed && ed !== d.editor) err(`editor ${ed}, data ${d.editor}`);
  },

  connections(page, d, p, err) {
    const COLORS = ["Yellow", "Green", "Blue", "Purple"];
    d.categories.forEach((c, i) => {
      const line = page.body.match(new RegExp(`^- \\*\\*${COLORS[i]}, (.+?):\\*\\* (.+)$`, "m"));
      if (!line) return err(`no answer line for ${COLORS[i]}`);
      if (norm(line[1]) !== norm(c.title)) err(`${COLORS[i]} title "${line[1]}", data "${c.title}"`);
      const want = c.cards.map((x) => norm(x.content));
      if (!sameSet(list(line[2]), want)) err(`${COLORS[i]} words "${line[2]}", data ${c.cards.map((x) => x.content).join(", ")}`);
    });
    const all = d.categories.flatMap((c) => c.cards.map((x) => norm(x.content)));
    const words = page.sections.find((s) => /16 words/i.test(s.h))?.lines.find((l) => l.trim());
    if (words && !sameSet(list(words.replace(/^[^:]*:\s*/, "")), all)) err(`"Today's 16 words" list differs from the data`);
    const f = page.faq.find((x) => /^Spoilers: /.test(x.a) && /\(/.test(x.a));
    const fa = f?.a.toLowerCase().replace(/[’‘“”"']/g, "");
    if (fa) for (const w of all) if (!fa.includes(w)) err(`FAQ answers miss "${w}"`);
    const ed = page.body.match(/edited by ([A-Z][A-Za-z'-]+(?: [A-Z][A-Za-z'-]+)+)/)?.[1];
    if (ed && ed !== d.editor) err(`editor ${ed}, data ${d.editor}`);
  },

  strands(page, d, p, err) {
    const sp = page.body.match(/^- \*\*Spangram:\*\* (.+)$/m)?.[1];
    if (!sp) err("no '- **Spangram:**' line");
    else if (letters(sp) !== d.spangram) err(`spangram ${sp}, data ${d.spangram}`);
    const th = page.body.match(/^- \*\*Theme words:\*\* (.+)$/m)?.[1];
    if (!th) err("no '- **Theme words:**' line");
    else if (!sameSet(th.split(/,\s*/).map(letters), d.themeWords)) err(`theme words ${th}, data ${d.themeWords.join(", ")}`);
    const clue = page.body.match(/theme clue is "([^"]+?)\.?"/)?.[1];
    if (clue && norm(clue) !== norm(d.clue)) err(`clue "${clue}", data "${d.clue}"`);
    const f = page.faq.find((x) => /theme words are/.test(x.a));
    if (f) for (const w of [...d.themeWords, d.spangram]) if (!letters(f.a).includes(w)) err(`FAQ answers miss ${w}`);
    const by = page.body.match(/constructed by ([^.]+?) and edited by ([A-Z][A-Za-z'-]+(?: [A-Z][A-Za-z'-]+)+)/);
    if (by && (norm(by[1]) !== norm(d.constructors) || by[2] !== d.editor)) err(`credits "${by[1]} / ${by[2]}", data "${d.constructors} / ${d.editor}"`);
  },

  pips(page, d, p, err) {
    for (const lvl of ["easy", "medium", "hard"]) {
      const L = d[lvl], name = lvl[0].toUpperCase() + lvl.slice(1);
      const values = pipsValues(L);
      const broken = L.regions.filter((r) => !pipsRegionOk(r, values));
      if (broken.length) err(`${name}: the data's own placements break ${broken.length} region(s); recheck the data`);
      // The answer block runs from "**Easy, by Name.**" to the next bold line or heading.
      const head = page.body.match(new RegExp(`^\\*\\*${name}, by ([^*]+?)\\.\\*\\*`, "m"));
      if (!head) { err(`${name}: no '**${name}, by …**' answer block`); continue; }
      const rest = page.body.slice(head.index + head[0].length);
      const block = rest.slice(0, rest.search(/\n\*\*|\n## |$/));
      if (norm(head[1]) !== norm(L.constructors)) err(`${name}: constructor ${head[1]}, data ${L.constructors}`);
      // A domino is the pair of cell values, whichever end the line names first ("0-1" or "1-0").
      const cell = (r, c, v) => `R${r}C${c} = ${v}`;
      const pair = (x, y) => [x, y].sort().join(", ");
      const got = [...block.matchAll(/^- \d-\d: R(\d+)C(\d+) = (\d), R(\d+)C(\d+) = (\d)$/gm)].map((m) => pair(cell(m[1], m[2], m[3]), cell(m[4], m[5], m[6])));
      const want = L.solution.map(([c1, c2], i) => pair(cell(c1[0] + 1, c1[1] + 1, L.dominoes[i][0]), cell(c2[0] + 1, c2[1] + 1, L.dominoes[i][1])));
      if (!sameSet(got, want)) {
        const miss = want.filter((w) => !got.includes(w)), extra = got.filter((g) => !want.includes(g));
        err(`${name}: placements differ from the data (page: ${extra.join(" / ") || "nothing extra"}; data: ${miss.join(" / ") || "nothing missing"})`);
      }
      // Each line must also say what it shows: "a-b: <cell> = a, <cell> = b".
      for (const m of block.matchAll(/^- (\d)-(\d): R\d+C\d+ = (\d), R\d+C\d+ = (\d)$/gm)) if (m[1] !== m[3] || m[2] !== m[4]) err(`${name}: line "${m[0].slice(2)}" lists the values in another order than its domino label`);
      const hint = page.body.match(new RegExp(`^\\*\\*${name} \\(\\w+ dominoes: ([\\d\\-, ]+)\\)\\*\\*`, "m"))?.[1];
      if (hint && !sameSet(hint.split(/,\s*/), L.dominoes.map(([a, b]) => `${a}-${b}`))) err(`${name}: domino list in the hints differs from the data`);
    }
  },

  bee(page, d, p, err) {
    // Every spoiler section is checked against the data of the date in its heading (today and yesterday).
    const dated = page.sections.filter((s) => /spoilers?\)/i.test(s.h) && /Spelling Bee answers/i.test(s.h));
    if (!dated.length) err("no Spelling Bee answers (spoilers) section");
    for (const s of dated) {
      const date = datesIn(s.h)[0]?.date ?? p.date;
      const b = date === p.date ? d : loadPuzzle("bee", date);
      if (!b) { err(`no saved data for the ${date} answers section; run news-puzzle-data ${date} --games bee`); continue; }
      const txt = s.lines.join("\n");
      const groups = [...txt.matchAll(/^- \*\*(\d+) letters:\*\* (.+)$/gm)];
      const all = groups.flatMap((g) => g[2].split(/,\s*/).map(norm));
      for (const g of groups) for (const w of g[2].split(/,\s*/)) if (letters(w).length !== Number(g[1])) err(`${date}: "${w}" listed under ${g[1]} letters`);
      if (!sameSet(all, [...b.answers, ...b.pangrams].map(norm))) {
        const want = [...b.answers, ...b.pangrams].map(norm);
        err(`${date}: word list differs (page only: ${all.filter((w) => !want.includes(w)).join(", ") || "none"}; data only: ${want.filter((w) => !all.includes(w)).join(", ") || "none"})`);
      }
      const pg = txt.match(/^- \*\*Pangrams?:\*\* (.+)$/m)?.[1];
      if (!pg) err(`${date}: no pangram line`);
      else if (!sameSet(pg.split(/,\s*/).map(norm), b.pangrams.map(norm))) err(`${date}: pangrams ${pg}, data ${b.pangrams.join(", ")}`);
    }
    // Letter and score summaries ("Center letter A; outer letters ... 29 words, 116 points"), wherever they are.
    for (const m of page.body.matchAll(/Center letter ([A-Z]); outer letters ([A-Z, ]+)\. (\d+) words, (\d+) points/g)) {
      const b = [d, loadPuzzle("bee", addDays(p.date, -1))].find((x) => x && x.center_letter.toUpperCase() === m[1] && sameSet(m[2].split(/,\s*/), x.outer_letters.toUpperCase().split("")));
      if (!b) { err(`letters "${m[1]}; ${m[2]}" match neither this date's nor the day before's data`); continue; }
      const sc = beeScore(b);
      if (Number(m[3]) !== sc.words || Number(m[4]) !== sc.total) err(`summary says ${m[3]} words, ${m[4]} points; data gives ${sc.words} words, ${sc.total} points`);
    }
    const sc = beeScore(d);
    const desc = page.body.match(/Genius (?:at|needs) (\d+) points/)?.[1];
    if (desc && Number(desc) !== sc.genius) err(`Genius ${desc} points, data gives ${sc.genius} (70% of ${sc.total})`);
  },
};

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
let pages = 0, errors = 0;
for (const file of walk(ART).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const slug = path.basename(file).replace(/\.mdx?$/, "");
  if (only && !slug.includes(only)) continue;
  const p = puzzleOf(slug);
  if (!p) continue;
  pages++;
  const errs = [];
  const err = (m) => errs.push(m);
  const d = loadPuzzle(p.game, p.date);
  if (!d) err(`no saved official data; run: node scripts/news-puzzle-data.mjs ${p.date} --games ${p.game}`);
  else {
    const page = parse(file);
    const num = puzzleNumber(p.game, p.date, d);
    if (p.number !== null && num !== null && p.number !== num) err(`slug number ${p.number}, the date gives #${num}`);
    const tnum = page.title.match(/#(\d+)/)?.[1];
    if (tnum && num !== null && Number(tnum) !== num) err(`title says #${tnum}, the date gives #${num}`);
    const td = datesIn(page.title)[0];
    if (!td) err("no date in the title");
    else {
      if (td.date !== p.date) err(`title date ${td.date}, slug date ${p.date}`);
      if (td.wd && td.wd !== weekday(p.date)) err(`title says ${td.wd}, ${p.date} is a ${weekday(p.date)}`);
    }
    // Live before the puzzle day is over in New York (pages for a day go up the day before).
    if (Date.parse(page.publishedAt) >= Date.parse(`${addDays(p.date, 1)}T00:00:00-05:00`)) err(`publishedAt ${page.publishedAt} is after the puzzle day`);
    CHECK[p.game](page, d, p, err);
  }
  if (errs.length) {
    errors += errs.length;
    console.log(`✖ ${slug}`);
    for (const e of errs) console.log(`    ${e}`);
  }
}
console.log(`${pages} puzzle pages checked against the official data (${Object.values(GAMES).map((g) => g.name).join(", ")}): ${errors ? `${errors} problem(s)` : "all match"}`);
process.exit(errors ? 1 : 0);
