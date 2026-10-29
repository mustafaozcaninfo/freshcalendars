/**
 * Build step for the printable PDFs in dist/news/downloads, following Google's advice on PDFs
 * (Search Off the Record, "PDF files"): fill in the document properties, link back to the site
 * from the top of the document, and give each file a canonical pointing at its story.
 * - Info and XMP: title, author, subject, keywords, language, dates, copyright and license
 *   (the terms-of-use wording), with "show title" so viewers display the title, not the file name.
 * - A small "freshcalendars.com" link at the top right of every page, to the story.
 * - dist/news-data/pdf-canonical.map: nginx map lines (PDF path regex → Link header value).
 * Output is deterministic (dates come from the story, nothing random), so an unchanged PDF stays
 * byte-identical between builds and deploys do not purge it again.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFHexString, PDFName, PDFString, StandardFonts, rgb } from "pdf-lib";

export const PUBLISHER = "Fresh Calendars";
const TERMS = "https://freshcalendars.com/page/terms-of-use/";
const RIGHTS = `© ${PUBLISHER}. Free for personal, classroom and internal non-commercial use. Do not redistribute, resell or re-host. Terms: ${TERMS}`;
const LINK_TEXT = "freshcalendars.com";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function xmp(m) {
  const alt = (v) => `<rdf:Alt><rdf:li xml:lang="x-default">${esc(v)}</rdf:li></rdf:Alt>`;
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
<dc:format>application/pdf</dc:format>
<dc:title>${alt(m.title)}</dc:title>
<dc:description>${alt(m.description)}</dc:description>
<dc:creator><rdf:Seq><rdf:li>${PUBLISHER}</rdf:li></rdf:Seq></dc:creator>
<dc:publisher><rdf:Bag><rdf:li>${PUBLISHER}</rdf:li></rdf:Bag></dc:publisher>
<dc:rights>${alt(RIGHTS)}</dc:rights>
<dc:source>${esc(m.story)}</dc:source>
<dc:language><rdf:Bag><rdf:li>en-US</rdf:li></rdf:Bag></dc:language>
<dc:subject><rdf:Bag>${m.keywords.map((k) => `<rdf:li>${esc(k)}</rdf:li>`).join("")}</rdf:Bag></dc:subject>
<xmp:CreateDate>${m.created}</xmp:CreateDate>
<xmp:ModifyDate>${m.modified}</xmp:ModifyDate>
<xmp:MetadataDate>${m.modified}</xmp:MetadataDate>
<xmp:CreatorTool>${PUBLISHER}</xmp:CreatorTool>
<pdf:Producer>${PUBLISHER}</pdf:Producer>
<pdf:Keywords>${esc(m.keywords.join(", "))}</pdf:Keywords>
<xmpRights:Marked>True</xmpRights:Marked>
<xmpRights:WebStatement>${TERMS}</xmpRights:WebStatement>
<xmpRights:UsageTerms>${alt(RIGHTS)}</xmpRights:UsageTerms>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;
}

/** Stamps one PDF in place. */
export async function stampPdf(file, m) {
  const doc = await PDFDocument.load(await readFile(file), { updateMetadata: false });
  doc.setTitle(m.title, { showInWindowTitleBar: true });
  doc.setAuthor(PUBLISHER);
  doc.setSubject(m.description);
  doc.setKeywords(m.keywords);
  doc.setCreator(`${PUBLISHER} (freshcalendars.com)`);
  doc.setProducer(PUBLISHER);
  doc.setLanguage("en-US");
  doc.setCreationDate(new Date(m.created));
  doc.setModificationDate(new Date(m.modified));
  const info = doc.getInfoDict();
  info.set(PDFName.of("Copyright"), PDFHexString.fromText(RIGHTS));
  info.set(PDFName.of("Source"), PDFHexString.fromText(m.story));
  const meta = doc.context.stream(new TextEncoder().encode(xmp(m)), { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(meta));

  // Top-right link to the story, in the 0.25 in (18 pt) band the templates keep clear of text
  // (printCheck.ts). Its glyphs run from 13 to 18 pt below the edge: low enough that home printers,
  // which lose up to 1/6 in (12 pt) at the top, still print it.
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 7, w = font.widthOfTextAtSize(LINK_TEXT, size);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const x = width - w - 18, y = height - 18;
    page.drawText(LINK_TEXT, { x, y, size, font, color: rgb(0.35, 0.42, 0.46) });
    const annot = doc.context.register(doc.context.obj({
      Type: "Annot", Subtype: "Link", Rect: [x - 2, y - 3, x + w + 2, y + size + 2], Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(m.story) },
    }));
    page.node.addAnnot(annot);
  }
  await writeFile(file, await doc.save({ useObjectStreams: false }));
}

/** Stamps every mapped PDF under dist/news and writes the nginx canonical map; returns the count. */
export async function stampPdfs(distNews, map, mapOut) {
  const lines = [];
  for (const [pdf, m] of Object.entries(map)) {
    await stampPdf(path.join(distNews, pdf.replace(/^\/news\//, "")), m);
    // Regex keys: nginx hashes plain keys in 64-byte buckets, too small for these paths, and the
    // bucket size cannot be raised here (another map already fixed it). Only PDF requests evaluate it.
    lines.push(`"~^${pdf.replace(/[.+?^$()[\]{}|\\]/g, "\\$&")}$" "<${m.story}>; rel=\\"canonical\\"";`);
  }
  await writeFile(mapOut, `# Generated by apps/news/src/lib/pdf-meta.mjs: printable PDF -> its story.\n${lines.join("\n")}\n`);
  return lines.length;
}
