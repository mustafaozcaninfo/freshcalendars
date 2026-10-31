/**
 * Licensed photos for /news/ heroes, from sources that publish a machine-readable license:
 *
 *   pnpm fc news-photo search "<query>" [--source commons|nasa|openverse|pexels|flickr|unsplash|all]
 *   pnpm fc news-photo use <slug> <n | commons:File:Name.jpg | nasa:<id> | openverse:<id> | pexels:<id> | flickr:<id> | unsplash:<id>> [--focus …] [--allow-flickr]
 *   pnpm fc news-photo press <slug> --url <image> --author "<owner>" (--terms <terms page> | --page <press release>)
 *   pnpm fc news-photo gov <slug> --url <image> --page <federal agency page> [--author "NASA/Bill Ingalls"]
 *   pnpm fc news-photo official <slug> --url <image> --page <notice page> --owner "<company>"
 *   pnpm fc news-photo trace <competing page> [<page> …]
 *
 * Every command except official and trace takes --inline <name>: an in-body photo (whole, up to 1600 px,
 * credit line printed for the story body) instead of the hero. A hero narrower than a 1600 px 16:9 crop
 * but at least 800 px wide is framed whole on a blurred copy of itself (credit ", edited").
 * `gov` takes a photo a federal agency published as its own work (CISA's federal .gov list, .mil, DVIDS),
 * refusing it when the caption or file credits anyone else. `trace` reads the pages that rank for the
 * story's query and says, for each picture, who owns it and the legal way to get it.
 *
 * `search` lists candidates and marks the ones we may use. `use` re-reads the license from the source
 * (never from the cache), crops to 16:9 without upscaling, writes <slug>.webp with the credit embedded,
 * a <slug>.photo.json record, and prints the `hero:` block for the frontmatter.
 *
 * Allowed: public domain (incl. U.S. federal works), CC0, CC BY, CC BY-SA and the Pexels License. Refused:
 * NC, ND, GFDL-only, "fair use", anything without a license field, and NASA items credited to a third
 * party. Being a news site does not license a photo; a credit line is attribution, not permission.
 * Openverse indexes museums, Wikimedia and Flickr; Flickr uploads are refused unless --allow-flickr,
 * because re-uploads of other people's photos under a CC label are common there: open the page and
 * confirm the uploader is the photographer first. Pexels needs PEXELS_API_KEY in the environment.
 * `use` also keeps the untouched crop as <slug>.source.webp, which `news-assets` uses for the
 * branded overlay (assets.overlay), so the overlay is never applied twice.
 * `press` is for a company's own press-kit image; the terms page must be on the same site as the image
 * and must allow editorial use. The main session checks the terms before committing.
 * `official` is for the product photo a government recall or safety notice publishes (FDA, USDA FSIS,
 * CPSC, NHTSA, CDC): the image must be on the agency's site and appear on the notice page itself. These
 * photos are usually small, so the whole image is placed, never cropped and enlarged at most 2x, on a
 * 2400×1350 canvas filled with its own background colour. It is shown as published: no overlay, and the
 * credit names the owner and the agency ("Photo: <company> via U.S. Food and Drug Administration (FDA)").
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "./paths.js";

const UA = "FreshCalendarsNews/1.0 (https://freshcalendars.com/news/; image licensing tool)";
const CACHE = path.join(ROOT, ".cache/news-photo-last.json");
/** Hero: a 1600 px 16:9 crop, or at least 800 px to be framed whole. In-body photos: 800 px, kept up to 1600. */
const MIN_W = 1600, OUT_W = 2400, OUT_H = 1350, FRAME_MIN = 800, INLINE_MIN = 800, INLINE_W = 1600;

type Candidate = {
  ref: string; source: "Wikimedia Commons" | "NASA" | "Openverse" | "Pexels" | "Unsplash" | "Flickr" | "press" | string; provider?: string; title: string; page: string; file: string;
  width?: number; height?: number; license: string; licenseUrl: string; author: string; authorUrl?: string;
  /** A small preview for the contact sheet; never used for the hero. */
  thumb?: string;
  ok: boolean; why?: string;
  /** Called once when the photo is downloaded (Unsplash API terms). */
  ping?: string;
};

/** Why a photo is too small for any use, or null (narrow photos are framed on use). */
function sizeWhy(w?: number, h?: number): string | null {
  if (!w || !h) return null;
  return w < FRAME_MIN ? `${w}px wide; needs ${FRAME_MIN}px (framed) or a ${MIN_W}px 16:9 crop` : null;
}
const framedNote = (c: Candidate) => c.width && c.height && Math.min(c.width, (c.height * 16) / 9) < MIN_W ? " (hero: framed whole)" : "";

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();

/** Licenses we accept, by Commons short name. */
export function licenseOk(name: string): string | null {
  const n = name.toLowerCase();
  if (/\b(nc|nd)\b|non-?commercial|no ?deriv|fair use|all rights reserved/.test(n)) return `license "${name}" does not allow our use`;
  if (/^(public domain|pd\b|pd-|cc0|cc by(-sa)? \d|pexels license$|unsplash license$)/.test(n)) return null;
  return `license "${name}" is not on the allowlist (public domain, CC0, CC BY, CC BY-SA, Pexels License, Unsplash License)`;
}

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
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
    thumb: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.title.replace(/^File:/, ""))}?width=640`,
    license, licenseUrl: m.LicenseUrl?.value ?? (/^(public domain|pd)/i.test(license) ? "https://creativecommons.org/publicdomain/mark/1.0/" : ""),
    author: strip(authorHtml) || "Unknown author", authorUrl: href ? (href.startsWith("//") ? `https:${href}` : href) : undefined, ok: true,
  };
  const why = (ii.mime && !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime) ? `type ${ii.mime}` : null)
    ?? licenseOk(license)
    ?? (strip(m.Restrictions?.value) ? `restrictions: ${strip(m.Restrictions.value)} (trademark or personality rights; check by hand)` : null)
    ?? sizeWhy(c.width, c.height);
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

function fromNasa(d: any, thumb?: string): Candidate {
  const credit = [d.photographer, d.secondary_creator].filter(Boolean).join(", ");
  const c: Candidate = {
    ref: `nasa:${d.nasa_id}`, source: "NASA", title: d.title, page: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`, file: "", thumb,
    license: "Public domain (NASA)", licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    author: credit ? `NASA/${credit.replace(/^NASA\/?/i, "")}` : `NASA${d.center ? ` ${d.center}` : ""}`, ok: true,
  };
  if (THIRD_PARTY.test(`${d.description ?? ""} ${credit} ${d.title}`)) Object.assign(c, { ok: false, why: "credited to a third party or marked copyright" });
  return c;
}

async function searchNasa(q: string): Promise<Candidate[]> {
  const j = await getJson(`https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(q)}`);
  return (j.collection?.items ?? []).slice(0, 24).map((it: any) => fromNasa(it.data[0], it.links?.[0]?.href));
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

// ── Openverse (museums, Wikimedia, Flickr…) ───────────────────────────────
const OPENVERSE = "https://api.openverse.org/v1/images/";

/** Openverse license codes → the names licenseOk() knows. */
export function openverseLicense(code: string, version = ""): string {
  const v = version ? ` ${version}` : "";
  if (code === "cc0") return "CC0 1.0";
  if (code === "pdm") return "Public domain";
  if (code === "by") return `CC BY${v}`;
  if (code === "by-sa") return `CC BY-SA${v}`;
  return `CC ${code.toUpperCase()}${v}`;
}

function fromOpenverse(d: any, allowFlickr = false): Candidate {
  const license = openverseLicense(d.license, d.license_version);
  const c: Candidate = {
    ref: `openverse:${d.id}`, source: "Openverse", provider: d.source ?? d.provider, title: d.title || d.id, page: d.foreign_landing_url,
    file: d.url, width: d.width ?? undefined, height: d.height ?? undefined, license, licenseUrl: d.license_url ?? "", thumb: d.thumbnail ?? undefined,
    author: d.creator || "Unknown author", authorUrl: d.creator_url ?? undefined, ok: true,
  };
  const why = licenseOk(license)
    ?? (/flickr/i.test(`${d.source} ${d.provider}`) && !allowFlickr && !officialFlickr(c.page) ? "Flickr upload: open the page, confirm the uploader took the photo, then use --allow-flickr" : null)
    ?? sizeWhy(c.width, c.height);
  if (why) Object.assign(c, { ok: false, why });
  return c;
}

async function searchOpenverse(q: string): Promise<Candidate[]> {
  const j = await getJson(`${OPENVERSE}?q=${encodeURIComponent(q)}&license_type=commercial,modification&mature=false&page_size=20`);
  return (j.results ?? []).map((d: any) => fromOpenverse(d));
}

// ── Pexels (needs PEXELS_API_KEY) ─────────────────────────────────────────
async function pexelsJson(url: string): Promise<any> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set");
  const r = await fetch(url, { headers: { Authorization: key, "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
}

function fromPexels(p: any): Candidate {
  const c: Candidate = {
    ref: `pexels:${p.id}`, source: "Pexels", title: p.alt || `Pexels photo ${p.id}`, page: p.url, file: p.src?.original ?? "",
    width: p.width, height: p.height, thumb: p.src?.medium, license: "Pexels License", licenseUrl: "https://www.pexels.com/license/",
    author: p.photographer || "Unknown photographer", authorUrl: p.photographer_url, ok: true,
  };
  const why = sizeWhy(c.width, c.height);
  if (why) Object.assign(c, { ok: false, why });
  return c;
}

const searchPexels = async (q: string): Promise<Candidate[]> => ((await pexelsJson(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=24&orientation=landscape`)).photos ?? []).map(fromPexels);

// ── Flickr (needs FLICKR_API_KEY) ─────────────────────────────────────────
/**
 * Official U.S. government and agency accounts (Flickr path aliases). Their uploads are their own
 * work, so they pass without --allow-flickr; anyone else's upload still needs a look first.
 */
const OFFICIAL_FLICKR = new Set([
  "whitehouse", "nasahqphoto", "nasa_goddard", "nasakennedy", "nasa_jsc_photo", "nasamarshall", "nasa2explore", "nasawebbtelescope",
  "usarmy", "usnavy", "usairforce", "marine_corps", "departmentofdefense", "secdef", "thenationalguard", "uscoastguard",
  "usdagov", "usfwshq", "fema", "noaaphotolib", "usgeologicalsurvey", "statephotos", "usdot", "usnationalarchives",
  "library_of_congress", "smithsonian", "usembassy", "cbpphotos", "uscapitol", "usinterior", "blmoregon", "usforestservice",
]);
const officialFlickr = (page = "") => OFFICIAL_FLICKR.has(/flickr\.com\/photos\/([^/]+)/i.exec(page)?.[1]?.toLowerCase() ?? "");
/** Flickr license ids we accept → names licenseOk() knows. 7 ("no known copyright restrictions") is not a license. */
const FLICKR_LICENSES: Record<string, string> = { "4": "CC BY 2.0", "5": "CC BY-SA 2.0", "8": "Public domain (U.S. Government Work)", "9": "CC0 1.0", "10": "Public domain" };
const FLICKR_LICENSE_URL: Record<string, string> = { "4": "https://creativecommons.org/licenses/by/2.0/", "5": "https://creativecommons.org/licenses/by-sa/2.0/", "8": "https://www.usa.gov/government-copyright", "9": "https://creativecommons.org/publicdomain/zero/1.0/", "10": "https://creativecommons.org/publicdomain/mark/1.0/" };

async function flickrJson(method: string, params: Record<string, string>): Promise<any> {
  const key = process.env.FLICKR_API_KEY;
  if (!key) throw new Error("FLICKR_API_KEY is not set");
  const j = await getJson(`https://api.flickr.com/services/rest/?${new URLSearchParams({ method, api_key: key, format: "json", nojsoncallback: "1", ...params })}`);
  if (j.stat !== "ok") throw new Error(`Flickr: ${j.message}`);
  return j;
}

function fromFlickr(p: any, allowFlickr = false): Candidate {
  const lic = String(p.license);
  const alias = p.pathalias || p.owner;
  const page = `https://www.flickr.com/photos/${alias}/${p.id}/`;
  const file = p.url_o ?? p.url_k ?? p.url_h ?? p.url_b ?? "";
  const width = Number(p.width_o ?? p.width_k ?? p.width_h ?? p.width_b) || undefined, height = Number(p.height_o ?? p.height_k ?? p.height_h ?? p.height_b) || undefined;
  const c: Candidate = {
    ref: `flickr:${p.id}`, source: "Flickr", title: p.title?._content ?? p.title ?? p.id, page, file, width, height, thumb: p.url_z ?? p.url_m,
    license: FLICKR_LICENSES[lic] ?? `Flickr license ${lic}`, licenseUrl: FLICKR_LICENSE_URL[lic] ?? "",
    author: p.ownername ?? p.owner?.realname ?? p.owner?.username ?? alias, authorUrl: `https://www.flickr.com/photos/${alias}/`, ok: true,
  };
  const why = (FLICKR_LICENSES[lic] ? null : `Flickr license ${lic} is not one we accept`)
    ?? (lic !== "8" && !officialFlickr(page) && !allowFlickr ? "Flickr upload: open the page, confirm the uploader took the photo, then use --allow-flickr" : null)
    ?? (file ? null : "no downloadable size (the owner turned downloads off)")
    ?? sizeWhy(width, height);
  if (why) Object.assign(c, { ok: false, why });
  return c;
}

const FLICKR_EXTRAS = "license,owner_name,path_alias,url_o,url_k,url_h,url_b,url_z";
async function searchFlickr(q: string): Promise<Candidate[]> {
  const j = await flickrJson("flickr.photos.search", { text: q, license: Object.keys(FLICKR_LICENSES).join(","), sort: "relevance", content_types: "0", media: "photos", per_page: "30", extras: FLICKR_EXTRAS });
  // Official accounts first: their photos pass without a manual check.
  return (j.photos?.photo ?? []).map((p: any) => fromFlickr(p)).sort((a: Candidate, b: Candidate) => Number(b.ok) - Number(a.ok));
}

async function flickrPhoto(id: string, allowFlickr: boolean): Promise<Candidate> {
  const info = (await flickrJson("flickr.photos.getInfo", { photo_id: id })).photo;
  const sizes: any[] = (await flickrJson("flickr.photos.getSizes", { photo_id: id })).sizes?.size ?? [];
  const best = sizes.filter((x) => /^(Original|Large 2048|Large 1600|Large)$/.test(x.label)).sort((a, b) => b.width - a.width)[0];
  return fromFlickr({ id, license: info.license, pathalias: info.owner?.path_alias || info.owner?.nsid, ownername: info.owner?.realname || info.owner?.username, title: info.title,
    url_o: best?.source, width_o: best?.width, height_o: best?.height }, allowFlickr);
}

// ── Unsplash (needs UNSPLASH_ACCESS_KEY) ──────────────────────────────────
async function unsplashJson(url: string): Promise<any> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY is not set");
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1", "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${r.status} from ${url}`);
  return r.json();
}

function fromUnsplash(p: any): Candidate {
  const key = process.env.UNSPLASH_ACCESS_KEY ?? "";
  const c: Candidate = {
    ref: `unsplash:${p.id}`, source: "Unsplash", title: p.alt_description || p.description || `Unsplash photo ${p.id}`,
    page: `${p.links?.html}?utm_source=fresh_calendars&utm_medium=referral`, file: `${p.urls?.raw}&fm=jpg&q=90&w=${Math.min(p.width ?? OUT_W, 3200)}`,
    width: p.width, height: p.height, thumb: p.urls?.small, license: "Unsplash License", licenseUrl: "https://unsplash.com/license",
    author: p.user?.name || "Unknown photographer", authorUrl: p.user?.links?.html, ok: true,
    ping: p.links?.download_location ? `${p.links.download_location}${p.links.download_location.includes("?") ? "&" : "?"}client_id=${key}` : undefined,
  };
  // Unsplash+ photos are paid; brand-sponsored ones advertise a product.
  const why = (p.premium || p.plus ? "Unsplash+ photo (paid license)" : null) ?? (p.sponsorship ? "sponsored photo" : null) ?? sizeWhy(c.width, c.height);
  if (why) Object.assign(c, { ok: false, why });
  return c;
}

const searchUnsplash = async (q: string): Promise<Candidate[]> =>
  ((await unsplashJson(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=24&orientation=landscape&content_filter=high`)).results ?? []).map(fromUnsplash);

// ── commands ──────────────────────────────────────────────────────────────
/**
 * Several phrasings in one call ("runners bridge|marathon Verrazzano"): results are merged and
 * de-duplicated, and the usable ones are drawn on a numbered contact sheet, cropped 16:9 with the
 * left 40% (where the overlay card goes) shaded, so one look picks the photo.
 */
export async function photoSearch(q: string, source = "all", sheet = true): Promise<void> {
  if (!q) throw new Error('usage: pnpm fc news-photo search "<query>[|<another phrasing>…]" [--source commons|nasa|openverse|pexels|all] [--no-sheet]');
  const want = (s: string) => source === "all" || source === s;
  const soft = (p: Promise<Candidate[]>, name: string) => p.catch((e): Candidate[] => (console.warn(`${name}: ${e.message}`), []));
  const one = async (q: string) => (await Promise.all([
    want("commons") ? searchCommons(q) : [],
    want("nasa") ? soft(searchNasa(q), "NASA") : [],
    want("openverse") ? soft(searchOpenverse(q), "Openverse") : [],
    want("pexels") && (source === "pexels" || process.env.PEXELS_API_KEY) ? soft(searchPexels(q), "Pexels") : [],
    want("flickr") && (source === "flickr" || process.env.FLICKR_API_KEY) ? soft(searchFlickr(q), "Flickr") : [],
    want("unsplash") && (source === "unsplash" || process.env.UNSPLASH_ACCESS_KEY) ? soft(searchUnsplash(q), "Unsplash") : [],
  ])).flat();
  const seen = new Set<string>();
  const list = (await Promise.all(q.split("|").map((s) => s.trim()).filter(Boolean).map(one))).flat().filter((c) => !seen.has(c.ref) && seen.add(c.ref));
  await fs.mkdir(path.dirname(CACHE), { recursive: true });
  await fs.writeFile(CACHE, JSON.stringify(list, null, 2));
  list.forEach((c, i) => {
    const size = c.width ? `${c.width}×${c.height}` : "size on use";
    console.log(`${String(i + 1).padStart(2)} ${c.ok ? "OK  " : "NO  "} ${c.title.slice(0, 60)}\n      ${c.source}${c.provider ? ` (${c.provider})` : ""} · ${c.license} · ${c.author.slice(0, 50)} · ${size}${c.ok ? framedNote(c) : ""}${c.why ? `\n      ✗ ${c.why}` : ""}\n      ${c.page}`);
  });
  const usable = list.map((c, i) => ({ c, n: i + 1 })).filter(({ c }) => c.ok && c.thumb);
  console.log(`\n${list.filter((c) => c.ok).length} usable of ${list.length}.`);
  if (sheet && usable.length) console.log(`contact sheet: ${path.relative(ROOT, await contactSheet(usable.slice(0, 16)))} (read it, then: pnpm fc news-photo use <slug> <n>)`);
  else console.log("Look at the page before choosing, then: pnpm fc news-photo use <slug> <n>");
}

const SHEET = path.join(ROOT, ".cache/news-photo-sheet.jpg");
async function contactSheet(items: { c: Candidate; n: number }[]): Promise<string> {
  const TW = 480, TH = 270, cols = 4, rows = Math.ceil(items.length / cols);
  const tiles = await Promise.all(items.map(async ({ c, n }) => {
    const label = `<svg width="${TW}" height="${TH}"><rect width="${TW * 0.4}" height="${TH}" fill="#000" opacity=".35"/>
      <rect x="8" y="8" width="${46 + String(n).length * 12}" height="34" rx="6" fill="#111827"/><text x="18" y="32" font-family="Helvetica" font-weight="700" font-size="22" fill="#fff">#${n}</text>
      <rect x="0" y="${TH - 26}" width="${TW}" height="26" fill="#000" opacity=".6"/><text x="8" y="${TH - 8}" font-family="Helvetica" font-size="14" fill="#fff">${xmlEsc(`${c.license} · ${c.width ?? "?"}×${c.height ?? "?"} · ${c.author.slice(0, 34)}`)}</text></svg>`;
    try {
      const r = await fetch(c.thumb!, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(String(r.status));
      const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(TW, TH, { fit: "cover", position: sharp.strategy.attention }).toBuffer();
      return sharp(img).composite([{ input: Buffer.from(label) }]).jpeg().toBuffer();
    } catch {
      return sharp({ create: { width: TW, height: TH, channels: 3, background: "#374151" } }).composite([{ input: Buffer.from(label) }]).jpeg().toBuffer();
    }
  }));
  await sharp({ create: { width: cols * TW, height: rows * TH, channels: 3, background: "#ffffff" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * TW, top: Math.floor(i / cols) * TH }))).jpeg({ quality: 80 }).toFile(SHEET);
  return SHEET;
}

async function resolve(ref: string, allowFlickr = false): Promise<Candidate> {
  if (/^\d+$/.test(ref)) {
    const list: Candidate[] = JSON.parse(await fs.readFile(CACHE, "utf8").catch(() => "[]"));
    const c = list[Number(ref) - 1];
    if (!c) throw new Error(`no candidate ${ref}; run news-photo search first`);
    ref = c.ref;
  }
  if (ref.startsWith("commons:")) return commonsFile(ref.slice(8));
  if (ref.startsWith("nasa:")) return nasaItem(ref.slice(5));
  if (ref.startsWith("openverse:")) return fromOpenverse(await getJson(`${OPENVERSE}${encodeURIComponent(ref.slice(10))}/`), allowFlickr);
  if (ref.startsWith("pexels:")) return fromPexels(await pexelsJson(`https://api.pexels.com/v1/photos/${encodeURIComponent(ref.slice(7))}`));
  if (ref.startsWith("flickr:")) return flickrPhoto(ref.slice(7), allowFlickr);
  if (ref.startsWith("unsplash:")) return fromUnsplash(await unsplashJson(`https://api.unsplash.com/photos/${encodeURIComponent(ref.slice(9))}`));
  throw new Error(`unknown reference ${ref}; use a number from search, commons:File:…, nasa:<id>, openverse:<id>, pexels:<id>, flickr:<id> or unsplash:<id>`);
}

const POSITIONS: Record<string, string | number> = { attention: sharp.strategy.attention, entropy: sharp.strategy.entropy, center: "centre", top: "north", bottom: "south" };

/** Credit for the hero line: Commons, Pexels and Unsplash name the platform after the author. */
function creditOf(c: Candidate): string {
  const via = ["Wikimedia Commons", "Pexels", "Unsplash", "Flickr"].includes(c.source) ? ` / ${c.source}` : c.source === "Openverse" && c.provider ? ` / ${c.provider}` : "";
  return `Photo: ${c.author}${via}`;
}

/**
 * A photo narrower than a 1600 px 16:9 crop is placed whole (enlarged at most 2x) over a blurred,
 * darkened copy of itself, so small official and press photos can still be heroes without a soft,
 * over-enlarged crop.
 */
async function frameOnBlur(buf: Buffer, w: number, h: number): Promise<Buffer> {
  const scale = Math.min(2, (OUT_W * 0.9) / w, (OUT_H * 0.9) / h);
  const pw = Math.round(w * scale), ph = Math.round(h * scale);
  const placed = await sharp(buf).rotate().resize(pw, ph, { kernel: "lanczos3" }).toBuffer();
  // Two pipelines: sharp keeps only the last resize of one.
  const tiny = await sharp(buf).rotate().resize(64, 36, { fit: "cover" }).toBuffer();
  const backdrop = await sharp(tiny).resize(OUT_W, OUT_H).blur(24).modulate({ brightness: 0.45, saturation: 0.7 }).toBuffer();
  return sharp(backdrop).composite([{ input: placed, left: Math.round((OUT_W - pw) / 2), top: Math.round((OUT_H - ph) / 2) }]).png().toBuffer();
}

async function write(slug: string, c: Candidate, focus = "attention", inline?: string): Promise<void> {
  if (!c.ok) throw new Error(`refused: ${c.why}`);
  const r = await fetch(c.file, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} downloading ${c.file}`);
  // Unsplash's API terms: tell it about every download.
  if (c.ping) await fetch(c.ping, { headers: { "User-Agent": UA } }).catch(() => undefined);
  const buf = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 0, h = meta.height ?? 0;
  const rights = `${c.author}, ${c.license}${c.licenseUrl ? ` (${c.licenseUrl})` : ""}`;
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
<dc:creator><rdf:Seq><rdf:li>${xmlEsc(c.author)}</rdf:li></rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${xmlEsc(rights)}</rdf:li></rdf:Alt></dc:rights>
<xmpRights:WebStatement>${xmlEsc(c.licenseUrl || c.page)}</xmpRights:WebStatement></rdf:Description></rdf:RDF></x:xmpmeta>`;
  const exif = { IFD0: { Artist: c.author, Copyright: rights, ImageDescription: c.title } };
  const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
  await fs.mkdir(dir, { recursive: true });
  const q = JSON.stringify;

  // In-body photo: whole image, no crop, its own credit line under it.
  if (inline) {
    if (!/^[a-z0-9-]+$/.test(inline)) throw new Error("--inline takes a kebab-case file name");
    if (w < INLINE_MIN) throw new Error(`image is ${w}px wide; in-body photos need ${INLINE_MIN}px`);
    const outW = Math.min(INLINE_W, w), file = `${inline}.webp`;
    await sharp(buf).rotate().resize(outW, null, { withoutEnlargement: true }).withExif(exif).withXmp(xmp).webp({ quality: 84, effort: 6 }).toFile(path.join(dir, file));
    const credit = creditOf(c);
    const record = { ...c, slug, inline: file, fetchedAt: new Date().toISOString(), original: `${w}×${h}`, output: `${outW}×${Math.round((h * outW) / w)}`, cropped: false, credit };
    await fs.writeFile(path.join(dir, `${inline}.photo.json`), `${JSON.stringify(record, null, 2)}\n`);
    const lic = c.licenseUrl ? `[${c.license}](${c.licenseUrl})` : c.license;
    console.log(`photo: apps/news/src/assets/news/${slug}/${file} (${outW}px wide)\n\nPaste where it belongs in the story (write alt and caption yourself; keep the credit sentence):\n
![<what the photo shows, 10-160 chars>](../../../../assets/news/${slug}/${file} "<short title>")

*<caption: what it shows, when, and "file photo" when it is not from this event>. ${credit.replace(/ \/ [^/]+$/, "")}, ${lic}, via [${c.provider ?? c.source}](${c.page}).*`);
    return;
  }

  const cropW = Math.floor(Math.min(w, (h * 16) / 9));
  const framed = cropW < MIN_W;
  if (framed && w < FRAME_MIN) throw new Error(`image is ${w}px wide; heroes need a ${MIN_W}px 16:9 crop, or ${FRAME_MIN}px to be framed`);
  const outW = framed ? OUT_W : Math.min(OUT_W, cropW), outH = Math.round((outW * 9) / 16);
  const cropped = !framed && (cropW < w || Math.round((cropW * 9) / 16) < h);
  const out = path.join(dir, `${slug}.webp`);
  const img = framed ? sharp(await frameOnBlur(buf, w, h))
    : sharp(buf).rotate().resize(outW, outH, { fit: "cover", position: POSITIONS[focus] ?? sharp.strategy.attention, withoutEnlargement: true });
  await img.withExif(exif).withXmp(xmp).webp({ quality: 84, effort: 6 }).toFile(out);
  // The untouched crop: news-assets draws the branded overlay from this, never from the hero itself.
  await fs.copyFile(out, path.join(dir, `${slug}.source.webp`));
  const credit = `${creditOf(c)}${cropped ? ", cropped" : ""}${framed ? ", edited" : ""}`;
  const record = { ...c, slug, fetchedAt: new Date().toISOString(), original: `${w}×${h}`, output: `${outW}×${outH}`, cropped, ...(framed ? { framed: true } : {}), credit };
  await fs.writeFile(path.join(dir, `${slug}.photo.json`), `${JSON.stringify(record, null, 2)}\n`);
  console.log(`photo: ${path.relative(ROOT, out)} (${outW}×${outH} from ${w}×${h}${framed ? ", framed whole on a blurred copy" : ""})\n\nhero: block for the frontmatter (write alt and caption yourself):
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

export async function photoUse(slug: string, ref: string, focus = "attention", allowFlickr = false, inline?: string): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !ref) throw new Error("usage: pnpm fc news-photo use <slug> <n | commons:File:… | nasa:<id> | openverse:<id> | pexels:<id> | flickr:<id> | unsplash:<id>> [--inline <name>]");
  await write(slug, await resolve(ref, allowFlickr), focus, inline);
}

/** Press-release distributors: an image in a release on these is the issuing company's own. */
const NEWSWIRES: Record<string, string> = { "prnewswire.com": "PR Newswire", "globenewswire.com": "GlobeNewswire", "businesswire.com": "Business Wire", "accesswire.com": "ACCESSWIRE", "newswire.ca": "Cision" };
const siteOf = (u: string) => new URL(u).hostname.split(".").slice(-2).join(".");

/** The <img> sources on a page, as absolute paths, and the text around each one. */
async function pageImages(page: string): Promise<{ html: string; imgs: { url: string; tag: string; context: string }[] }> {
  const r = await fetch(page, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${r.status} reading ${page} (blocked pages are not worked around; use another official page)`);
  const html = await r.text();
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].flatMap((m) => {
    const src = /\s(?:data-src|src)="([^"]+)"/i.exec(m[0])?.[1] ?? /\ssrcset="([^"\s]+)/i.exec(m[0])?.[1];
    if (!src) return [];
    const at = m.index ?? 0;
    const fig = html.slice(at, at + 1500).match(/<figcaption[\s\S]*?<\/figcaption>/i)?.[0] ?? "";
    return [{ url: new URL(src.replace(/&amp;/g, "&"), page).href, tag: m[0], context: strip(`${/alt="([^"]*)"/i.exec(m[0])?.[1] ?? ""} ${fig} ${html.slice(at + m[0].length, at + m[0].length + 500)}`) }];
  });
  return { html, imgs };
}
const samePath = (a: string, b: string) => decodeURIComponent(new URL(a).pathname) === decodeURIComponent(new URL(b).pathname);

/**
 * A company's own press-kit or press-release image. Either the image and terms page are on the
 * company's site, or --page names the release (company newsroom or a newswire) the image appears on,
 * which also covers newsroom images served from a CDN.
 */
export async function photoPress(slug: string, url: string, terms: string, author: string, focus = "attention", page?: string, inline?: string): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !url || !author || (!terms && !page)) throw new Error('usage: pnpm fc news-photo press <slug> --url <image> --author "<company>" (--terms <terms page> | --page <press release page>) [--inline <name>]');
  let license = "Press image, editorial use", licenseUrl = terms;
  if (page) {
    const { imgs } = await pageImages(page);
    if (!imgs.some((i) => samePath(i.url, url))) throw new Error(`the image is not on the release page ${page}`);
    const wire = NEWSWIRES[siteOf(page)];
    if (wire) license = `Press release image (via ${wire}), editorial use`;
    else if (terms && siteOf(terms) !== siteOf(page)) throw new Error(`terms page (${siteOf(terms)}) must be on the company's site (${siteOf(page)})`);
    licenseUrl = terms || page;
  } else if (siteOf(url) !== siteOf(terms)) throw new Error(`image (${siteOf(url)}) and terms page (${siteOf(terms)}) must be on the same site; for a CDN image pass --page <the release it appears on>`);
  console.warn("press: confirm the release or terms page is the company's own and allows use by news sites before committing");
  await write(slug, { ref: `press:${url}`, source: "press", title: author, page: page || terms, file: url, license, licenseUrl, author, ok: true }, focus, inline);
}

/** Agencies whose recall and safety notices publish product photos. */
const OFFICIAL_HOSTS: Record<string, string> = {
  "fda.gov": "U.S. Food and Drug Administration (FDA)",
  "fsis.usda.gov": "U.S. Department of Agriculture Food Safety and Inspection Service (FSIS)",
  "cpsc.gov": "U.S. Consumer Product Safety Commission (CPSC)",
  "nhtsa.gov": "National Highway Traffic Safety Administration (NHTSA)",
  "cdc.gov": "Centers for Disease Control and Prevention (CDC)",
};
const officialAgency = (u: string) => {
  const h = new URL(u).hostname.replace(/^www\./, "");
  return Object.entries(OFFICIAL_HOSTS).find(([d]) => h === d || h.endsWith(`.${d}`))?.[1];
};

/** The product photo from an official recall or safety notice, framed whole on a hero-size canvas. */
export async function photoOfficial(slug: string, url: string, page: string, owner: string): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !url || !page || !owner) throw new Error('usage: pnpm fc news-photo official <slug> --url <image> --page <notice page> --owner "<company>"');
  const agency = officialAgency(page);
  if (!agency) throw new Error(`notice page must be on ${Object.keys(OFFICIAL_HOSTS).join(", ")}`);
  if (officialAgency(url) !== agency) throw new Error("the image must be on the same agency site as the notice page");
  // The photo has to be part of the notice, not any file that happens to sit on the agency's server.
  const html = await (await fetch(page, { headers: { "User-Agent": UA } })).text();
  const { pathname } = new URL(url);
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => new URL(m[1]!.replace(/&amp;/g, "&"), page).pathname);
  if (!srcs.includes(pathname)) throw new Error(`the image is not on the notice page ${page}`);
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok || !/^image\//.test(r.headers.get("content-type") ?? "")) throw new Error(`${r.status} downloading ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const { width: w = 0, height: h = 0 } = await sharp(buf).metadata();
  if (w < 400) throw new Error(`image is ${w}px wide; below 400px it is too small to read even framed`);
  // Fill with the photo's own corner colour so the frame reads as the photo's backdrop, not ours.
  const { data } = await sharp(buf).flatten({ background: "#ffffff" }).extract({ left: 0, top: 0, width: 4, height: 4 }).raw().toBuffer({ resolveWithObject: true });
  const background = { r: data[0]!, g: data[1]!, b: data[2]! };
  const scale = Math.min(2, (OUT_W * 0.86) / w, (1350 * 0.86) / h);
  const pw = Math.round(w * scale), ph = Math.round(h * scale);
  const placed = await sharp(buf).flatten({ background }).resize(pw, ph, { kernel: "lanczos3" }).toBuffer();
  const credit = `Photo: ${owner} via ${agency}`;
  const title = `${owner} product photo from the ${agency} notice`;
  const rights = `${owner}; published in an official notice by the ${agency} (${page})`;
  const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, `${slug}.webp`);
  await sharp({ create: { width: OUT_W, height: 1350, channels: 3, background } })
    .composite([{ input: placed, left: Math.round((OUT_W - pw) / 2), top: Math.round((1350 - ph) / 2) }])
    .withExif({ IFD0: { Artist: owner, Copyright: rights, ImageDescription: title } })
    .webp({ quality: 86, effort: 6 }).toFile(out);
  // No <slug>.source.webp: official photos never get our overlay.
  await fs.rm(path.join(dir, `${slug}.source.webp`), { force: true });
  const record = { ref: `official:${url}`, source: agency, title, page, file: url, license: "Official notice image", licenseUrl: page, author: owner, ok: true, official: true, slug, fetchedAt: new Date().toISOString(), original: `${w}×${h}`, output: `${OUT_W}×1350`, framed: `${pw}×${ph}`, cropped: false, credit };
  await fs.writeFile(path.join(dir, `${slug}.photo.json`), `${JSON.stringify(record, null, 2)}\n`);
  const q = JSON.stringify;
  console.log(`photo: ${path.relative(ROOT, out)} (${w}×${h} framed at ${pw}×${ph}${scale > 1 ? `, enlarged ${scale.toFixed(2)}x` : ""})\n\nset assets.overlay: false (or remove it), then the hero: block (write alt and caption yourself):
hero:
  src: ../../../../assets/news/${slug}/${slug}.webp
  alt: "<what the photo shows, with the main keyword>"
  caption: "<20-220 chars; say it is the product photo from the ${agency} notice>"
  credit: ${q(credit)}
  license:
    name: "Official notice image"
    url: ${q(page)}
    source: ${q(page)}
    author: ${q(owner)}`);
}

// ── U.S. federal government works ─────────────────────────────────────────
/** CISA's list of federal .gov domains; state and local .gov sites are not public domain. */
const FEDERAL_CSV = "https://raw.githubusercontent.com/cisagov/dotgov-data/main/current-federal.csv";
const FEDERAL_CACHE = path.join(ROOT, ".cache/federal-domains.csv");
/** Federal photo sites outside .gov and .mil. */
const FEDERAL_EXTRA: Record<string, string> = { "dvidshub.net": "Defense Visual Information Distribution Service (DVIDS)", "army.mil": "U.S. Army", "navy.mil": "U.S. Navy", "af.mil": "U.S. Air Force", "marines.mil": "U.S. Marine Corps", "spaceforce.mil": "U.S. Space Force", "uscg.mil": "U.S. Coast Guard" };
let federal: Map<string, string> | undefined;

async function federalDomains(): Promise<Map<string, string>> {
  if (federal) return federal;
  const fresh = await fs.stat(FEDERAL_CACHE).then((s) => Date.now() - s.mtimeMs < 7 * 864e5, () => false);
  let csv = fresh ? await fs.readFile(FEDERAL_CACHE, "utf8") : "";
  if (!csv) {
    const r = await fetch(FEDERAL_CSV, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`${r.status} reading the federal domain list`);
    csv = await r.text();
    await fs.mkdir(path.dirname(FEDERAL_CACHE), { recursive: true });
    await fs.writeFile(FEDERAL_CACHE, csv);
  }
  federal = new Map(csv.split("\n").slice(1).map((l) => l.split(",")).filter((c) => /^Federal/.test(c[1] ?? ""))
    .map((c) => [c[0]!.toLowerCase(), c[3] && !/information officer|\bCIO\b/i.test(c[3]) ? c[3] : c[2]!]));
  return federal;
}

/** The federal agency that runs a host, or undefined for anything else (state .gov included). */
export async function federalAgency(u: string): Promise<string | undefined> {
  const host = new URL(u).hostname.toLowerCase();
  const labels = host.split(".");
  const domains = await federalDomains();
  for (let i = 0; i < labels.length - 1; i++) {
    const d = labels.slice(i).join(".");
    if (domains.has(d)) return domains.get(d);
    if (FEDERAL_EXTRA[d]) return FEDERAL_EXTRA[d];
  }
  return host.endsWith(".mil") ? "U.S. Department of Defense" : undefined;
}

/** Credits that mean a photo on a government page belongs to someone else. */
const NOT_GOV_WORK = /©|\bcopyright\b|all rights reserved|getty|associated press|\bap photo|reuters|\bafp\b|\bepa\b|shutterstock|istock|alamy|bloomberg|courtesy of|used with permission|licensed from|\besa\b|maxar|vantor|planet labs|airbus|spacex/i;

/** Readable strings from EXIF, IPTC and XMP: who the file says owns it. */
async function embeddedRights(buf: Buffer): Promise<string> {
  const m: { exif?: Buffer; iptc?: Buffer; xmp?: Buffer } = await sharp(buf).metadata().catch(() => ({}));
  const text = (b?: Buffer) => (b ? (b.toString("latin1").match(/[\x20-\x7e]{6,}/g) ?? []).join(" ") : "");
  return `${text(m.exif)} ${text(m.iptc)} ${m.xmp ? strip(m.xmp.toString("utf8")) : ""}`.slice(0, 4000);
}

/**
 * A photo a federal agency published as its own work (public domain): the page must be on a federal
 * site, the image must appear on it, and neither the caption nor the file may credit anyone else.
 */
export async function photoGov(slug: string, url: string, page: string, author?: string, focus = "attention", inline?: string): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(slug ?? "") || !url || !page) throw new Error('usage: pnpm fc news-photo gov <slug> --url <image> --page <agency page> [--author "NASA/Bill Ingalls"] [--inline <name>]');
  const agency = await federalAgency(page);
  if (!agency) throw new Error(`${new URL(page).hostname} is not a federal site (CISA's federal .gov list, .mil, DVIDS); state and city photos are not public domain`);
  const { imgs } = await pageImages(page);
  const img = imgs.find((i) => samePath(i.url, url));
  if (!img) throw new Error(`the image is not on ${page}`);
  if (!(await federalAgency(url))) console.warn(`gov: the image is served from ${new URL(url).hostname}, not a federal host; the credit check below still applies`);
  // Agency sites resize on the fly (?w=1024); the same path without the query is the original upload.
  const full = url.replace(/\?.*$/, "");
  let r = full !== url ? await fetch(full, { headers: { "User-Agent": UA } }) : undefined;
  if (!r?.ok || !/^image\//.test(r.headers.get("content-type") ?? "")) r = await fetch(url, { headers: { "User-Agent": UA } });
  else url = full;
  if (!r.ok) throw new Error(`${r.status} downloading ${url}`);
  const rights = `${decodeURIComponent(new URL(url).pathname)} ${img.context} ${await embeddedRights(Buffer.from(await r.arrayBuffer()))}`;
  const hit = NOT_GOV_WORK.exec(rights);
  if (hit) throw new Error(`refused: the caption or file credits someone else ("…${rights.slice(Math.max(0, hit.index - 60), hit.index + 60)}…")`);
  const owner = author || agency;
  await write(slug, { ref: `gov:${url}`, source: agency, title: strip(/alt="([^"]*)"/i.exec(img.tag)?.[1] ?? "") || `${agency} photo`, page, file: url,
    license: "Public domain (U.S. federal government work)", licenseUrl: "https://www.usa.gov/government-copyright", author: owner, ok: true }, focus, inline);
}

// ── trace: who owns the pictures other sites use ──────────────────────────
const WIRE = /getty|associated press|\bap photo\b|\(ap\)|reuters|\bafp\b|\bepa\b|shutterstock|istock|alamy|bloomberg|usa today|imagn|zuma|sipa|nurphoto|anadolu|picture alliance|dpa\b/i;
const SOCIAL = /instagram|tiktok|twitter|\bx\.com\b|facebook|youtube|threads\.net|screenshot/i;
const GOV_CREDIT = /\bnasa\b|\bnoaa\b|\bfema\b|national park service|\bnps\b|white house|u\.s\. (army|navy|air force|marine corps|coast guard|fish and wildlife)|\bdvids\b|\busda\b|\bfda\b|\bcdc\b|department of (defense|state|agriculture|the interior|energy|transportation)|library of congress|national archives|smithsonian/i;
const FREE = /cc by|creative commons|wikimedia|wikipedia|unsplash|pexels|public domain/i;
const PRESS = /courtesy|provided by|handout|press kit|business wire|pr newswire|globenewswire|accesswire|\bvia\b/i;

type Trace = { page: string; image: string; size: string; credit: string; verdict: string; next: string; commons?: string };

/** An exact copy of a Commons file, found by its SHA-1. */
async function commonsBySha1(buf: Buffer): Promise<string | undefined> {
  const sha1 = (await import("node:crypto")).createHash("sha1").update(buf).digest("hex");
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=allimages&aisha1=${sha1}&ailimit=1`).catch(() => ({}));
  const t = j.query?.allimages?.[0]?.title;
  return t ? `commons:${t}` : undefined;
}

/**
 * Reads competing pages, lists their hero and in-body images with the credit next to each, and says
 * which ones we can get legally and how: the federal original (gov), the free-licensed original (use),
 * the company's release (press --page), the post itself (news-embed), or a paid agency license.
 * Nothing is saved from these pages; the images are only read for their credits.
 */
export async function photoTrace(pages: string[]): Promise<void> {
  if (!pages.length) throw new Error("usage: pnpm fc news-photo trace <page url> [<page url> …]  (the top results for the story's query)");
  const rows: Trace[] = [];
  for (const page of pages) {
    let found: Awaited<ReturnType<typeof pageImages>>;
    try { found = await pageImages(page); } catch (e) { rows.push({ page, image: "", size: "", credit: "", verdict: "page not read", next: (e as Error).message }); continue; }
    const og = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i.exec(found.html)?.[1] ?? /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i.exec(found.html)?.[1];
    const list = [...(og ? [{ url: new URL(og.replace(/&amp;/g, "&"), page).href, tag: "", context: "og:image" }] : []), ...found.imgs]
      .filter((i) => /^https?:/.test(i.url) && !/\.svg(\?|$)|logo|icon|avatar|sprite|pixel|badge|spacer|placeholder|gravatar|1x1/i.test(i.url))
      .filter((i, n, a) => a.findIndex((j) => j.url === i.url) === n).slice(0, 10);
    for (const i of list) {
      const r = await fetch(i.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) }).catch(() => undefined);
      const buf = r?.ok ? Buffer.from(await r.arrayBuffer()) : undefined;
      const m = buf ? await sharp(buf).metadata().catch(() => undefined) : undefined;
      if (m?.width && m.width < 300) continue;
      const meta = buf ? await embeddedRights(buf) : "";
      const text = `${i.context} ${meta}`, host = new URL(i.url).hostname;
      const credit = (/(?:photo|image|credit)s?\s*(?:by|:)?\s*([^.|]{3,80})/i.exec(i.context)?.[0] ?? /copyright[^\x00]{0,60}/i.exec(meta)?.[0] ?? "").trim();
      const commons = buf ? await commonsBySha1(buf) : undefined;
      const gov = await federalAgency(i.url).catch(() => undefined);
      const [verdict, next] = commons ? ["free license (exact Commons file)", `pnpm fc news-photo use <slug> "${commons}"`]
        : WIRE.test(text) ? ["news agency: not usable without a paid license", "license it from the agency, or embed it (Getty: news-embed with the embed link)"]
        : SOCIAL.test(text) ? ["social post", "pnpm fc news-embed <post url>"]
        : gov || GOV_CREDIT.test(text) ? [gov ? `on a ${gov} site (gov checks the credit)` : "credited to a federal agency", gov ? `pnpm fc news-photo gov <slug> --url ${i.url} --page ${(await federalAgency(page).catch(() => undefined)) ? page : "<the agency page it is on>"}` : "find it on the agency's site or DVIDS, then news-photo gov"]
        : FREE.test(text) ? ["free license", "find the original on that site, then news-photo search/use"]
        : PRESS.test(text) || NEWSWIRES[siteOf(i.url)] ? ["press image", "find the company's release or newsroom page, then news-photo press --page"]
        : ["owner unknown or the publisher's own", "not usable; search for a licensed photo of the same subject"];
      rows.push({ page, image: i.url, size: m?.width ? `${m.width}×${m.height}` : "?", credit: credit.slice(0, 90), verdict, next, ...(commons ? { commons } : {}) });
    }
  }
  const file = path.join(ROOT, ".cache/news-photo-trace.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2));
  let last = "";
  for (const r of rows) {
    if (r.page !== last) console.log(`\n${(last = r.page)}`);
    if (!r.image) { console.log(`  ✗ ${r.verdict}: ${r.next}`); continue; }
    console.log(`  · ${r.verdict} · ${r.size}${r.credit ? ` · "${r.credit}"` : ""}\n      ${r.image.slice(0, 140)}\n      → ${r.next}`);
  }
  console.log(`\n${rows.filter((r) => r.image).length} images on ${pages.length} pages; details in ${path.relative(ROOT, file)}`);
}
