/**
 * Monthly story archive (/news/archive/YYYY/MM/). Every published story is listed on exactly one
 * month page, linked from /news/archive/, which the news home and the rail link: no story is ever
 * more than three clicks from /news/, however long the site runs (apps/news/test/links.mjs). Pure
 * for testing.
 */
export const ARCHIVE_PATH = "/news/archive/";

export interface ArchiveMonth<T> {
  year: number;
  /** 1 to 12 */
  month: number;
  /** "October 2026" */
  name: string;
  path: string;
  items: T[];
}

const ET = "America/New_York";
const parts = new Intl.DateTimeFormat("en-US", { timeZone: ET, year: "numeric", month: "numeric" });
const names = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" });

export const archivePath = (year: number, month: number) => `${ARCHIVE_PATH}${year}/${String(month).padStart(2, "0")}/`;

/** Months with stories, newest first; each month keeps the input order (pass stories newest first). Months are Eastern Time. */
export function archiveMonths<T>(items: T[], date: (t: T) => Date): ArchiveMonth<T>[] {
  const out = new Map<string, ArchiveMonth<T>>();
  for (const t of items) {
    const p = Object.fromEntries(parts.formatToParts(date(t)).map((x) => [x.type, x.value]));
    const year = Number(p.year), month = Number(p.month);
    const key = `${year}-${month}`;
    let m = out.get(key);
    if (!m) {
      m = { year, month, name: names.format(Date.UTC(year, month - 1, 15)), path: archivePath(year, month), items: [] };
      out.set(key, m);
    }
    m.items.push(t);
  }
  return [...out.values()].sort((a, b) => b.year - a.year || b.month - a.month);
}
