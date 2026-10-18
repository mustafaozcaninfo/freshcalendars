/**
 * Evergreen month pages show the next occurrence of that month from `today`.
 * Aug 2 2026 → January=2027, August=2026.
 */
export function resolveMonthYear(month: number, today: Date = new Date()): number {
  if (month < 1 || month > 12) throw new Error(`Invalid month: ${month}`);
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  if (month < m) return y + 1;
  return y;
}

/** Yearly hub planning year = civil year (flips Jan 1). */
export function resolvePlanningYear(today: Date = new Date()): number {
  return today.getFullYear();
}

/**
 * Calendar date used for SSG — US Eastern (America/New_York).
 * Daily refresh-meta runs ~05:25 UTC (~01:25 Eastern) so the bake matches
 * the new Eastern civil day. Noon local Date avoids DST edges.
 */
export function resolveBakeToday(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  if (!y || !m || !d) throw new Error("resolveBakeToday: could not parse Eastern date");
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Sunday 00:00 of the week containing `today` (local date fields). */
export function sundayWeekStart(today: Date): Date {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/** e.g. "Aug 30 – Sep 5, 2026" for the on-page weekly planner (Sunday start). */
export function sundayWeekRangeLabel(today: Date): string {
  const start = sundayWeekStart(today);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function resolveAllMonthYears(today: Date = new Date()): Record<number, number> {
  const out: Record<number, number> = {};
  for (let month = 1; month <= 12; month++) {
    out[month] = resolveMonthYear(month, today);
  }
  return out;
}
