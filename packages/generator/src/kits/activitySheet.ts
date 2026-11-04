/**
 * activity-sheet kit: an observance day's activity page (World Toilet Day, National Bird Day,
 * Popcorn Day, World Braille Day). A date card with the weekday computed from the sourced date, a
 * box of sourced facts, and one or more activity sections chosen by `type`:
 *
 *   checklist  our own tick-box list                      items: ["...", "..."]
 *   tally      rows of blank tally boxes with a total     labels: ["...", "..."]
 *   quiz       questions with write-in answer lines; the  questions: [{ q, a, src, quote? }]
 *              sourced answers sit on a cut-off strip at the bottom, upside down, behind a
 *              drawn cut line and a scissors icon
 *   lines      labeled write-in lines                     labels: ["...", "..."]
 *   chart      a grid of cells, each a label and a braille cells: [{ label, dots: [1,4] }]
 *              six-dot pattern drawn in SVG               columns: 6
 *
 * Facts and quiz answers are sourced; checklist items, tally and line labels and section titles are
 * our own wording (so they are not fact-checked against the story). Portrait.
 *
 * data:
 *   day: { date: "2027-01-19", name: "National Popcorn Day", src: 1,
 *          quote: "National Popcorn Day is on Jan. 19, 2027" }  # the source's words with the date
 *   facts:
 *     - { text: "Popcorn is a whole grain.", src: 2, quote: "popcorn is a 100 percent whole grain" }
 *   activities:
 *     - { type: quiz, title: "Facts quiz", questions: [{ q: "Is popcorn a whole grain?", a: "Yes", src: 2 }] }
 *     - { type: tally, title: "Flavor tally", labels: ["Butter", "Caramel"] }
 *   unconfirmed: [{ label: "2027 deals", why: "no theater had posted a 2027 offer" }]
 */
import { baseCss, fillLines, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { DOWFULL, MONTHS, Problems, esc, isObj, isoDay, needQuote, needSource, str, unconfirmedList, type Kit, type KitContext, type Unconfirmed } from "./kit.js";

type Fact = { text: string };
type Quiz = { type: "quiz"; title: string; questions: { q: string; a: string }[] };
type Checklist = { type: "checklist"; title: string; items: string[] };
type Tally = { type: "tally"; title: string; labels: string[] };
type Lines = { type: "lines"; title: string; labels: string[] };
type Chart = { type: "chart"; title: string; columns: number; cells: { label: string; dots: number[] }[] };
type Activity = Quiz | Checklist | Tally | Lines | Chart;
export type ActivitySheet = { day: { date: Date; name: string }; facts: Fact[]; activities: Activity[]; unconfirmed: Unconfirmed[] };

const TYPES = ["checklist", "tally", "quiz", "lines", "chart"] as const;

/** One labeled activity's title, 1 to 60 characters. */
function title(pr: Problems, at: string, v: unknown): string {
  if (!str(v) || (v as string).length > 60) { pr.add(`${at}: title, up to 60 characters`); return ""; }
  return v as string;
}
/** A list of short strings (our wording): checklist items, tally and line labels. */
function labelList(pr: Problems, at: string, field: string, v: unknown, max: number): string[] {
  if (!Array.isArray(v) || !v.length) { pr.add(`${at}: ${field}, at least one`); return []; }
  const out: string[] = [];
  for (const [i, s] of v.entries()) {
    if (!str(s) || (s as string).length > 90) pr.add(`${at}: ${field} ${i + 1}, up to 90 characters`);
    else out.push(s as string);
  }
  if (out.length > max) pr.add(`${at}: ${field}, up to ${max}`);
  return out;
}

function validateActivity(pr: Problems, at: string, a: Record<string, unknown>, ctx: KitContext): Activity | null {
  const type = a.type;
  if (!TYPES.includes(type as (typeof TYPES)[number])) { pr.add(`${at}: type must be one of ${TYPES.join(", ")}`); return null; }
  const tl = title(pr, at, a.title);
  if (type === "checklist") return { type, title: tl, items: labelList(pr, at, "items", a.items, 20) };
  if (type === "tally") return { type, title: tl, labels: labelList(pr, at, "labels", a.labels, 14) };
  if (type === "lines") return { type, title: tl, labels: labelList(pr, at, "labels", a.labels, 14) };
  if (type === "quiz") {
    const questions: { q: string; a: string }[] = [];
    if (!Array.isArray(a.questions) || !a.questions.length) pr.add(`${at}: questions, at least one`);
    for (const [i, q] of ((a.questions as unknown[]) ?? []).entries()) {
      const qat = `${at} question ${i + 1}`;
      if (!isObj(q)) { pr.add(`${qat}: { q, a, src }`); continue; }
      if (!str(q.q) || (q.q as string).length > 120) pr.add(`${qat}: q, up to 120 characters`);
      if (!str(q.a) || (q.a as string).length > 120) pr.add(`${qat}: a (the answer), up to 120 characters`);
      // The answer is a sourced fact: src, and the quote proves the source's wording.
      needSource(pr, qat, q.src, ctx);
      needQuote(pr, qat, q.quote, ctx, {});
      if (str(q.q) && str(q.a)) questions.push({ q: q.q as string, a: q.a as string });
    }
    if (questions.length > 12) pr.add(`${at}: up to 12 questions`);
    return { type, title: tl, questions };
  }
  // chart
  const columns = a.columns === undefined ? 6 : a.columns;
  if (typeof columns !== "number" || !Number.isInteger(columns) || columns < 2 || columns > 8) pr.add(`${at}: columns, a whole number 2 to 8`);
  const cells: { label: string; dots: number[] }[] = [];
  if (!Array.isArray(a.cells) || !a.cells.length) pr.add(`${at}: cells, at least one`);
  for (const [i, c] of ((a.cells as unknown[]) ?? []).entries()) {
    const cat = `${at} cell ${i + 1}`;
    if (!isObj(c)) { pr.add(`${cat}: { label, dots }`); continue; }
    if (!str(c.label) || (c.label as string).length > 16) pr.add(`${cat}: label, up to 16 characters`);
    const dots = c.dots;
    if (!Array.isArray(dots) || !dots.every((n) => Number.isInteger(n) && n >= 1 && n <= 6) || new Set(dots).size !== dots.length) pr.add(`${cat}: dots, whole numbers 1 to 6 with no repeats`);
    else if (str(c.label)) cells.push({ label: c.label as string, dots: dots as number[] });
  }
  if (cells.length > 40) pr.add(`${at}: up to 40 cells`);
  return { type: "chart", title: tl, columns: typeof columns === "number" ? columns : 6, cells };
}

export const activitySheet: Kit<ActivitySheet> = {
  name: "activity-sheet",
  validate(data, ctx) {
    const pr = new Problems("activity-sheet");
    if (!isObj(data)) { pr.add("data: needs day, facts and activities"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;

    // The day itself: a sourced date, the weekday computed by the kit.
    let day: ActivitySheet["day"] | null = null;
    const h = d.day;
    if (!isObj(h)) pr.add("day: { date: YYYY-MM-DD, name, src }");
    else {
      const date = isoDay(h.date);
      if (!date) pr.add(`day: date ${JSON.stringify(h.date)} is not a real date (YYYY-MM-DD)`);
      if (!str(h.name) || (h.name as string).length > 60) pr.add("day: name, up to 60 characters");
      needSource(pr, "day", h.src, ctx);
      if (date) needQuote(pr, "day", h.quote, ctx, { days: [date] });
      if (date && str(h.name) && (h.name as string).length <= 60) day = { date, name: h.name as string };
    }

    // Facts: sourced claims, 1 to 8; a quote, when given, proves the source's wording.
    const facts: Fact[] = [];
    if (!Array.isArray(d.facts) || !d.facts.length) pr.add("facts: at least one { text, src }");
    for (const [i, f] of ((d.facts as unknown[]) ?? []).entries()) {
      const at = `fact ${i + 1}`;
      if (!isObj(f)) { pr.add(`${at}: { text, src }`); continue; }
      if (!str(f.text) || (f.text as string).length > 160) pr.add(`${at}: text, up to 160 characters`);
      needSource(pr, at, f.src, ctx);
      needQuote(pr, at, f.quote, ctx, {});
      if (str(f.text) && (f.text as string).length <= 160) facts.push({ text: f.text as string });
    }
    if (facts.length > 8) pr.add(`${facts.length} facts; keep it to 8`);

    // Activities: one or more sections, each with a known type.
    const activities: Activity[] = [];
    if (!Array.isArray(d.activities) || !d.activities.length) pr.add("activities: at least one section with a type");
    for (const [i, a] of ((d.activities as unknown[]) ?? []).entries()) {
      const at = `activity ${i + 1}`;
      if (!isObj(a)) { pr.add(`${at}: a section with a type`); continue; }
      const act = validateActivity(pr, at, a, ctx);
      if (act) activities.push(act);
    }
    if (activities.length > 6) pr.add(`${activities.length} activity sections; keep it to 6`);

    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { day: day!, facts, activities, unconfirmed };
  },

  render(k, p, ctx) {
    const t = ctx.theme, size = sizeOf(false, ctx.paper);
    const hd = k.day.date;

    // Big date card; the weekday is computed, never typed.
    const card = `<div class="dcard blk"><span class="dc-dow">${DOWFULL[hd.getUTCDay()]}</span>
      <span class="dc-date">${MONTHS[hd.getUTCMonth()]} ${hd.getUTCDate()}, ${hd.getUTCFullYear()}</span>
      <span class="dc-name">${esc(k.day.name)}</span></div>`;

    const factsBox = k.facts.length ? `<div class="box blk facts"><h3>Facts</h3><ul>${k.facts.map((f) => `<li>${esc(f.text)}</li>`).join("")}</ul></div>` : "";

    // Each activity section. Quiz answers are collected into one cut-off strip at the bottom.
    const answers: string[] = [];
    const sections = k.activities.map((a) => {
      if (a.type === "checklist")
        return `<div class="blk act"><h2 class="sec">${esc(a.title)}</h2><ul class="ck">${a.items.map((x) => `<li><span class="bx"></span><span>${esc(x)}</span></li>`).join("")}</ul></div>`;
      if (a.type === "tally")
        return `<div class="blk act"><h2 class="sec">${esc(a.title)}</h2><div class="tl">${a.labels.map((x) => `<div class="row"><span class="lab">${esc(x)}</span><span class="cells">${'<span></span>'.repeat(20)}</span><span class="tot">Total<i></i></span></div>`).join("")}</div></div>`;
      if (a.type === "lines")
        return `<div class="blk act">${fillLines(a.title, a.labels)}</div>`;
      if (a.type === "chart") {
        const grid = a.cells.map((c) => `<div class="cl"><span class="cl-lab">${esc(c.label)}</span>${braille(c.dots, t.primary)}</div>`).join("");
        return `<div class="blk act"><h2 class="sec">${esc(a.title)}</h2><div class="chart" style="grid-template-columns:repeat(${a.columns},1fr)">${grid}</div></div>`;
      }
      // quiz: numbered questions with a write-in line; answers go to the strip.
      const base = answers.length;
      const rows = a.questions.map((q, i) => {
        answers.push(`Q${base + i + 1}. ${q.a}`);
        return `<li><span class="qn">Q${base + i + 1}</span><span class="qt">${esc(q.q)}</span><i class="qln"></i></li>`;
      }).join("");
      return `<div class="blk act"><h2 class="sec">${esc(a.title)}</h2><ol class="quiz">${rows}</ol><p class="qhint">Answers are at the bottom of the page, upside down. Fold or cut them off.</p></div>`;
    }).join("");

    // The answer strip: a drawn cut line with a scissors icon, then the sourced answers upside down.
    const strip = answers.length
      ? `<div class="blk ans"><div class="cut">${scissors(t.muted)}<span class="cut-l"></span><span class="cut-t">cut here to hide the answers</span><span class="cut-l"></span></div>
         <div class="ans-body"><b>Answers</b><div class="ans-grid">${answers.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div></div>`
      : "";

    const css = `${baseCss(t, false)}
    .dcard{display:flex;flex-direction:column;align-items:flex-start;border:2px solid ${t.primary};border-radius:12px;background:${t.soft};padding:calc(10px*var(--s)) 16px;margin-bottom:calc(10px*var(--s))}
    .dc-dow{font-family:Sora;font-weight:800;font-size:calc(14px*var(--s));color:${t.primary};line-height:1.1}
    .dc-date{font-family:Sora;font-weight:800;font-size:calc(26px*var(--s));color:${t.ink};line-height:1.05}
    .dc-name{font-family:Sora;font-weight:700;font-size:calc(13px*var(--s));color:${t.primary};margin-top:2px}
    .facts ul{list-style:none;margin:0;padding:0;font-size:calc(10px*var(--s));line-height:1.4}
    .facts li{margin:0 0 3px;padding-left:13px;position:relative}
    .facts li::before{content:"";position:absolute;left:2px;top:6px;width:5px;height:5px;border-radius:50%;background:${t.primary}}
    .act{margin-top:calc(2px*var(--s))}
    ul.ck{list-style:none;margin:0;padding:0;font-size:calc(10.5px*var(--s));line-height:1.5}
    ul.ck li{display:flex;gap:8px;align-items:flex-start;margin:0 0 4px}
    ul.ck .bx{margin-top:2px}
    .tl .row{display:flex;align-items:center;gap:9px;margin:5px 0}
    .tl .lab{width:34%;font-family:Sora;font-weight:700;font-size:calc(10px*var(--s));color:${t.ink}}
    .tl .cells{flex:1;display:flex;height:calc(18px*var(--s));border:1.4px solid ${t.line};border-radius:4px;overflow:hidden}
    .tl .cells span{flex:1;border-right:1px solid ${t.line}}
    .tl .cells span:last-child{border-right:none}
    .tl .tot{width:84px;display:flex;align-items:center;gap:6px;font-size:calc(9.5px*var(--s));color:${t.muted};font-family:Sora;font-weight:700}
    .tl .tot i{flex:1;border-bottom:1px solid ${t.muted};height:12px}
    .chart{display:grid;gap:9px 8px}
    .chart .cl{border:1.3px solid ${t.line};border-radius:8px;padding:5px 2px;display:flex;flex-direction:column;align-items:center;gap:3px;background:${t.soft}}
    .chart .cl-lab{font-family:Sora;font-weight:800;font-size:calc(12px*var(--s));color:${t.primary}}
    ol.quiz{margin:0;padding:0;list-style:none;font-size:calc(10.5px*var(--s));line-height:1.5}
    ol.quiz li{display:flex;align-items:baseline;gap:8px;margin:0 0 5px}
    ol.quiz .qn{font-family:Sora;font-weight:800;color:${t.primary};flex:none;width:26px}
    ol.quiz .qt{flex:none;max-width:62%}
    ol.quiz .qln{flex:1;border-bottom:1px solid ${t.muted};height:12px;align-self:flex-end}
    .qhint{margin:4px 0 0;font-size:calc(8.8px*var(--s));color:${t.muted};font-style:italic}
    .ans{margin-top:calc(8px*var(--s))}
    .cut{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .cut .cut-l{flex:1;border-top:1.4px dashed ${t.muted};height:0}
    .cut .cut-t{font-size:8.6px;color:${t.muted};font-family:Sora;letter-spacing:.04em;text-transform:uppercase}
    .cut svg{flex:none}
    .ans-body{transform:rotate(180deg);border:1.3px solid ${t.line};border-radius:8px;padding:7px 11px;background:${t.soft}}
    .ans-body b{display:block;font-family:Sora;font-size:9.5px;color:${t.primary};margin-bottom:3px}
    .ans-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px 16px;font-size:9px;line-height:1.4;color:${t.ink}}`;

    const body = `${header(t, p.title, p.subtitle)}${card}${factsBox}${sections}${k.unconfirmed.length ? `<div class="blk">${unconfirmedBox(k.unconfirmed)}</div>` : ""}${notes(p.notesLabel)}${strip}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [], warnings: [] };
  },
};

/** A braille six-dot cell: dots 1-2-3 down the left, 4-5-6 down the right; present dots filled, the rest faint. */
function braille(dots: number[], color: string): string {
  const pos: [number, number][] = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]; // index 0 = dot 1, … , index 5 = dot 6
  const circles = pos.map(([c, r], i) => {
    const on = dots.includes(i + 1), cx = 7 + c * 13, cy = 7 + r * 13;
    return on
      ? `<circle cx="${cx}" cy="${cy}" r="4.3" fill="${color}"/>`
      : `<circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="${color}" stroke-width="1.1" stroke-opacity="0.45"/>`;
  }).join("");
  return `<svg width="27" height="40" viewBox="0 0 27 40" aria-hidden="true">${circles}</svg>`;
}

/** A scissors icon drawn as inline SVG (never a font glyph), for the quiz cut line. */
const scissors = (color: string) =>
  `<svg width="22" height="15" viewBox="0 0 24 16" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"><circle cx="4" cy="4" r="2.6"/><circle cx="4" cy="12" r="2.6"/><path d="M6 5 L22 13 M6 11 L22 3"/></g></svg>`;
