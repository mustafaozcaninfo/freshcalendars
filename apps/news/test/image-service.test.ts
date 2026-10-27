import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import service from "../src/lib/image-service.mjs";
import original from "astro/assets/services/sharp";

const config = { service: { config: {} } } as any;
const sharp = createRequire(import.meta.resolve("astro/assets/services/sharp"))("sharp");
test("AVIF keeps crop, background and dimensions while WebP stays unchanged", async () => {
  const input = await sharp({ create: { width: 240, height: 120, channels: 4, background: { r: 40, g: 140, b: 80, alpha: .5 } } }).png().toBuffer();
  for (const quality of [76, "high", undefined]) {
    const result = await service.transform(input, { format: "avif", width: 80, height: 80, fit: "cover", background: "#ffffff", quality }, config);
    const image = await sharp(result.data).metadata();
    assert.equal(result.format, "avif");
    assert.equal(image.width, 80);
    assert.equal(image.height, 80);
    const { data } = await sharp(result.data).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert(Math.abs(data[0] - 147) < 12 && Math.abs(data[1] - 197) < 12 && Math.abs(data[2] - 167) < 12);
  }
  const options = { format: "webp", width: 90, quality: 76 };
  const a = await service.transform(input, options, config);
  const b = await original.transform(input, options, config);
  assert.deepEqual(a.data, b.data);
});
