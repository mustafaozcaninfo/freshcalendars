/** Blank printable variant ids (generator owns HTML/CSS). */

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
    description: "A Sunday-start month with empty date boxes and room to write.",
  },
  "monday-start": {
    label: "Monday Start Blank",
    shortLabel: "Mon-start",
    description: "A blank month that runs Monday to Sunday, for planning around the work week.",
  },
  notes: {
    label: "Notes Blank",
    shortLabel: "Notes",
    description: "A blank month with ruled boxes and a wide notes column.",
  },
  landscape: {
    label: "Landscape Blank",
    shortLabel: "Landscape",
    description: "A wide blank month in landscape, for a wall or a desk.",
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

/** Blank 12-month yearly poster. */
export function blankYearlyAssetPaths(): { png: string; pdf: string } {
  return {
    png: "/assets/blank/yearly/classic/calendar.png",
    pdf: "/assets/blank/yearly/classic/calendar.pdf",
  };
}
