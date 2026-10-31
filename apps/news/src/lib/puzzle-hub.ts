/**
 * Puzzle hub table: one row per daily puzzle page (date, puzzle number, link), drawn above the
 * story cards on a game's topic hub so a reader finds any past day at a glance. Rows never carry
 * an answer: the game and number come from the title head and its "#N", never from the subtitle
 * after the colon (Connections titles name the groups there). Pure for testing.
 */

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
/** "<month>-<day>-<year>" in a slug, at its end or before a number or other suffix. */
const DATED = new RegExp(`-(${MONTHS.join("|")})-(\\d{1,2})-(\\d{4})(?:-|$)`);

export interface HubStory {
  id: string;
  title: string;
}

export interface PuzzleRow {
  id: string;
  /** YYYY-MM-DD, the puzzle's day from the slug. */
  date: string;
  /** "Wordle", "NYT Connections: Sports Edition". */
  game: string;
  number: number | null;
}

/** The puzzle day of a daily page slug ("2026-10-31"), or null for any other story. */
export function puzzleDate(slug: string): string | null {
  const m = slug.match(DATED);
  if (!m) return null;
  return `${m[3]}-${String(MONTHS.indexOf(m[1]!) + 1).padStart(2, "0")}-${m[2]!.padStart(2, "0")}`;
}

/** Game name from the title head: the words before "Hints" or "Answer(s)". */
export function gameName(title: string): string {
  const head = title.match(/^(.*?)\s+(?:Hints?|Answers?)\b/)?.[1]?.trim();
  return head || title.split(/[,(]/)[0]!.trim();
}

/** Rows for every daily page among a hub's stories, newest day first (same day: by game name). */
export function puzzleRows(stories: HubStory[]): PuzzleRow[] {
  const rows: PuzzleRow[] = [];
  for (const s of stories) {
    const date = puzzleDate(s.id);
    if (!date) continue;
    const n = s.title.match(/#(\d+)/)?.[1] ?? s.id.match(/-\d{4}-(\d+)$/)?.[1];
    rows.push({ id: s.id, date, game: gameName(s.title), number: n ? Number(n) : null });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.game.localeCompare(b.game));
}

/** "Sat., Oct. 31, 2026" (AP month abbreviations, as in the titles). */
export function shortDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const wd = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const ap: Record<string, string> = { January: "Jan.", February: "Feb.", August: "Aug.", September: "Sept.", October: "Oct.", November: "Nov.", December: "Dec." };
  return `${wd}., ${ap[month] ?? month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
