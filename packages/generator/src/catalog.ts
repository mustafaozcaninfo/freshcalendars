/** Printable template catalog — independent designs, not recolors. */

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
export const LANDSCAPE: PrintSize = { width: 1600, height: 1100 };

/** Default / primary download shown in meta.download */
export const DEFAULT_MONTHLY_VARIANT: MonthlyVariantId = "classic-bw";

export const MONTHLY_VARIANTS: MonthlyVariant[] = [
  {
    id: "classic-bw",
    label: "Classic Black & White",
    shortLabel: "Classic B&W",
    description:
      "High-contrast minimal grid for crisp laser or ink-jet printing. Clean sans header, thin rules, no color ink required.",
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
      "Contemporary accent header and weekday strip — still print-friendly with restrained teal/coral ink use.",
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
      "Federal holidays named in-cell with weekend columns tinted — built from the live holiday engine for that year.",
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
      "Oversized day cells with ruled lines plus a wide notes column for handwriting-first monthly planning.",
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
      "Wide landscape sheet with soft seasonal wash and centered typography — a distinct alternate aesthetic, not a recolor.",
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
      "Workweek-first Mon–Sun monthly grid — same crisp print layout as classic, aligned to Monday.",
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

/* ——— Yearly variants ——— */

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
    description: "Portrait year-at-a-glance with soft teal wash — twelve mini-months, holiday tints.",
    templateFile: "classic.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    holidayEmphasis: false,
  },
  {
    id: "landscape-wall",
    label: "Landscape Wall",
    shortLabel: "Landscape",
    description: "Wide landscape poster for wall strips and desk rails — distinct layout, not a recolor.",
    templateFile: "landscape-wall.html",
    size: LANDSCAPE,
    weekStartsOn: 0,
    holidayEmphasis: false,
  },
  {
    id: "holidays",
    label: "Holidays Emphasis",
    shortLabel: "Holidays",
    description: "Portrait yearly with stronger US holiday marks and weekend column cues on mini grids.",
    templateFile: "holidays.html",
    size: PORTRAIT,
    weekStartsOn: 0,
    holidayEmphasis: true,
  },
  {
    id: "monday-start",
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "ISO-style Monday-first mini-months for workweek planning across the year.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
    holidayEmphasis: false,
  },
  {
    id: "ink-compact",
    label: "Ink Compact",
    shortLabel: "Compact",
    description: "Dense black-and-white year grid — maximum contrast, minimal ink, tight typography.",
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

/* ——— Weekly variants (undated printable packs) ——— */

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
    description: "Clean seven-day Sunday-start planner with generous write-in cells.",
    templateFile: "classic-sun.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "monday-start",
    label: "Monday Start Week",
    shortLabel: "Mon-start",
    description: "Workweek-first Mon–Sun grid for office and school planners.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
  },
  {
    id: "hourly",
    label: "Hourly Week",
    shortLabel: "Hourly",
    description: "Seven days with 7am–7pm hour blocks for meetings and appointments.",
    templateFile: "hourly.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "priorities",
    label: "Priorities Planner",
    shortLabel: "Priorities",
    description: "Week grid plus top-three priorities and a wide notes column.",
    templateFile: "priorities.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "habit",
    label: "Habit Tracker Week",
    shortLabel: "Habits",
    description: "Seven-day habit rows with checkbox tracks for routines.",
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

/* ——— Blank undated variants ——— */

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
    description: "Undated Sunday-start monthly grid with generous writing space.",
    templateFile: "classic.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "monday-start",
    label: "Monday Start Blank",
    shortLabel: "Mon-start",
    description: "Undated Mon–Sun blank monthly for workweek-first planning.",
    templateFile: "monday-start.html",
    size: PORTRAIT,
    weekStartsOn: 1,
  },
  {
    id: "notes",
    label: "Notes Blank",
    shortLabel: "Notes",
    description: "Undated grid with ruled cells and a wide notes column.",
    templateFile: "notes.html",
    size: PORTRAIT,
    weekStartsOn: 0,
  },
  {
    id: "landscape",
    label: "Landscape Blank",
    shortLabel: "Landscape",
    description: "Wide undated landscape monthly for wall or desk use.",
    templateFile: "landscape.html",
    size: LANDSCAPE,
    weekStartsOn: 0,
  },
  {
    id: "kids",
    label: "Kids / Classroom Blank",
    shortLabel: "Kids",
    description: "Larger day boxes for young writers and classroom write-ins.",
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
