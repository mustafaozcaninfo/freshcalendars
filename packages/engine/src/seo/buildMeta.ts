import {
  buildBlankFaq,
  buildMonthlyFaq,
  buildYearlyFaq,
  getMonthEditorial,
} from "../content/monthlyEditorial.js";
import { buildHolidayFaq, getHolidayEditorial } from "../content/holidayEditorial.js";
import { holidaysForMonth, holidaysForYear, resolveHoliday } from "../holidays/engine.js";
import {
  holidayDefBySlug,
  holidayRulesForLocale,
  holidaysHubPath,
  holidayLocaleForSlug,
  type HolidayLocale,
} from "../holidays/rules.js";
import { monthNumberToName, monthSlugToNumber, type MonthSlug } from "../months.js";
import { resolveMonthYear } from "../resolve.js";
import {
  BLANK_VARIANT_IDS,
  BLANK_VARIANT_META,
  DEFAULT_BLANK_VARIANT,
  blankVariantAssetPaths,
  blankYearlyAssetPaths,
} from "../blankVariants.js";
import {
  DEFAULT_MONTHLY_VARIANT,
  MONTHLY_VARIANT_IDS,
  MONTHLY_VARIANT_META,
  monthlyVariantAssetPaths,
} from "../monthlyVariants.js";
import {
  schoolYearOverviewAssetPaths,
  schoolYearStartYear,
} from "../schoolYear.js";
import {
  DEFAULT_WEEKLY_VARIANT,
  WEEKLY_VARIANT_IDS,
  WEEKLY_VARIANT_META,
  weeklyVariantAssetPaths,
} from "../weeklyVariants.js";
import {
  DEFAULT_YEARLY_VARIANT,
  YEARLY_VARIANT_IDS,
  YEARLY_VARIANT_META,
  yearlyVariantAssetPaths,
} from "../yearlyVariants.js";
import { SITE_NAME, SITE_ORIGIN, THEME_COLOR, cdnUrl } from "../site.js";
import { absUrl, holidayWhenIsPath, type UrlEntry } from "../urls.js";
import type { SeoMeta } from "./types.js";

function todayIso(): string {
  return new Date().toISOString();
}

function ogPath(pageId: string): string {
  return `/og/${pageId}.png`;
}

function baseMeta(partial: {
  pageId: string;
  path: string;
  title: string;
  description: string;
  family: SeoMeta["calendar"]["family"];
  year: number | null;
  month: number | null;
  priority: number;
  faq: SeoMeta["faq"];
  breadcrumbs: SeoMeta["breadcrumbs"];
  download?: SeoMeta["download"];
  downloadTitles?: SeoMeta["downloadTitles"];
  variants?: SeoMeta["variants"];
  keywords?: string[];
  hreflang?: SeoMeta["hreflang"];
  ogLocale?: string;
}): SeoMeta {
  const url = absUrl(partial.path);
  partial = { ...partial, title: fitTitle(partial.title) };
  const ogImagePath = ogPath(partial.pageId);
  const ogAbs = cdnUrl(ogImagePath);
  const pngRel =
    partial.download?.png ??
    (partial.year && partial.month
      ? `/assets/${partial.year}/monthly/${monthNumberToName(partial.month).toLowerCase()}/${DEFAULT_MONTHLY_VARIANT}/calendar.png`
      : partial.year
        ? `/assets/${partial.year}/yearly/calendar.png`
        : `/assets/blank/calendar.png`);
  const pdfRel = (partial.download?.pdf ?? pngRel.replace(/\.png$/, ".pdf")).replace(
    /^https?:\/\/[^/]+/,
    "",
  );
  const pngPath = pngRel.replace(/^https?:\/\/[^/]+/, "");
  const png = cdnUrl(pngPath.startsWith("/") ? pngPath : `/${pngPath}`);
  const pdf = cdnUrl(pdfRel.startsWith("/") ? pdfRel : `/${pdfRel}`);

  const toCdn = (p: string) => {
    const rel = p.replace(/^https?:\/\/[^/]+/, "");
    return cdnUrl(rel.startsWith("/") ? rel : `/${rel}`);
  };

  const labelCore =
    partial.year && partial.month
      ? `${monthNumberToName(partial.month)} ${partial.year}`
      : partial.year
        ? `${partial.year} yearly`
        : "blank";

  const variants = partial.variants?.map((v) => {
    const pngCdn = toCdn(v.png);
    const pdfCdn = toCdn(v.pdf);
    return {
      ...v,
      png: pngCdn,
      pdf: pdfCdn,
      pngTitle:
        v.pngTitle ??
        `Download ${labelCore} printable calendar PNG, ${v.label} design | ${SITE_NAME}`,
      pdfTitle:
        v.pdfTitle ??
        `Download ${labelCore} printable calendar PDF, ${v.label} design | ${SITE_NAME}`,
    };
  });

  const pngAlt =
    partial.family === "blank"
      ? `Printable blank monthly calendar template, ${SITE_NAME}`
      : partial.family === "yearly"
        ? `Printable ${partial.year} year-at-a-glance calendar, ${SITE_NAME}`
        : partial.family === "monthly"
          ? `Printable ${labelCore} calendar, ${SITE_NAME}`
          : partial.title;

  const downloadTitles = partial.downloadTitles ?? {
    png: `Download ${labelCore} printable calendar as high-resolution PNG | ${SITE_NAME}`,
    pdf: `Download ${labelCore} printable calendar as print-ready PDF | ${SITE_NAME}`,
  };

  const imageAlts: Record<string, string> = {
    [png]: pngAlt,
    [ogAbs]: `${partial.title}, share image`,
    [ogImagePath]: `${partial.title}, share image`,
  };
  if (variants) {
    for (const v of variants) {
      imageAlts[v.png] = `${pngAlt}, ${v.label} design`;
    }
  }

  return {
    pageId: partial.pageId,
    url,
    canonical: url,
    title: partial.title,
    description: partial.description,
    robots: "index,follow",
    author: SITE_NAME,
    themeColor: THEME_COLOR,
    keywords: partial.keywords,
    hreflang: partial.hreflang ?? [{ lang: "en", href: url }],
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: partial.title,
      description: partial.description,
      url,
      locale: partial.ogLocale ?? "en_US",
      images: [
        {
          url: ogAbs,
          width: 1200,
          height: 630,
          alt: `${partial.title}, share image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: partial.title,
      description: partial.description,
      image: ogAbs,
    },
    jsonLd: ["WebSite", "BreadcrumbList", "ImageObject", "FAQPage"],
    breadcrumbs: partial.breadcrumbs,
    faq: partial.faq,
    download: { pdf, png },
    downloadTitles,
    variants,
    calendar: {
      family: partial.family,
      year: partial.year,
      month: partial.month,
      weekStartsOn: 0,
    },
    sitemap: {
      priority: partial.priority,
      changefreq: "weekly",
      lastmod: todayIso(),
    },
    imageAlts,
    ogImagePath,
  };
}

/** Drop the brand suffix when it would push a title past ~60 characters (SERP truncation). */
function fitTitle(title: string): string {
  const suffix = ` | ${SITE_NAME}`;
  return title.length > 60 && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

const LOCALE_HREFLANG: Record<HolidayLocale, string> = { us: "en-US", uk: "en-GB", ca: "en-CA" };

/**
 * US/UK/Canada versions of the same holiday (same name) are regional
 * alternates of one page, so they point at each other; the US page is x-default.
 */
function holidayHreflang(name: string, slug: string): SeoMeta["hreflang"] | undefined {
  const twins = (["us", "uk", "ca"] as HolidayLocale[]).flatMap((loc) =>
    holidayRulesForLocale(loc)
      .filter((d) => d.name === name && holidayLocaleForSlug(d.slug) === loc)
      .map((d) => ({ loc, slug: d.slug })),
  );
  if (twins.length < 2 || !twins.some((t) => t.slug === slug)) return undefined;
  const links = twins.map((t) => ({ lang: LOCALE_HREFLANG[t.loc], href: absUrl(holidayWhenIsPath(t.slug)) }));
  const fallback = twins.find((t) => t.loc === "us") ?? twins[0]!;
  return [...links, { lang: "x-default", href: absUrl(holidayWhenIsPath(fallback.slug)) }];
}

/**
 * When-is title: the question as searchers type it, then the answer. The longest form that fits
 * ~60 characters wins, so long holiday names keep the question and shorten the date.
 */
function holidayTitle(h: { weekdayName: string; date: Date }, question: string): string {
  const long = h.date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const short = h.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const options = [
    `${question} ${h.weekdayName}, ${long}, ${h.date.getFullYear()}`,
    `${question} ${h.weekdayName}, ${long}`,
    `${question} ${h.weekdayName}, ${short}`,
    `${question} ${short}`,
  ];
  // A name too long for the question form keeps the name and the date.
  const bare = question.replace(/^When Is /, "").replace(/( in the UK| in Canada)?\?$/, "");
  return options.find((t) => t.length <= 60) ?? `${bare}: ${short}`;
}

/** Longest tail that keeps a meta description within the 160-character snippet. */
function fitDescription(head: string, tails: string[]): string {
  for (const tail of tails) {
    const full = `${head} ${tail}`;
    if (full.length <= 160) return full;
  }
  return head;
}

export function buildMetaForEntry(
  entry: UrlEntry,
  resolved: { year: number; month?: number },
  opts: { today?: Date } = {},
): SeoMeta {
  const year = resolved.year;
  const home = { name: "Home", url: `${SITE_ORIGIN}/` };
  const today = opts.today ?? new Date();

  if (entry.kind === "home") {
    const curM = today.getMonth() + 1;
    const curName = monthNumberToName(curM);
    return baseMeta({
      pageId: entry.pageId,
      path: "/",
      // Both years: from autumn on, searchers ask for next year's calendar and the home page serves it too.
      title: `Free Printable Calendars ${year} and ${year + 1} · PDF, No Sign-Up`,
      description: `Free printable calendars for ${year} and ${year + 1}: ${curName} and every month after it, the year on one page, blank and weekly sheets. PDF or PNG, no sign-up.`,
      family: "home",
      year,
      month: curM,
      priority: 1,
      keywords: [
        "printable calendar",
        `printable calendar ${year}`,
        `${year} calendar`,
        `${year + 1} calendar`,
        `printable calendar ${year + 1}`,
        "free printable monthly calendar",
        "printable yearly calendar",
        "blank calendar printable",
      ],
      breadcrumbs: [home],
      faq: [
        {
          q: `Are Fresh Calendars ${year} printables really free?`,
          a: `Yes. Every PDF and PNG is free for personal and classroom use, with no account and no watermark.`,
        },
        {
          q: `Which calendar should I download first?`,
          a: `Start with this month's page, which has seven designs. Add the ${year} yearly calendar for the wall and a blank calendar for anything without fixed dates.`,
        },
        {
          q: `Do the calendars include US holidays?`,
          a: `Yes. Choose the Holidays design on any month page to print US holidays in the date boxes, or open the holidays page for the full list.`,
        },
        {
          q: `Will January pages show the correct year later in ${year}?`,
          a: `Yes. Each month page shows the next occurrence of that month, so once a month ends its page moves on to the following year.`,
        },
      ],
      download: {
        png: yearlyVariantAssetPaths(year, DEFAULT_YEARLY_VARIANT).png,
        pdf: yearlyVariantAssetPaths(year, DEFAULT_YEARLY_VARIANT).pdf,
      },
    });
  }

  if (entry.kind === "yearly-evergreen" || entry.kind === "yearly-fixed") {
    const isNext = entry.pageId === "yearly-next";
    const primary = yearlyVariantAssetPaths(year, DEFAULT_YEARLY_VARIANT);
    const variants = YEARLY_VARIANT_IDS.map((id) => {
      const paths = yearlyVariantAssetPaths(year, id);
      const meta = YEARLY_VARIANT_META[id];
      return {
        id,
        label: meta.label,
        shortLabel: meta.shortLabel,
        description: meta.description,
        png: paths.png,
        pdf: paths.pdf,
      };
    });
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: isNext
        ? `${year} Calendar Printable · Free One-Page Yearly PDF`
        : `${year} Calendar Printable · Free One-Page Yearly PDF`,
      description: isNext
        ? `Free ${year} printable calendar on one page, in PDF and PNG: all twelve months in portrait, landscape, holidays, Monday-start and ink-saving designs.`
        : `Free ${year} calendar on one page, in PDF and PNG: all twelve months in portrait, landscape, holidays, Monday-start and ink-saving designs.`,
      family: "yearly",
      year,
      month: null,
      priority: isNext ? 0.92 : entry.kind === "yearly-evergreen" ? 0.95 : 0.9,
      keywords: [
        `${year} calendar`,
        `printable calendar ${year}`,
        "yearly calendar",
        `${year} year at a glance`,
        ...(isNext ? [`${year} printable calendar`, "next year calendar"] : []),
      ],
      breadcrumbs: [home, { name: `${year} Calendar`, url: absUrl(entry.path) }],
      faq: buildYearlyFaq(year),
      download: primary,
      variants,
    });
  }

  if (entry.kind === "monthly-evergreen" || entry.kind === "monthly-fixed") {
    const month = resolved.month ?? (entry.month ? monthSlugToNumber(entry.month) : 1);
    const name = monthNumberToName(month);
    const slug = entry.month ?? (name.toLowerCase() as MonthSlug);
    const editorial = getMonthEditorial(month);
    const hols = holidaysForMonth(year, month);
    const primary = monthlyVariantAssetPaths(year, slug, DEFAULT_MONTHLY_VARIANT);
    const variants = MONTHLY_VARIANT_IDS.map((id) => {
      const paths = monthlyVariantAssetPaths(year, slug, id);
      const meta = MONTHLY_VARIANT_META[id];
      return {
        id,
        label: meta.label,
        shortLabel: meta.shortLabel,
        description: meta.description,
        png: paths.png,
        pdf: paths.pdf,
      };
    });

    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: `${name} ${year} Calendar · Free Printable PDF, 7 Designs`,
      description: editorial.description(year),
      family: "monthly",
      year,
      month,
      priority: 0.8,
      keywords: [
        `printable ${slug} ${year} calendar`,
        `${name} ${year} calendar`,
        `${name} ${year} calendar printable`,
        `free ${slug} calendar ${year}`,
        "monthly calendar printable",
      ],
      breadcrumbs: [
        home,
        { name: `${year} Calendar`, url: absUrl("/printable-calendars.html") },
        { name: `${name} ${year}`, url: absUrl(entry.path) },
      ],
      faq: buildMonthlyFaq(year, month, hols),
      download: primary,
      variants,
    });
  }

  if (entry.kind === "blank") {
    const primary = blankVariantAssetPaths(DEFAULT_BLANK_VARIANT);
    const variants = BLANK_VARIANT_IDS.map((id) => {
      const paths = blankVariantAssetPaths(id);
      const meta = BLANK_VARIANT_META[id];
      return {
        id,
        label: meta.label,
        shortLabel: meta.shortLabel,
        description: meta.description,
        png: paths.png,
        pdf: paths.pdf,
      };
    });
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: `Blank Calendar Template · Free Printable PDF, 5 Designs`,
      description:
        "Free blank calendar templates to fill in yourself: classic, Monday start, notes, landscape and kids designs. PDF or PNG, Letter or A4, good for any month.",
      family: "blank",
      year: null,
      month: null,
      priority: 0.9,
      keywords: [
        "printable blank calendar",
        "blank monthly calendar",
        "blank calendar template",
        "fill in calendar",
        "monday start blank calendar",
      ],
      breadcrumbs: [home, { name: "Blank Calendar", url: absUrl(entry.path) }],
      faq: buildBlankFaq(),
      download: primary,
      variants,
    });
  }

  if (entry.kind === "blank-yearly") {
    const download = blankYearlyAssetPaths();
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: `Blank Yearly Calendar Printable · Free 12-Month PDF`,
      description:
        "Blank yearly calendar to fill in by hand: twelve empty months on one page, in PDF and PNG. Use it for any year, a school year or a fiscal year.",
      family: "blank",
      year: null,
      month: null,
      priority: 0.85,
      keywords: [
        "blank yearly calendar",
        "blank year at a glance",
        "fill in yearly calendar",
        "printable blank year calendar",
      ],
      breadcrumbs: [
        home,
        { name: "Blank Calendar", url: absUrl("/blank-calendars.html") },
        { name: "Blank Yearly", url: absUrl(entry.path) },
      ],
      faq: [
        {
          q: "Is this blank yearly calendar dated?",
          a: "No. The month names are printed and the day boxes are empty, so you can write in any year.",
        },
        {
          q: "When should I use blank yearly vs dated yearly?",
          a: "Use the blank one for a year that does not start in January, or to reuse the same sheet. Use the dated yearly calendar when you want the weekdays and US holidays printed.",
        },
        {
          q: "Can I print a blank monthly instead?",
          a: "Yes. The blank calendar page has five monthly designs, including a Monday start and a kids sheet.",
        },
      ],
      download,
      downloadTitles: {
        png: `Download blank yearly calendar PNG | ${SITE_NAME}`,
        pdf: `Download blank yearly calendar PDF | ${SITE_NAME}`,
      },
    });
  }

  if (entry.kind === "holidays-evergreen" || entry.kind === "holidays-fixed") {
    const locale: HolidayLocale = entry.holidayLocale ?? "us";
    const list = holidaysForYear(year, { locale });
    const federal = list.filter((h) => h.kind === "federal");
    const localeLabel = locale === "uk" ? "UK" : locale === "ca" ? "Canada" : "US";
    const highlight =
      locale === "uk"
        ? list.find((h) => h.slug === "uk-boxing-day")
        : locale === "ca"
          ? list.find((h) => h.slug === "ca-thanksgiving")
          : list.find((h) => h.slug === "thanksgiving");
    const highlightName =
      locale === "uk" ? "Boxing Day" : locale === "ca" ? "Canadian Thanksgiving" : "Thanksgiving";
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title:
        locale === "us"
          ? `US Federal Holidays ${year} and ${year + 1} · Dates and Weekdays`
          : locale === "uk"
            ? `UK Bank Holidays ${year} and ${year + 1} · Dates and Weekdays`
            : `Canada Statutory Holidays ${year} and ${year + 1} · Dates`,
      description:
        locale === "us"
          ? `US federal holidays for ${year} and ${year + 1}: all ${federal.length} dates with weekdays, plus widely kept observances${highlight ? `, including Thanksgiving on ${highlight.formatted}` : ""}.`
          : `${locale === "uk" ? "UK bank holidays" : "Canada statutory holidays"} for ${year} and ${year + 1}: ${federal.length} dates with weekdays, plus observances${highlight ? `, including ${highlightName} on ${highlight.formatted}` : ""}.`,
      family: "holidays",
      year,
      month: null,
      priority: 0.9,
      keywords:
        locale === "us"
          ? [
              `${year} holidays`,
              `${year} US holidays`,
              `federal holidays ${year}`,
              "when is thanksgiving",
              "holiday calendar",
            ]
          : locale === "uk"
            ? [
                `${year} UK holidays`,
                `${year} bank holidays`,
                "UK bank holidays",
                "when is boxing day UK",
                "UK holiday calendar",
              ]
            : [
                `${year} Canada holidays`,
                `${year} Canadian holidays`,
                "Canada federal holidays",
                "when is Canadian thanksgiving",
                "Canada holiday calendar",
              ],
      breadcrumbs: [home, { name: `${year} ${localeLabel} Holidays`, url: absUrl(entry.path) }],
      faq: [
        {
          q: `How are ${year} ${localeLabel} holiday dates calculated?`,
          a: `Each date is worked out from the rule that sets it: a fixed day, a weekday such as the fourth Thursday of November, or the date of Easter. Nothing is typed in by hand for one year.`,
        },
        {
          q: `How many holidays are listed for ${year}?`,
          a: `${list.length} in all: ${federal.length} ${locale === "us" ? "federal holidays" : "public holidays"} and ${list.length - federal.length} widely kept observances.`,
        },
        {
          q: `When is ${highlightName} ${year}?`,
          a: highlight
            ? `${highlightName} ${year} is ${highlight.formatted}.`
            : `${highlightName} ${year} is listed in the table on this page.`,
        },
        {
          q: `Where can I print a ${year} calendar?`,
          a:
            locale === "us"
              ? `Open any month page and choose the Holidays design. It prints the same dates in the day boxes.`
              : `Print any month page and mark the ${localeLabel} holidays by hand; each holiday in the table links to its date page.`,
        },
      ],
      download: {
        png: yearlyVariantAssetPaths(year, DEFAULT_YEARLY_VARIANT).png,
        pdf: yearlyVariantAssetPaths(year, DEFAULT_YEARLY_VARIANT).pdf,
      },
      downloadTitles: {
        png: `Download printable ${year} yearly calendar PNG | ${SITE_NAME}`,
        pdf: `Download printable ${year} yearly calendar PDF | ${SITE_NAME}`,
      },
    });
  }

  if (entry.kind === "holiday" || entry.kind === "easter") {
    const slug = entry.holidaySlug ?? "easter";
    const def = holidayDefBySlug(slug);
    if (!def) throw new Error(`Unknown holiday slug: ${slug}`);
    const h = resolveHoliday(def, year);
    const monthName = monthNumberToName(h.month);
    const locale = holidayLocaleForSlug(slug);
    const hub = holidaysHubPath(locale);
    const hubLabel =
      locale === "uk" ? "UK Holidays" : locale === "ca" ? "Canada Holidays" : "Holidays";
    const ed = getHolidayEditorial(slug);
    const description = ed
      ? ed.description(h)
      : fitDescription(`${h.name} ${year} falls on ${h.formatted}. ${h.blurb}`, [
          `Free printable ${monthName} ${year} calendar with holidays marked.`,
          `Printable ${monthName} ${year} calendar.`,
        ]);
    // Same-name UK/Canada pages would otherwise share the US title.
    const localeTag =
      locale === "uk" && !/\bUK\b/.test(h.name)
        ? " in the UK"
        : locale === "ca" && !/Canad/.test(h.name)
          ? " in Canada"
          : "";
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: holidayTitle(h, `When Is ${h.name} ${year}${localeTag}?`),
      description,
      hreflang: holidayHreflang(h.name, slug),
      ogLocale: locale === "uk" ? "en_GB" : locale === "ca" ? "en_CA" : undefined,
      family: "holiday",
      year,
      month: h.month,
      priority: 0.75,
      keywords: [
        `when is ${h.name.toLowerCase()} ${year}`,
        `${h.name} ${year}`,
        `${h.name.toLowerCase()} date`,
        `${monthName} ${year} calendar`,
      ],
      breadcrumbs: [
        home,
        { name: hubLabel, url: absUrl(hub) },
        { name: `${h.name} ${year}`, url: absUrl(holidayWhenIsPath(slug)) },
      ],
      faq: buildHolidayFaq(def, h, locale, holidayWhenIsPath(slug)),
      download: {
        png: `/assets/${year}/monthly/${monthName.toLowerCase()}/${DEFAULT_MONTHLY_VARIANT}/calendar.png`,
        pdf: `/assets/${year}/monthly/${monthName.toLowerCase()}/${DEFAULT_MONTHLY_VARIANT}/calendar.pdf`,
      },
      downloadTitles: {
        png: `Download printable ${monthName} ${year} calendar PNG for ${h.name} | ${SITE_NAME}`,
        pdf: `Download printable ${monthName} ${year} calendar PDF for ${h.name} | ${SITE_NAME}`,
      },
    });
  }

  if (entry.kind === "guide") {
    const g = entry.guide ?? "print";
    const schoolStart = schoolYearStartYear(today);
    const schoolOverview = schoolYearOverviewAssetPaths(schoolStart);
    const guideMeta: Record<
      string,
      { title: string; description: string; faq: SeoMeta["faq"]; keywords: string[] }
    > = {
      print: {
        title: `How to Print a Calendar · Paper Size, Margins and Ink`,
        description: `How to print a calendar that fits the page: Letter vs A4, margins, "Actual size" vs "Fit", low-ink black and white, PDF vs PNG, and common printer fixes.`,
        keywords: [
          "how to print a calendar",
          "printable calendar margins",
          "print PDF calendar letter size",
          "ink saver calendar print",
        ],
        faq: [
          {
            q: "What paper size should I use?",
            a: "Use the size in your printer tray. Every calendar has its own US Letter (8.5 × 11 in) and A4 (210 × 297 mm) file, so nothing needs scaling.",
          },
          {
            q: "Why is my calendar cut off at the edges?",
            a: "The printer cannot reach the outer edge of the sheet. Switch the scale from “Actual size” to “Fit” and turn off borderless printing.",
          },
          {
            q: "Which template uses the least ink?",
            a: "The Minimal design: black lines on white with no shading. Print it in grayscale, and in draft mode for a copy you will replace.",
          },
        ],
      },
      weekly: {
        title: `Weekly Calendar Printable · 5 Free Planner Templates`,
        description: `Free weekly calendar printables: Sunday start, Monday start, hourly, priorities and habit tracker layouts in PDF and PNG, plus this week with its dates.`,
        keywords: [
          "printable weekly calendar",
          "weekly planner printable",
          "current week calendar",
          "free weekly calendar PDF",
          "monday start weekly planner",
          "hourly weekly planner",
        ],
        faq: [
          {
            q: "Are the weekly downloads dated?",
            a: "No. The five weekly templates have no dates, so one print works for any week. The grid on the page shows this week with its dates.",
          },
          {
            q: "Which weekly template should I use?",
            a: "Sunday start for a household week, Monday start for a work week, hourly for appointments, priorities for a short task list, and the habit tracker for routines.",
          },
          {
            q: "Can I print just this week?",
            a: "Yes. Print the page from your browser to get this week with its dates, or download a template PDF and write the dates in.",
          },
        ],
      },
      school: {
        title: `School Year Calendar ${schoolOverview.span} · Free Printable PDF`,
        description: `Free ${schoolOverview.span} school year calendar: an August to July overview on one page, plus every month as a PDF in black and white or Monday start.`,
        keywords: [
          "school year calendar printable",
          "academic calendar printable",
          "August to July calendar",
          "classroom printable calendar",
        ],
        faq: [
          {
            q: "Is this an official district school calendar?",
            a: "No. It shows August to July with the correct weekdays. Mark your district’s first day, breaks and teacher work days by hand.",
          },
          {
            q: "What is the school year overview download?",
            a: "One page with twelve small months, August to July, as a PDF and a PNG.",
          },
          {
            q: "Which monthly templates are linked?",
            a: "Each month of the school year has a black-and-white PDF and a Monday-start PDF here, and all seven designs on its own page.",
          },
        ],
      },
      "monday-start": {
        title: `Monday Start Calendar Printable · Free Monthly PDFs`,
        description: `Free Monday start calendars: this month and next month as PDFs with weeks running Monday to Sunday, plus every other month, Letter or A4.`,
        keywords: [
          "monday start calendar",
          "monday start printable calendar",
          "mon sun calendar printable",
          "workweek calendar printable",
        ],
        faq: [
          {
            q: "What is a Monday-start calendar?",
            a: "The first column is Monday and each week ends with Saturday and Sunday together. It is the layout ISO week numbers use.",
          },
          {
            q: "Do all months have a Monday-start template?",
            a: "Yes. Every month page offers a Monday start for all seven designs.",
          },
          {
            q: "Is there a Monday-start blank template too?",
            a: "Yes. The blank calendar page has a Monday-start month with empty date boxes.",
          },
        ],
      },
      classroom: {
        title: `Classroom Calendar Printables · Free for Teachers`,
        description: `Free classroom calendars for teachers: the school year on one page, a blank kids month, weekly trackers, and the weekdays in each month from August to July.`,
        keywords: [
          "classroom printable calendar",
          "teacher calendar printable",
          "student planner printable",
          "school printable calendar",
        ],
        faq: [
          {
            q: "Which calendar should teachers print first?",
            a: "The school year on one page for the wall, then this month in the Minimal design for handouts.",
          },
          {
            q: "Are district breaks included?",
            a: "No. Mark your district’s breaks by hand. The calendars print US holidays only.",
          },
        ],
      },
      "monday-guide": {
        title: `Monday vs Sunday Start Calendar · Which One to Print`,
        description: `Monday start or Sunday start? Where each layout is the norm, how many rows each month needs in both, and free printable months either way.`,
        keywords: [
          "monday start vs sunday start calendar",
          "how to choose monday start calendar",
          "ISO week printable calendar",
        ],
        faq: [
          {
            q: "Should I use Monday-start or Sunday-start?",
            a: "Monday start if you plan around the work or school week. Sunday start if the other calendars you read put Sunday first, as most US calendars do.",
          },
          {
            q: "Where do I download Monday-start months?",
            a: "On the Monday start page, or on any month page by choosing a Monday start before you download.",
          },
        ],
      },
      fiscal: {
        title: `Fiscal Year vs Calendar Year · Dates and Printables`,
        description: `Fiscal year vs calendar year: start and end dates of the US federal fiscal year and the UK tax year, the quarters, and a calendar to print for each.`,
        keywords: [
          "fiscal year calendar printable",
          "fiscal vs calendar year",
          "academic year vs calendar year",
          "blank yearly calendar",
        ],
        faq: [
          {
            q: "What is the difference between fiscal and calendar year?",
            a: "A calendar year runs January 1 to December 31. A fiscal year is any other twelve-month period used for budgets and accounts, such as October to September.",
          },
          {
            q: "Which printable should I use for a fiscal year?",
            a: "Print the blank yearly calendar and write your fiscal months into its twelve boxes, or print the twelve dated months of your year.",
          },
        ],
      },
    };
    const gm = guideMeta[g];
    if (!gm) throw new Error(`Unknown guide slug: ${g}`);
    const weeklyPrimary = weeklyVariantAssetPaths(DEFAULT_WEEKLY_VARIANT);
    const blankPrimary = blankVariantAssetPaths(DEFAULT_BLANK_VARIANT);
    const weeklyVariants =
      g === "weekly"
        ? WEEKLY_VARIANT_IDS.map((id) => {
            const paths = weeklyVariantAssetPaths(id);
            const meta = WEEKLY_VARIANT_META[id];
            return {
              id,
              label: meta.label,
              shortLabel: meta.shortLabel,
              description: meta.description,
              png: paths.png,
              pdf: paths.pdf,
            };
          })
        : undefined;
    const mondayMonth = today.getMonth() + 1;
    const mondaySlug = monthNumberToName(mondayMonth).toLowerCase();
    const mondayDownload = monthlyVariantAssetPaths(
      resolveMonthYear(mondayMonth, today),
      mondaySlug,
      "monday-start",
    );
    const download =
      g === "weekly"
        ? weeklyPrimary
        : g === "school"
          ? { png: schoolOverview.png, pdf: schoolOverview.pdf }
          : g === "monday-start"
            ? mondayDownload
            : blankPrimary;
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: gm.title,
      description: gm.description,
      family: "guide",
      year: year,
      month: null,
      priority: 0.85,
      keywords: gm.keywords,
      breadcrumbs: [home, { name: gm.title.split("|")[0]!.split(" · ")[0]!.trim(), url: absUrl(entry.path) }],
      faq: gm.faq,
      download,
      downloadTitles:
        g === "weekly"
          ? {
              png: `Download printable weekly calendar PNG, Sunday start | ${SITE_NAME}`,
              pdf: `Download printable weekly calendar PDF, Sunday start | ${SITE_NAME}`,
            }
          : g === "school"
            ? {
                png: `Download school year ${schoolOverview.span} overview PNG | ${SITE_NAME}`,
                pdf: `Download school year ${schoolOverview.span} overview PDF | ${SITE_NAME}`,
              }
            : g === "monday-start"
              ? {
                  png: `Download Monday-start monthly calendar PNG | ${SITE_NAME}`,
                  pdf: `Download Monday-start monthly calendar PDF | ${SITE_NAME}`,
                }
              : {
                  png: `Download blank printable calendar PNG | ${SITE_NAME}`,
                  pdf: `Download blank printable calendar PDF | ${SITE_NAME}`,
                },
      variants: weeklyVariants,
    });
  }

  // legal
  const labels = {
    contact: "Contact Fresh Calendars",
    "privacy-policy": "Fresh Calendars Privacy",
    "terms-of-use": "Fresh Calendars Terms",
    about: "About Fresh Calendars",
    advertising: "Advertising on Fresh Calendars",
    disclosure: "Affiliate Disclosure",
    "school-holidays": "School Holiday Planning",
    "daylight-savings": "US Daylight Saving Time",
  } as const;
  const key = entry.legal ?? "contact";
  const legalFaq: Record<string, SeoMeta["faq"]> = {
    contact: [
      {
        q: "How do I reach Fresh Calendars?",
        a: "Send a message with the contact form on this page. We store inquiries securely and reply by email.",
      },
    ],
    "privacy-policy": [
      {
        q: "Does Fresh Calendars sell personal data?",
        a: "No. We do not sell personal information. We use hosting/CDN logs, optional cookies, Google AdSense for free calendars, and store contact-form messages only to reply.",
      },
      {
        q: "How do ads affect my privacy?",
        a: "Google AdSense and partners may use cookies or identifiers to show and measure ads. You can manage ad personalization in Google Ads Settings; see our Privacy Policy for links.",
      },
    ],
    "terms-of-use": [
      {
        q: "Can I redistribute the calendar files?",
        a: "Calendars are free for personal, classroom, and internal non-commercial use. Do not rehost or resell PNG/PDF packs. Link to our .html pages instead.",
      },
      {
        q: "Can I hotlink PDF or PNG files?",
        a: "No. Link to our HTML pages. Direct hotlinking of downloadable assets as a substitute for our pages is not allowed.",
      },
    ],
    about: [
      {
        q: "What is Fresh Calendars?",
        a: "A free printable calendar site: monthly, yearly, weekly, blank and school-year calendars, with US holiday dates worked out for each year.",
      },
      {
        q: "Why do month and when-is URLs stay the same every year?",
        a: "So a bookmark keeps working. A month page moves to next year once the month ends, and a holiday page moves to the next date once the day has passed.",
      },
    ],
    advertising: [
      {
        q: "Why does Fresh Calendars show ads?",
        a: "Google AdSense helps keep printable calendars free. Ads may appear in reserved units and via Auto ads configured in AdSense.",
      },
      {
        q: "How can I control personalized ads?",
        a: "Use Google Ads Settings to manage ad personalization. See our Privacy Policy for cookies and partner details.",
      },
    ],
  };
  const legalDesc: Record<string, string> = {
    contact: `Contact ${SITE_NAME} about printable calendars, broken downloads, or licensing questions. Send a message with the form and we reply by email.`,
    "privacy-policy": `How ${SITE_NAME} handles your data: hosting logs, cookies, Google AdSense, contact-form storage, and the ad choices available to you.`,
    "terms-of-use": `Terms for using ${SITE_NAME}: the personal calendar license, linking rules, disclaimers, and liability limits that apply to our free downloads.`,
    about: `About ${SITE_NAME}: free printable calendars, holiday dates worked out for every year, and how the monthly and yearly sheets are made.`,
    advertising: `How ads fund ${SITE_NAME}: where AdSense units and Auto ads appear and which privacy controls you can use, while calendars stay free to download.`,
    disclosure: `${SITE_NAME} affiliate disclosure: how Amazon Associates and other advertising relationships work on this site and when a link may earn us a commission.`,
    "school-holidays": `Plan school holidays for the August to July year: the federal holidays in term time, the school year on one page and every month to print.`,
    "daylight-savings": `US daylight saving time ${today.getFullYear()} and ${today.getFullYear() + 1}: clocks spring forward the second Sunday of March and fall back the first Sunday of November.`,
  };
  return baseMeta({
    pageId: entry.pageId,
    path: entry.path,
    title:
      key === "daylight-savings"
        ? `Daylight Saving Time ${today.getFullYear()} and ${today.getFullYear() + 1} · US Clock Change Dates`
        : key === "school-holidays"
          ? `School Holidays Calendar · Plan the August to July Year`
          : `${({ "privacy-policy": "Privacy Policy", "terms-of-use": "Terms of Use", contact: "Contact Us" } as Record<string, string>)[key] ?? labels[key]} | ${SITE_NAME}`,
    description: legalDesc[key] ?? `${labels[key]} for ${SITE_NAME}.`,
    family: "legal",
    year: null,
    month: null,
    priority: key === "about" ? 0.5 : key === "advertising" ? 0.4 : key === "school-holidays" || key === "daylight-savings" ? 0.7 : 0.3,
    breadcrumbs: [home, { name: labels[key], url: absUrl(entry.path) }],
    faq: legalFaq[key] ?? [],
  });
}

export function validateSeoMeta(meta: SeoMeta): string[] {
  const errors: string[] = [];
  if (!meta.pageId) errors.push("pageId missing");
  if (!meta.title) errors.push("title missing");
  if (!meta.description) errors.push("description missing");
  if (!meta.canonical.startsWith("https://")) errors.push("canonical must be https");
  if (!meta.openGraph.images[0]) errors.push("og image missing");
  else {
    const img = meta.openGraph.images[0];
    if (img.width !== 1200 || img.height !== 630) errors.push("og image must be 1200x630");
    if (!img.url.includes(meta.pageId) && !meta.ogImagePath.includes(meta.pageId)) {
      errors.push("og image should be page-specific");
    }
  }
  if (!meta.ogImagePath.startsWith("/og/")) errors.push("ogImagePath invalid");
  if (!meta.twitter.image) errors.push("twitter.image missing");
  if (meta.calendar.family === "monthly") {
    if (!meta.variants || meta.variants.length !== 6) {
      errors.push("monthly pages must declare 6 variants");
    }
    if (!meta.faq || meta.faq.length < 3) {
      errors.push("monthly pages need substantial FAQ");
    }
  }
  if (meta.pageId === "blank") {
    if (!meta.variants || meta.variants.length !== 5) {
      errors.push("blank hub must declare 5 variants");
    }
  }
  return errors;
}
