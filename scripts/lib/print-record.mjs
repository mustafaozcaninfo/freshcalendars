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
  "school-calendars": ["school-year"],
  sports: ["watch-guide"],
  entertainment: ["watch-guide"],
  "retail-dates": ["deadline-matrix"],
  "money-benefits": ["deadline-matrix"],
  elections: ["deadline-matrix"],
  planning: ["deadline-matrix"],
};
/** Records from this version on are held to the kit rule (older records were drawn before it). */
export const RECORD_VERSION = 2;

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
  const re = new RegExp(`\\b${MON_RE}\\s+(\\d{1,2})\\b(?:\\s*(?:-|to|through|and)\\s*(?:${MON_RE}\\s+)?(\\d{1,2})\\b(?!\\s*(?::|[ap]\\.?m)))?`, "g");
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
