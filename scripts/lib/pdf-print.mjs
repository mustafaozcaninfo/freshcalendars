/**
 * Print checks for the built printable PDFs (news-seo-audit's 10-PDF-* checks). The generators run
 * the same rules on the HTML before printing (packages/generator/src/printCheck.ts); this reads the
 * PDF that ships, so a sheet made any other way is held to them too.
 * - page: US Letter (612 x 792 pt, either way up); A4 or tabloid only when the file name says so
 * - fonts: every font embedded (the build's own top link uses standard Helvetica-Bold)
 * - vector: no raster images, so the sheet stays sharp and small
 * - safe area: no text closer than 12 pt (1/6 in) to an edge, where home printers cut it off
 * - overlap: no two lines of text printed on top of each other (a note under the footer, a link on a badge)
 * - text: the first page has extractable text, including the top link (heading vs download title is a warning)
 * PDF_LEGACY lists files made before these rules by a tool outside the repo; they skip the font rule
 * until someone regenerates them.
 */
import { readFile } from "node:fs/promises";
import { PDFDocument, PDFDict, PDFName, PDFRawStream } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const EDGE_PT = 12;
const LINK_TEXT = "freshcalendars.com";
const SIZES = { letter: [612, 792], a4: [595.28, 841.89], tabloid: [792, 1224] };
/** Path prefix (under downloads/) → why its fonts are not embedded. Shrink this list; never grow it. */
export const PDF_LEGACY = {
  "nfl-2026-2027/": "drawn outside the repo's generators (standard Helvetica not embedded, Arial Narrow); regenerate through renderPrintables",
};
const STOP = new Set(["the", "and", "for", "with", "from", "your", "pdf", "printable", "free", "ink", "saver", "version", "of", "a", "an", "to", "in", "on", "by", "at", "or", "vs"]);

/** The page size a file name allows: `-a4` and `-tabloid` opt out of US Letter. */
const sizeFor = (file) => (/-a4\b/.test(file) ? SIZES.a4 : /-tabloid\b/.test(file) ? SIZES.tabloid : SIZES.letter);
const fits = ([w, h], [a, b]) => (Math.abs(w - a) <= 1.5 && Math.abs(h - b) <= 1.5) || (Math.abs(w - b) <= 1.5 && Math.abs(h - a) <= 1.5);

/** Fonts without an embedded program, and the number of raster images, from the object table. */
function objects(doc) {
  const loose = new Set();
  let images = 0;
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    const dict = obj instanceof PDFRawStream ? obj.dict : obj instanceof PDFDict ? obj : null;
    if (!dict) continue;
    const type = dict.get(PDFName.of("Type"))?.toString(), sub = dict.get(PDFName.of("Subtype"))?.toString();
    if (sub === "/Image") images++;
    if (type !== "/Font" || sub === "/Type0" || sub === "/Type3") continue;
    const fd = dict.lookup(PDFName.of("FontDescriptor"));
    const embedded = fd instanceof PDFDict && ["FontFile", "FontFile2", "FontFile3"].some((k) => fd.has(PDFName.of(k)));
    const name = dict.get(PDFName.of("BaseFont"))?.toString() ?? "?";
    if (!embedded && name !== "/Helvetica-Bold") loose.add(name.replace(/^\//, ""));
  }
  return { loose: [...loose], images };
}

/** Text runs of one page as boxes in PDF points (origin bottom left). Rotated runs are skipped. */
async function runs(page) {
  const tc = await page.getTextContent();
  const out = [];
  for (const it of tc.items) {
    if (!it.str?.trim() || !it.width) continue;
    const [a, b, c, d, e, f] = it.transform;
    if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || a <= 0 || d <= 0) continue;
    const st = tc.styles[it.fontName] ?? {};
    const asc = st.ascent ?? 0.75, desc = st.descent ?? -0.25;
    // y0/y1: the font's full ascent and descent (edge test); g0/g1: cap height and descenders (overlap test).
    out.push({ s: it.str, x0: e, x1: e + it.width, y0: f + desc * d, y1: f + asc * d, g0: f - 0.2 * d, g1: f + 0.72 * d, base: f, size: d });
  }
  return out;
}

/** Pairs of runs that overlap: different lines whose boxes cross by more than a third of the smaller one. */
function overlaps(rs) {
  const hits = [];
  const sorted = [...rs].sort((p, q) => p.g0 - q.g0);
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    for (let j = i + 1; j < sorted.length && sorted[j].g0 < p.g1; j++) {
      const q = sorted[j];
      if (Math.abs(p.base - q.base) < 0.35 * Math.min(p.size, q.size)) continue;
      const w = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), h = Math.min(p.g1, q.g1) - Math.max(p.g0, q.g0);
      if (w <= 0.5 || h <= 0) continue;
      const small = Math.min((p.x1 - p.x0) * (p.g1 - p.g0), (q.x1 - q.x0) * (q.g1 - q.g0));
      if (w * h > small / 3) hits.push(`"${p.s.trim().slice(0, 24)}" over "${q.s.trim().slice(0, 24)}"`);
    }
  }
  return hits;
}

/**
 * Checks one built (stamped) PDF against its download title, the stamped /Title.
 * Returns { page, fonts, vector, safe, overlap, text, title }: arrays of problems, empty when the rule holds.
 */
export async function checkPrintPdf(file) {
  const bytes = await readFile(file);
  const lib = await PDFDocument.load(bytes, { updateMetadata: false });
  const title = lib.getTitle() ?? "";
  const want = sizeFor(file);
  const page = [], safe = [], overlap = [], text = [], named = [];
  lib.getPages().forEach((p, i) => {
    const { width, height } = p.getSize();
    if (!fits([width, height], want)) page.push(`page ${i + 1} is ${Math.round(width)} x ${Math.round(height)} pt, not ${want[0]} x ${want[1]}`);
  });
  const { loose, images } = objects(lib);
  const pdf = await getDocument({ data: new Uint8Array(bytes), verbosity: 0, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise;
  let first = "";
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const pg = await pdf.getPage(n);
      const [, , W, H] = pg.view;
      const rs = await runs(pg);
      if (n === 1) first = rs.map((r) => r.s).join(" ");
      const at = pdf.numPages > 1 ? `page ${n}: ` : "";
      for (const r of rs) {
        const d = Math.min(r.x0, W - r.x1, r.y0, H - r.y1);
        if (d < EDGE_PT - 0.5 && safe.length < 4) safe.push(`${at}"${r.s.trim().slice(0, 30)}" is ${d.toFixed(1)} pt from the edge`);
      }
      for (const o of overlaps(rs).slice(0, 3)) if (overlap.length < 4) overlap.push(at + o);
      pg.cleanup();
    }
  } finally {
    await pdf.destroy();
  }
  const words = (s) => (s.toLowerCase().normalize("NFKD").match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w));
  const have = new Set(words(first)), need = [...new Set(words(title.replace(/\([^)]*\)/g, "")))];
  const missing = need.filter((w) => !have.has(w));
  if (!first.trim()) text.push("no extractable text on page 1");
  else if (need.length && missing.length / need.length > 0.4) named.push(`page 1 does not use "${missing.slice(0, 5).join(", ")}" from the title "${title}"`);
  if (!first.includes(LINK_TEXT)) text.push("no top link text");
  return {
    page,
    fonts: loose.map((f) => `${f} is not embedded`),
    vector: images ? [`${images} raster image(s)`] : [],
    safe,
    overlap,
    text,
    title: named,
  };
}
