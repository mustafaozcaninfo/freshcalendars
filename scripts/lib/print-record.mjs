/**
 * What `pnpm fc news-assets` printed for a story, kept as apps/news/src/assets/news/<slug>/<slug>.print.json,
 * and the fact tokens the audit compares between a printable and its story (10-PDF-FACTS, 10-PDF-FRESH).
 *
 * Record: { kit, hash, files, computed }
 *   kit       the kit that drew the sheet ("list" for the four classic layouts)
 *   hash      of the story's assets.printable block, so a data change without a new PDF is caught
 *   files     the PDFs written (download paths)
 *   computed  dates, times and amounts the kit worked out in code (time-zone conversions, moon times,
 *             counts); these are allowed on the sheet without appearing in the story text
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Stories published from this date on that have `assets.printable` must carry a record. */
export const PRINT_SINCE = "2026-11-14";

/**
 * Categories whose printables must use a topic kit (owner's decision 2026-11-03). A story in one of
 * them that has no kit writes `noKit: "<why none fits>"` in assets.printable instead; categories not
 * listed here keep the classic layouts until they get a kit of their own.
 */
export const KIT_FOR_CATEGORY = {
  "school-calendars": ["school-year", "deadline-matrix", "fact-table"],
  sports: ["watch-guide", "fact-table"],
  entertainment: ["watch-guide", "release-tracker"],
  "retail-dates": ["deadline-matrix", "holiday-planner", "fact-table", "planner"],
  "money-benefits": ["deadline-matrix", "fact-table", "planner"],
  elections: ["deadline-matrix", "fact-table"],
  planning: ["deadline-matrix", "holiday-planner", "planner"],
  holidays: ["holiday-planner", "activity-sheet", "deadline-matrix", "watch-guide", "year-reference"],
  "uk-canada": ["bank-holidays", "holiday-planner", "watch-guide", "deadline-matrix", "activity-sheet", "fact-table"],
  "sky-events": ["sky-night"],
  "time-change": ["clock-change"],
  puzzles: ["puzzle-month"],
  "gaming-tech": ["release-tracker", "watch-guide"],
  "calendar-guides": ["year-reference", "deadline-matrix", "planner"],
};
/**
 * Records from this version on are held to the kit rule. v2 records were drawn while only seven
 * categories had kits; v3 (2026-11-03, a kit for every category) is when the rule covers them all,
 * so a sheet is never failed for a rule that did not exist when it was drawn.
 */
export const RECORD_VERSION = 3;
/** Records from this version on also have their kit data's names and numbers checked (10-PDF-FACTS). */
export const NAMES_VERSION = 3;
/** The version news-assets writes now. */
export const CURRENT_RECORD = 3;

/**
 * Kit data fields that are not facts from the story: identifiers, ISO values, the source's own
 * words, and the sheet's own fill-in labels and advice.
 */
const NOT_FACTS = new Set(["src", "quote", "kind", "tz", "airing", "status", "direction", "mode", "start", "from", "to", "date", "dates", "at", "game", "month", "year", "months", "landscape", "family", "tasks", "checklist", "pick", "notesLabel", "why", "substitute", "federal", "done"]);
const SKIP_WORDS = new Set(["jan", "january", "feb", "february", "mar", "march", "apr", "april", "may", "jun", "june", "jul", "july", "aug", "august", "sep", "sept", "september", "oct", "october", "nov", "november", "dec", "december", "mon", "monday", "tue", "tuesday", "wed", "wednesday", "thu", "thursday", "fri", "friday", "sat", "saturday", "sun", "sunday", "et", "ct", "mt", "pt", "the", "and", "or", "of", "a", "an", "to", "in", "on", "at", "for", "by", "with", "no"]);
const words = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) ?? [];

/**
 * Names and numbers in a kit's data (capitalized words, numbers) that the story's text does not
 * contain, e.g. a channel or a count typed only in the printable. `storyText` is the story's body
 * and frontmatter without the printable block.
 */
/**
 * Per kit, more keys whose text is the sheet's own wording (section titles, fill-in labels, quiz
 * questions), scoped so `label` stays checked where it is a fact (a school-year event's label).
 */
const KIT_OWN_WORDS = {
  "activity-sheet": ["title", "items", "labels", "q", "label", "columns"],
  planner: ["title", "columns", "rows", "items", "labels", "mark", "label", "groups"],
  "fact-table": ["label", "note", "key", "align", "highlight"],
};

export function unsupportedNames(data, storyText, kit = "") {
  const have = new Set(words(storyText));
  const missing = new Set();
  const own = new Set([...NOT_FACTS, ...(KIT_OWN_WORDS[kit] ?? [])]);
  const visit = (v, key) => {
    if (key && own.has(key)) return;
    if (typeof v === "string") {
      for (const raw of v.match(/[\p{L}\p{N}][\p{L}\p{N}'+]*/gu) ?? []) {
        const isName = /^\p{Lu}/u.test(raw) || /\d/.test(raw);
        for (const w of words(raw)) if (isName && !SKIP_WORDS.has(w) && !have.has(w)) missing.add(raw);
      }
    } else if (Array.isArray(v)) v.forEach((x) => visit(x));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) visit(x, k);
  };
  visit(data);
  return [...missing];
}

/** Why a story's printable breaks the kit rule, or null when it is fine. */
export function kitProblem(category, printable) {
  const kits = KIT_FOR_CATEGORY[category];
  if (!kits || !printable || printable.kit) return null;
  const why = typeof printable.noKit === "string" ? printable.noKit.trim() : "";
  if (why.length >= 20) return null;
  return why
    ? `noKit must say in at least 20 characters why no kit fits (now: "${why}")`
    : `stories in ${category} use a kit (${kits.join(" or ")}): set assets.printable.kit and data:, or add noKit: "<why none fits>"`;
}

/**
 * Why a story's downloads break the rule that printables in a kit category come from `news-assets`
 * (a kit, or a `noKit` reason): a PDF drawn by a story's own generator module (renderPrintables
 * directly) needs `assets.customPrintable: "<why a kit cannot draw it>"`. Returns null when fine.
 */
export function customProblem(category, assets, record, pdfs) {
  if (!KIT_FOR_CATEGORY[category]) return null;
  const drawn = new Set(record?.files ?? []);
  const own = pdfs.filter((f) => !drawn.has(f));
  if (!own.length) return null;
  const why = typeof assets?.customPrintable === "string" ? assets.customPrintable.trim() : "";
  if (why.length >= 20) return null;
  return `${own.length} printable(s) not drawn by news-assets (${own.slice(0, 2).join(", ")}): use a kit, or add assets.customPrintable: "<why a kit cannot draw it>" (20+ characters)`;
}

/** Stable hash of the parsed `assets.printable` block (the YAML parser keeps key order). */
export const printableHash = (printable) => createHash("sha256").update(JSON.stringify(printable ?? null)).digest("hex").slice(0, 16);

export const recordPath = (slug) => path.join(ROOT, "apps/news/src/assets/news", slug, `${slug}.print.json`);
export function readRecord(slug) {
  const f = recordPath(slug);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

const MONTHS = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
const MON_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";

/**
 * Dates ("d:12-21"), clock times ("t:20:00"), dollar amounts ("$:1234.5") and percentages ("%:86")
 * in a text. "Dec. 21-31" and "Dec. 21 to Jan. 4" give both ends, not the days between: a story that
 * says "from Dec. 15 to Dec. 24" does not support a sheet that names Dec. 19. `iso: true` also reads
 * YYYY-MM-DD dates (frontmatter source dates). `story: true` also reads the forms a story may use to
 * state a value, "25 November" and 24-hour "17:00" (UK and Canada stories); they are never read on the
 * sheet, where a numbered legend marker before a month ("2 Feb.") would look like a date.
 */
export function factTokens(text, { iso = false, story = false } = {}) {
  // ISO dates in frontmatter ("2026-09-24") support "Sept. 24" on the sheet.
  if (iso) text = text.replace(/\b20\d\d-(\d{2})-(\d{2})\b/g, (_, m, d) => ` ${["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][Number(m) - 1] ?? ""} ${Number(d)} `);
  const t = ` ${text.toLowerCase().replace(/\u2013|\u2014/g, "-").replace(/\s+/g, " ")} `;
  const out = new Set();
  const day = (m, d) => `d:${m}-${d}`;
  // Ordinals count too ("January 19th", "Dec. 1st to 3rd"): organizers often write dates that way.
  const re = new RegExp(`\\b${MON_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:\\s*(?:-|to|through|and)\\s*(?:${MON_RE}\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\s*(?::|[ap]\\.?m)))?`, "g");
  for (const m of t.matchAll(re)) {
    const m1 = MONTHS[m[1].replace(/\./, "")], d1 = Number(m[2]);
    if (!m1 || d1 < 1 || d1 > 31) continue;
    out.add(day(m1, d1));
    if (!m[4]) continue;
    const m2 = m[3] ? MONTHS[m[3].replace(/\./, "")] : m1, d2 = Number(m[4]);
    if (!m2 || d2 < 1 || d2 > 31) continue;
    out.add(day(m2, d2));
  }
  // Day before month, as UK and Canadian stories write it: "25 November", "Saturday 21st Nov".
  if (story) for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*(?:-|to|and)\\s*(\\d{1,2})(?:st|nd|rd|th)?)?\\s+(?:of\\s+)?${MON_RE}(?![a-z])`, "g"))) {
    const mo = MONTHS[m[3].replace(/\./, "")];
    for (const d of [m[1], m[2]].filter(Boolean).map(Number)) if (mo && d >= 1 && d <= 31) out.add(day(mo, d));
  }
  for (const m of t.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\b\.?/g)) {
    let h = Number(m[1]) % 12;
    if (m[3] === "p") h += 12;
    if (Number(m[1]) > 12) continue;
    out.add(`t:${String(h).padStart(2, "0")}:${m[2] ?? "00"}`);
  }
  // A time range in a story or quote, "1-4 p.m." or "11 a.m. to 1 p.m.": both ends are times.
  if (story) for (const m of t.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s?m\.?)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\b/g)) {
    const h2 = Number(m[4]) % 12 + (m[6] === "p" ? 12 : 0);
    let h1 = Number(m[1]) % 12 + ((m[3] ?? m[6]) === "p" ? 12 : 0);
    if (!m[3] && h1 > h2) h1 -= 12; // "11-1 p.m." starts at 11 a.m.
    if (Number(m[1]) <= 12 && Number(m[4]) <= 12) for (const [h, mm] of [[h1, m[2]], [h2, m[5]]]) out.add(`t:${String(h).padStart(2, "0")}:${mm ?? "00"}`);
  }
  // TV listings' "8/7c": 8 p.m. Eastern, 7 p.m. Central (prime time is always evening).
  if (story) for (const m of t.matchAll(/\b(\d{1,2})(?::(\d{2}))?\/(\d{1,2})(?::\d{2})?c\b/g)) out.add(`t:${String((Number(m[1]) % 12) + 12).padStart(2, "0")}:${m[2] ?? "00"}`);
  if (story) for (const m of t.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s*[ap]\.?\s?m)/g)) out.add(`t:${m[1].padStart(2, "0")}:${m[2]}`);
  for (const m of t.matchAll(/\b(noon|midnight)\b/g)) out.add(m[1] === "noon" ? "t:12:00" : "t:00:00");
  for (const m of t.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)/g)) out.add(`$:${Number(m[1].replace(/,/g, ""))}`);
  for (const m of t.matchAll(/\b(\d+(?:\.\d+)?)\s?(?:%|percent\b)/g)) out.add(`%:${Number(m[1])}`);
  return out;
}

/** Readable form of a token for the audit report. */
export const showToken = (k) => k.replace(/^d:(\d+)-(\d+)$/, (_, m, d) => `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}`).replace(/^t:/, "").replace(/^\$:/, "$").replace(/^%:(.*)$/, "$1%");
