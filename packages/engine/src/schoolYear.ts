/** Academic Aug→Jul helpers for school-year hub + overview assets. */

export function schoolYearStartYear(today: Date = new Date()): number {
  const m = today.getMonth() + 1;
  return m >= 8 ? today.getFullYear() : today.getFullYear() - 1;
}

/** e.g. 2026 → "2026-2027" */
export function schoolYearSpanLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

export function schoolYearOverviewAssetPaths(startYear: number): { png: string; pdf: string; span: string } {
  const span = schoolYearSpanLabel(startYear);
  return {
    span,
    png: `/assets/school/${span}/overview/calendar.png`,
    pdf: `/assets/school/${span}/overview/calendar.pdf`,
  };
}

/** Aug→Jul month numbers with calendar years. */
export function schoolYearMonthSpecs(startYear: number): { month: number; year: number }[] {
  const order = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
  return order.map((month) => ({
    month,
    year: month >= 8 ? startYear : startYear + 1,
  }));
}
