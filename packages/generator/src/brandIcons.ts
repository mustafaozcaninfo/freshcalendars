/**
 * Fresh Calendars brand icons — calendar page + binding rings.
 * Palette: green #007b48, mint #a4cfba, navy #0e2135, white.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { SITE_NAME, SITE_ORIGIN, THEME_COLOR } from "@freshcalendars/engine";
import { DIST_SITE } from "./paths.js";

const INK = "#0e2135";
const PAPER = "#ffffff";
const RED = "#007b48";
const BLUE = "#007b48";
const GOLD = "#a4cfba";
const RING = "#dcebe4";
const MUTED_DOT = "#527f99";

/** Full-color master (512). Reads clearly from 180px down to ~32px. */
export function brandIconSvg(size = 512): string {
  const s = size;
  const r = Math.round(s * 0.1875); // ~96 @512
  const pageX = Math.round(s * 0.156);
  const pageY = Math.round(s * 0.219);
  const pageW = Math.round(s * 0.688);
  const pageH = Math.round(s * 0.625);
  const pageR = Math.round(s * 0.07);
  const headH = Math.round(s * 0.172);
  const ringW = Math.round(s * 0.07);
  const ringH = Math.round(s * 0.14);
  const ringY = Math.round(s * 0.141);
  const ringR = Math.round(ringW / 2);
  const leftRingX = Math.round(s * 0.297);
  const rightRingX = Math.round(s * 0.633);
  const gridY = Math.round(s * 0.445);
  const cell = Math.round(s * 0.078);
  const gap = Math.round(s * 0.055);
  const startX = Math.round(s * 0.27);

  const dots: string[] = [];
  const colors = [
    [BLUE, BLUE, BLUE],
    [RED, MUTED_DOT, GOLD],
  ];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = startX + col * (cell + gap) + cell / 2;
      const cy = gridY + row * (cell + gap) + cell / 2;
      const fill = colors[row]![col]!;
      dots.push(
        `<rect x="${(cx - cell / 2).toFixed(1)}" y="${(cy - cell / 2).toFixed(1)}" width="${cell}" height="${cell}" rx="${Math.round(cell * 0.28)}" fill="${fill}"/>`,
      );
    }
  }

  const headBottom = pageY + headH;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" role="img" aria-label="${SITE_NAME}">
  <rect width="${s}" height="${s}" rx="${r}" fill="${INK}"/>
  <rect x="${leftRingX}" y="${ringY}" width="${ringW}" height="${ringH}" rx="${ringR}" fill="${RING}"/>
  <rect x="${rightRingX}" y="${ringY}" width="${ringW}" height="${ringH}" rx="${ringR}" fill="${RING}"/>
  <rect x="${pageX}" y="${pageY}" width="${pageW}" height="${pageH}" rx="${pageR}" fill="${PAPER}"/>
  <rect x="${pageX}" y="${pageY}" width="${pageW}" height="${headH}" rx="${pageR}" fill="${RED}"/>
  <rect x="${pageX}" y="${headBottom - pageR}" width="${pageW}" height="${pageR}" fill="${RED}"/>
  ${dots.join("\n  ")}
</svg>`;
}

/** Safari pinned-tab / mask-icon — single silhouette, no fills beyond black. */
export function safariPinnedTabSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path fill="#000" d="M3.2 2.6h2v1.2h5.6V2.6h2v1.2H14v10.2c0 .7-.5 1.2-1.2 1.2H3.2c-.7 0-1.2-.5-1.2-1.2V3.8h1.2V2.6zm-.2 3.2v7.6c0 .1 0 .2.2.2h9.6c.1 0 .2-.1.2-.2V5.8H3zM5 7.2h1.4v1.4H5V7.2zm2.4 0H8.8v1.4H7.4V7.2zm2.4 0H11.2v1.4H9.8V7.2zM5 9.6h1.4V11H5V9.6zm2.4 0H8.8V11H7.4V9.6zm2.4 0H11.2V11H9.8V9.6z"/>
</svg>`;
}

async function writePngFromSvg(svg: string, outPath: string, size: number): Promise<void> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "fill" })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  await fs.writeFile(outPath, buf);
}

/** Maskable: full-bleed ink + mark inset to ~72% safe zone. */
async function writeMaskablePng(masterSvg: string, outPath: string, size: number): Promise<void> {
  const inset = Math.round(size * 0.72);
  const mark = await sharp(Buffer.from(masterSvg))
    .resize(inset, inset, { fit: "fill" })
    .png()
    .toBuffer();
  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: INK,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buf);
}

/** Minimal ICO (PNG payloads) for 16 + 32. */
function icoFromPngs(pngs: { size: number; data: Buffer }[]): Buffer {
  const count = pngs.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries: Buffer[] = [];
  const payloads: Buffer[] = [];
  for (const p of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(p.size >= 256 ? 0 : p.size, 0);
    entry.writeUInt8(p.size >= 256 ? 0 : p.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(p.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(p.data);
    offset += p.data.length;
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  return Buffer.concat([header, ...entries, ...payloads]);
}

export function siteWebManifest(): string {
  return `${JSON.stringify(
    {
      name: SITE_NAME,
      short_name: "Fresh",
      description:
        "Free printable monthly, weekly, yearly, and blank calendars with accurate weekdays and US holidays.",
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "any",
      background_color: "#e8eef3",
      theme_color: THEME_COLOR,
      lang: "en-US",
      categories: ["productivity", "utilities"],
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-maskable-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    null,
    2,
  )}\n`;
}

export function browserConfigXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icons/mstile-150x150.png"/>
      <TileColor>${THEME_COLOR}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
}

export { brandHeadLinks } from "@freshcalendars/site-chrome";

export async function writeBrandIcons(): Promise<void> {
  const master = brandIconSvg(512);
  const pinned = safariPinnedTabSvg();

  await fs.mkdir(path.join(DIST_SITE, "icons"), { recursive: true });
  await fs.writeFile(path.join(DIST_SITE, "favicon.svg"), `${master}\n`, "utf8");
  await fs.writeFile(path.join(DIST_SITE, "safari-pinned-tab.svg"), `${pinned}\n`, "utf8");
  const manifest = siteWebManifest();
  await fs.writeFile(path.join(DIST_SITE, "site.webmanifest"), manifest, "utf8");
  // Alias — some crawlers/tools still request the generic name
  await fs.writeFile(path.join(DIST_SITE, "manifest.webmanifest"), manifest, "utf8");
  await fs.writeFile(path.join(DIST_SITE, "browserconfig.xml"), browserConfigXml(), "utf8");

  const pngJobs: { file: string; size: number }[] = [
    { file: "favicon-16x16.png", size: 16 },
    { file: "favicon-32x32.png", size: 32 },
    { file: "apple-touch-icon.png", size: 180 },
    { file: "icons/apple-touch-icon-152x152.png", size: 152 },
    { file: "icons/apple-touch-icon-167x167.png", size: 167 },
    { file: "icons/icon-192.png", size: 192 },
    { file: "icons/icon-512.png", size: 512 },
    { file: "icons/mstile-150x150.png", size: 150 },
  ];

  for (const job of pngJobs) {
    await writePngFromSvg(master, path.join(DIST_SITE, job.file), job.size);
  }
  await writeMaskablePng(master, path.join(DIST_SITE, "icons/icon-maskable-192.png"), 192);
  await writeMaskablePng(master, path.join(DIST_SITE, "icons/icon-maskable-512.png"), 512);

  const png16 = await sharp(Buffer.from(master)).resize(16, 16).png().toBuffer();
  const png32 = await sharp(Buffer.from(master)).resize(32, 32).png().toBuffer();
  const png48 = await sharp(Buffer.from(master)).resize(48, 48).png().toBuffer();
  await fs.writeFile(
    path.join(DIST_SITE, "favicon.ico"),
    icoFromPngs([
      { size: 16, data: png16 },
      { size: 32, data: png32 },
      { size: 48, data: png48 },
    ]),
  );

  await fs.writeFile(
    path.join(DIST_SITE, "icons/README.txt"),
    `${SITE_NAME} icons — generated at build from brandIcons.ts
Master: blue tile, red header, gold rings (Fresh brand)
Site: ${SITE_ORIGIN}
`,
    "utf8",
  );

  console.log("brand icons: favicon + apple-touch + PWA set written");
}
