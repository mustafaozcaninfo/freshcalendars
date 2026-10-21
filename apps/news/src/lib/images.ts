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

export async function heroImages(src: ImageMetadata): Promise<HeroImages> {
  // The main image feeds og:image, twitter:image and JSON-LD: JPEG, because LinkedIn and some
  // messaging apps drop WebP link previews. Page images and the extra crops stay WebP.
  const main = await getImage({ src, ...HERO_MAIN, fit: "cover", format: "jpg", quality: 82 });
  const crops = await Promise.all(HERO_CROPS.map((c) => getImage({ src, ...c, fit: "cover", format: "webp" })));
  return {
    main: { url: abs(main.src), ...HERO_MAIN, type: "image/jpeg" },
    crops: crops.map((c, i) => ({ url: abs(c.src), ...HERO_CROPS[i]! })),
  };
}
