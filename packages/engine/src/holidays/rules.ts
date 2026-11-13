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
 * All published holidays: dates are always computed (never hardcoded).
 * Adding a row here auto-creates /when-is/{slug}.html + sitemap entry.
 */
export const US_HOLIDAY_RULES: HolidayDef[] = [
  {
    slug: "new-years-day",
    name: "New Year's Day",
    kind: "federal",
    sort: 1,
    rule: { t: "fixed", m: 1, d: 1 },
    blurb: "It is a federal holiday that marks the first day of the year.",
  },
  {
    slug: "martin-luther-king-day",
    name: "Martin Luther King Jr. Day",
    kind: "federal",
    sort: 2,
    rule: { t: "nth_weekday", n: 3, weekday: "monday", m: 1 },
    blurb: "It is a US federal holiday on the third Monday of January.",
  },
  {
    slug: "groundhogs-day",
    name: "Groundhog Day",
    kind: "observance",
    sort: 3,
    rule: { t: "fixed", m: 2, d: 2 },
    blurb: "It is the February 2 folklore day: will the groundhog see its shadow?",
  },
  {
    slug: "valentines-day",
    name: "Valentine's Day",
    kind: "observance",
    sort: 4,
    rule: { t: "fixed", m: 2, d: 14 },
    blurb: "It is a February 14 observance for cards, gifts and a night out.",
  },
  {
    slug: "presidents-day",
    name: "Presidents' Day",
    kind: "federal",
    sort: 5,
    rule: { t: "nth_weekday", n: 3, weekday: "monday", m: 2 },
    blurb: "Its official name is Washington's Birthday, on the third Monday of February.",
  },
  {
    slug: "st-patricks-day",
    name: "St. Patrick's Day",
    kind: "observance",
    sort: 6,
    rule: { t: "fixed", m: 3, d: 17 },
    blurb: "It is a March 17 observance with parades and plenty of green.",
  },
  {
    slug: "ash-wednesday",
    name: "Ash Wednesday",
    kind: "movable",
    sort: 7,
    rule: { t: "easter_offset", offset: -46 },
    blurb: "It opens Lent in Western churches, 46 days before Easter Sunday.",
  },
  {
    slug: "april-fools-day",
    name: "April Fools' Day",
    kind: "observance",
    sort: 8,
    rule: { t: "fixed", m: 4, d: 1 },
    blurb: "It is an April 1 day for jokes and hoaxes, and not a public holiday.",
  },
  {
    slug: "palm-sunday",
    name: "Palm Sunday",
    kind: "movable",
    sort: 9,
    rule: { t: "easter_offset", offset: -7 },
    blurb: "It is the Sunday one week before Easter Sunday.",
  },
  {
    slug: "good-friday",
    name: "Good Friday",
    kind: "movable",
    sort: 10,
    rule: { t: "easter_offset", offset: -2 },
    blurb: "It is the Friday before Easter Sunday, so its date moves with Easter.",
  },
  {
    slug: "easter",
    name: "Easter Sunday",
    kind: "movable",
    sort: 11,
    rule: { t: "easter_offset", offset: 0 },
    blurb: "The date follows the Easter rule of the Gregorian church calendar.",
  },
  {
    slug: "earth-day",
    name: "Earth Day",
    kind: "observance",
    sort: 12,
    rule: { t: "fixed", m: 4, d: 22 },
    blurb: "It is an environmental awareness day observed every April 22.",
  },
  {
    slug: "cinco-de-mayo",
    name: "Cinco de Mayo",
    kind: "observance",
    sort: 13,
    rule: { t: "fixed", m: 5, d: 5 },
    blurb: "It is a May 5 observance that commemorates the Battle of Puebla.",
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    kind: "observance",
    sort: 14,
    rule: { t: "nth_weekday", n: 2, weekday: "sunday", m: 5 },
    blurb: "In the US it falls on the second Sunday of May.",
  },
  {
    slug: "memorial-day",
    name: "Memorial Day",
    kind: "federal",
    sort: 15,
    rule: { t: "last_weekday", weekday: "monday", m: 5 },
    blurb: "It is a US federal holiday on the last Monday of May.",
  },
  {
    slug: "flag-day",
    name: "Flag Day",
    kind: "observance",
    sort: 16,
    rule: { t: "fixed", m: 6, d: 14 },
    blurb: "It commemorates the adoption of the US flag on June 14.",
  },
  {
    slug: "fathers-day",
    name: "Father's Day",
    kind: "observance",
    sort: 17,
    rule: { t: "nth_weekday", n: 3, weekday: "sunday", m: 6 },
    blurb: "In the US it is the third Sunday of June, and not a federal holiday.",
  },
  {
    slug: "juneteenth",
    name: "Juneteenth",
    kind: "federal",
    sort: 18,
    rule: { t: "fixed", m: 6, d: 19 },
    blurb: "It is a US federal holiday on June 19 that recalls Galveston in 1865.",
  },
  {
    slug: "independence-day",
    name: "Independence Day",
    kind: "federal",
    sort: 19,
    rule: { t: "fixed", m: 7, d: 4 },
    blurb: "It is the July 4 US federal holiday.",
  },
  {
    slug: "labor-day",
    name: "Labor Day",
    kind: "federal",
    sort: 20,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 9 },
    blurb: "It is a US federal holiday on the first Monday of September.",
  },
  {
    slug: "patriot-day",
    name: "Patriot Day",
    kind: "observance",
    sort: 21,
    rule: { t: "fixed", m: 9, d: 11 },
    blurb: "It is a national day of remembrance observed each September 11.",
  },
  {
    slug: "columbus-day",
    name: "Columbus Day",
    kind: "federal",
    sort: 22,
    rule: { t: "nth_weekday", n: 2, weekday: "monday", m: 10 },
    blurb: "It is a federal holiday, also Indigenous Peoples' Day in many places.",
  },
  {
    slug: "halloween",
    name: "Halloween",
    kind: "observance",
    sort: 23,
    rule: { t: "fixed", m: 10, d: 31 },
    blurb: "It is the October 31 night of costumes, candy and parties.",
  },
  {
    slug: "veterans-day",
    name: "Veterans Day",
    kind: "federal",
    sort: 24,
    rule: { t: "fixed", m: 11, d: 11 },
    blurb: "It is the November 11 federal holiday that honors military veterans.",
  },
  {
    slug: "thanksgiving",
    name: "Thanksgiving",
    kind: "federal",
    sort: 25,
    rule: { t: "nth_weekday", n: 4, weekday: "thursday", m: 11 },
    blurb: "In the US it is the fourth Thursday of November.",
  },
  {
    slug: "black-friday",
    name: "Black Friday",
    kind: "observance",
    sort: 26,
    rule: { t: "offset_from", base: "thanksgiving", days: 1 },
    blurb: "It is the day after Thanksgiving and a major shopping day.",
  },
  {
    slug: "cyber-monday",
    name: "Cyber Monday",
    kind: "observance",
    sort: 27,
    rule: { t: "offset_from", base: "thanksgiving", days: 4 },
    blurb: "It is the Monday after Thanksgiving, known for online sales.",
  },
  {
    slug: "daylight-savings",
    name: "Daylight Saving Time",
    kind: "observance",
    sort: 28,
    rule: { t: "nth_weekday", n: 2, weekday: "sunday", m: 3 },
    blurb: "Clocks spring forward one hour at 2:00 a.m. on the second Sunday of March.",
  },
  {
    slug: "christmas-eve",
    name: "Christmas Eve",
    kind: "observance",
    sort: 29,
    rule: { t: "fixed", m: 12, d: 24 },
    blurb: "It is the evening before Christmas Day.",
  },
  {
    slug: "christmas-day",
    name: "Christmas Day",
    kind: "federal",
    sort: 30,
    rule: { t: "fixed", m: 12, d: 25 },
    blurb: "It is a federal holiday on December 25.",
  },
  {
    slug: "new-years-eve",
    name: "New Year's Eve",
    kind: "observance",
    sort: 31,
    rule: { t: "fixed", m: 12, d: 31 },
    blurb: "It is the last day of the year, with countdowns at midnight.",
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
    blurb: "It is a UK bank holiday, moved to a weekday when 1 January is a weekend.",
  },
  {
    slug: "uk-good-friday",
    name: "Good Friday",
    kind: "federal",
    sort: 2,
    rule: { t: "easter_offset", offset: -2 },
    blurb: "It is a UK bank holiday on the Friday before Easter Sunday.",
  },
  {
    slug: "uk-easter-monday",
    name: "Easter Monday",
    kind: "federal",
    sort: 3,
    rule: { t: "easter_offset", offset: 1 },
    blurb: "It is a UK bank holiday on the Monday after Easter Sunday.",
  },
  {
    slug: "uk-early-may-bank-holiday",
    name: "Early May Bank Holiday",
    kind: "federal",
    sort: 4,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 5 },
    blurb: "It is a UK bank holiday on the first Monday of May.",
  },
  {
    slug: "uk-spring-bank-holiday",
    name: "Spring Bank Holiday",
    kind: "federal",
    sort: 5,
    rule: { t: "last_weekday", weekday: "monday", m: 5 },
    blurb: "It is a UK bank holiday on the last Monday of May.",
  },
  {
    slug: "uk-summer-bank-holiday",
    name: "Summer Bank Holiday",
    kind: "federal",
    sort: 6,
    rule: { t: "last_weekday", weekday: "monday", m: 8 },
    blurb: "It is the last Monday of August in England, Wales and Northern Ireland.",
  },
  {
    slug: "uk-christmas-day",
    name: "Christmas Day",
    kind: "federal",
    sort: 7,
    rule: { t: "fixed", m: 12, d: 25 },
    blurb: "It is a UK public holiday on 25 December.",
  },
  {
    slug: "uk-boxing-day",
    name: "Boxing Day",
    kind: "federal",
    sort: 8,
    rule: { t: "fixed", m: 12, d: 26 },
    blurb: "It is a UK bank holiday on 26 December.",
  },
  {
    slug: "uk-st-georges-day",
    name: "St. George's Day",
    kind: "observance",
    sort: 9,
    rule: { t: "fixed", m: 4, d: 23 },
    blurb: "It is England's patronal day, and not a UK-wide bank holiday.",
  },
  {
    slug: "uk-guy-fawkes-night",
    name: "Guy Fawkes Night",
    kind: "observance",
    sort: 10,
    rule: { t: "fixed", m: 11, d: 5 },
    blurb: "Bonfire Night on 5 November recalls the failed Gunpowder Plot of 1605.",
  },
  {
    slug: "uk-remembrance-sunday",
    name: "Remembrance Sunday",
    kind: "observance",
    sort: 11,
    rule: { t: "nth_weekday", n: 2, weekday: "sunday", m: 11 },
    blurb: "It is the second Sunday of November, with national Remembrance services.",
  },
  {
    slug: "uk-christmas-eve",
    name: "Christmas Eve",
    kind: "observance",
    sort: 12,
    rule: { t: "fixed", m: 12, d: 24 },
    blurb: "It is the evening before Christmas Day.",
  },
  {
    slug: "uk-new-years-eve",
    name: "New Year's Eve",
    kind: "observance",
    sort: 13,
    rule: { t: "fixed", m: 12, d: 31 },
    blurb: "It is 31 December, Hogmanay in Scotland, and not a bank holiday.",
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
    blurb: "It is a Canadian statutory holiday that marks the first day of the year.",
  },
  {
    slug: "ca-family-day",
    name: "Family Day",
    kind: "observance",
    sort: 2,
    rule: { t: "nth_weekday", n: 3, weekday: "monday", m: 2 },
    blurb: "It is the third Monday of February in most provinces, and not nationwide.",
  },
  {
    slug: "ca-good-friday",
    name: "Good Friday",
    kind: "federal",
    sort: 3,
    rule: { t: "easter_offset", offset: -2 },
    blurb: "It is a Canadian statutory holiday on the Friday before Easter Sunday.",
  },
  {
    slug: "ca-easter-monday",
    name: "Easter Monday",
    kind: "observance",
    sort: 4,
    rule: { t: "easter_offset", offset: 1 },
    blurb: "It is the Monday after Easter, observed by many employers.",
  },
  {
    slug: "ca-victoria-day",
    name: "Victoria Day",
    kind: "federal",
    sort: 5,
    rule: { t: "weekday_on_or_before", weekday: "monday", m: 5, d: 24 },
    blurb: "It is a federal holiday on the Monday on or before 24 May.",
  },
  {
    slug: "ca-canada-day",
    name: "Canada Day",
    kind: "federal",
    sort: 6,
    rule: { t: "fixed", m: 7, d: 1 },
    blurb: "It is the 1 July federal holiday that celebrates Confederation.",
  },
  {
    slug: "ca-civic-holiday",
    name: "Civic Holiday",
    kind: "observance",
    sort: 7,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 8 },
    blurb: "It is the first Monday of August, a civic holiday in many provinces.",
  },
  {
    slug: "ca-labour-day",
    name: "Labour Day",
    kind: "federal",
    sort: 8,
    rule: { t: "nth_weekday", n: 1, weekday: "monday", m: 9 },
    blurb: "It is a Canadian federal holiday on the first Monday of September.",
  },
  {
    slug: "ca-national-day-truth",
    name: "National Day for Truth and Reconciliation",
    kind: "federal",
    sort: 9,
    rule: { t: "fixed", m: 9, d: 30 },
    blurb: "It is the 30 September federal holiday, also known as Orange Shirt Day.",
  },
  {
    slug: "ca-thanksgiving",
    name: "Thanksgiving (Canada)",
    kind: "federal",
    sort: 10,
    rule: { t: "nth_weekday", n: 2, weekday: "monday", m: 10 },
    blurb: "In Canada it is the second Monday of October, weeks before the US date.",
  },
  {
    slug: "ca-remembrance-day",
    name: "Remembrance Day",
    kind: "federal",
    sort: 11,
    rule: { t: "fixed", m: 11, d: 11 },
    blurb: "It is a federal holiday on 11 November.",
  },
  {
    slug: "ca-christmas-day",
    name: "Christmas Day",
    kind: "federal",
    sort: 12,
    rule: { t: "fixed", m: 12, d: 25 },
    blurb: "It is a Canadian statutory holiday on 25 December.",
  },
  {
    slug: "ca-boxing-day",
    name: "Boxing Day",
    kind: "federal",
    sort: 13,
    rule: { t: "fixed", m: 12, d: 26 },
    blurb: "It is 26 December, a statutory holiday in several provinces.",
  },
  {
    slug: "ca-christmas-eve",
    name: "Christmas Eve",
    kind: "observance",
    sort: 14,
    rule: { t: "fixed", m: 12, d: 24 },
    blurb: "It is the evening before Christmas Day.",
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
