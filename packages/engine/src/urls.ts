import { allHolidayRules, type HolidayLocale } from "./holidays/rules.js";
import { MONTH_SLUGS, monthNumberToSlug, type MonthSlug } from "./months.js";
import { SITE_ORIGIN } from "./site.js";

export type PageKind =
  | "home"
  | "yearly-evergreen"
  | "yearly-fixed"
  | "monthly-evergreen"
  | "monthly-fixed"
  | "blank"
  | "blank-yearly"
  | "holidays-evergreen"
  | "holidays-fixed"
  | "holiday"
  | "easter"
  | "legal"
  | "guide"
  | "sitemap";

export type GuideSlug =
  | "print"
  | "weekly"
  | "school"
  | "monday-start"
  | "classroom"
  | "fiscal"
  | "monday-guide";

export type UrlEntry = {
  pageId: string;
  path: string;
  kind: PageKind;
  month?: MonthSlug;
  year?: number;
  holidaySlug?: string;
  holidayLocale?: HolidayLocale;
  legal?:
    | "contact"
    | "privacy-policy"
    | "terms-of-use"
    | "about"
    | "advertising"
    | "disclosure"
    | "school-holidays"
    | "daylight-savings";
  guide?: GuideSlug;
};

/** Directory URLs (Apache index.html) always end with `/`. File URLs keep their extension. */
export function withDirSlash(path: string): string {
  if (!path || path === "/") return "/";
  const bare = path.split(/[?#]/, 1)[0] ?? path;
  if (/\.[a-z0-9]+$/i.test(bare)) return path;
  return bare.endsWith("/") ? path : `${bare}/`;
}

export function absUrl(path: string): string {
  if (path.startsWith("http")) {
    try {
      const u = new URL(path);
      if (u.origin === SITE_ORIGIN) {
        u.pathname = withDirSlash(u.pathname);
        return u.toString();
      }
    } catch {
      /* keep as-is */
    }
    return path;
  }
  const local = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${withDirSlash(local)}`;
}

export function holidayWhenIsPath(slug: string): string {
  return withDirSlash(`/when-is/${slug}`);
}

export function preservedEvergreenUrls(): UrlEntry[] {
  const months = MONTH_SLUGS.map((month) => ({
    pageId: `month-${month}-evergreen`,
    path: `/${month}-calendars.html`,
    kind: "monthly-evergreen" as const,
    month,
  }));
  const holidays = allHolidayRules().map((h) => ({
    pageId: `holiday-${h.slug}`,
    path: holidayWhenIsPath(h.slug),
    kind: "holiday" as const,
    holidaySlug: h.slug,
  }));
  return [
    { pageId: "home", path: "/", kind: "home" },
    { pageId: "yearly-evergreen", path: "/printable-calendars.html", kind: "yearly-evergreen" },
    {
      pageId: "yearly-next",
      path: "/printable-yearly-calendar.html",
      kind: "yearly-evergreen",
    },
    { pageId: "blank", path: "/blank-calendars.html", kind: "blank" },
    {
      pageId: "blank-yearly",
      path: "/printable-blank-yearly-calendar.html",
      kind: "blank-yearly",
    },
    {
      pageId: "holidays-evergreen",
      path: "/holidays/",
      kind: "holidays-evergreen",
      holidayLocale: "us",
    },
    {
      pageId: "holidays-uk",
      path: "/uk-holidays/",
      kind: "holidays-evergreen",
      holidayLocale: "uk",
    },
    {
      pageId: "holidays-ca",
      path: "/canada-holidays/",
      kind: "holidays-evergreen",
      holidayLocale: "ca",
    },
    {
      pageId: "legal-school-holidays",
      path: "/page/school-holidays/",
      kind: "legal",
      legal: "school-holidays",
    },
    {
      pageId: "legal-daylight-savings",
      path: "/page/daylight-savings/",
      kind: "legal",
      legal: "daylight-savings",
    },
    {
      pageId: "guide-print",
      path: "/print-guide.html",
      kind: "guide",
      guide: "print",
    },
    {
      pageId: "guide-weekly",
      path: "/printable-weekly-calendar.html",
      kind: "guide",
      guide: "weekly",
    },
    {
      pageId: "guide-school",
      path: "/printable-school-calendar.html",
      kind: "guide",
      guide: "school",
    },
    {
      pageId: "guide-monday-start",
      path: "/printable-monday-start-calendar.html",
      kind: "guide",
      guide: "monday-start",
    },
    {
      pageId: "guide-classroom",
      path: "/guides/classroom-printable-calendars.html",
      kind: "guide",
      guide: "classroom",
    },
    {
      pageId: "guide-monday-howto",
      path: "/guides/monday-start-calendar.html",
      kind: "guide",
      guide: "monday-guide",
    },
    {
      pageId: "guide-fiscal",
      path: "/guides/fiscal-year-calendar.html",
      kind: "guide",
      guide: "fiscal",
    },
    ...months,
    ...holidays,
    { pageId: "legal-contact", path: "/page/contact/", kind: "legal", legal: "contact" },
    {
      pageId: "legal-privacy",
      path: "/page/privacy-policy/",
      kind: "legal",
      legal: "privacy-policy",
    },
    {
      pageId: "legal-terms",
      path: "/page/terms-of-use/",
      kind: "legal",
      legal: "terms-of-use",
    },
    { pageId: "legal-about", path: "/page/about/", kind: "legal", legal: "about" },
    {
      pageId: "legal-advertising",
      path: "/page/advertising/",
      kind: "legal",
      legal: "advertising",
    },
    {
      pageId: "legal-disclosure",
      path: "/page/disclosure/",
      kind: "legal",
      legal: "disclosure",
    },
  ];
}

/** Legacy year-qualified twins — redirect targets only; not published in sitemap. */
export function yearQualifiedUrls(year: number): UrlEntry[] {
  const months = MONTH_SLUGS.map((month) => ({
    pageId: `month-${month}-${year}`,
    path: `/${month}-calendars-${year}.html`,
    kind: "monthly-fixed" as const,
    month,
    year,
  }));
  return [
    {
      pageId: `yearly-${year}`,
      path: `/printable-calendars-${year}.html`,
      kind: "yearly-fixed" as const,
      year,
    },
    {
      pageId: `holidays-${year}`,
      path: `/${year}-holidays.html`,
      kind: "holidays-fixed" as const,
      year,
      holidayLocale: "us",
    },
    {
      pageId: `easter-${year}`,
      path: `/when-is/easter-${year}/`,
      kind: "easter" as const,
      year,
      holidaySlug: "easter",
    },
    ...months,
  ];
}

export function monthEvergreenPath(month: number | MonthSlug): string {
  const slug = typeof month === "number" ? monthNumberToSlug(month) : month;
  return `/${slug}-calendars.html`;
}
