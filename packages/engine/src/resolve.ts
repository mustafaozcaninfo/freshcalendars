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

export function resolveAllMonthYears(today: Date = new Date()): Record<number, number> {
  const out: Record<number, number> = {};
  for (let month = 1; month <= 12; month++) {
    out[month] = resolveMonthYear(month, today);
  }
  return out;
}
