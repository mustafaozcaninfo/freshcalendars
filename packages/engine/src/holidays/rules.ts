export type WeekdayName =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type HolidayRule =
  | { t: "fixed"; m: number; d: number }
  | { t: "nth_weekday"; n: number; weekday: WeekdayName; m: number }
  | { t: "last_weekday"; weekday: WeekdayName; m: number }
  | { t: "weekday_on_or_before"; weekday: WeekdayName; m: number; d: number }
  | { t: "easter_offset"; offset: number }
  | { t: "offset_from"; base: string; days: number };

export type HolidayLocale = "us" | "uk" | "ca";

export type HolidayDef = {
  slug: string;
  name: string;
  kind: "federal" | "observance" | "movable";
  sort: number;
  rule: HolidayRule;
  /** Short SEO blurb for when-is pages */
  blurb: string;
};

/**
 * All published holidays — dates are always computed (never hardcoded).
 * Adding a row here auto-creates /when-is/{slug}.html + sitemap entry.
 */
export const US_HOLIDAY_RULES: HolidayDef[] = [
  {
    slug: "new-years-day",
    name: "New Year's Day",
    kind: "federal",
    sort: 1,
    rule: { t: "fixed", m: 1, d: 1 },
    blurb: "Federal holiday marking the first day of the civil year.",
  },
  {
    slug: "martin-luther-king-day",
    name: "Martin Luther King Jr. Day",
    kind: "federal",
    sort: 2,
    rule: { t: "nth_weekday", n: 3, weekday: "monday", m: 1 },
    blurb: "US federal holiday on the third Monday of January.",
  },
  {
    slug: "groundhogs-day",
    name: "Groundhog Day",
    kind: "observance",
    sort: 3,
    rule: { t: "fixed", m: 2, d: 2 },
    blurb: "February 2 folklore observance — will the groundhog see its shadow?",
  },
  {
    slug: "valentines-day",
    name: "Valentine's Day",
    kind: "observance",
    sort: 4,
    rule: { t: "fixed", m: 2, d: 14 },
    blurb: "Popular observance for cards, gifts, and date-night planning.",
  },
  {
    slug: "presidents-day",
    name: "Presidents' Day",
    kind: "federal",
    sort: 5,
    rule: { t: "nth_weekday", n: 3, weekday: "monday", m: 2 },
    blurb: "Officially Washington's Birthday — observed the third Monday of February.",
  },
  {
    slug: "st-patricks-day",
    name: "St. Patrick's Day",
    kind: "observance",
    sort: 6,
    rule: { t: "fixed", m: 3, d: 17 },
    blurb: "Cultural observance with parades and green-themed celebrations.",
  },
  {
    slug: "ash-wednesday",
    name: "Ash Wednesday",
    kind: "movable",
    sort: 7,
    rule: { t: "easter_offset", offset: -46 },
    blurb: "Start of Lent — 46 days before Easter Sunday (Gregorian computus).",
  },
  {
    slug: "april-fools-day",
    name: "April Fools' Day",
    kind: "observance",
    sort: 8,
    rule: { t: "fixed", m: 4, d: 1 },
    blurb: "Lighthearted observance known for jokes and pranks.",
  },
  {
    slug: "palm-sunday",
    name: "Palm Sunday",
    kind: "movable",
    sort: 9,
    rule: { t: "easter_offset", offset: -7 },
    blurb: "Sunday before Easter — one week before Easter Sunday.",
  },
  {
    slug: "good-friday",
    name: "Good Friday",
    kind: "movable",
    sort: 10,
    rule: { t: "easter_offset", offset: -2 },
    blurb: "Friday before Easter Sunday, calculated from the Gregorian computus.",
  },
  {
    slug: "easter",
    name: "Easter Sunday",
    kind: "movable",
    sort: 11,
    rule: { t: "easter_offset", offset: 0 },
    blurb: "Western Easter Sunday via the Gregorian computus (Anonymous algorithm).",
  },
  {
    slug: "earth-day",
    name: "Earth Day",
    kind: "observance",
    sort: 12,
    rule: { t: "fixed", m: 4, d: 22 },
    blurb: "Environmental awareness day observed every April 22.",
  },
  {
    slug: "cinco-de-mayo",
    name: "Cinco de Mayo",
    kind: "observance",
    sort: 13,
    rule: { t: "fixed", m: 5, d: 5 },
    blurb: "May 5 observance commemorating the Battle of Puebla.",
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    kind: "observance",
    sort: 14,
    rule: { t: "nth_weekday", n: 2, weekday: "sunday", m: 5 },
    blurb: "US Mother's Day falls on the second Sunday of May.",
  },
  {
    slug: "memorial-day",
    name: "Memorial Day",
    kind: "federal",
    sort: 15,
    rule: { t: "last_weekday", weekday: "monday", m: 5 },
    blurb: "US federal holiday on the last Monday of May.",
  },
  {
    slug: "flag-day",
    name: "Flag Day",
    kind: "observance",
    sort: 16,
    rule: { t: "fixed", m: 6, d: 14 },
    blurb: "Commemorates the adoption of the US flag (June 14).",
  },
  {
    slug: "fathers-day",
    name: "Father's Day",
    kind: "observance",
    sort: 17,
    rule: { t: "nth_weekday", n: 3, weekday: "sunday", m: 6 },
    blurb: "US Father's Day falls on the third Sunday of June.",
  },
  {
    slug: "juneteenth",
    name: "Juneteenth",
    kind: "federal",
    sort: 18,
    rule: { t: "fixed", m: 6, d: 19 },
    blurb: "Federal holiday commemorating the end of slavery in the United States.",
  },
  {
    slug: "independence-day",
    name: "Independence Day",
    kind: "federal",
    sort: 19,
    rule: { t: "fixed", m: 7, d: 4 },
    blurb: "US Independence Day — July 4 federal holiday.",
  },
  {
    slug: "labor-day",
    name: "Labor Day",
    kind: "federal",
    sort: 20,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 9 },
    blurb: "US federal holiday on the first Monday of September.",
  },
  {
    slug: "patriot-day",
    name: "Patriot Day",
    kind: "observance",
    sort: 21,
    rule: { t: "fixed", m: 9, d: 11 },
    blurb: "National day of remembrance observed each September 11.",
  },
  {
    slug: "columbus-day",
    name: "Columbus Day",
    kind: "federal",
    sort: 22,
    rule: { t: "nth_weekday", n: 2, weekday: "monday", m: 10 },
    blurb: "Federal holiday on the second Monday of October (also Indigenous Peoples' Day in many places).",
  },
  {
    slug: "halloween",
    name: "Halloween",
    kind: "observance",
    sort: 23,
    rule: { t: "fixed", m: 10, d: 31 },
    blurb: "October 31 observance for costumes, candy, and parties.",
  },
  {
    slug: "veterans-day",
    name: "Veterans Day",
    kind: "federal",
    sort: 24,
    rule: { t: "fixed", m: 11, d: 11 },
    blurb: "Federal holiday honoring military veterans — November 11.",
  },
  {
    slug: "thanksgiving",
    name: "Thanksgiving",
    kind: "federal",
    sort: 25,
    rule: { t: "nth_weekday", n: 4, weekday: "thursday", m: 11 },
    blurb: "US Thanksgiving — fourth Thursday of November.",
  },
  {
    slug: "black-friday",
    name: "Black Friday",
    kind: "observance",
    sort: 26,
    rule: { t: "offset_from", base: "thanksgiving", days: 1 },
    blurb: "Day after Thanksgiving — major shopping observance.",
  },
  {
    slug: "cyber-monday",
    name: "Cyber Monday",
    kind: "observance",
    sort: 27,
    rule: { t: "offset_from", base: "thanksgiving", days: 4 },
    blurb: "Monday after Thanksgiving — online shopping peak.",
  },
  {
    slug: "daylight-savings",
    name: "Daylight Saving Time",
    kind: "observance",
    sort: 28,
    rule: { t: "nth_weekday", n: 2, weekday: "sunday", m: 3 },
    blurb: "US clocks spring forward — second Sunday of March at 2:00 AM local time.",
  },
  {
    slug: "christmas-eve",
    name: "Christmas Eve",
    kind: "observance",
    sort: 29,
    rule: { t: "fixed", m: 12, d: 24 },
    blurb: "Evening before Christmas Day.",
  },
  {
    slug: "christmas-day",
    name: "Christmas Day",
    kind: "federal",
    sort: 30,
    rule: { t: "fixed", m: 12, d: 25 },
    blurb: "Federal holiday observing Christmas Day.",
  },
  {
    slug: "new-years-eve",
    name: "New Year's Eve",
    kind: "observance",
    sort: 31,
    rule: { t: "fixed", m: 12, d: 31 },
    blurb: "Last day of the civil year — countdown and party planning.",
  },
];

/**
 * UK bank holidays + common observances (England/Wales core).
 * Slugs are locale-prefixed so when-is URLs stay unique.
 */
export const UK_HOLIDAY_RULES: HolidayDef[] = [
  {
    slug: "uk-new-years-day",
    name: "New Year's Day",
    kind: "federal",
    sort: 1,
    rule: { t: "fixed", m: 1, d: 1 },
    blurb: "UK public holiday marking the first day of the civil year.",
  },
  {
    slug: "uk-good-friday",
    name: "Good Friday",
    kind: "federal",
    sort: 2,
    rule: { t: "easter_offset", offset: -2 },
    blurb: "UK bank holiday — Friday before Easter Sunday (Gregorian computus).",
  },
  {
    slug: "uk-easter-monday",
    name: "Easter Monday",
    kind: "federal",
    sort: 3,
    rule: { t: "easter_offset", offset: 1 },
    blurb: "UK bank holiday — Monday after Easter Sunday.",
  },
  {
    slug: "uk-early-may-bank-holiday",
    name: "Early May Bank Holiday",
    kind: "federal",
    sort: 4,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 5 },
    blurb: "UK bank holiday on the first Monday of May.",
  },
  {
    slug: "uk-spring-bank-holiday",
    name: "Spring Bank Holiday",
    kind: "federal",
    sort: 5,
    rule: { t: "last_weekday", weekday: "monday", m: 5 },
    blurb: "UK bank holiday on the last Monday of May.",
  },
  {
    slug: "uk-summer-bank-holiday",
    name: "Summer Bank Holiday",
    kind: "federal",
    sort: 6,
    rule: { t: "last_weekday", weekday: "monday", m: 8 },
    blurb: "England & Wales bank holiday on the last Monday of August.",
  },
  {
    slug: "uk-christmas-day",
    name: "Christmas Day",
    kind: "federal",
    sort: 7,
    rule: { t: "fixed", m: 12, d: 25 },
    blurb: "UK public holiday observing Christmas Day.",
  },
  {
    slug: "uk-boxing-day",
    name: "Boxing Day",
    kind: "federal",
    sort: 8,
    rule: { t: "fixed", m: 12, d: 26 },
    blurb: "UK bank holiday on 26 December.",
  },
  {
    slug: "uk-st-georges-day",
    name: "St. George's Day",
    kind: "observance",
    sort: 9,
    rule: { t: "fixed", m: 4, d: 23 },
    blurb: "England's patronal day — not a UK-wide bank holiday.",
  },
  {
    slug: "uk-guy-fawkes-night",
    name: "Guy Fawkes Night",
    kind: "observance",
    sort: 10,
    rule: { t: "fixed", m: 11, d: 5 },
    blurb: "Bonfire Night observance on 5 November.",
  },
  {
    slug: "uk-remembrance-sunday",
    name: "Remembrance Sunday",
    kind: "observance",
    sort: 11,
    rule: { t: "nth_weekday", n: 2, weekday: "sunday", m: 11 },
    blurb: "Second Sunday of November — national remembrance observance.",
  },
  {
    slug: "uk-christmas-eve",
    name: "Christmas Eve",
    kind: "observance",
    sort: 12,
    rule: { t: "fixed", m: 12, d: 24 },
    blurb: "Evening before Christmas Day.",
  },
  {
    slug: "uk-new-years-eve",
    name: "New Year's Eve",
    kind: "observance",
    sort: 13,
    rule: { t: "fixed", m: 12, d: 31 },
    blurb: "Last day of the civil year.",
  },
];

/**
 * Canadian federal + widely observed holidays.
 * Slugs are locale-prefixed so when-is URLs stay unique.
 */
export const CA_HOLIDAY_RULES: HolidayDef[] = [
  {
    slug: "ca-new-years-day",
    name: "New Year's Day",
    kind: "federal",
    sort: 1,
    rule: { t: "fixed", m: 1, d: 1 },
    blurb: "Canadian statutory holiday marking the first day of the civil year.",
  },
  {
    slug: "ca-family-day",
    name: "Family Day",
    kind: "observance",
    sort: 2,
    rule: { t: "nth_weekday", n: 3, weekday: "monday", m: 2 },
    blurb: "Third Monday of February in most provinces (not federal nationwide).",
  },
  {
    slug: "ca-good-friday",
    name: "Good Friday",
    kind: "federal",
    sort: 3,
    rule: { t: "easter_offset", offset: -2 },
    blurb: "Canadian statutory holiday — Friday before Easter Sunday.",
  },
  {
    slug: "ca-easter-monday",
    name: "Easter Monday",
    kind: "observance",
    sort: 4,
    rule: { t: "easter_offset", offset: 1 },
    blurb: "Monday after Easter — observed by many employers; not federal for all.",
  },
  {
    slug: "ca-victoria-day",
    name: "Victoria Day",
    kind: "federal",
    sort: 5,
    rule: { t: "weekday_on_or_before", weekday: "monday", m: 5, d: 24 },
    blurb: "Monday on or before 24 May — Victoria Day federal holiday.",
  },
  {
    slug: "ca-canada-day",
    name: "Canada Day",
    kind: "federal",
    sort: 6,
    rule: { t: "fixed", m: 7, d: 1 },
    blurb: "Federal holiday celebrating Confederation (1 July).",
  },
  {
    slug: "ca-civic-holiday",
    name: "Civic Holiday",
    kind: "observance",
    sort: 7,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 8 },
    blurb: "First Monday of August — common provincial civic holiday (names vary).",
  },
  {
    slug: "ca-labour-day",
    name: "Labour Day",
    kind: "federal",
    sort: 8,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 9 },
    blurb: "Canadian federal holiday on the first Monday of September.",
  },
  {
    slug: "ca-national-day-truth",
    name: "National Day for Truth and Reconciliation",
    kind: "federal",
    sort: 9,
    rule: { t: "fixed", m: 9, d: 30 },
    blurb: "Federal holiday on 30 September (Orange Shirt Day).",
  },
  {
    slug: "ca-thanksgiving",
    name: "Thanksgiving (Canada)",
    kind: "federal",
    sort: 10,
    rule: { t: "nth_weekday", n: 2, weekday: "monday", m: 10 },
    blurb: "Canadian Thanksgiving — second Monday of October (not the US date).",
  },
  {
    slug: "ca-remembrance-day",
    name: "Remembrance Day",
    kind: "federal",
    sort: 11,
    rule: { t: "fixed", m: 11, d: 11 },
    blurb: "Federal holiday observing Remembrance Day on 11 November.",
  },
  {
    slug: "ca-christmas-day",
    name: "Christmas Day",
    kind: "federal",
    sort: 12,
    rule: { t: "fixed", m: 12, d: 25 },
    blurb: "Canadian statutory holiday observing Christmas Day.",
  },
  {
    slug: "ca-boxing-day",
    name: "Boxing Day",
    kind: "federal",
    sort: 13,
    rule: { t: "fixed", m: 12, d: 26 },
    blurb: "Statutory holiday in several provinces on 26 December.",
  },
  {
    slug: "ca-christmas-eve",
    name: "Christmas Eve",
    kind: "observance",
    sort: 14,
    rule: { t: "fixed", m: 12, d: 24 },
    blurb: "Evening before Christmas Day.",
  },
];

export function holidayRulesForLocale(locale: HolidayLocale = "us"): HolidayDef[] {
  if (locale === "uk") return UK_HOLIDAY_RULES;
  if (locale === "ca") return CA_HOLIDAY_RULES;
  return US_HOLIDAY_RULES;
}

/** Legacy FreshCalendars slugs → Fresh canonical slugs */
export const HOLIDAY_SLUG_ALIASES: Record<string, string> = {
  "mlk-day": "martin-luther-king-day",
  "washingtons-birthday": "presidents-day",
};

export function canonicalHolidaySlug(slug: string): string {
  return HOLIDAY_SLUG_ALIASES[slug] ?? slug;
}

export function allHolidayRules(): HolidayDef[] {
  return [...US_HOLIDAY_RULES, ...UK_HOLIDAY_RULES, ...CA_HOLIDAY_RULES];
}

export function holidayLocaleForSlug(slug: string): HolidayLocale {
  const canonical = canonicalHolidaySlug(slug);
  if (canonical.startsWith("uk-")) return "uk";
  if (canonical.startsWith("ca-")) return "ca";
  return "us";
}

export function holidayDefBySlug(slug: string): HolidayDef | undefined {
  const canonical = canonicalHolidaySlug(slug);
  return allHolidayRules().find((h) => h.slug === canonical);
}

export function holidaysHubPath(locale: HolidayLocale): string {
  if (locale === "uk") return "/uk-holidays/";
  if (locale === "ca") return "/canada-holidays/";
  return "/holidays/";
}
