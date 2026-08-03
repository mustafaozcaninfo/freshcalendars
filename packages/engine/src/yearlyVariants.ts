/** Yearly printable variant ids (generator owns HTML/CSS). */

export const YEARLY_VARIANT_IDS = [
  "classic",
  "landscape-wall",
  "holidays",
  "monday-start",
  "ink-compact",
] as const;

export type YearlyVariantId = (typeof YEARLY_VARIANT_IDS)[number];

export const DEFAULT_YEARLY_VARIANT: YearlyVariantId = "classic";

export const YEARLY_VARIANT_META: Record<
  YearlyVariantId,
  { label: string; shortLabel: string; description: string }
> = {
  classic: {
    label: "Classic Year Poster",
    shortLabel: "Classic",
    description: "Portrait year-at-a-glance with holiday tints on mini-months.",
  },
  "landscape-wall": {
    label: "Landscape Wall",
    shortLabel: "Landscape",
    description: "Wide landscape yearly poster for walls and desk rails.",
  },
  holidays: {
    label: "Holidays Emphasis",
    shortLabel: "Holidays",
    description: "Yearly poster with stronger US holiday marks.",
  },
  "monday-start": {
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "Monday-first mini-months for workweek planning.",
  },
  "ink-compact": {
    label: "Ink Compact",
    shortLabel: "Compact",
    description: "Dense black-and-white year grid — minimal ink.",
  },
};

export function yearlyVariantAssetPaths(
  year: number,
  variantId: YearlyVariantId,
): { png: string; pdf: string } {
  return {
    png: `/assets/${year}/yearly/${variantId}/calendar.png`,
    pdf: `/assets/${year}/yearly/${variantId}/calendar.pdf`,
  };
}
