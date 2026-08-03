/** Blank undated printable variant ids (generator owns HTML/CSS). */

export const BLANK_VARIANT_IDS = [
  "classic",
  "monday-start",
  "notes",
  "landscape",
  "kids",
] as const;

export type BlankVariantId = (typeof BLANK_VARIANT_IDS)[number];

export const DEFAULT_BLANK_VARIANT: BlankVariantId = "classic";

export const BLANK_VARIANT_META: Record<
  BlankVariantId,
  { label: string; shortLabel: string; description: string }
> = {
  classic: {
    label: "Classic Blank",
    shortLabel: "Classic",
    description: "Undated Sunday-start monthly grid with generous writing space.",
  },
  "monday-start": {
    label: "Monday Start Blank",
    shortLabel: "Mon-start",
    description: "Undated Mon–Sun blank monthly for workweek-first planning.",
  },
  notes: {
    label: "Notes Blank",
    shortLabel: "Notes",
    description: "Undated grid with ruled cells and a wide notes column.",
  },
  landscape: {
    label: "Landscape Blank",
    shortLabel: "Landscape",
    description: "Wide undated landscape monthly for wall or desk use.",
  },
  kids: {
    label: "Kids / Classroom Blank",
    shortLabel: "Kids",
    description: "Larger day boxes for young writers and classroom write-ins.",
  },
};

export function blankVariantAssetPaths(variantId: BlankVariantId): { png: string; pdf: string } {
  return {
    png: `/assets/blank/${variantId}/calendar.png`,
    pdf: `/assets/blank/${variantId}/calendar.pdf`,
  };
}

/** Undated 12-month blank yearly poster. */
export function blankYearlyAssetPaths(): { png: string; pdf: string } {
  return {
    png: "/assets/blank/yearly/classic/calendar.png",
    pdf: "/assets/blank/yearly/classic/calendar.pdf",
  };
}
