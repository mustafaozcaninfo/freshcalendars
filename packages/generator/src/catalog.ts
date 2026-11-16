/** Printable template catalog: independent designs, not recolors. */

export type PrintSize = { width: number; height: number };

export type MonthlyVariantId =
  | "classic-bw"
  | "color-modern"
  | "holidays"
  | "notes-planner"
  | "landscape-soft"
  | "monday-start";

export type MonthlyVariant = {
  id: MonthlyVariantId;
  label: string;
  shortLabel: string;
  description: string;
  /** HTML file under packages/templates/monthly/ */
  templateFile: string;
  size: PrintSize;
  weekStartsOn: 0 | 1;
  /** Show holiday names inside day cells */
  showHolidayLabels: boolean;
  /** Emphasize weekend columns */
  weekendAccent: boolean;
  /** Extra notes band in markup */
  notesBand: boolean;
};

export const PORTRAIT: PrintSize = { width: 1100, height: 1420 };
/** US Letter on its side (11 x 8.5 in), so a wide sheet fills the page it prints on. */
export const LANDSCAPE: PrintSize = { width: 1600, height: 1236 };

/** Default / primary download shown in meta.download */
export const DEFAULT_MONTHLY_VARIANT: MonthlyVariantId = "classic-bw";

export const MONTHLY_VARIANTS: MonthlyVariant[] = [
  {
    id: "classic-bw",
    label: "Classic Black & White",
    shortLabel: "Classic B&W",
    description:
      "Black ink only: a heavy title, big dates and US holidays named in the boxes. No color ink required.",
    templateFile: "classic-bw.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    showHolidayLabels: false,
    weekendAccent: false,
    notesBand: false,
  },
  {
    id: "color-modern",
    label: "Modern Color",
    shortLabel: "Color",
    description:
      "A blue title band, rounded date boxes and US holidays named in red.",
    templateFile: "color-modern.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    showHolidayLabels: false,
    weekendAccent: false,
    notesBand: false,
  },
  {
    id: "holidays",
    label: "US Holidays Marked",
    shortLabel: "Holidays",
    description:
      "US holidays named in the date boxes and listed below the grid, with the weekend columns tinted.",
    templateFile: "holidays.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    showHolidayLabels: true,
    weekendAccent: true,
    notesBand: false,
  },
  {
    id: "notes-planner",
    label: "Notes Planner",
    shortLabel: "Planner",
    description:
      "Ruled date boxes with big dates, plus a notes column with priorities and next-month lines.",
    templateFile: "notes-planner.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    showHolidayLabels: false,
    weekendAccent: false,
    notesBand: true,
  },
  {
    id: "landscape-soft",
    label: "Landscape Soft",
    shortLabel: "Landscape",
    description:
      "US Letter on its side: a green title band, full weekday names, big dates and US holidays named.",
    templateFile: "landscape-soft.html",
    size: LANDSCAPE,
    weekStartsOn: 0,
    showHolidayLabels: false,
    weekendAccent: false,
    notesBand: false,
  },
  {
    id: "monday-start",
    label: "Monday Start",
    shortLabel: "Mon-start",
    description:
      "The black-and-white layout with weeks that run Monday to Sunday.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
    showHolidayLabels: false,
    weekendAccent: false,
    notesBand: false,
  },
];

export function monthlyVariantById(id: string): MonthlyVariant {
  const v = MONTHLY_VARIANTS.find((x) => x.id === id);
  if (!v) throw new Error(`Unknown monthly variant: ${id}`);
  return v;
}

export function monthlyAssetPaths(
  year: number,
  monthSlug: string,
  variantId: MonthlyVariantId,
): { png: string; pdf: string; pngRel: string; pdfRel: string } {
  const pngRel = `/assets/${year}/monthly/${monthSlug}/${variantId}/calendar.png`;
  const pdfRel = `/assets/${year}/monthly/${monthSlug}/${variantId}/calendar.pdf`;
  return { png: pngRel, pdf: pdfRel, pngRel, pdfRel };
}

/* Yearly variants */

export type YearlyVariantId =
  | "classic"
  | "landscape-wall"
  | "holidays"
  | "monday-start"
  | "ink-compact";

export type YearlyVariant = {
  id: YearlyVariantId;
  label: string;
  shortLabel: string;
  description: string;
  templateFile: string;
  size: PrintSize;
  weekStartsOn: 0 | 1;
  holidayEmphasis: boolean;
};

export const DEFAULT_YEARLY_VARIANT: YearlyVariantId = "classic";

export const YEARLY_VARIANTS: YearlyVariant[] = [
  {
    id: "classic",
    label: "Classic Year Poster",
    shortLabel: "Classic",
    description: "Twelve months with large dates on a portrait page, US holidays ringed in red.",
    templateFile: "classic.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    holidayEmphasis: false,
  },
  {
    id: "landscape-wall",
    label: "Landscape Wall",
    shortLabel: "Landscape",
    description: "Twelve months on a wide landscape page, for a wall or a desk.",
    templateFile: "landscape-wall.html",
    size: LANDSCAPE,
    weekStartsOn: 0,
    holidayEmphasis: false,
  },
  {
    id: "holidays",
    label: "Holidays Emphasis",
    shortLabel: "Holidays",
    description: "The year on one page with US holidays in red circles and the weekend columns tinted.",
    templateFile: "holidays.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    holidayEmphasis: true,
  },
  {
    id: "monday-start",
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "Twelve small months with weeks that run Monday to Sunday.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
    holidayEmphasis: false,
  },
  {
    id: "ink-compact",
    label: "Ink Compact",
    shortLabel: "Compact",
    description: "A black-and-white year in twelve boxes, holidays ringed, light on ink.",
    templateFile: "ink-compact.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    holidayEmphasis: false,
  },
];

export function yearlyVariantById(id: string): YearlyVariant {
  const v = YEARLY_VARIANTS.find((x) => x.id === id);
  if (!v) throw new Error(`Unknown yearly variant: ${id}`);
  return v;
}

export function yearlyAssetPaths(
  year: number,
  variantId: YearlyVariantId,
): { png: string; pdf: string } {
  return {
    png: `/assets/${year}/yearly/${variantId}/calendar.png`,
    pdf: `/assets/${year}/yearly/${variantId}/calendar.pdf`,
  };
}

/* Weekly variants (sheets with no dates) */

export type WeeklyVariantId =
  | "classic-sun"
  | "monday-start"
  | "hourly"
  | "priorities"
  | "habit";

export type WeeklyVariant = {
  id: WeeklyVariantId;
  label: string;
  shortLabel: string;
  description: string;
  templateFile: string;
  size: PrintSize;
  weekStartsOn: 0 | 1;
};

export const DEFAULT_WEEKLY_VARIANT: WeeklyVariantId = "classic-sun";

export const WEEKLY_VARIANTS: WeeklyVariant[] = [
  {
    id: "classic-sun",
    label: "Classic Sunday Week",
    shortLabel: "Classic",
    description: "Seven days, Sunday first, with room to write in each.",
    templateFile: "classic-sun.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "monday-start",
    label: "Monday Start Week",
    shortLabel: "Mon-start",
    description: "Seven days, Monday first, for a work or school week.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
  },
  {
    id: "hourly",
    label: "Hourly Week",
    shortLabel: "Hourly",
    description: "Seven days with hour rows from 7 a.m. to 7 p.m. for appointments.",
    templateFile: "hourly.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "priorities",
    label: "Priorities Planner",
    shortLabel: "Priorities",
    description: "A week with a top-three priorities box and a notes column.",
    templateFile: "priorities.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "habit",
    label: "Habit Tracker Week",
    shortLabel: "Habits",
    description: "Rows of habits with a checkbox for each day of the week.",
    templateFile: "habit.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
];

export function weeklyVariantById(id: string): WeeklyVariant {
  const v = WEEKLY_VARIANTS.find((x) => x.id === id);
  if (!v) throw new Error(`Unknown weekly variant: ${id}`);
  return v;
}

export function weeklyAssetPaths(variantId: WeeklyVariantId): { png: string; pdf: string } {
  return {
    png: `/assets/weekly/${variantId}/calendar.png`,
    pdf: `/assets/weekly/${variantId}/calendar.pdf`,
  };
}

/* Blank variants */

export type BlankVariantId =
  | "classic"
  | "monday-start"
  | "notes"
  | "landscape"
  | "kids";

export type BlankVariant = {
  id: BlankVariantId;
  label: string;
  shortLabel: string;
  description: string;
  templateFile: string;
  size: PrintSize;
  weekStartsOn: 0 | 1;
};

export const DEFAULT_BLANK_VARIANT: BlankVariantId = "classic";

export const BLANK_VARIANTS: BlankVariant[] = [
  {
    id: "classic",
    label: "Classic Blank",
    shortLabel: "Classic",
    description: "A Sunday-start month with lines for the month and year and a number box in every day.",
    templateFile: "classic.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "monday-start",
    label: "Monday Start Blank",
    shortLabel: "Mon-start",
    description: "A blank month that runs Monday to Sunday, for planning around the work week.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
  },
  {
    id: "notes",
    label: "Notes Blank",
    shortLabel: "Notes",
    description: "A blank month with ruled boxes and a wide notes column.",
    templateFile: "notes.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "landscape",
    label: "Landscape Blank",
    shortLabel: "Landscape",
    description: "A wide blank month in landscape, for a wall or a desk.",
    templateFile: "landscape.html",
    size: LANDSCAPE,
    weekStartsOn: 0,
  },
  {
    id: "kids",
    label: "Kids / Classroom Blank",
    shortLabel: "Kids",
    description: "Thick lines and big number boxes for young writers and classroom write-ins.",
    templateFile: "kids.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
];

export function blankVariantById(id: string): BlankVariant {
  const v = BLANK_VARIANTS.find((x) => x.id === id);
  if (!v) throw new Error(`Unknown blank variant: ${id}`);
  return v;
}

export function blankAssetPaths(variantId: BlankVariantId): { png: string; pdf: string } {
  return {
    png: `/assets/blank/${variantId}/calendar.png`,
    pdf: `/assets/blank/${variantId}/calendar.pdf`,
  };
}

export function blankYearlyAssetPaths(): { png: string; pdf: string } {
  return {
    png: "/assets/blank/yearly/classic/calendar.png",
    pdf: "/assets/blank/yearly/classic/calendar.pdf",
  };
}

export function schoolOverviewAssetPaths(startYear: number): {
  png: string;
  pdf: string;
  span: string;
} {
  const span = `${startYear}-${startYear + 1}`;
  return {
    span,
    png: `/assets/school/${span}/overview/calendar.png`,
    pdf: `/assets/school/${span}/overview/calendar.pdf`,
  };
}
