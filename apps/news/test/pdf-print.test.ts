import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { checkPrintPdf } from "../../../scripts/lib/pdf-print.mjs";
import { rasterImages } from "../../../packages/generator/src/printCheck.ts";

/** A one-page PDF with the given lines of text at [x, y] (points from the bottom left) and the top link. */
async function sheet(name: string, size: [number, number], lines: [string, number, number][]) {
  const doc = await PDFDocument.create();
  doc.setTitle("Thaw Dates 2026");
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage(size);
  for (const [t, x, y] of lines) page.drawText(t, { x, y, size: 10, font });
  page.drawText("freshcalendars.com", { x: size[0] - 90, y: size[1] - 18, size: 7, font });
  const file = path.join(await mkdtemp(path.join(tmpdir(), "pdf-print-")), name);
  await writeFile(file, await doc.save({ useObjectStreams: false }));
  return checkPrintPdf(file);
}

describe("printable PDF checks", () => {
  it("passes a Letter sheet with text inside the safe area", async () => {
    const r = await sheet("ok-2026.pdf", [612, 792], [["Thaw Dates 2026", 40, 700], ["Free printable from Fresh Calendars", 200, 16]]);
    assert.deepEqual([r.page, r.safe, r.overlap, r.text, r.title], [[], [], [], [], []]);
  });

  it("flags A4 without -a4 in the name, text at the edge and a note printed over the footer", async () => {
    const a4 = await sheet("sheet-2026.pdf", [595.28, 841.89], [["Thaw Dates 2026", 40, 700]]);
    assert.match(a4.page[0]!, /not 612 x 792/);
    assert.deepEqual((await sheet("sheet-2026-a4.pdf", [595.28, 841.89], [["Thaw Dates 2026", 40, 700]])).page, []);
    const r = await sheet("bad-2026.pdf", [612, 792], [["Thaw Dates 2026", 40, 700], ["Source: USDA", 4, 300], ["Free printable", 200, 16], ["Sources: a long note", 200, 20]]);
    assert.equal(r.safe.length, 1);
    assert.match(r.safe[0]!, /Source: USDA/);
    assert.equal(r.overlap.length, 1);
  });

  it("flags fonts that are not embedded, except the build's own link font", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    page.drawText("Thaw Dates 2026 freshcalendars.com", { x: 40, y: 700, size: 10, font: await doc.embedFont(StandardFonts.Helvetica) });
    const file = path.join(await mkdtemp(path.join(tmpdir(), "pdf-print-")), "fonts-2026.pdf");
    await writeFile(file, await doc.save({ useObjectStreams: false }));
    assert.deepEqual((await checkPrintPdf(file)).fonts, ["Helvetica is not embedded"]);
  });

  it("counts raster images in Chromium output", () => {
    const pdf = new TextEncoder().encode("1 0 obj\n<</Type /XObject /Subtype /Image /Width 524 /Height 138 /BitsPerComponent 8>>\nendobj\n2 0 obj\n<</Type /Font>>\nendobj");
    assert.deepEqual(rasterImages(pdf), ["524x138"]);
  });
});
