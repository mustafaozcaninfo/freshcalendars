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
    description: "Twelve small months on a portrait page, with holidays tinted.",
  },
  "landscape-wall": {
    label: "Landscape Wall",
    shortLabel: "Landscape",
    description: "Twelve months on a wide landscape page, for a wall or a desk.",
  },
  holidays: {
    label: "Holidays Emphasis",
    shortLabel: "Holidays",
    description: "The year on one page with US holidays marked more strongly.",
  },
  "monday-start": {
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "Twelve small months with weeks that run Monday to Sunday.",
  },
  "ink-compact": {
    label: "Ink Compact",
    shortLabel: "Compact",
    description: "A compact black-and-white year that uses little ink.",
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
