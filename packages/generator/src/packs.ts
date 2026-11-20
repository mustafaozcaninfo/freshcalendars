/**
 * Paid printable packs (cloudflare/products.js, docs/PACKS.md).
 *
 * A pack is the eight free sheets of one month bound into four print-ready PDFs (US Letter or A4,
 * Sunday or Monday start), sold as one download. The single sheets stay free on the page; the pack
 * sells the convenience of one file per paper size and start day.
 *
 * A listed pack with no checkout link yet shows "checkout opens soon" and an OutOfStock offer: data
 * that says a shopper can buy what they cannot is the "misleading structured data" Google's
 * policies name.
 */
import fs from "node:fs/promises";
import { statSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { cdnUrl, monthNumberToName } from "@freshcalendars/engine";
import { esc } from "@freshcalendars/site-chrome";
import { ROOT } from "./paths.js";
import { CARD_STYLES, studioAssets } from "./studio.js";
import { PACKS, packCovers, packDir, packFile } from "../../../cloudflare/products.js";

export type Pack = (typeof PACKS)[number];
const ORG = "https://freshcalendars.com/#organization";
const PAPERS = [["letter", "US Letter"], ["a4", "A4"]] as const;
const STARTS = [["sunday", "Sunday"], ["monday", "Monday"]] as const;

/** `FC_PACK_PREVIEW=1` draws the buy box without a checkout link, for a local look only. */
const preview = () => process.env.FC_PACK_PREVIEW === "1";

/** The pack on sale for this month, if any. */
export function packFor(year: number, month: number): Pack | null {
  const p = PACKS.find((x) => x.year === year && x.month === month);
  return p && (p.listed || p.checkoutUrl || preview()) ? p : null;
}

const usd = (p: Pack) => `$${p.price}`;
const period = (p: Pack) => `${monthNumberToName(p.month)} ${p.year}`;
const sheets = () => CARD_STYLES.length;
/** The files inside the zip, in the order the page lists them. */
export function packContents(p: Pack): { file: string; paper: string; start: string }[] {
  return PAPERS.flatMap(([paper, paperLabel]) => STARTS.map(([start, startLabel]) => ({
    file: `${monthNumberToName(p.month).toLowerCase()}-${p.year}-calendar-${paper}-${start}-start.pdf`, paper: paperLabel, start: startLabel,
  })));
}

export function packDescription(p: Pack): string {
  return `All ${sheets()} ${period(p)} calendar designs in four print-ready PDF files: US Letter and A4, each with a Sunday start and a Monday start. US federal holidays are named on the sheets. Instant download, nothing ships.`;
}

/** The buy box: picture, price, what is inside, the button. */
export function packBoxHtml(p: Pack): string {
  const c = packCovers(p), designs = CARD_STYLES.map((s) => s.label);
  const buy = p.checkoutUrl
    ? `<a class="btn btn-primary pack-buy" href="${esc(p.checkoutUrl)}" rel="nofollow" data-pack="${p.id}" data-price="${p.price}">Buy the pack for ${usd(p)}</a>`
    : `<span class="btn btn-primary pack-buy" aria-disabled="true">Checkout opens soon</span>`;
  return `<section class="pack-box" id="pack" aria-labelledby="pack-title">
  <img class="pack-cover" src="${cdnUrl(c.standard.url)}" alt="The ${sheets()} sheets of the ${esc(p.name)} laid out side by side" title="${esc(p.name)}" width="${c.standard.width}" height="${c.standard.height}" decoding="async">
  <div class="pack-body">
    <h2 id="pack-title">${esc(p.name)}</h2>
    <p class="pack-price"><strong>${usd(p)}</strong> <span>${p.checkoutUrl ? "one payment, instant download" : "one payment; not on sale yet"}</span></p>
    <p>Every ${period(p)} design on this page, bound into four PDF files so one click prints the whole set.</p>
    <ul class="pack-list">
      <li><strong>${sheets()} designs in each file:</strong> ${designs.join(", ")}</li>
      <li><strong>4 PDF files:</strong> US Letter and A4, each with a Sunday start and a Monday start</li>
      <li><strong>${sheets() * 4} pages</strong> of vector PDF, sharp at any print size</li>
      <li>US federal holidays named on the sheets</li>
    </ul>
    ${buy}
    <p class="pack-small">Digital download in a ZIP file${packSizeLabel(p) ? `, about ${packSizeLabel(p)}` : ""}. Nothing ships. Card payment by Stripe. Full refund within ${p.refundDays} days: <a href="#pack-terms">delivery, refunds and license</a>.</p>
    <p class="pack-small">The single sheets below stay free.</p>
  </div>
</section>`;
}

/** Delivery, refund and license terms, on the page so the Product data can point at them. */
export function packTermsHtml(p: Pack): string {
  const files = packContents(p);
  return `<h2 id="pack-terms">${esc(p.name)}: delivery, refunds and license</h2>
<table class="guide-table pack-files"><thead><tr><th>File in the ZIP</th><th>Paper</th><th>Week starts</th><th>Pages</th></tr></thead><tbody>${files.map((f) => `<tr><td>${f.file}</td><td>${f.paper}</td><td>${f.start}</td><td>${sheets()}</td></tr>`).join("")}</tbody></table>
<p><strong>Delivery.</strong> The pack is a digital file. After payment the download page opens right away and Stripe emails the receipt. No physical item is made or shipped, so there is no shipping charge.</p>
<p><strong>Refunds.</strong> Write to <a href="mailto:info@freshcalendars.com">info@freshcalendars.com</a> within ${p.refundDays} days of buying, from the email address on the receipt, and we refund the full ${usd(p)}. You do not have to give a reason and there is nothing to send back.</p>
<p><strong>License.</strong> Print as many copies as you need for home, classroom or office use. The files may not be resold or shared as files; the <a href="/page/terms-of-use/">Terms of Use</a> apply.</p>
<p><strong>Price.</strong> ${usd(p)} in US dollars, charged once. The seller is Fresh Calendars, Inc.</p>`;
}

/**
 * Product data for Google's merchant listing: one Product, one Offer, the seller, and the shipping
 * and return terms the page states. No rating or review: the pack has none.
 */
export function packLd(p: Pack, pageUrl: string): Record<string, unknown> {
  const c = packCovers(p);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#pack`,
    name: p.name,
    description: packDescription(p),
    image: [c.square, c.standard, c.wide].map((i) => cdnUrl(i.url)),
    sku: p.sku,
    category: "Printable calendars",
    brand: { "@type": "Brand", name: "Fresh Calendars" },
    offers: {
      "@type": "Offer",
      url: `${pageUrl}#pack`,
      price: p.price,
      priceCurrency: p.currency,
      priceValidUntil: p.validUntil,
      // Buyable only with a checkout link; until then the page says so and so does the data.
      availability: p.checkoutUrl ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", "@id": ORG, name: "Fresh Calendars" },
      // A download: no charge, no handling or transit time.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: p.currency },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: p.refundDays,
        returnFees: "https://schema.org/FreeReturn",
        refundType: "https://schema.org/FullRefund",
        merchantReturnLink: `${pageUrl}#pack-terms`,
      },
    },
  };
}

/** Tells Google Analytics a checkout began; the link works the same without it. */
export const PACK_JS = `document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-pack]");if(a&&window.gtag)gtag("event","begin_checkout",{currency:"USD",value:Number(a.dataset.price||0),items:[{item_id:a.dataset.pack}]})});`;

// ——— The files ———

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(b: Uint8Array): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]!) & 255]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/**
 * A ZIP with stored (uncompressed) entries: PDFs are compressed already, and a fixed date keeps
 * the file byte-identical from build to build, so the deploy uploads it only when a sheet changed.
 */
export function zipStore(entries: { name: string; data: Uint8Array }[]): Buffer {
  const DATE = ((2026 - 1980) << 9) | (11 << 5) | 20, parts: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8"), crc = crc32(e.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10); local.writeUInt16LE(DATE, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.data.length, 18); local.writeUInt32LE(e.data.length, 22); local.writeUInt16LE(name.length, 26);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(20, 6); head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(0, 12); head.writeUInt16LE(DATE, 14); head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(e.data.length, 20); head.writeUInt32LE(e.data.length, 24); head.writeUInt16LE(name.length, 28); head.writeUInt32LE(offset, 42);
    parts.push(local, name, Buffer.from(e.data)); central.push(head, name);
    offset += 30 + name.length + e.data.length;
  }
  const dir = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, dir, end]);
}

const dist = (p: string) => path.join(ROOT, "dist", p);

/** Size of the built pack for the buy box ("about 7 MB"); empty until the pack is built. */
export function packSizeLabel(p: Pack): string {
  let s: { size: number } | null = null;
  try { s = statSync(dist(packFile(p))); } catch { /* not built yet */ }
  return s ? (s.size >= 1048576 ? `${Math.round(s.size / 1048576)} MB` : `${Math.max(1, Math.round(s.size / 1024))} KB`) : "";
}

function readme(p: Pack): string {
  return [`${p.name}`, "", `Thank you for buying this pack from Fresh Calendars.`, "",
    `Each PDF holds the same ${sheets()} designs, one per page: ${CARD_STYLES.map((s) => s.label).join(", ")}.`, "",
    ...packContents(p).map((f) => `${f.file}: ${f.paper}, week starts on ${f.start}`), "",
    "Printing: choose the file for your paper, print at 100% or \"Fit to printable area\", and pick single pages in the print dialog if you want only some designs. Landscape designs are already turned on their page.", "",
    "License: print as many copies as you need for home, classroom or office use. The files may not be resold or shared as files. Terms: https://freshcalendars.com/page/terms-of-use/", "",
    `Questions or a refund within ${p.refundDays} days: info@freshcalendars.com`, `https://freshcalendars.com/${monthNumberToName(p.month).toLowerCase()}-${p.year}-calendar/`, ""].join("\r\n");
}

/** The cover pictures: the eight sheets on white, in the three shapes Google asks for. */
async function drawCovers(p: Pack) {
  const thumbs = await Promise.all(CARD_STYLES.map(async (s) => `data:image/png;base64,${(await fs.readFile(dist(studioAssets(p.year, p.month, s.id).png))).toString("base64")}`));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const [shape, cols] of [["square", 3], ["standard", 4], ["wide", 4]] as const) {
      const { url, width, height } = packCovers(p)[shape];
      const tiles = thumbs.map((t) => `<div><img src="${t}"></div>`);
      // Three by three leaves one cell: it says what the picture cannot.
      if (cols === 3) tiles.push(`<div class="note"><b>${sheets()} designs</b><span>${period(p)}</span><span>US Letter and A4</span></div>`);
      await page.setViewportSize({ width, height });
      await page.setContent(`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;background:#fff;padding:${shape === "wide" ? 36 : 56}px;display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));grid-template-rows:repeat(${Math.ceil(tiles.length / cols)},minmax(0,1fr));gap:${shape === "wide" ? 24 : 36}px;font-family:Arial,Helvetica,sans-serif}div{min-width:0;min-height:0;display:grid;place-items:center}div{position:relative}img{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;box-shadow:0 6px 22px rgba(20,30,45,.22);border:1px solid #d9dee5;border-radius:4px}.note{align-content:center;gap:14px;color:#16202b;text-align:center}.note b{font-size:64px}.note span{font-size:38px;color:#475569}</style>${tiles.join("")}`, { waitUntil: "load" });
      await fs.writeFile(dist(url), await page.screenshot({ type: "jpeg", quality: 88 }));
    }
  } finally { await browser.close(); }
}

/**
 * Builds every pack that is on sale (or all of them with `all`): four bound PDFs and a note in a
 * ZIP, and the cover pictures. Skipped when the month's sheets have not changed since the last
 * build. Runs after the studio sheets exist (gen.ts).
 */
export async function ensurePacks(opts: { all?: boolean } = {}) {
  for (const p of PACKS) {
    if (!opts.all && !packFor(p.year, p.month)) continue;
    const sources = PAPERS.flatMap(([paper]) => STARTS.map(([start]) => CARD_STYLES.map((s) => dist(studioAssets(p.year, p.month, s.id, paper, start).pdf))));
    const bytes = await Promise.all(sources.map((group) => Promise.all(group.map((f) => fs.readFile(f)))));
    const stampHash = crypto.createHash("sha256").update("pack-v1").update(readme(p));
    for (const b of bytes.flat()) stampHash.update(b);
    const stamp = stampHash.digest("hex"), stampFile = dist(`${packDir(p)}/.stamp`);
    const covers = Object.values(packCovers(p)).map((c) => dist(c.url));
    const have = await Promise.all([dist(packFile(p)), ...covers].map((f) => fs.stat(f).then(() => true, () => false)));
    if (have.every(Boolean) && (await fs.readFile(stampFile, "utf8").catch(() => "")) === stamp) continue;
    await fs.mkdir(dist(packDir(p)), { recursive: true });
    const names = packContents(p), entries: { name: string; data: Uint8Array }[] = [{ name: "READ-ME.txt", data: Buffer.from(readme(p), "utf8") }];
    for (let i = 0; i < bytes.length; i++) {
      // No "modified now" stamp: the same sheets must give the same file.
      const doc = await PDFDocument.create({ updateMetadata: false });
      for (const b of bytes[i]!) { const src = await PDFDocument.load(b); for (const pg of await doc.copyPages(src, src.getPageIndices())) doc.addPage(pg); }
      doc.setTitle(`${period(p)} Calendar, ${sheets()} designs, ${names[i]!.paper}, ${names[i]!.start} start`); doc.setAuthor("Fresh Calendars"); doc.setProducer("Fresh Calendars"); doc.setCreator("Fresh Calendars");
      const fixed = new Date(Date.UTC(2026, 10, 20)); doc.setCreationDate(fixed); doc.setModificationDate(fixed);
      entries.push({ name: names[i]!.file, data: await doc.save() });
    }
    await fs.writeFile(dist(packFile(p)), zipStore(entries));
    await drawCovers(p);
    await fs.writeFile(stampFile, stamp);
    console.log(`packs: built ${p.id} (${packSizeLabel(p)})`);
  }
}
