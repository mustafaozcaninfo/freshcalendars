/**
 * Photographic finish for hero art, applied before the text layer goes on top: bloom on the
 * highlights (lit windows, a glowing pumpkin), a light grade, a vignette and fine film grain.
 * Grain is seeded, so a slug always yields the same bytes and an unchanged hero is not re-uploaded.
 */
import sharp, { type OverlayOptions } from "sharp";

export interface FxOptions {
  seed: string;
  /** 0..1 strength of the glow around highlights. */
  bloom?: number;
  /** Highlights above this level (0..255) feed the bloom. */
  threshold?: number;
  /** 0..1 darkening at the corners. */
  vignette?: number;
  /** Grain amplitude in 8-bit levels. */
  grain?: number;
  saturation?: number;
}

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gray noise centered on mid-gray, for a soft-light blend. */
export function grainLayer(width: number, height: number, amp: number, seed: string): Buffer {
  const r = seeded(seed), buf = Buffer.alloc(width * height);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.max(0, Math.min(255, Math.round(128 + (r() + r() + r() - 1.5) * amp * 1.6)));
  return buf;
}

export async function finish(input: Buffer, o: FxOptions): Promise<Buffer> {
  const base = sharp(input).removeAlpha();
  const { width = 0, height = 0 } = await base.metadata();
  const bloom = o.bloom ?? 0.35, threshold = o.threshold ?? 175, vig = o.vignette ?? 0.28, amp = o.grain ?? 7;
  const layers: OverlayOptions[] = [];
  if (bloom > 0) {
    // Keep only what is brighter than the threshold, blur it wide, scale it down, screen it back.
    const a = 255 / (255 - threshold);
    const glow = await sharp(input).removeAlpha().linear(a, -threshold * a).blur(Math.max(8, width / 90)).linear(bloom, 0).png().toBuffer();
    layers.push({ input: glow, blend: "screen" });
  }
  if (vig > 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" cx=".6" cy=".48" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${vig}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`;
    layers.push({ input: Buffer.from(svg), blend: "over" });
  }
  if (amp > 0) layers.push({ input: grainLayer(width, height, amp, o.seed), raw: { width, height, channels: 1 }, blend: "soft-light" });
  const graded = await base.composite(layers).png().toBuffer();
  return sharp(graded).modulate({ saturation: o.saturation ?? 1.06 }).sharpen({ sigma: 0.55 }).png().toBuffer();
}
