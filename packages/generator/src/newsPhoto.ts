/**
 * Licensed photos for /news/ heroes, from sources that publish a machine-readable license:
 *
 *   pnpm fc news-photo search "<query>" [--source commons|nasa|all]
 *   pnpm fc news-photo use <slug> <n | commons:File:Name.jpg | nasa:<id>> [--focus attention|entropy|center|top|bottom]
 *   pnpm fc news-photo press <slug> --url <image> --terms <terms page> --author "<owner>"
 *
 * `search` lists candidates and marks the ones we may use. `use` re-reads the license from the source
 * (never from the cache), crops to 16:9 without upscaling, writes <slug>.webp with the credit embedded,
 * a <slug>.photo.json record, and prints the `hero:` block for the frontmatter.
 *
 * Allowed: public domain (incl. U.S. federal works), CC0, CC BY and CC BY-SA. Refused: NC, ND, GFDL-only,
 * "fair use", anything without a license field, and NASA items credited to a third party. Being a news
 * site does not license a photo; a credit line is attribution, not permission.
 * `press` is for a company's own press-kit image; the terms page must be on the same site as the image
 * and must allow editorial use. The main session checks the terms before committing.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "./paths.js";

const UA = "FreshCalendarsNews/1.0 (https://freshcalendars.com/news/; image licensing tool)";
const CACHE = path.join(ROOT, ".cache/news-photo-last.json");
const MIN_W = 1600, OUT_W = 2400;

type Candidate = {
  ref: string; source: "Wikimedia Commons" | "NASA" | "press"; title: string; page: string; file: string;
  width?: number; height?: number; license: string; licenseUrl: string; author: string; authorUrl?: string;
  ok: boolean; why?: string;
};

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();

/** Licenses we accept, by Commons short name. */
export function licenseOk(name: string): string | null {
  const n = name.toLowerCase();
  if (/\b(nc|nd)\b|non-?commercial|no ?deriv|fair use|all rights reserved/.test(n)) return `license "${name}" does not allow our use`;
  if (/^(public domain|pd\b|pd-|cc0|cc by(-sa)? \d)/.test(n)) return null;
  return `license "${name}" is not on the allowlist (public domain, CC0, CC BY, CC BY-SA)`;
}

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
}

// ── Wikimedia Commons ─────────────────────────────────────────────────────
const COMMONS = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Restrictions|ObjectName";

function fromCommons(p: any): Candidate {
  const ii = p.imageinfo?.[0] ?? {}, m = ii.extmetadata ?? {};
  const license = m.LicenseShortName?.value ?? "";
  const authorHtml: string = m.Artist?.value ?? "";
  const href = /href="([^"]+)"/.exec(authorHtml)?.[1];
  const c: Candidate = {
    ref: `commons:${p.title}`, source: "Wikimedia Commons", title: strip(m.ObjectName?.value) || p.title.replace(/^File:/, ""),
    page: ii.descriptionurl, file: String(ii.url ?? "").replace(/\?.*$/, ""), width: ii.width, height: ii.height,
    license, licenseUrl: m.LicenseUrl?.value ?? (/^(public domain|pd)/i.test(license) ? "https://creativecommons.org/publicdomain/mark/1.0/" : ""),
    author: strip(authorHtml) || "Unknown author", authorUrl: href ? (href.startsWith("//") ? `https:${href}` : href) : undefined, ok: true,
  };
  const why = (ii.mime && !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime) ? `type ${ii.mime}` : null)
    ?? licenseOk(license)
    ?? (strip(m.Restrictions?.value) ? `restrictions: ${strip(m.Restrictions.value)} (trademark or personality rights; check by hand)` : null)
    ?? (Math.min(c.width ?? 0, ((c.height ?? 0) * 16) / 9) < MIN_W ? `16:9 crop narrower than ${MIN_W}px` : null);
  if (why) Object.assign(c, { ok: false, why });
  return c;
}

async function searchCommons(q: string): Promise<Candidate[]> {
  const j = await getJson(`${COMMONS}&generator=search&gsrnamespace=6&gsrlimit=24&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}`);
  return Object.values(j.query?.pages ?? {}).sort((a: any, b: any) => a.index - b.index).map(fromCommons);
}

async function commonsFile(title: string): Promise<Candidate> {
  const j = await getJson(`${COMMONS}&titles=${encodeURIComponent(title)}`);
  const p = Object.values(j.query?.pages ?? {})[0] as any;
  if (!p?.imageinfo) throw new Error(`no Commons file ${title}`);
  return fromCommons(p);
}

// ── NASA Image and Video Library ──────────────────────────────────────────
/** NASA media is public domain unless credited to someone else; those are refused. */
const THIRD_PARTY = /©|copyright|getty|associated press|\bap photo|reuters|esa\/|\besa\b|courtesy of|used with permission/i;

function fromNasa(d: any): Candidate {
  const credit = [d.photographer, d.secondary_creator].filter(Boolean).join(", ");
  const c: Candidate = {
    ref: `nasa:${d.nasa_id}`, source: "NASA", title: d.title, page: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`, file: "",
    license: "Public domain (NASA)", licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    author: credit ? `NASA/${credit.replace(/^NASA\/?/i, "")}` : `NASA${d.center ? ` ${d.center}` : ""}`, ok: true,
  };
  if (THIRD_PARTY.test(`${d.description ?? ""} ${credit} ${d.title}`)) Object.assign(c, { ok: false, why: "credited to a third party or marked copyright" });
  return c;
}

async function searchNasa(q: string): Promise<Candidate[]> {
  const j = await getJson(`https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(q)}`);
  return (j.collection?.items ?? []).slice(0, 24).map((it: any) => fromNasa(it.data[0]));
}

async function nasaItem(id: string): Promise<Candidate> {
  const j = await getJson(`https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(id)}`);
  const d = j.collection?.items?.[0]?.data?.[0];
  if (!d) throw new Error(`no NASA item ${id}`);
  const c = fromNasa(d);
  const assets: string[] = ((await getJson(`https://images-api.nasa.gov/asset/${encodeURIComponent(id)}`)).collection?.items ?? []).map((x: any) => x.href);
  c.file = (assets.find((h) => /~orig\.(jpe?g|png|tif)$/i.test(h)) ?? assets.find((h) => /~large\.(jpe?g|png)$/i.test(h)) ?? "").replace(/^http:/, "https:");
  if (!c.file) Object.assign(c, { ok: false, why: "no original file" });
  return c;
}

// ── commands ──────────────────────────────────────────────────────────────
export async function photoSearch(q: string, source = "all"): Promise<void> {
  if (!q) throw new Error('usage: pnpm fc news-photo search "<query>" [--source commons|nasa|all]');
  const list = [
    ...(source === "nasa" ? [] : await searchCommons(q)),
    ...(source === "commons" ? [] : await searchNasa(q).catch(() => [])),
  ];
  await fs.mkdir(path.dirname(CACHE), { recursive: true });
  await fs.writeFile(CACHE, JSON.stringify(list, null, 2));
  list.forEach((c, i) => {
    const size = c.width ? `${c.width}×${c.height}` : "size on use";
    console.log(`${String(i + 1).padStart(2)} ${c.ok ? "OK  " : "NO  "} ${c.title.slice(0, 60)}\n      ${c.source} · ${c.license} · ${c.author.slice(0, 50)} · ${size}${c.why ? `\n      ✗ ${c.why}` : ""}\n      ${c.page}`);
  });
  console.log(`\n${list.filter((c) => c.ok).length} usable of ${list.length}. Look at the page before choosing, then: pnpm fc news-photo use <slug> <n>`);
}

async function resolve(ref: string): Promise<Candidate> {
  if (/^\d+$/.test(ref)) {
    const list: Candidate[] = JSON.parse(await fs.readFile(CACHE, "utf8").catch(() => "[]"));
    const c = list[Number(ref) - 1];
    if (!c) throw new Error(`no candidate ${ref}; run news-photo search first`);
    ref = c.ref;
  }
  if (ref.startsWith("commons:")) return commonsFile(ref.slice(8));
  if (ref.startsWith("nasa:")) return nasaItem(ref.slice(5));
  throw new Error(`unknown reference ${ref}; use a number from search, commons:File:… or nasa:<id>`);
}

const POSITIONS: Record<string, string | number> = { attention: sharp.strategy.attention, entropy: sharp.strategy.entropy, center: "centre", top: "north", bottom: "south" };

async function write(slug: string, c: Candidate, focus: string): Promise<void> {
  if (!c.ok) throw new Error(`refused: ${c.why}`);
  const r = await fetch(c.file, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} downloading ${c.file}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 0, h = meta.height ?? 0;
  const cropW = Math.floor(Math.min(w, (h * 16) / 9));
  if (cropW < MIN_W) throw new Error(`16:9 crop is ${cropW}px wide; heroes need ${MIN_W}px and we never upscale`);
  const outW = Math.min(OUT_W, cropW), outH = Math.round((outW * 9) / 16);
  const cropped = cropW < w || Math.round((cropW * 9) / 16) < h;
  const rights = `${c.author}, ${c.license}${c.licenseUrl ? ` (${c.licenseUrl})` : ""}`;
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
<dc:creator><rdf:Seq><rdf:li>${xmlEsc(c.author)}</rdf:li></rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${xmlEsc(rights)}</rdf:li></rdf:Alt></dc:rights>
<xmpRights:WebStatement>${xmlEsc(c.licenseUrl || c.page)}</xmpRights:WebStatement></rdf:Description></rdf:RDF></x:xmpmeta>`;
  const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, `${slug}.webp`);
  await sharp(buf).rotate()
    .resize(outW, outH, { fit: "cover", position: POSITIONS[focus] ?? sharp.strategy.attention, withoutEnlargement: true })
    .withExif({ IFD0: { Artist: c.author, Copyright: rights, ImageDescription: c.title } }).withXmp(xmp)
    .webp({ quality: 84, effort: 6 }).toFile(out);
  /** Commons names the platform after the author; NASA and press credits already name the owner. */
  const credit = `Photo: ${c.author}${c.source === "Wikimedia Commons" ? " / Wikimedia Commons" : ""}${cropped ? ", cropped" : ""}`;
  const record = { ...c, slug, fetchedAt: new Date().toISOString(), original: `${w}×${h}`, output: `${outW}×${outH}`, cropped, credit };
  await fs.writeFile(path.join(dir, `${slug}.photo.json`), `${JSON.stringify(record, null, 2)}\n`);
  const q = JSON.stringify;
  console.log(`photo: ${path.relative(ROOT, out)} (${outW}×${outH} from ${w}×${h})\n\nhero: block for the frontmatter (write alt and caption yourself):
hero:
  src: ../../../../assets/news/${slug}/${slug}.webp
  alt: "<what the photo shows, with the main keyword>"
  caption: "<20-220 chars; what the photo shows and why it is here>"
  credit: ${q(credit)}
  license:
    name: ${q(c.license)}
    url: ${q(c.licenseUrl || c.page)}
    source: ${q(c.page)}
    author: ${q(c.author)}${c.authorUrl ? `\n    authorUrl: ${q(c.authorUrl)}` : ""}`);
}

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function photoUse(slug: string, ref: string, focus = "attention"): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !ref) throw new Error("usage: pnpm fc news-photo use <slug> <n | commons:File:… | nasa:<id>>");
  await write(slug, await resolve(ref), focus);
}

/** A company's own press-kit image. Same-site check only; a person still reads the terms. */
export async function photoPress(slug: string, url: string, terms: string, author: string, focus = "attention"): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !url || !terms || !author) throw new Error('usage: pnpm fc news-photo press <slug> --url <image> --terms <terms page> --author "<owner>"');
  const site = (u: string) => new URL(u).hostname.split(".").slice(-2).join(".");
  if (site(url) !== site(terms)) throw new Error(`image (${site(url)}) and terms page (${site(terms)}) must be on the same site; CDN hosts need a manual check`);
  console.warn("press: read the terms page yourself and confirm it allows editorial use by news sites before committing");
  await write(slug, { ref: `press:${url}`, source: "press", title: author, page: terms, file: url, license: "Press image, editorial use", licenseUrl: terms, author, ok: true }, focus);
}
