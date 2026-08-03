import {
  buildBlankFaq,
  buildMonthlyFaq,
  buildYearlyFaq,
  getMonthEditorial,
} from "../content/monthlyEditorial.js";
import { holidaysForMonth, holidaysForYear, resolveHoliday } from "../holidays/engine.js";
import {
  holidayDefBySlug,
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
}): SeoMeta {
  const url = absUrl(partial.path);
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
        : "blank undated";

  const variants = partial.variants?.map((v) => {
    const pngCdn = toCdn(v.png);
    const pdfCdn = toCdn(v.pdf);
    return {
      ...v,
      png: pngCdn,
      pdf: pdfCdn,
      pngTitle:
        v.pngTitle ??
        `Download ${labelCore} printable calendar PNG — ${v.label} template | ${SITE_NAME}`,
      pdfTitle:
        v.pdfTitle ??
        `Download ${labelCore} printable calendar PDF — ${v.label} template | ${SITE_NAME}`,
    };
  });

  const pngAlt =
    partial.family === "blank"
      ? `Printable blank undated monthly calendar template — ${SITE_NAME}`
      : partial.family === "yearly"
        ? `Printable ${partial.year} year-at-a-glance calendar poster — ${SITE_NAME}`
        : partial.family === "monthly"
          ? `Printable ${labelCore} calendar — ${SITE_NAME}`
          : partial.title;

  const downloadTitles = partial.downloadTitles ?? {
    png: `Download ${labelCore} printable calendar as high-resolution PNG | ${SITE_NAME}`,
    pdf: `Download ${labelCore} printable calendar as print-ready PDF | ${SITE_NAME}`,
  };

  const imageAlts: Record<string, string> = {
    [png]: pngAlt,
    [ogAbs]: `${partial.title} — Open Graph preview image`,
    [ogImagePath]: `${partial.title} — Open Graph preview image`,
  };
  if (variants) {
    for (const v of variants) {
      imageAlts[v.png] = `${pngAlt} — ${v.label} template`;
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
    hreflang: [{ lang: "en", href: url }],
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: partial.title,
      description: partial.description,
      url,
      locale: "en_US",
      images: [
        {
          url: ogAbs,
          width: 1200,
          height: 630,
          alt: `${partial.title} — Open Graph preview image`,
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
      title: `Printable Calendars ${year} · Free Monthly & Year PDFs | ${SITE_NAME}`,
      description: `Fresh Calendars home for ${year}: grab this month’s ${curName} sheet, next month, blank write-ins, and a ${year} year-at-a-glance PDF. US holidays calculated live — six monthly designs, no account.`,
      family: "home",
      year,
      month: curM,
      priority: 1,
      keywords: [
        "printable calendar",
        `printable calendar ${year}`,
        `${year} calendar`,
        "free printable monthly calendar",
        "printable yearly calendar",
        "blank calendar printable",
      ],
      breadcrumbs: [home],
      faq: [
        {
          q: `Are Fresh Calendars ${year} printables really free?`,
          a: `Yes. Monthly and yearly ${year} PNG/PDF downloads are free for personal use — no account and no watermark on the print files.`,
        },
        {
          q: `Which calendar should I download first?`,
          a: `Start with this month's dated monthly page (five template styles), keep a blank undated sheet for scratch planning, and pin the ${year} yearly poster for wall overview.`,
        },
        {
          q: `Do the calendars include US holidays?`,
          a: `Yes. Holidays are calculated dynamically for each year. Use the “US Holidays Marked” monthly template or the holidays list page for federal dates.`,
        },
        {
          q: `Will January pages show the correct year later in ${year}?`,
          a: `Evergreen month URLs always resolve to the next occurrence of that month — so after the month passes, the page rolls forward automatically.`,
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
        ? `${year} Yearly Calendar · Next-Year Poster Hub | ${SITE_NAME}`
        : `${year} Yearly Calendar · Printable Year Overview | ${SITE_NAME}`,
      description: isNext
        ? `Get ahead with Fresh Calendars’ free ${year} yearly poster (PNG & PDF). Five wall formats — classic, landscape, holidays, Monday-start, ink-compact — on our evergreen next-year hub.`
        : `Free ${year} yearly printable from Fresh Calendars (PNG & PDF). Five poster formats, twelve mini-months, accurate ${year} weekdays — current planning-year hub.`,
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
      title: `${name} ${year} Printable Calendar · 6 Free Designs | ${SITE_NAME}`,
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
        { name: `${year} Calendar`, url: absUrl("/printable-calendar.html") },
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
      title: `Blank Calendar Printables · 5 Undated Monthly Sheets | ${SITE_NAME}`,
      description:
        "Fresh Calendars blank month pack — classic, Monday-start, notes, landscape, and kids/classroom undated PNG/PDF sheets you can reuse any month.",
      family: "blank",
      year: null,
      month: null,
      priority: 0.9,
      keywords: [
        "printable blank calendar",
        "blank monthly calendar",
        "undated calendar",
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
      title: `Blank Yearly Calendar · Undated 12-Month Fill-In | ${SITE_NAME}`,
      description:
        "Fresh Calendars undated yearly poster — twelve mini-months to fill by hand (PNG & PDF). Reuse for any year or custom fiscal span.",
      family: "blank",
      year: null,
      month: null,
      priority: 0.85,
      keywords: [
        "blank yearly calendar",
        "undated year at a glance",
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
          a: "No — month names are printed, but day cells are empty so you can fill any year by hand.",
        },
        {
          q: "When should I use blank yearly vs dated yearly?",
          a: "Use blank yearly for reusable posters or custom fiscal spans. Use the dated yearly poster when you want accurate weekdays and US holidays.",
        },
        {
          q: "Can I print a blank monthly instead?",
          a: "Yes — the blank monthly hub has five undated monthly templates including Monday-start and kids/classroom.",
        },
      ],
      download,
      downloadTitles: {
        png: `Download blank yearly undated calendar PNG | ${SITE_NAME}`,
        pdf: `Download blank yearly undated calendar PDF | ${SITE_NAME}`,
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
          ? `${year} US Holiday List · Federal Dates & Observances | ${SITE_NAME}`
          : `${year} ${localeLabel} Holiday List · Public & Bank Dates | ${SITE_NAME}`,
      description:
        locale === "us"
          ? `Fresh Calendars ${year} US holiday list — ${federal.length} federal days plus popular observances${highlight ? ` (Thanksgiving ${highlight.formatted})` : ""}. Each date opens a when-is page and matching month printable.`
          : `Fresh Calendars ${year} ${localeLabel} holiday list — ${federal.length} public/bank holidays plus observances${highlight ? ` (${highlightName} ${highlight.formatted})` : ""}. Every date has its own when-is page.`,
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
          a: `Every date on this page is computed by rules (fixed days, nth weekdays, Easter computus, and relative offsets). Nothing is hand-typed for a single year.`,
        },
        {
          q: `How many holidays are listed for ${year}?`,
          a: `${list.length} holidays for ${localeLabel}: ${federal.length} public/bank (or federal) plus observances.`,
        },
        {
          q: `When is ${highlightName} ${year}?`,
          a: highlight
            ? `${highlightName} ${year} is ${highlight.formatted}.`
            : `${highlightName} ${year} is calculated from the holiday engine rules.`,
        },
        {
          q: `Where can I print a ${year} calendar?`,
          a:
            locale === "us"
              ? `Open any monthly page and choose the US Holidays Marked template — cells are labeled from this same holiday engine.`
              : `Use our dated monthly printables and mark ${localeLabel} holidays by hand, or open each when-is page for the exact date.`,
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
    return baseMeta({
      pageId: entry.pageId,
      path: entry.path,
      title: `${h.name} ${year} Date · ${h.formatted} | ${SITE_NAME}`,
      description: `${h.name} falls on ${h.formatted} in ${year}. ${h.blurb} Fresh Calendars keeps this URL evergreen for the planning year — print ${monthName} with holidays marked.`,
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
        { name: `${year} ${hubLabel}`, url: absUrl(hub) },
        { name: h.name, url: absUrl(holidayWhenIsPath(slug)) },
      ],
      faq: [
        {
          q: `What date is ${h.name} in ${year}?`,
          a: `${h.name} ${year} falls on ${h.formatted}.`,
        },
        {
          q: `How is ${h.name} calculated?`,
          a: h.blurb,
        },
        {
          q: `Which printable calendar should I use for ${h.name} ${year}?`,
          a: `Download the ${monthName} ${year} printable calendar and choose the US Holidays Marked template so the day is labeled in-cell.`,
        },
        {
          q: "Does this page change every year?",
          a: `Yes. ${holidayWhenIsPath(slug)} is evergreen and updates with the planning year automatically.`,
        },
      ],
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
    const guideMeta: Record<
      string,
      { title: string; description: string; faq: SeoMeta["faq"]; keywords: string[] }
    > = {
      print: {
        title: `Print a Calendar Cleanly · Paper, Margins & Ink | ${SITE_NAME}`,
        description: `Fresh Calendars print guide: Letter vs A4, margins, fit-to-page, ink-saver B&W, PDF vs PNG, and common printer fixes so sheets actually fit.`,
        keywords: [
          "how to print a calendar",
          "printable calendar margins",
          "print PDF calendar letter size",
          "ink saver calendar print",
        ],
        faq: [
          {
            q: "What paper size should I use?",
            a: "US Letter (8.5×11 in) is the default for Fresh Calendars downloads. A4 works if you choose “fit to printable area” in your printer dialog.",
          },
          {
            q: "Why is my calendar cut off at the edges?",
            a: "Turn off “fit to page” only if margins are already safe; otherwise enable fit-to-printable-area and disable borderless unless your printer supports it cleanly.",
          },
          {
            q: "Which template uses the least ink?",
            a: "Choose the classic black-and-white monthly template, print in grayscale, and use draft/economy mode for planning drafts.",
          },
        ],
      },
      weekly: {
        title: `Weekly Calendar Printables · 5 Planner Packs | ${SITE_NAME}`,
        description: `Fresh Calendars weekly pack — classic Sunday, Monday-start, hourly, priorities, and habit-tracker PNG/PDFs, plus a current-week grid you can print from the browser.`,
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
            a: "The five PNG/PDF weekly templates are undated write-in sheets you can reuse. The on-page grid shows the current week’s dates and rolls forward when the site rebuilds.",
          },
          {
            q: "Which weekly template should I use?",
            a: "Classic Sunday for general planning, Monday-start for workweeks, hourly for meetings, priorities for focus weeks, and habit tracker for routines.",
          },
          {
            q: "Can I print just this week?",
            a: "Yes — use your browser Print dialog on the weekly page, or download a template PDF for a cleaner sheet.",
          },
        ],
      },
      school: {
        title: `School-Year Calendar Hub · Aug–Jul Printables | ${SITE_NAME}`,
        description: `Fresh Calendars academic hub — August–July overview poster plus Classic B&W and Monday-start month downloads for classrooms, students, and parents.`,
        keywords: [
          "school year calendar printable",
          "academic calendar printable",
          "August to July calendar",
          "classroom printable calendar",
        ],
        faq: [
          {
            q: "Is this an official district school calendar?",
            a: "No — dates are a standard Aug→Jul academic span. Mark your own district breaks, in-service days, and local holidays by hand.",
          },
          {
            q: "What is the school year overview download?",
            a: "A single PNG/PDF poster with twelve mini-months from August through July for the current academic span.",
          },
          {
            q: "Which monthly templates are linked?",
            a: "Each month offers Classic Black & White and Monday-start PDF/PNG downloads, plus the full monthly gallery on each month page.",
          },
        ],
      },
      "monday-start": {
        title: `Monday-Start Monthly Calendars · Mon–Sun Grids | ${SITE_NAME}`,
        description: `Fresh Calendars Monday-start months — Mon–Sun downloads for this month and next, plus links to every evergreen month and a short how-to.`,
        keywords: [
          "monday start calendar",
          "monday start printable calendar",
          "mon sun calendar printable",
          "workweek calendar printable",
        ],
        faq: [
          {
            q: "What is a Monday-start calendar?",
            a: "The first column is Monday and the week ends on Sunday — common for workweeks, schools, and ISO-style planners.",
          },
          {
            q: "Do all months have a Monday-start template?",
            a: "Yes — every monthly page includes a Monday-start PNG/PDF alongside Classic B&W and the other designs.",
          },
          {
            q: "Is there a Monday-start blank template too?",
            a: "Yes — the blank calendar hub includes an undated Monday-start monthly sheet.",
          },
        ],
      },
      classroom: {
        title: `Classroom Calendar Guide · Teacher & Student Prints | ${SITE_NAME}`,
        description: `Fresh Calendars classroom guide — Aug–Jul school overview, kids blanks, weekly habit trackers, and Monday-start months for teachers and parents.`,
        keywords: [
          "classroom printable calendar",
          "teacher calendar printable",
          "student planner printable",
          "school printable calendar",
        ],
        faq: [
          {
            q: "Which calendar should teachers print first?",
            a: "Start with the school-year overview poster, then Classic B&W or Monday-start months for wall and handouts.",
          },
          {
            q: "Are district breaks included?",
            a: "No — mark local breaks by hand. Our engine covers US federal and selected UK/Canada holidays, not every school district.",
          },
        ],
      },
      "monday-guide": {
        title: `Monday-Start vs Sunday-Start · Which Grid to Print | ${SITE_NAME}`,
        description: `Pick Monday-start or Sunday-start on Fresh Calendars — workweeks, schools, ISO weeks, and which downloads to grab first.`,
        keywords: [
          "monday start vs sunday start calendar",
          "how to choose monday start calendar",
          "ISO week printable calendar",
        ],
        faq: [
          {
            q: "Should I use Monday-start or Sunday-start?",
            a: "Prefer Monday-start for workweeks and many classrooms; Sunday-start for US consumer planners and church/weekend-first layouts.",
          },
          {
            q: "Where do I download Monday-start months?",
            a: "Open the Monday-start hub or any monthly page gallery and choose the Monday Start template.",
          },
        ],
      },
      fiscal: {
        title: `Fiscal vs Calendar Year · Which Printable to Use | ${SITE_NAME}`,
        description: `Fresh Calendars guide to fiscal vs calendar years — blank yearly posters, Aug–Jul school hubs, and dated yearly sheets for budgets and academics.`,
        keywords: [
          "fiscal year calendar printable",
          "fiscal vs calendar year",
          "academic year vs calendar year",
          "blank yearly calendar",
        ],
        faq: [
          {
            q: "What is the difference between fiscal and calendar year?",
            a: "A calendar year runs January–December. A fiscal year is any 12-month accounting span (for example July–June or October–September).",
          },
          {
            q: "Which printable should I use for a fiscal year?",
            a: "Use the blank yearly undated poster and label your fiscal months, or chain dated monthly sheets for your span. School hubs cover Aug–Jul specifically.",
          },
        ],
      },
    };
    const gm = guideMeta[g];
    if (!gm) throw new Error(`Unknown guide slug: ${g}`);
    const weeklyPrimary = weeklyVariantAssetPaths(DEFAULT_WEEKLY_VARIANT);
    const blankPrimary = blankVariantAssetPaths(DEFAULT_BLANK_VARIANT);
    const schoolStart = schoolYearStartYear(today);
    const schoolOverview = schoolYearOverviewAssetPaths(schoolStart);
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
      breadcrumbs: [home, { name: gm.title.split("|")[0]!.trim(), url: absUrl(entry.path) }],
      faq: gm.faq,
      download,
      downloadTitles:
        g === "weekly"
          ? {
              png: `Download printable weekly calendar PNG — classic Sunday template | ${SITE_NAME}`,
              pdf: `Download printable weekly calendar PDF — classic Sunday template | ${SITE_NAME}`,
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
        a: "Fresh Calendars is a free printable calendar site — monthly, yearly, weekly, blank, and school-year hubs generated from a live calendar engine with US holidays.",
      },
      {
        q: "Why do month URLs stay the same every year?",
        a: "Evergreen pages always resolve to the next occurrence of that month or the current planning year, so bookmarks stay useful.",
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
    contact: `Reach ${SITE_NAME} about printable calendars, download issues, or licensing — we reply by email.`,
    "privacy-policy": `${SITE_NAME} privacy details: hosting logs, cookies, Google AdSense, contact-form storage, and your ad choices.`,
    "terms-of-use": `${SITE_NAME} terms: personal calendar license, linking rules, disclaimers, and liability limits for free downloads.`,
    about: `What ${SITE_NAME} is: free printables, evergreen URLs, a live US holidays engine, and how monthly/yearly sheets are built.`,
    advertising: `How ads fund ${SITE_NAME}: AdSense units, Auto ads, and privacy controls while calendars stay free.`,
    disclosure: `${SITE_NAME} affiliate disclosure for Amazon Associates and other advertising relationships.`,
    "school-holidays": `${SITE_NAME} school-year guide: August–July planning, month packs, and classroom printables (not district-official).`,
    "daylight-savings": `US daylight saving on ${SITE_NAME}: when clocks spring forward and fall back for the planning year.`,
  };
  return baseMeta({
    pageId: entry.pageId,
    path: entry.path,
    title: `${labels[key]} | ${SITE_NAME}`,
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
