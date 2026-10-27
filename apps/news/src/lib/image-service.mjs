import { createRequire } from "node:module";
import defaultService from "astro/assets/services/sharp";

// Use Astro's own Sharp binary; loading two libvips versions can break native builds.
const sharp = createRequire(import.meta.resolve("astro/assets/services/sharp"))("sharp");

const qualities = { low: 25, mid: 50, high: 80, max: 100 };

/** Keep Astro's resizing and quality settings; spend less CPU on AVIF compression. */
export default {
  ...defaultService,
  async transform(input, options, config) {
    if (options.format !== "avif" || (await sharp(input).metadata()).pages > 1) {
      return defaultService.transform(input, options, config);
    }
    // An unquantized PNG carries the existing rotate/resize/fit/background result losslessly.
    const resized = await defaultService.transform(input, { ...options, format: "png", quality: undefined }, config);
    const numeric = Number.parseInt(String(options.quality), 10);
    const quality = Number.isNaN(numeric) ? qualities[options.quality] : numeric;
    const data = await sharp(resized.data).avif({ quality, effort: 2 }).toBuffer();
    return { data, format: "avif" };
  },
};
