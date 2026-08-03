export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type MonthSlug = (typeof MONTH_SLUGS)[number];

export function monthSlugToNumber(slug: string): number {
  const i = MONTH_SLUGS.indexOf(slug.toLowerCase() as MonthSlug);
  if (i < 0) throw new Error(`Unknown month slug: ${slug}`);
  return i + 1;
}

export function monthNumberToSlug(month: number): MonthSlug {
  if (month < 1 || month > 12) throw new Error(`Invalid month: ${month}`);
  return MONTH_SLUGS[month - 1]!;
}

export function monthNumberToName(month: number): string {
  return MONTH_NAMES[month - 1]!;
}
