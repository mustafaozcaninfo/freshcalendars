/** Hero derivatives shared by the article page, sitemaps and RSS (same URLs everywhere). */
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { SITE_ORIGIN } from "./site";

export const HERO_MAIN = { width: 1344, height: 756 };
export const HERO_CROPS = [
  { width: 1200, height: 675 },
  { width: 1200, height: 900 },
  { width: 1200, height: 1200 },
] as const;

const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_ORIGIN}${u}`);

export interface HeroImages {
  main: { url: string; width: number; height: number; type: string };
  crops: { url: string; width: number; height: number }[];
}

/** Square author avatar for JSON-LD (Person.image) and the byline card. */
export const AUTHOR_IMAGE = { width: 400, height: 400 };
export async function authorImage(src: ImageMetadata): Promise<{ url: string; width: number; height: number }> {
  const img = await getImage({ src, ...AUTHOR_IMAGE, fit: "cover", format: "webp" });
  return { url: abs(img.src), ...AUTHOR_IMAGE };
}

/** Alt text that says the avatar is an illustration, not a photograph. */
export function authorImageAlt(name: string, role: string): string {
  return `Illustrated avatar of ${name}, ${role}`;
}

export async function heroImages(src: ImageMetadata): Promise<HeroImages> {
  const main = await getImage({ src, ...HERO_MAIN, fit: "cover", format: "webp" });
  const crops = await Promise.all(HERO_CROPS.map((c) => getImage({ src, ...c, fit: "cover", format: "webp" })));
  return {
    main: { url: abs(main.src), ...HERO_MAIN, type: "image/webp" },
    crops: crops.map((c, i) => ({ url: abs(c.src), ...HERO_CROPS[i]! })),
  };
}
