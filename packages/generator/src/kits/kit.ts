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

export type Size = { width: number; height: number };
export type Source = { title?: string; url?: string; publisher?: string };
export type KitPrintable = {
  kit: string; slug: string; group: string; title: string; subtitle?: string; note: string;
  description?: string; alt?: string; landscape?: boolean; notesLabel?: string; data: unknown;
};
export type KitContext = { storySlug: string; category: string; sources: Source[]; theme: Theme; fonts: string };
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
