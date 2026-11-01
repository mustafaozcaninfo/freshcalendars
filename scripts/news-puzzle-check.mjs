#!/usr/bin/env node
/**
 * Daily puzzle pages vs the official puzzle data saved in apps/news/src/content/puzzles/
 * (scripts/news-puzzle-data.mjs). Offline, so CI runs it on every push: a wrong answer, number,
 * weekday or Pips placement fails the build before it can publish. Scheduled pages are checked too.
 *
 * Checks per page: data file exists; weekday, date and puzzle number in title and slug; answers in
 * the spoiler section and spoiler FAQ (Wordle answer, Connections groups, Strands spangram and
 * theme words, every Pips placement, Spelling Bee letters, counts, points and word lists, today's
 * and yesterday's; Letter Boxed sides, par, the Times' solution and its route, warm-up words in the
 * puzzle's dictionary; Contexto's secret word, game numbers, letter count and yesterday's word;
 * Waffle answers, hint letters, solved and starting grids, and the swap route replayed on the starting
 * grid); named editors and constructors; published before the puzzle day ends; and no answer word in
 * the headline, lede, key points, hero text or hints (spoiler guard).
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
  return { title: field("title"), publishedAt: field("publishedAt"), fm, faq, body, sections };
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

  mini(page, d, p, err) {
    const answer = (cl) => cl.cells.map((i) => d.cells[i]).join("");
    for (const cl of d.clues) {
      const key = `${cl.label}-${cl.direction}`;
      const row = page.body.match(new RegExp(`^\\| ${key} \\| (.+?) \\|$`, "m"))?.[1];
      if (!row) err(`no answer row for ${key}`);
      else if (letters(row) !== answer(cl)) err(`${key} answer ${row}, data ${answer(cl)}`);
      // Hint lines quote the clue and give the length: "- **1-Across** (5 letters), *clue*: hint".
      const hint = page.body.match(new RegExp(`^- \\*\\*${key}\\*\\* \\((\\d+) letters\\), \\*(.+?)\\*:`, "m"));
      if (!hint) err(`no hint line for ${key}`);
      else {
        if (Number(hint[1]) !== cl.cells.length) err(`${key} hint says ${hint[1]} letters, data ${cl.cells.length}`);
        if (norm(hint[2].replace(/\\/g, "")) !== norm(cl.text)) err(`${key} clue "${hint[2]}", data "${cl.text}"`);
      }
    }
    const by = page.body.match(/clues? by ([A-Z][A-Za-z'-]+(?: [A-Z][A-Za-z'-]+)+)/)?.[1];
    if (by && !d.constructors.includes(by)) err(`constructor ${by}, data ${d.constructors.join(", ")}`);
  },

  letterboxed(page, d, p, err) {
    const sideOf = new Map(d.sides.flatMap((s, i) => [...s].map((c) => [c, i + 1])));
    const sides = d.sides.map((s) => [...s].join("/")).join(", ");
    // Sides as the table ("| 1 | L, R, V |"), the lede and summary ("L/R/V, I/F/S, ...") and the FAQ ("L, R, V; I, F, S; ...") print them.
    d.sides.forEach((s, i) => {
      const row = page.body.match(new RegExp(`^\\| ${i + 1} \\| ([A-Z, ]+) \\|$`, "m"))?.[1];
      if (!row) err(`no row for side ${i + 1} in the sides table`);
      else if (letters(row) !== s) err(`side ${i + 1} is ${row}, data ${[...s].join(", ")}`);
    });
    const all = `${page.fm}\n${page.body}`;
    for (const m of all.matchAll(/sides ((?:[A-Z]\/[A-Z]\/[A-Z](?:,? (?:and )?)?){4})/g)) {
      if (m[1].replace(/,? (?:and )?/g, ", ").replace(/, $/, "") !== sides) err(`sides "${m[1].replace(/[, ]+$/, "")}", data ${sides}`);
    }
    const fq = page.faq.find((x) => /four sides are/.test(x.a))?.a.match(/sides are (.+)\.$/)?.[1];
    if (fq && fq.split(/;\s*(?:and\s+)?/).map(letters).join("|") !== d.sides.join("|")) err(`FAQ sides "${fq}", data ${sides}`);
    for (const m of all.matchAll(/\b[Pp]ar (?:of|is) (\d+)/g)) if (Number(m[1]) !== d.par) err(`par ${m[1]}, data ${d.par}`);
    const dict = all.match(/lists ([\d,]+) dictionary words/)?.[1];
    if (dict && Number(dict.replace(/,/g, "")) !== d.dictionary.length) err(`dictionary size ${dict}, data ${d.dictionary.length}`);
    // The Times' solution, in order: "is Flamingos, then Striving." and "Spoiler: Flamingos, then Striving."
    const words = (s) => s.split(/,? then |, /).map(letters);
    const want = d.ourSolution.join(" then ");
    const ans = page.body.match(/own solution for [^*]*? is ([A-Za-z, ]+?)\.\*\*/)?.[1];
    if (!ans) err("no '**The Times' own solution for … is …**' line");
    else if (words(ans).join(" then ") !== want) err(`solution ${ans}, data ${want}`);
    const f = page.faq.find((x) => /^Spoiler: /.test(x.a));
    if (f && words(f.a.replace(/^Spoiler: |\.$/g, "")).join(" then ") !== want) err(`FAQ answer "${f.a}", data ${want}`);
    const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    for (const m of all.matchAll(/own solution (?:uses|needs only) (\w+) words|^ {4}a: "(\w+) words?, /gim)) {
      const n = NUM[(m[1] ?? m[2]).toLowerCase()] ?? Number(m[1] ?? m[2]);
      if (n !== d.ourSolution.length) err(`says the Times' solution has ${m[1] ?? m[2]} words, data ${d.ourSolution.length}`);
    }
    const len = all.match(/first word has (\d+) letters and the second has (\d+)/);
    if (len && (Number(len[1]) !== d.ourSolution[0].length || Number(len[2]) !== d.ourSolution[1]?.length)) err(`hint lengths ${len[1]} and ${len[2]}, data ${d.ourSolution.map((w) => w.length).join(" and ")}`);
    // Route table "| Flamingos | F2, L1, A4, ... |": the word's own letters, each with its side.
    for (const m of page.body.matchAll(/^\| ([A-Z][a-z]+) \| ((?:[A-Z]\d, )*[A-Z]\d) \|$/gm)) {
      const w = m[1].toUpperCase();
      if (!d.ourSolution.includes(w)) err(`route table word ${m[1]} is not in the Times' solution`);
      const got = m[2].split(", ");
      const exp = [...w].map((c) => `${c}${sideOf.get(c)}`);
      if (got.join() !== exp.join()) err(`route for ${m[1]} is ${m[2]}, data gives ${exp.join(", ")}`);
    }
    // Warm-up words "| Farm | 4 |": accepted by the puzzle's dictionary, not part of the solution, length right.
    for (const m of page.body.matchAll(/^\| ([A-Z][a-z]+) \| (\d+) \|$/gm)) {
      const w = m[1].toUpperCase();
      if (!d.dictionary.includes(w)) err(`warm-up word ${m[1]} is not in the puzzle's dictionary`);
      if (d.ourSolution.includes(w)) err(`warm-up word ${m[1]} is part of the Times' solution`);
      if (w.length !== Number(m[2])) err(`warm-up word ${m[1]} listed as ${m[2]} letters`);
    }
    for (const m of all.matchAll(/edited by ([A-Z][a-z]+ [A-Z][a-z]+)|([A-Z][a-z]+ [A-Z][a-z]+) edits it/g)) if ((m[1] ?? m[2]) !== d.editor) err(`editor ${m[1] ?? m[2]}, data ${d.editor}`);
  },

  contexto(page, d, p, err) {
    // The API serves the word for a game number; the saved file keeps the number and date we asked for.
    if (d.date !== p.date || d.number !== puzzleNumber("contexto", p.date)) err(`saved data is for #${d.number} on ${d.date}; resave with --force`);
    const word = letters(d.word);
    const ans = page.body.match(/secret word for Contexto #(\d+) is ([A-Za-z' -]+?)\.\*\*/);
    if (!ans) err("no '**The secret word for Contexto #N is X.**' line");
    else {
      if (Number(ans[1]) !== d.number) err(`answer line says #${ans[1]}, the date gives #${d.number}`);
      if (letters(ans[2]) !== word) err(`answer ${ans[2]}, data ${d.word}`);
    }
    const all = `${page.fm}\n${page.body}`;
    for (const m of all.matchAll(/Today's Contexto is game #(\d+)|^ {4}a: "Game #(\d+), for /gm)) if (Number(m[1] ?? m[2]) !== d.number) err(`says today is game #${m[1] ?? m[2]}, the date gives #${d.number}`);
    const f = page.faq.find((x) => /^Spoiler: /.test(x.a) && /Contexto answer for/.test(x.q));
    if (f && letters(f.a.replace(/^Spoiler: |\.$/g, "")) !== word) err(`FAQ answer "${f.a}", data ${d.word}`);
    // Letter counts in the lede, summary and hints ("a short noun, 4 letters", "a noun with 4 letters").
    for (const m of all.matchAll(/\bnoun(?: with|[^.,]*,) (\d+) letters/g)) if (Number(m[1]) !== word.length) err(`says ${m[1]} letters, ${d.word} has ${word.length}`);
    // Yesterday's word, in the FAQ ("Spoiler: Barn, for game #1502 on ...") and the answer section
    // ("Yesterday's word, for game #1502, was Barn."), against the day before's saved data.
    const y = loadPuzzle("contexto", addDays(p.date, -1));
    const said = [...all.matchAll(/Spoiler: ([A-Za-z' -]+), for game #(\d+) on|Yesterday's word, for game #(\d+), was ([A-Za-z' -]+)\./g)]
      .map((m) => ({ w: m[1] ?? m[4], n: Number(m[2] ?? m[3]) }));
    if (said.length && !y) err(`no saved data for yesterday's word; run: node scripts/news-puzzle-data.mjs ${addDays(p.date, -1)} --games contexto`);
    if (y) for (const s of said) {
      if (s.n !== y.number) err(`yesterday's game is #${s.n}, data #${y.number}`);
      if (letters(s.w) !== letters(y.word)) err(`yesterday's word ${s.w}, data ${y.word}`);
    }
    const next = all.match(/Game #(\d+) starts at/)?.[1];
    if (next && Number(next) !== d.number + 1) err(`next game #${next}, should be #${d.number + 1}`);
  },

  waffle(page, d, p, err) {
    // 21 letters row by row; rows 2 and 4 hold only columns 1, 3 and 5 (the rest are holes).
    const grid = (s) => {
      const g = [], it = [...s];
      for (let r = 0; r < 5; r++) g.push([0, 1, 2, 3, 4].map((c) => (r % 2 && c % 2 ? "." : it.shift())));
      return g;
    };
    const show = (g) => g.map((r) => r.join(" ")).join("\n");
    const sol = grid(d.solution), start = grid(d.puzzle);
    const word = { Row: (n) => sol[n - 1].join(""), Column: (n) => sol.map((r) => r[n - 1]).join("") };
    const lines = [["Across", "Row", 1], ["Across", "Row", 3], ["Across", "Row", 5], ["Down", "Column", 1], ["Down", "Column", 3], ["Down", "Column", 5]];
    if (!sameSet(lines.map(([, k, n]) => word[k](n)), d.words)) err(`the data's solution grid and word list disagree; recheck the data`);
    // Answer table "| Across | Row 1 | Tuber |" and hint lines "- **Row 1:** starts with T and ends with R".
    for (const [dir, k, n] of lines) {
      const w = word[k](n);
      const row = page.body.match(new RegExp(`^\\| ${dir} \\| ${k} ${n} \\| ([A-Za-z]+) \\|$`, "m"))?.[1];
      if (!row) err(`no answer row for ${dir} ${k} ${n}`);
      else if (letters(row) !== w) err(`${k} ${n} answer ${row}, data ${w}`);
      const h = page.body.match(new RegExp(`^- \\*\\*${k} ${n}:\\*\\* starts with ([A-Z]) and ends with ([A-Z])`, "m"));
      if (h && (h[1] !== w[0] || h[2] !== w[4])) err(`${k} ${n} hint says ${h[1]}…${h[2]}, data ${w}`);
    }
    // FAQ "Spoilers. Across: Tuber, Nerdy, Title. Down: Tenet, Burst, Rhyme."
    const f = page.faq.find((x) => /Across: .+ Down: /.test(x.a))?.a.match(/Across: (.+?)\. Down: (.+?)\.?$/);
    if (f) {
      if (f[1].split(/,\s*/).map(letters).join() !== [1, 3, 5].map(word.Row).join()) err(`FAQ across "${f[1]}", data ${[1, 3, 5].map(word.Row).join(", ")}`);
      if (f[2].split(/,\s*/).map(letters).join() !== [1, 3, 5].map(word.Column).join()) err(`FAQ down "${f[2]}", data ${[1, 3, 5].map(word.Column).join(", ")}`);
    }
    // Grids in code blocks: the one introduced as the starting grid must be the puzzle, any other the solution.
    const blocks = [...page.body.matchAll(/([^\n]*)\n\n```\n((?:[A-Z.](?: [A-Z.]){4}\n){5})```/g)];
    if (!blocks.length) err("no solved grid code block");
    for (const [, intro, b] of blocks) {
      const want = /starting grid/i.test(intro) ? start : sol;
      if (b.trim() !== show(want)) err(`${want === start ? "starting" : "solved"} grid differs from the data:\n${b.trimEnd()}`);
    }
    // Swap route "| 3 | Row 2, column 1 and row 4, column 5 | L and E |": replay it on the starting grid.
    const swaps = [...page.body.matchAll(/^\| (\d+) \| Row (\d), column (\d) and row (\d), column (\d) \| ([A-Z]) and ([A-Z]) \|$/gm)];
    if (swaps.length) {
      const g = start.map((r) => [...r]);
      for (const m of swaps) {
        const [a, b] = [[m[2] - 1, m[3] - 1], [m[4] - 1, m[5] - 1]];
        if (g[a[0]]?.[a[1]] === "." || g[b[0]]?.[b[1]] === ".") { err(`swap ${m[1]} names a hole`); continue; }
        if (g[a[0]][a[1]] !== m[6] || g[b[0]][b[1]] !== m[7]) err(`swap ${m[1]} says ${m[6]} and ${m[7]}, the squares hold ${g[a[0]][a[1]]} and ${g[b[0]][b[1]]} by then`);
        [g[a[0]][a[1]], g[b[0]][b[1]]] = [g[b[0]][b[1]], g[a[0]][a[1]]];
      }
      if (show(g) !== show(sol)) err(`the ${swaps.length}-swap route does not end at the solution`);
      for (const m of `${page.fm}\n${page.body}`.matchAll(/\b(\d+)-swap route/g)) if (Number(m[1]) !== swaps.length) err(`says a ${m[1]}-swap route, the table has ${swaps.length} swaps`);
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

/**
 * Spoiler guard. A searcher who wants a nudge reads the headline, the lede, the key points and the
 * hints; none of them may hand over the answer. Answer words may appear only in the spoiler
 * section and the FAQ (rendered under the story). Checked for puzzle dates from LEAK_SINCE on,
 * so older live pages are left as published.
 */
const LEAK_SINCE = "2026-11-02";
const answerWords = (game, d) => {
  if (game === "wordle") return [d.solution];
  if (game === "strands") return [d.spangram, ...d.themeWords];
  if (game === "bee") return d.pangrams;
  if (game === "letterboxed") return d.ourSolution;
  // Short Mini answers ("SPY") and one-word group names ("ANGER") read as ordinary prose; longer ones do not.
  if (game === "mini") return d.clues.map((c) => c.cells.map((i) => d.cells[i]).join("")).filter((w) => w.length >= 5);
  if (game === "connections") return d.categories.map((c) => c.title);
  return [];
};
function leaks(page, d, p, err) {
  if (p.date < LEAK_SINCE) return;
  const words = answerWords(p.game, d);
  if (!words.length) return;
  const fmField = (k) => page.fm.match(new RegExp(`^ *${k}: "(.*)"$`, "m"))?.[1] ?? "";
  const summary = [...(page.fm.match(/^summary:\n((?: {2}- .*\n?)+)/m)?.[1] ?? "").matchAll(/^ {2}- "(.*)"$/gm)].map((m) => m[1]).join(" ");
  const spoilerAt = page.sections.findIndex((s) => /\bspoilers?\b/i.test(s.h));
  const before = page.sections.slice(0, spoilerAt < 0 ? page.sections.length : spoilerAt);
  const clean = (s) => s
    .replace(/\]\([^)]*\)/g, "]") // link targets (slugs of other days)
    .replace(/^\s*(?:[-*]|\d+\.) \*\*[^*]+?:\*\*/gm, "") // hint labels such as "**First letter:**"
    .replace(/\*[^*\n]+\*/g, ""); // quoted official clues in italics
  const places = {
    title: fmField("title"), seoTitle: fmField("seoTitle"), description: fmField("description"),
    summary, "hero alt/caption": `${fmField("alt")} ${fmField("caption")}`,
    lede: clean(before[0]?.lines.join("\n") ?? ""),
    ...Object.fromEntries(before.slice(1).map((s) => [`"${s.h}" section`, clean(s.lines.join("\n"))])),
  };
  for (const w of words) {
    // Letters in order with optional spaces, hyphens or apostrophes between them ("Forest Floor").
    const re = new RegExp(`(?<![A-Za-z])${[...letters(w)].join("[\\s'’-]?")}(?![A-Za-z])`, "i");
    // A one-word Connections group name ("Anger") is only flagged in the headline fields and lede.
    const oneWord = p.game === "connections" && w.trim().split(/[\s_]+/).filter(Boolean).length === 1;
    for (const [where, txt] of Object.entries(places)) {
      if (oneWord && /section$/.test(where)) continue;
      if (re.test(txt)) err(`spoiler: "${title(w)}" appears in the ${where}, before the spoiler section`);
    }
  }
  // Wordle: letters belong inside the tap-to-reveal clues. The headline fields, key points, lede and
  // plain-text tips must not name one ("starts with S", "its only vowel, O", "the double T").
  if (p.game === "wordle") {
    const LETTER = /\b(?:starts|begins|ends) with [A-Z]\b|\b[A-Z] (?:first|last)\b|\b(?:vowels?|letters?|the|an|that|final|double),? [A-Z](?=[\s,.;:)]|$)/;
    const open = Object.entries(places).filter(([where]) => !/section$/.test(where) || /tips/i.test(where));
    for (const [where, txt] of open) {
      const m = txt.match(LETTER);
      if (m) err(`spoiler: the ${where} names a letter in plain text ("${m[0]}"); keep letters inside the hints`);
    }
  }
  // Connections: a visible sentence that lists three or more entries of one group hands the group
  // over. The board list ("Today's 16 words") and the tap-to-reveal hints are exempt.
  if (p.game === "connections") {
    const open = Object.entries(places).filter(([where]) => !/16 words|hints?\b/i.test(where));
    for (const [where, txt] of open) for (const sentence of txt.split(/(?<=[.!?])\s+/)) {
      for (const c of d.categories) {
        const named = c.cards.filter((x) => new RegExp(`(?<![A-Za-z])${x.content.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`, "i").test(sentence));
        if (named.length >= 3) err(`spoiler: the ${where} names ${named.length} entries of the "${title(c.title)}" group in one sentence (${named.map((x) => title(x.content)).join(", ")})`);
      }
    }
  }
}
const title = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

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
  if (!d && GAMES[p.game].since && p.date < GAMES[p.game].since) { pages--; continue; } // written before data was saved
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
    // Pages go up the day before; a missed day may be filled in later, but a date far off means a slip.
    const pub = Date.parse(page.publishedAt), day = Date.parse(`${p.date}T12:00:00-05:00`);
    if (pub < day - 14 * 86_400_000 || pub > day + 7 * 86_400_000) err(`publishedAt ${page.publishedAt} is more than two weeks before or a week after the puzzle day`);
    CHECK[p.game](page, d, p, err);
    leaks(page, d, p, err);
  }
  if (errs.length) {
    errors += errs.length;
    console.log(`✖ ${slug}`);
    for (const e of errs) console.log(`    ${e}`);
  }
}
console.log(`${pages} puzzle pages checked against the official data (${Object.values(GAMES).map((g) => g.name).join(", ")}): ${errors ? `${errors} problem(s)` : "all match"}`);
process.exit(errors ? 1 : 0);
