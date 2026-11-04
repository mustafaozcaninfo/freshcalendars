/**
 * Printable kits: one module per kind of sheet (a school year at a glance, a watch guide, a deadline
 * matrix), chosen with `assets.printable.kit` and filled from `assets.printable.data`.
 *
 * A kit never trusts typed weekdays, day counts or converted times: the data carries ISO dates and
 * ISO times with an offset, and the kit computes the rest. Every fact names its source (`src`: the
 * 1-based number of an entry in the story's `sources:`, or that entry's URL or publisher), and
 * values that are not confirmed are listed in words, never drawn on a grid or counted.
 * Design: docs/PRINTABLE-DESIGN-PLAN.md.
 */
import type { Theme } from "./themes.js";
import { factTokens } from "../../../../scripts/lib/print-record.mjs";

export type Size = { width: number; height: number };
export type Source = { title?: string; url?: string; publisher?: string };
export type KitPrintable = {
  kit: string; slug: string; group: string; title: string; subtitle?: string; note: string;
  description?: string; alt?: string; landscape?: boolean; notesLabel?: string; data: unknown;
};
/**
 * `paper`: "letter" (816 x 1056 px) or "a4" (794 x 1123 px); A4 is drawn as an extra -a4 file for
 * uk-canada stories. `publishedAt`: the story's, so rules that start on a date (QUOTE_SINCE) know.
 */
export type KitContext = { storySlug: string; category: string; sources: Source[]; theme: Theme; fonts: string; paper?: "letter" | "a4"; publishedAt?: string };
export type KitSheet = { html: string; size: Size; computed: string[]; warnings: string[] };
export type Kit<D> = {
  name: string;
  /** Checks the data and returns it typed; throws one error that lists every problem. */
  validate: (data: unknown, ctx: KitContext) => D;
  render: (data: D, p: KitPrintable, ctx: KitContext) => KitSheet;
};

/** Collects problems so a writer sees all of them in one run. */
export class Problems {
  list: string[] = [];
  constructor(readonly kit: string) {}
  add(msg: string) { this.list.push(msg); }
  throwIfAny() { if (this.list.length) throw new Error(`kit ${this.kit}: data does not check out\n  ${this.list.join("\n  ")}`); }
}

export const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** "2026-12-21" as a UTC date, or null when it is not a real calendar day. */
export function isoDay(s: unknown): Date | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}
/** "2026-11-18T20:00-05:00": a moment with its offset, or null. */
export function isoMoment(s: unknown): Date | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Resolves `src` against the story's sources; null when it names none of them. */
export function resolveSource(src: unknown, sources: Source[]): Source | null {
  if (typeof src === "number") return sources[src - 1] ?? null;
  if (typeof src !== "string") return null;
  return sources.find((s) => s.url === src || s.publisher === src) ?? null;
}
export function needSource(pr: Problems, where: string, src: unknown, ctx: KitContext): void {
  if (src === undefined) pr.add(`${where}: add src (the number of its entry in the story's sources:)`);
  else if (!resolveSource(src, ctx.sources)) pr.add(`${where}: src ${JSON.stringify(src)} is not one of the story's ${ctx.sources.length} sources`);
}

export const DAY_MS = 86_400_000;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MON = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
export const DOW = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
export const DOWFULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const isoOf = (d: Date) => d.toISOString().slice(0, 10);
/** "Tue., Dec. 15" (the weekday is computed, never typed). */
export const dayLabel = (d: Date) => `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY_MS);
export const eachDay = (a: Date, b: Date) => Array.from({ length: daysBetween(a, b) + 1 }, (_, i) => new Date(a.getTime() + i * DAY_MS));

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Unconfirmed items: `{ label, why }`, shown in words only. */
export type Unconfirmed = { label: string; why: string };
export function unconfirmedList(pr: Problems, v: unknown): Unconfirmed[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) { pr.add("unconfirmed: a list of { label, why }"); return []; }
  return v.flatMap((u, i) => {
    if (!isObj(u) || !str(u.label) || !str(u.why)) { pr.add(`unconfirmed ${i + 1}: needs label and why`); return []; }
    return [{ label: u.label, why: u.why }];
  });
}

/**
 * Stories published from this date on quote the source for every dated or timed fact (`quote:` on
 * the item, the sentence or table cell exactly as the source prints it). The kit checks that the
 * quote really contains the date (month and day) and, for a time, the clock time, so a value copied
 * wrong from the source is caught before it is printed.
 */
export const QUOTE_SINCE = "2026-11-04";
export const quotesRequired = (ctx: KitContext) => String(ctx.publishedAt ?? "9999").slice(0, 10) >= QUOTE_SINCE;

/** Checks `quote` against the values it must contain; `days` are calendar days, `clocks` "HH:MM". */
export function needQuote(pr: Problems, where: string, quote: unknown, ctx: KitContext, want: { days?: Date[]; clocks?: string[] }): void {
  // Several quotes are allowed when the source gives the date and the time in different places.
  if (Array.isArray(quote)) quote = quote.every(str) && quote.length ? quote.join(" | ") : "";
  if (quote === undefined) { if (quotesRequired(ctx)) pr.add(`${where}: add quote, the source's own words for this fact (required from ${QUOTE_SINCE})`); return; }
  if (!str(quote) || quote.length < 6) { pr.add(`${where}: quote must be the source's own words`); return; }
  const have = factTokens(quote, { story: true, iso: true }) as Set<string>;
  for (const d of want.days ?? []) {
    const k = `d:${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
    if (!have.has(k)) pr.add(`${where}: the quote does not say ${MON[d.getUTCMonth()]} ${d.getUTCDate()} ("${quote.slice(0, 60)}"); check the date against the source`);
  }
  for (const c of want.clocks ?? []) if (!have.has(`t:${c}`)) pr.add(`${where}: the quote does not say ${c} ("${quote.slice(0, 60)}"); check the time against the source`);
}

/** Wall-clock "HH:MM" of an ISO time as written (the source's own zone), e.g. "20:00" for 2026-11-18T20:00-05:00. */
export const clockOf = (iso: string) => /T(\d{2}:\d{2})/.exec(iso)?.[1] ?? "";

/**
 * Zones whose clock a source may state a time in. An ISO time's offset must be the offset one of
 * them has at that moment, so a "-04:00" typed for a November date (daylight saving time ended
 * Nov. 1) is caught instead of printing every time an hour off.
 */
const ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris", "UTC"];
/** Canada's Atlantic and Newfoundland clocks, only for uk-canada stories: in winter Atlantic time is -04:00, the very offset a missed daylight-saving change gives Eastern Time. */
const CANADA_EAST = ["America/Halifax", "America/St_Johns"];
const offsetIn = (d: Date, tz: string) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(d).map((x) => [x.type, x.value]));
  const m = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(p.timeZoneName ?? "");
  return !m || !m[1] ? 0 : (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
};
/**
 * For a time the source states in a named zone ("Australia/Sydney" for a Melbourne Test, "Asia/Tokyo"):
 * the ISO time's offset must be that zone's offset at that moment, so the same daylight-saving check
 * covers events abroad. Returns a problem or null.
 */
export function zoneOffsetProblem(iso: string, tz: string): string | null {
  const d = isoMoment(iso);
  if (!d) return null;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { return `tz "${tz}" is not a time zone name (use one like "Australia/Sydney")`; }
  const m = /(Z|([+-])(\d{2}):(\d{2}))$/.exec(iso)!;
  const off = m[1] === "Z" ? 0 : (m[2] === "-" ? -1 : 1) * (Number(m[3]) * 60 + Number(m[4]));
  const want = offsetIn(d, tz);
  if (off === want) return null;
  const sign = want < 0 ? "-" : "+", a = Math.abs(want);
  return `offset ${m[1]} is not ${tz}'s clock on ${iso.slice(0, 10)}; it is ${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")} that day (check daylight saving time)`;
}

export function offsetProblem(iso: string, category = ""): string | null {
  const d = isoMoment(iso);
  if (!d) return null;
  const m = /(Z|([+-])(\d{2}):(\d{2}))$/.exec(iso)!;
  const off = m[1] === "Z" ? 0 : (m[2] === "-" ? -1 : 1) * (Number(m[3]) * 60 + Number(m[4]));
  if ([...ZONES, ...(category === "uk-canada" ? CANADA_EAST : [])].some((z) => offsetIn(d, z) === off)) return null;
  const et = offsetIn(d, "America/New_York"), sign = et < 0 ? "-" : "+", a = Math.abs(et);
  return `offset ${m[1]} is not the clock of any U.S. zone, London, Paris or UTC on ${iso.slice(0, 10)}; Eastern Time is ${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")} that day (check daylight saving time)`;
}
