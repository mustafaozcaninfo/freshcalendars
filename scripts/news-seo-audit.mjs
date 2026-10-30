#!/usr/bin/env node
/**
 * SEO-HARITASI-TAM.md compliance audit for the built /news/ section (dist/news).
 * Each check maps to a rule in the playbook (section/line in the label). Prints PASS/FAIL
 * per rule with evidence; exits 1 on any FAIL. Usage: node scripts/news-seo-audit.mjs [distDir]
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPuzzle, puzzleOf } from "../apps/news/src/lib/puzzles.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(process.argv[2] ?? path.join(ROOT, "dist/news"));
const ARTICLES_SRC = path.join(ROOT, "apps/news/src/content/articles");

const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== "_astro") walk(p); }
    else if (f === "index.html") pages.push(p);
  }
})(dist);
const rel = (p) => "/news/" + path.relative(dist, path.dirname(p)).split(path.sep).filter(Boolean).map((s) => s + "/").join("");
const html = Object.fromEntries(pages.map((p) => [rel(p), readFileSync(p, "utf8")]));
const urls = Object.keys(html).sort();

const ldOf = (h) => [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const nodes = (h) => ldOf(h).flatMap((d) => d["@graph"] ?? [d]);
const types = (h) => nodes(h).map((n) => n["@type"]);
const mainText = (h) => {
  const m = h.match(/<main id="main"[^>]*>([\s\S]*?)<\/main>/);
  return (m ? m[1] : h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");
};
const isArticle = (h) => types(h).some((t) => /NewsArticle$/.test(t));
const articleUrls = urls.filter((u) => isArticle(html[u]));

const results = [];
function check(id, label, fn) {
  let fails = [];
  try { fails = fn() ?? []; } catch (e) { fails = [`error: ${e.message}`]; }
  results.push({ id, label, ok: fails.length === 0, fails });
}
const each = (list, pred) => list.flatMap((u) => { const r = pred(u, html[u]); return r ? [`${u}: ${r}`] : []; });

// ── 01 Visual semantics / layout ───────────────────────────────────────────
check("01-H1", "Exactly one H1 per page (§01 checklist, §02 C)", () =>
  each(urls, (u, h) => { const n = (h.match(/<h1[\s>]/g) ?? []).length; return n === 1 ? null : `${n} H1`; }));
check("01-ADS-CENTER", "One top ad under the breadcrumb (stories: plus one fixed-size banner above the headline), other ads stay out of the centerpiece; labeled, space-reserved, ≤6 in-flow + ≤3 sidebar rail per page, none on policy pages (§01 l.214, l.314)", () =>
  each(urls, (u, h) => {
    const main = h.match(/<main id="main"[\s\S]*?<\/main>/)?.[0] ?? "";
    // Stories may open with one fixed-height banner above the headline, under the menu bar
    // (docs/NEWS-ADS.md); it is checked on its own, and no other ad may precede the H1.
    const banners = [...main.matchAll(/<aside class="ad-slot ad-slot--banner"[^>]*>/g)];
    if (banners.length > 1) return `${banners.length} banner units (max 1)`;
    if (banners.length && !isArticle(h)) return "banner unit outside a story";
    if (banners.length && (!/aria-label="Advertisement"/.test(banners[0][0]) || banners[0].index > main.indexOf("<h1"))) return "banner unit unlabeled or below the H1";
    const ads = [...main.matchAll(/<aside class="ad-slot[^"]*"[^>]*>/g)].filter((m) => !/ad-slot--banner/.test(m[0]));
    const stray = (main.match(/<ins class="adsbygoogle/g) ?? []).length - ads.length - banners.length;
    if (stray) return `${stray} ad unit(s) outside an .ad-slot wrapper`;
    if (!ads.length) return null;
    if (/<meta name="robots" content="noindex/.test(h) || /\/(about|editorial-policy|corrections-policy|masthead)\/$/.test(u)) return "ads on a policy or noindex page";
    // The sidebar rail (wide screens only, one sticky unit in view at a time) is counted on its own.
    const side = ads.filter((m) => /ad-slot--side/.test(m[0])).length;
    if (ads.length - side > 6) return `${ads.length - side} in-flow ad units (max 6)`;
    if (side > 3) return `${side} sidebar rail units (max 3)`;
    if (ads.some((m) => !/aria-label="Advertisement"/.test(m[0]))) return "ad unit without the Advertisement label";
    // One top unit, after the headline block: below the H1 and lede on listings, below the hero
    // image on stories, so the H1, lede, byline and hero stay unbroken; the rest follow the centerpiece rule.
    const tops = ads.filter((m) => /ad-slot--top/.test(m[0]));
    if (tops.length > 1) return `${tops.length} top ad units (max 1)`;
    if (tops.length) {
      const before = main.slice(0, tops[0].index);
      if (!/<\/h1>/.test(before)) return "top ad above the H1";
      if (isArticle(h) && !/<\/figure>/.test(before)) return "top ad between the headline and the hero image";
    }
    const rest = ads.filter((m) => !/ad-slot--top/.test(m[0]));
    if (!rest.length) return null;
    const first = rest[0].index;
    if (isArticle(h)) {
      // Centerpiece: H1, lede, hero, key points and the first two prose sections stay unbroken.
      const prose = main.indexOf('<div class="prose-news');
      if (prose < 0 || first < prose) return "ad before the story body";
      const h2s = (main.slice(prose, first).match(/<h2[\s>]/g) ?? []).length;
      if (first < main.indexOf("</div>", prose) && h2s < 2) return `in-article ad after only ${h2s} section(s)`;
    } else {
      // Listings: the H1, lede and the first content block come before any ad.
      const firstBlock = main.search(/<\/section>|<\/article>/);
      if (firstBlock < 0 || first < firstBlock) return "ad above the first content block";
    }
    return null;
  }));
check("01-ADS-SPOILER", "No in-article ad inside a spoiler section: puzzle answers run unbroken from their (spoilers) heading to the next section (Google ad placement policy, accidental clicks)", () =>
  each(urls, (u, h) => {
    const prose = h.match(/<div class="prose-news[\s\S]*$/)?.[0] ?? "";
    for (const m of prose.matchAll(/<aside class="ad-slot[^"]*ad-slot--mid/g)) {
      const heads = [...prose.slice(0, m.index).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)];
      if (heads.length && /\bspoilers?\b/i.test(heads.at(-1)[1])) return "in-article ad inside a spoiler section";
    }
    return null;
  }));
check("01-ADS-LOAD", "Ads load at page load without blocking: no <script src> for AdSense, preconnect hint, reserved min-height (§01 SOP, CWV)", () =>
  each(urls, (u, h) => {
    if (!/class="ad-slot/.test(h)) return /googlesyndication/.test(h) ? "AdSense hints on a page without ads" : null;
    if (/<script[^>]+adsbygoogle\.js/.test(h)) return "render-path <script src> for adsbygoogle.js";
    if (!/<link rel="preconnect" href="https:\/\/pagead2\.googlesyndication\.com"/.test(h)) return "missing preconnect to pagead2.googlesyndication.com";
    if (!/\.ad-slot\{[^}]*min-height:\d/.test(h)) return "ad slots without a reserved min-height";
    if (/ad-slot--top/.test(h) && /\.ad-slot:has\(ins\[data-ad-status="?unfilled"?\]\)\{display:none/.test(h)) return "top ad collapses when unfilled (shifts the H1: CLS)";
    return null;
  }));
check("01-GA-LOAD", "Google Analytics on every page, loaded after window load: no gtag <script src> in the HTML (CWV)", () =>
  each(urls, (u, h) => {
    if (/<script[^>]+googletagmanager\.com\/gtag/.test(h)) return "render-path <script src> for gtag.js";
    return /gtag\((['"])config\1,\s*(?:(['"])G-[A-Z0-9]+\2|\w+)\)/.test(h) && /G-VT08H0GXHZ/.test(h) ? null : "GA4 snippet missing";
  }));
check("01-NEWSBAR", "Every page has the news bar: story search and crawlable links to every section (hub links on all pages)", () =>
  each(urls, (u, h) => {
    // Story search is either the news bar form or the shared header search, which also loads the news index.
    const barSearch = /<form class="nb-search[^"]*"[^>]*data-news-search/.test(h);
    const siteSearch = /<form class="site-search[^"]*"[^>]*data-site-search/.test(h) && h.includes("/news/search/index.json");
    if (!barSearch && !siteSearch) return "no news search";
    // Section links come from the news bar or, on listing and policy pages, the News directory rail.
    const nav = (h.match(/<nav class="nb-sections[^"]*" aria-label="News sections"[\s\S]*?<\/nav>/)?.[0] ?? "") +
      (h.match(/<aside class="news-rail"[^>]*aria-label="News directory"[\s\S]*?<\/aside>/)?.[0] ?? "");
    const cats = urls.filter((x) => /^\/news\/category\/[a-z0-9-]+\/$/.test(x));
    const missing = cats.filter((c) => !nav.includes(`href="${c}"`));
    return missing.length ? `section links missing: ${missing.join(" ")}` : null;
  }));
check("01-H1-FIT", "Headlines use the full column: the calendar site's 14-16ch h1 cap is lifted on news pages; the breadcrumb shows the current page", () =>
  each(urls, (u, h) => {
    if (!/\.news-main h1,\.news-main h2,\.news-main h3\{max-width:none/.test(h)) return "h1 max-width cap not lifted";
    if (/\.crumbs li:last-child\{display:none\}/.test(h)) return "breadcrumb hides the current page";
    return null;
  }));
check("01-HERO-IMG", "Primary image has alt, width, height; LCP image eager + high priority (§01 SOP)", () =>
  each(articleUrls, (u, h) => {
    const pic = h.match(/<picture[\s\S]*?<\/picture>/)?.[0];
    if (!pic) return "no hero <picture>";
    const img = pic.match(/<img [^>]+>/)[0];
    if (!/ alt="[^"]{10,}"/.test(img)) return "hero alt missing/short";
    if (!/ width="\d+"/.test(img) || !/ height="\d+"/.test(img)) return "hero without width/height";
    if (!/loading="eager"/.test(img) || !/fetchpriority="high"/.test(img)) return "hero not eager/high";
    return null;
  }));
check("01-IMG-ALT", "Every <img> has alt + width + height (§02 C HTML checklist)", () =>
  each(urls, (u, h) => {
    const bad = (h.match(/<img [^>]+>/g) ?? []).filter((t) => !/\salt(="|[\s>])/.test(t) || !/ width="/.test(t) || !/ height="/.test(t));
    return bad.length ? `${bad.length} img without alt/width/height` : null;
  }));
check("01-BREADCRUMB", "Visible breadcrumb matches BreadcrumbList (§01 SOP, §08 schema only for visible content)", () =>
  each(urls.filter((u) => u !== "/news/"), (u, h) => {
    const visible = /<nav class="crumbs" aria-label="Breadcrumb"/.test(h);
    const ld = types(h).includes("BreadcrumbList");
    return visible && ld ? null : `visible=${visible} ld=${ld}`;
  }));

check("01-IMG-TITLE", "Every image has a descriptive alt (≥10 chars) and a title attribute (image SEO; §02 C l.633)", () =>
  each(urls, (u, h) => {
    const imgs = h.match(/<main id="main"[\s\S]*?<\/main>/)?.[0].match(/<img [^>]+>/g) ?? [];
    const logo = (h.match(/<header[\s\S]*?<\/header>/)?.[0].match(/<img [^>]+>/g) ?? []);
    const bad = [...imgs, ...logo].filter((t) => !/\salt="[^"]{10,}"/.test(t.replace(/alt="Fresh Calendars"/, 'alt="Fresh Calendars logo"')) || !/\stitle="[^"]{5,}"/.test(t));
    return bad.length ? `${bad.length} image(s) without alt/title` : null;
  }));
check("01-IMG-CAPTION", "Article hero has a visible figcaption with credit (text next to the image; §01 SOP, §02 C l.633)", () =>
  each(articleUrls, (u, h) => (/<figure class="hero"[\s\S]*?<figcaption[^>]*>[^<]{20,}[\s\S]*?class="credit"[\s\S]*?<\/figure>/.test(h) ? null : "hero without caption/credit")));

// ── 02 Originality / HTML quality ──────────────────────────────────────────
check("02-SSR-LINKS", "Navigation and content links are server-rendered <a href> (§02 C l.659)", () =>
  each(urls, (u, h) => ((h.match(/<a [^>]*href="[^"#][^"]*"/g) ?? []).length >= 15 ? null : "too few server-rendered links")));
check("02-NO-JS-CONTENT", "Content does not depend on client JS (≤2 inline scripts, no framework bundles) (§02 C)", () =>
  each(urls, (u, h) => {
    const scripts = (h.match(/<script(?![^>]*(ld\+json|speculationrules|data-theme-boot))[^>]*>/g) ?? []);
    const external = scripts.filter((s) => / src=/.test(s));
    return external.length || scripts.length > 2 ? `${scripts.length} scripts (${external.length} external)` : null;
  }));
check("02-CANONICAL", "Self-referencing absolute canonical (§02 C l.660)", () =>
  each(urls, (u, h) => {
    const c = h.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (u === "/news/404/") return null;
    return c === `https://freshcalendars.com${u}` ? null : `canonical=${c}`;
  }));
check("02-ROBOTS", "Indexable pages carry index,follow + max-image-preview:large; utility pages noindex (§02 C l.661)", () =>
  each(urls, (u, h) => {
    const r = h.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
    return /^index, follow/.test(r) && /max-image-preview:large/.test(r) ? null : `robots="${r}"`;
  }));
check("02-LANG", "html lang + hreflang en/x-default (§02 C)", () =>
  each(urls, (u, h) => (/<html lang="en"/.test(h) && /hreflang="en"/.test(h) && /hreflang="x-default"/.test(h) ? null : "lang/hreflang missing")));

// Writing rules: banned AI-tell words and structures (§02 B l.598-622, §08)
// §02 B l.603 verbatim list (+ obvious inflections).
const BANNED_EN = ["delve", "tapestry", "testament", "interplay", "intricate", "meticulous", "meticulously", "pivotal", "crucial", "underscore", "underscores",
  "showcase", "showcases", "align", "aligns", "valuable", "realm", "nuanced", "robust", "seamless", "seamlessly", "leverage", "leveraging", "foster",
  "navigate", "navigating", "elevate", "embark", "unleash", "unlock", "harness", "bustling", "vibrant", "ever-evolving", "game-changer", "cutting-edge",
  "dive in", "dive into", "in today's digital world", "it's important to note", "it is important to note", "when it comes to", "in conclusion", "moreover", "furthermore"];
const words = (u) => mainText(html[u]).toLowerCase();
/**
 * Text a daily puzzle page quotes verbatim from the official puzzle data (Connections group names
 * and entries, clues), lowercased. It is the publisher's wording, not ours, so the writing-style
 * checks skip it; everything we write around it is still checked.
 */
const officialText = (u) => {
  const p = puzzleOf(u.split("/").filter(Boolean).at(-1) ?? "");
  const d = p && loadPuzzle(p.game, p.date);
  if (!d) return [];
  if (p.game === "connections") return d.categories.flatMap((c) => [c.title, ...c.cards.map((x) => x.content)]).map((s) => s.toLowerCase());
  if (p.game === "mini") return d.clues.map((c) => c.text.toLowerCase());
  if (p.game === "strands") return [d.clue.toLowerCase()];
  return [];
};
// Only the quoted form is skipped: capitalized as the puzzle prints it ("Cutting-Edge"), never the
// same words in lowercase running text, which is ours.
const ownWords = (u) => officialText(u).reduce(
  (t, s) => t.replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => (m === m.toLowerCase() ? m : " ")),
  mainText(html[u]),
).toLowerCase();
check("02-BANNED-WORDS", "No banned AI-tell words/phrases in article or policy text (§02 B l.603)", () =>
  each(urls.filter((u) => !/\/page\/\d+\/$/.test(u)), (u) => { const text = ownWords(u); const hit = BANNED_EN.filter((w) => new RegExp(`\\b${w.replace(/[-']/g, ".")}\\b`).test(text)); return hit.length ? hit.join(", ") : null; }));
check("02-EMDASH", "Em-dash overuse avoided (≤2 per article) (§02 B l.605)", () =>
  each(articleUrls, (u, h) => {
    const prose = (h.match(/<div class="prose-news[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "") + (h.match(/<p class="news-lede[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
    const n = (prose.match(/—/g) ?? []).length;
    return n > 2 ? `${n} em dashes in article prose` : null;
  }));
check("02-NOT-X-BUT-Y", "No 'not X, but Y' / 'it's not just X' constructions (§02 B l.606)", () =>
  each(articleUrls, (u) => { const m = words(u).match(/\b(it'?s|is|isn't) not (just|only|merely)\b[^.]{0,60}\b(but|it'?s)\b|\bnot just\b[^.]{0,60}\bbut\b/); return m ? `"${m[0].slice(0, 60)}"` : null; }));
check("02-ENDINGS", "Paragraphs/sections do not end with formulaic wrap-ups (§02 B l.607)", () =>
  each(articleUrls, (u) => (/\b(in summary|to sum up|all in all|in conclusion)\b|(^|[.!?:]\s+)(ultimately|overall|in short|in the end),/.test(words(u)) ? "formulaic wrap-up" : null)));

// ── 09 Google News technical checklist (Publisher Center answer 6204050, 9607104; Article structured data) ──
check("09-NEWSARTICLE-TYPE", "Story JSON-LD uses NewsArticle (Google recognizes Article, NewsArticle, BlogPosting only)", () =>
  each(articleUrls, (u, h) => (nodes(h).some((n) => n["@type"] === "NewsArticle") ? null : `type is ${types(h).find((t) => /Article$/.test(t))}`)));
check("09-GOOGLEBOT", "Every page has robots and googlebot meta with the same directives", () =>
  each(urls, (u, h) => { const r = h.match(/<meta name="robots" content="([^"]+)"/)?.[1]; const g = h.match(/<meta name="googlebot" content="([^"]+)"/)?.[1]; return r && g && r === g ? null : `robots=${r} googlebot=${g}`; }));
check("09-ARTICLE-FIELDS", "NewsArticle has headline = H1, description, image, dates, typed author with url, publisher, mainEntityOfPage, articleSection", () =>
  each(articleUrls, (u, h) => {
    const a = nodes(h).find((n) => n["@type"] === "NewsArticle"); if (!a) return "no NewsArticle";
    const h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
    const miss = ["headline", "description", "image", "datePublished", "dateModified", "author", "publisher", "mainEntityOfPage", "articleSection"].filter((k) => !a[k]);
    if (a.headline !== h1) miss.push(`headline≠H1`);
    for (const au of [].concat(a.author)) if (!au["@type"] || !au.url || !au.name) miss.push("author @type/url/name");
    return miss.length ? miss.join(", ") : null;
  }));
check("09-IMAGE-MATCH", "og:image is the first NewsArticle image and the hero is in the HTML (not JS-only)", () =>
  each(articleUrls, (u, h) => {
    const og = h.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const a = nodes(h).find((n) => n["@type"] === "NewsArticle");
    const first = [].concat(a?.image ?? [])[0];
    const file = (x) => (x ?? "").split("/").pop()?.split("_")[0];
    if (og !== first) return `og:image ${og} ≠ image[0] ${first}`;
    return h.includes(file(og)) && /<img[^>]+src="[^"]+"/.test(h) ? null : "hero not in HTML";
  }));
check("09-VISIBLE-BYLINE-DATE", "Visible byline and publication date sit apart from the first sentence of the story", () =>
  each(articleUrls, (u, h) => (/<p class="byline"/.test(h) && /<p class="dates"[\s\S]*?<time datetime=/.test(h) ? null : "byline/date block missing")));

// ── 03 Scaled content / velocity ───────────────────────────────────────────
check("03-UNIQUE-TITLES", "Unique <title> and meta description per page (no templated duplicates) (§03 risks)", () => {
  const seen = {}; const dup = [];
  for (const u of urls) for (const k of ["title", "desc"]) {
    const v = k === "title" ? html[u].match(/<title>([^<]+)/)?.[1] : html[u].match(/<meta name="description" content="([^"]+)"/)?.[1];
    if (!v) { dup.push(`${u}: missing ${k}`); continue; }
    const key = k + v; if (seen[key]) dup.push(`${u} duplicates ${seen[key]} (${k})`); else seen[key] = u;
  }
  return dup;
});

// ── 04 Topical map / internal links ────────────────────────────────────────
check("04-OUTER-CORE", "Each article links ≥2 core calendar pages (outer → core) (§04 l.1041, l.1210)", () =>
  each(articleUrls, (u, h) => {
    const core = new Set((h.match(/<main id="main"[\s\S]*<\/main>/)?.[0].match(/href="\/(?!news\/)[a-z][^"]*"/g) ?? []));
    return core.size >= 2 ? null : `${core.size} core links`;
  }));
check("04-NO-ORPHANS", "Zero orphan pages; every page reachable from /news/ (§04 KPI)", () => {
  const linked = new Set(["/news/"]);
  for (const u of urls) for (const m of html[u].matchAll(/href="(\/news\/[^"#?]*)"/g)) linked.add(m[1]);
  return urls.filter((u) => !linked.has(u) && u !== "/news/404/").map((u) => `${u} not linked`);
});
check("04-TOPIC-FOCUS", "Articles stay inside the declared source context (calendar/holiday/date categories) (§04 l.1010-1015)", () =>
  each(articleUrls, (u, h) => {
    const sec = nodes(h).find((n) => /NewsArticle$/.test(n["@type"]))?.articleSection;
    return ["Holidays", "Time Change", "School Calendars", "Retail Dates", "Sky Events", "UK & Canada", "Planning", /* owner decision 2026-10-20 */ "Puzzles", /* split out of Planning 2026-10-23 */ "Elections", "Calendar Guides", /* owner decision 2026-10-29 */ "Sports", /* owner decision 2026-10-30 */ "Entertainment"].includes(sec) ? null : `section=${sec}`;
  }));

// ── 05/08 Schema rules ─────────────────────────────────────────────────────
const FORBIDDEN_TYPES = ["FAQPage", "QAPage", "DiscussionForumPosting", "Review", "AggregateRating", "HowTo", "Rating"];
check("08-SCHEMA-FORBIDDEN", "No FAQPage/QAPage/DiscussionForumPosting/Review/AggregateRating on editorial pages (§00 l.50, §08)", () =>
  each(urls, (u, h) => { const bad = JSON.stringify(ldOf(h)).match(new RegExp(`"@type":"(${FORBIDDEN_TYPES.join("|")})"`, "g")); return bad ? bad.join(",") : null; }));
check("08-SCHEMA-VISIBLE", "Schema describes visible content: headline = H1, dates and author shown on page (§01 l.302, §08)", () =>
  each(articleUrls, (u, h) => {
    const a = nodes(h).find((n) => /NewsArticle$/.test(n["@type"]));
    const h1 = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, "").replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").trim();
    if (a.headline !== h1) return `headline ≠ H1`;
    if (!h.includes(`datetime="${a.datePublished}"`)) return "datePublished not visible";
    if (a.dateModified !== a.datePublished && !h.includes(`datetime="${a.dateModified}"`)) return "dateModified not visible";
    for (const au of a.author) if (!h.includes(`>${au.name}</a>`)) return `author ${au.name} not visible`;
    return null;
  }));
check("08-SCHEMA-ISO", "Complete author fields and ISO-8601 dates in JSON-LD (§08 l.2618)", () =>
  each(articleUrls, (u, h) => {
    const a = nodes(h).find((n) => /NewsArticle$/.test(n["@type"]));
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    if (!iso.test(a.datePublished) || !iso.test(a.dateModified)) return "non-ISO date";
    if (!a.author?.length || a.author.some((x) => !x["@id"] || !x.name)) return "author incomplete";
    if (!nodes(h).some((n) => n["@id"] === a.author[0]["@id"])) return "author node missing";
    return null;
  }));
check("08-FAQ-VISIBLE", "Editorial FAQ is visible HTML, not schema-only (§08)", () =>
  each(articleUrls, (u, h) => (/class="faq-block"/.test(h) || !/Frequently asked/.test(h) ? null : "FAQ heading without visible items")));

// ── 06/07 Entity, E-E-A-T, sameAs ──────────────────────────────────────────
check("07-ENTITY-IDS", "One consistent Organization entity (@id, name, logo) across pages (§07 l.2150-2159)", () => {
  const orgs = new Set(urls.map((u) => JSON.stringify(nodes(html[u]).find((n) => n["@id"] === "https://freshcalendars.com/#organization") ?? null)));
  return orgs.size === 1 && !orgs.has("null") ? [] : [`${orgs.size} different Organization nodes`];
});
check("07-SAMEAS", "sameAs only for verified profiles (none claimed yet) (§07 l.2148)", () =>
  each(urls, (u, h) => { const s = nodes(h).flatMap((n) => n.sameAs ?? []); return s.length ? `sameAs: ${s.join(" ")}` : null; }));
// A Person is accepted only when its author file records the publisher's confirmation (confirmedAt).
const authorsDir = path.join(ROOT, "apps/news/src/content/authors");
const confirmedPeople = new Set(
  readdirSync(authorsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.replace(/\.json$/, ""), JSON.parse(readFileSync(path.join(authorsDir, f), "utf8"))])
    .filter(([, a]) => a.kind === "Person" && a.confirmedAt)
    .map(([slug]) => `https://freshcalendars.com/news/author/${slug}/`),
);
check("07-NO-FAKE-EXPERTS", "No invented people: every Person is a confirmed author (§02 l.2587, §07 l.2148)", () =>
  each(urls, (u, h) => {
    const bad = nodes(h).filter((n) => n["@type"] === "Person" && !confirmedPeople.has(n["@id"]));
    return bad.length ? `unconfirmed Person ${bad.map((n) => n.name ?? n["@id"]).join(", ")}` : null;
  }));
check("07-TRUST-PAGES", "About / editorial / corrections / masthead pages exist and are linked from the Organization (§07 entity checklist)", () => {
  const need = ["/news/about/", "/news/editorial-policy/", "/news/corrections-policy/", "/news/masthead/"];
  const miss = need.filter((u) => !html[u]);
  const org = nodes(html["/news/"]).find((n) => n["@type"] === "Organization");
  if (!org.publishingPrinciples || !org.correctionsPolicy || !org.masthead) miss.push("Organization policy links missing");
  return miss;
});

// ── News-specific exception to §08 l.2591 (visible dates) ───────────────────
check("08-NEWS-DATES", "/news/ exception: visible byline, published and updated date/time ET (l.2591 note)", () =>
  each(articleUrls, (u, h) => (/class="byline"/.test(h) && /Published <time/.test(h) && / ET<\/time>/.test(h) ? null : "byline/date missing")));
check("08-SOURCES", "Every news/update article cites ≥1 primary source with a link (§02 SOP Who/How/Why, editorial policy)", () =>
  each(articleUrls, (u, h) => ((h.match(/<section class="sources"[\s\S]*?<\/section>/)?.[0].match(/<a href="https?:/g) ?? []).length >= 1 ? null : "no linked sources")));

// ── Sitemaps ───────────────────────────────────────────────────────────────
check("02-SITEMAP", "Every indexable page is in a sitemap; no noindex page is (§02 C l.661)", () => {
  // Every child of the sitemap index except the 48-hour News sitemap, so a new sitemap is checked too.
  const index = readFileSync(path.join(dist, "sitemap.xml"), "utf8");
  const children = [...index.matchAll(/<loc>[^<]*\/news\/([^<\/]+\.xml)<\/loc>/g)].map((m) => m[1]).filter((f) => f !== "news-sitemap.xml");
  const xml = children.map((f) => existsSync(path.join(dist, f)) ? readFileSync(path.join(dist, f), "utf8") : "").join("");
  const inMap = new Set([...xml.matchAll(/<loc>https:\/\/freshcalendars\.com([^<]+)<\/loc>/g)].map((m) => m[1]));
  const out = [];
  for (const u of urls) {
    const noindex = /<meta name="robots" content="noindex/.test(html[u]);
    const paged = /\/page\/\d+\/$/.test(u) || u === "/news/404/";
    if (!noindex && !paged && !inMap.has(u)) out.push(`${u} missing from sitemaps`);
    if (noindex && inMap.has(u)) out.push(`${u} noindex but in sitemap`);
  }
  return out;
});

// ── Source-level checks on article markdown ────────────────────────────────
check("02-WHO-HOW-WHY", "Who/How/Why visible: byline links to author page with bio; editorial policy linked site-wide (§02 l.588)", () =>
  each(articleUrls, (u, h) => (/rel="author"/.test(h) && /class="author-card"/.test(h) && /href="\/news\/editorial-policy\/"/.test(h) ? null : "who/how/why signals missing")));


// ── Additional rules from the full playbook pass ───────────────────────────
const WARN = [];
const warn = (id, label, fn) => { const f = fn() ?? []; if (f.length) WARN.push({ id, label, fails: f }); };
// Velocity was a hard cap (150 stories in any 7 days); the owner lifted it on 2026-10-25, so it now only
// reports a busy week. Publish only what the editors can check; the stop rule in the news-seo skill still applies.
warn("03-VELOCITY", "Busy publishing week: more than 150 stories in a 7-day window (informational, cap lifted 2026-10-25) (§03 l.758, l.833)", () => {
  // Velocity is a rate: count stories by datePublished in every rolling 7-day window.
  const days = articleUrls
    .map((u) => nodes(html[u]).find((n) => /NewsArticle$/.test(n["@type"]))?.datePublished)
    .filter(Boolean).map((d) => Date.parse(d)).sort((a, b) => a - b);
  let worst = 0;
  for (let i = 0, j = 0; i < days.length; i++) { while (days[i] - days[j] > 7 * 864e5) j++; worst = Math.max(worst, i - j + 1); }
  return worst <= 150 ? [] : [`${worst} stories in the busiest 7 days`];
});
const proseOf = (h) => (h.match(/<div class="prose-news[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "");
const plain = (s) => s.replace(/<[^>]+>/g, " ").replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();

check("01-HEADING-ORDER", "Logical heading hierarchy, no skipped levels inside <main> (§01 l.315, §08 l.2601)", () =>
  each(urls, (u, h) => {
    const main = h.match(/<main id="main"[\s\S]*?<\/main>/)?.[0] ?? "";
    let prev = 1; const bad = [];
    for (const m of main.matchAll(/<h([1-6])[\s>]/g)) { const l = +m[1]; if (l > prev + 1) bad.push(`h${prev}→h${l}`); prev = l; }
    return bad.length ? bad.slice(0, 3).join(", ") : null;
  }));
check("02-FOOTPRINT", "No builder/AI footprint meta or placeholder text (generator meta, Lorem, 'Project', TODO) (§02 C l.626, l.492)", () =>
  each(urls, (u, h) => {
    const hits = ["<meta name=\"generator\"", "lorem ipsum", "lovable", "untitled", "todo:", "placeholder text", "your title here"].filter((k) => h.toLowerCase().includes(k));
    return hits.length ? hits.join(", ") : null;
  }));
check("02-NOT-ONLY", "No 'not only … but also' chains (§02 B l.607)", () =>
  each(articleUrls, (u, h) => (/\bnot only\b[^.]{0,80}\bbut also\b/i.test(plain(proseOf(h))) ? "not only … but also" : null)));
check("08-ABBREV", "Abbreviations defined on first use in article prose (§08 l.2331, l.2609)", () =>
  each(articleUrls, (u, h) => {
    const text = plain((h.match(/<p class="news-lede[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "") + " " + proseOf(h));
    // Abbreviations every US reader knows are exempt.
    const COMMON = new Set(["US", "AXS", "U.S.", "UK", "EU", "ET", "AM", "PM", "TV", "NBC", "ID", "UTC", "NYSE", "SAT", "ACT", "EDM", "AARP", "AAA", "DST", "EST", "EDT", "CST", "CDT", "MST", "MDT", "PST", "PDT", "AKST", "AKDT", "GMT", "BST", "CET", "CEST", "COLA", "SSI", "II", "DC", "NASA", "IRS", "PDF", "PNG",
      // Proper names written in capitals, not abbreviations.
      "TIME", "GOV", "NORC", "LEGO", "PEAK", "IKEA", "H-E-B", "CVS", "UPS", "FOX", "ESPN", "ESPNU", "CBS",
      // Album titles and an artist name styled in capitals (Premios Billboard winners).
      "DINASTIA", "LUX", "MAG",
      // Traffic-analytics company name and the REAL ID program name, proper nouns in capitals.
      "INRIX", "REAL",
      // Restaurant chain name with a capitalized word (Mission BBQ, Veterans Day deals).
      "BBQ",
      // Country name and brand names written in capitals (USA Network, IMAX theaters).
      "USA", "IMAX",
      // Words quoted as printed in capitals ("10-22-38 ASTORIA", the first xerographic copy).
      "ASTORIA",
      // Phone mnemonics (1-800-MEDICARE, 1-800-QUIT-NOW).
      "MEDICARE", "QUIT-NOW",
      // Text-message keywords as the agencies print them (SmokefreeTXT: QUIT, HELP; CDC: QUITNOW).
      "QUIT", "QUITNOW", "HELP",
      // Spreadsheet function names.
      "WEEKNUM", "ISOWEEKNUM", "NYC", "USPS",
      // IRS form suffixes (Form 1099-NEC, 1099-MISC).
      "NEC", "MISC",
      // Postal codes, as familiar as ID.
      "ZIP",
      // Show titles styled in capitals (Hulu November 2026 list: "MAO", "LOL Live with Comedian CP").
      "MAO", "LOL",
      // Arena names built on company names written in capitals (PPG Paints Arena, SAP Center).
      "PPG", "SAP", "UBS",
      // Broadcast call letters and a transit route name styled in capitals (WISN 12 News, WUWM, MCTS CONNECT 1).
      "WISN", "WUWM", "CONNECT",
      // More call letters (KWQC, WDIV, KTTC) and a promo code as the company prints it (Lime HEADCOUNT).
      "KWQC", "WDIV", "KTTC", "HEADCOUNT"]);
    const undefined_ = [];
    const seen = new Set();
    for (const m of text.matchAll(/\b([A-Z][A-Z-]{1,}[A-Z])\b/g)) {
      const a = m[1]; if (seen.has(a) || COMMON.has(a)) continue; seen.add(a);
      // Date-format patterns such as YYDDD or YYYY-DDD are not abbreviations.
      if (/^[YMD-]+$/.test(a)) continue;
      // A word spelled out letter by letter ("C-H-E-E-S-E", as quoted from a crossword clue) is not an abbreviation.
      if (/^(?:[A-Z]-){2,}[A-Z]$/.test(a)) continue;
      const at = m.index; const around = text.slice(Math.max(0, at - 120), at + a.length + 2);
      if (!around.includes(`(${a})`) && !new RegExp(`\\(${a}\\)`).test(text.slice(0, at + a.length + 2))) undefined_.push(a);
    }
    return undefined_.length ? `not expanded on first use: ${undefined_.join(", ")}` : null;
  }));
check("02-BURSTINESS", "Sentence length varies (coefficient of variation ≥ 0.35) — no uniform rhythm (§02 B l.611, R043)", () =>
  each(articleUrls, (u, h) => {
    const text = plain(proseOf(h).replace(/<table[\s\S]*?<\/table>|<ul[\s\S]*?<\/ul>|<ol[\s\S]*?<\/ol>|<h[23][\s\S]*?<\/h[23]>/g, " "));
    const lens = text.split(/(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.split(/\s+/).length).filter((n) => n > 2);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    const cv = sd / mean;
    return cv >= 0.35 ? null : `CV ${cv.toFixed(2)} over ${lens.length} sentences`;
  }));
check("02-SUPERLATIVES", "No unverifiable superiority claims ('best', '#1', 'leading', 'ultimate', 'most trusted') (§F R036, §06 l.1611)", () =>
  each(urls, (u, h) => { // Claims about ourselves or a product; "the best time to watch" is advice, not a superiority claim.
    const m = plain(proseOf(h) || mainText(h)).match(/\b(the best (calendar|site|source|resource|website|place to)|#1|number one|leading provider|ultimate guide|most trusted|world-class|unbeatable)\b/i); return m ? `"${m[0]}"` : null; }));
check("06-SPONSORED", "Outbound commercial links carry rel=sponsored/nofollow + disclosure (§06 l.1622)", () =>
  each(urls, (u, h) => {
    // Only real outbound hrefs count; the word "affiliate" in a disclosure is fine.
    const hrefs = [...(h.match(/<main id="main"[\s\S]*?<\/main>/)?.[0] ?? "").matchAll(/<a [^>]*href="(https?:[^"]+)"[^>]*>/g)];
    const bad = hrefs.filter((m) => /utm_|amzn\.to|[?&]tag=|affiliate|ref=/.test(m[1]) && !/rel="[^"]*(sponsored|nofollow)/.test(m[0]));
    return bad.length ? bad.map((m) => m[1]).join(" ") : null;
  }));
check("03-LASTMOD", "Sitemap lastmod reflects real edits (updatedAt/publishedAt), not build time (§03 l.838)", () => {
  const xml = readFileSync(path.join(dist, "post-sitemap.xml"), "utf8");
  const today = new Date().toISOString().slice(0, 13);
  const stamps = [...xml.matchAll(/<lastmod>([^<]+)</g)].map((m) => m[1]);
  return stamps.filter((t) => t.startsWith(today) && !articleUrls.some((u) => { const a = nodes(html[u]).find((n) => /NewsArticle$/.test(n["@type"])); return a.dateModified === t; })).map((t) => `lastmod ${t} not tied to an article edit`);
});
check("08-INLANG", "en-US declared in JSON-LD inLanguage (§08 l.2572)", () =>
  each(urls, (u, h) => (nodes(h).filter((n) => /Page$|Article$|WebSite/.test(n["@type"])).every((n) => n.inLanguage === "en-US") ? null : "inLanguage missing")));

// ── Feeds, images and story-level rules added from the SEO map gap review ──────────────
const xmlDecode = (t) => t.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const ART = (u) => nodes(html[u]).find((n) => n["@type"] === "NewsArticle");
const indexable = (u) => !/<meta name="robots" content="noindex/.test(html[u]);
check("09-NEWS-SITEMAP", "Google News sitemap: publication name/language, ISO date and title per story; only indexable stories, headline = news:title, last 48h, ≤1,000 URLs (§08 l.2594, §03 l.758)", () => {
  const f = path.join(dist, "news-sitemap.xml");
  if (!existsSync(f)) return ["news-sitemap.xml missing"];
  const xml = readFileSync(f, "utf8"), fails = [];
  const items = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  if (!items.length) return ["news-sitemap.xml has no stories"];
  if (items.length > 1000) fails.push(`${items.length} URLs (max 1,000)`);
  const dates = [];
  for (const it of items) {
    const loc = it.match(/<loc>([^<]+)</)?.[1] ?? "", u = loc.replace("https://freshcalendars.com", "");
    const date = it.match(/<news:publication_date>([^<]+)</)?.[1] ?? "", title = xmlDecode(it.match(/<news:title>([^<]*)</)?.[1] ?? "");
    if (!/<news:name>Fresh Calendars<\/news:name>/.test(it) || !/<news:language>en<\/news:language>/.test(it)) fails.push(`${u}: publication name/language`);
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d([+-]\d\d:\d\d|Z)$/.test(date)) fails.push(`${u}: publication_date "${date}" not ISO 8601`);
    if (!html[u] || !articleUrls.includes(u) || !indexable(u)) { fails.push(`${u}: not an indexable story`); continue; }
    if (ART(u).headline !== title) fails.push(`${u}: news:title differs from headline`);
    dates.push(Date.parse(date));
  }
  const newest = Math.max(...articleUrls.filter(indexable).map((u) => Date.parse(ART(u).datePublished)));
  dates.forEach((d) => { if (newest - d > 48 * 3600e3) fails.push(`entry ${new Date(d).toISOString()} older than 48h before the newest story`); });
  const listed = new Set(items.map((it) => it.match(/<loc>([^<]+)</)[1].replace("https://freshcalendars.com", "")));
  articleUrls.filter((u) => indexable(u) && newest - Date.parse(ART(u).datePublished) < 24 * 3600e3 && !listed.has(u)).forEach((u) => fails.push(`${u}: story from the last 24h missing`));
  return fails;
});
check("07-FEED", "RSS feed: en-US, absolute links and guids, every item is a built indexable story (§07 echo pipeline)", () => {
  const f = path.join(dist, "feed.xml");
  if (!existsSync(f)) return ["feed.xml missing"];
  const xml = readFileSync(f, "utf8"), fails = [];
  if (!/<language>en-US<\/language>/.test(xml)) fails.push("channel language is not en-US");
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  if (!items.length) fails.push("no items");
  for (const it of items) {
    const link = it.match(/<link>([^<]+)</)?.[1] ?? "", guid = it.match(/<guid[^>]*>([^<]+)</)?.[1] ?? "";
    const u = link.replace("https://freshcalendars.com", "");
    if (!/^https:\/\/freshcalendars\.com\/news\//.test(link) || !/^https?:\/\//.test(guid)) fails.push(`item link/guid not absolute: ${link}`);
    else if (!articleUrls.includes(u) || !indexable(u)) fails.push(`${u}: feed item is not an indexable story`);
  }
  return fails;
});
check("09-IMAGE-SIZE", "Story image ≥1200px wide in og:image and schema, with 16:9, 4:3 and 1:1 crops (Article rich results, Discover)", () =>
  each(articleUrls, (u, h) => {
    const w = +(h.match(/<meta property="og:image:width" content="(\d+)"/)?.[1] ?? 0);
    if (w < 1200) return `og:image:width ${w}`;
    const im = ART(u).image, list = Array.isArray(im) ? im : [im];
    return list.length >= 3 ? null : `${list.length} schema image(s), need the 3 crops`;
  }));
check("02-IMG-FILENAME", "Story image file names are descriptive (slug words, not IMG_1234) (§02 C l.633)", () =>
  each(articleUrls, (u, h) => {
    const base = (h.match(/<meta property="og:image" content="[^"]*\/([^/"]+)"/)?.[1] ?? "").split(".")[0].toLowerCase();
    const slugWords = u.split("/").filter(Boolean).pop().split("-").filter((w) => w.length > 3);
    return slugWords.filter((w) => base.includes(w)).length >= Math.min(2, slugWords.length) ? null : `og:image "${base}"`;
  }));
// Datelines were a default city ("New York") that did not say where a story was reported, so they
// are no longer rendered; this keeps one from coming back as hidden text or schema (2026-10-25).
check("08-DATELINE", "No dateline in the page or NewsArticle (§08 l.2594, revised 2026-10-25)", () =>
  each(articleUrls, (u, h) => (/class="dateline"/.test(h) ? "dateline in HTML" : ART(u).dateline ? "schema dateline" : null)));
check("08-NO-OPINION", "No first-person opinion in factual news prose (§08 l.2298, l.2372, l.2600)", () =>
  each(articleUrls, (u, h) => { const m = plain(proseOf(h)).match(/\b(I think|I believe|we believe|in my opinion|in our opinion|honestly,|personally,|I'd say|we'd say|I feel)\b/i); return m ? `"${m[0]}"` : null; }));
check("01-THIN", "No thin stories: at least 300 words of body text (§02 l.548, §08 token economy)", () =>
  each(articleUrls, (u) => { const n = ART(u).wordCount ?? 0; return n >= 300 ? null : `${n} words`; }));

// ── 10 Printable PDFs (Google, Search Off the Record "PDF files"; apps/news/src/lib/pdf-meta.mjs) ──
// Byte-level reads are enough: pdf-meta saves without object streams, so dictionaries stay plain.
const PDF_MAX = 2 * 1024 * 1024;
const pdfLinks = (h) => [...new Set([...h.matchAll(/href="(\/news\/downloads\/[^"]+\.pdf)"/g)].map((m) => m[1]))];
const pngLinks = (h) => [...new Set([...h.matchAll(/href="(\/news\/downloads\/[^"]+\.png)"/g)].map((m) => m[1]))];
const fileOf = (u) => path.join(dist, u.replace(/^\/news\//, ""));
const pdfMapFile = path.join(dist, "..", "news-data", "pdf-canonical.map");
const pdfMap = existsSync(pdfMapFile)
  ? new Map([...readFileSync(pdfMapFile, "utf8").matchAll(/^"~\^(\S+?)\$" "<([^>]+)>/gm)].map((m) => [m[1].replace(/\\(.)/g, "$1"), m[2]]))
  : new Map();
const pdfBytes = (u) => readFileSync(fileOf(u)).toString("latin1");
check("10-PDF-FILES", "Every printable a story offers exists as PDF and PNG, the PDF under 2 MB and text-based (fonts, not page images)", () =>
  each(articleUrls, (u, h) => {
    const bad = [];
    for (const f of [...pdfLinks(h), ...pngLinks(h)]) if (!existsSync(fileOf(f))) bad.push(`missing ${f}`);
    for (const f of pdfLinks(h).filter((x) => existsSync(fileOf(x)))) {
      if (statSync(fileOf(f)).size > PDF_MAX) bad.push(`${f} over 2 MB`);
      if (!/\/Font\b/.test(pdfBytes(f))) bad.push(`${f} has no text layer`);
    }
    return bad.length ? bad.join("; ") : null;
  }));
check("10-PDF-PROPERTIES", "Printable PDFs carry title, author, subject, keywords, en-US language, shown title, copyright and the terms-of-use license", () =>
  each(articleUrls, (u, h) => {
    const bad = [];
    for (const f of pdfLinks(h).filter((x) => existsSync(fileOf(x)))) {
      const b = pdfBytes(f);
      const miss = ["/Title", "/Author", "/Subject", "/Keywords", "/Copyright", "/Lang (en-US)", "/DisplayDocTitle true", "xmpRights:WebStatement>https://freshcalendars.com/page/terms-of-use/"].filter((k) => !b.includes(k));
      if (miss.length) bad.push(`${f}: ${miss.join(", ")}`);
    }
    return bad.length ? bad.join("; ") : null;
  }));
check("10-PDF-LINK-CANONICAL", "Each printable PDF links to its story from the top of the page and is in the nginx canonical map (Link rel=canonical)", () =>
  each(articleUrls, (u, h) => {
    const bad = [];
    for (const f of pdfLinks(h).filter((x) => existsSync(fileOf(x)))) {
      const story = pdfMap.get(f);
      if (!story) { bad.push(`${f} not in pdf-canonical.map`); continue; }
      if (!html[story.replace(/^https:\/\/[^/]+/, "")]) bad.push(`${f} canonical ${story} is not a built story`);
      if (!pdfBytes(f).includes(`/URI (${story})`)) bad.push(`${f} has no top link to ${story}`);
    }
    return bad.length ? bad.join("; ") : null;
  }));
// Print quality of the PDFs as shipped (scripts/lib/pdf-print.mjs). The generators run the same rules on
// the HTML before printing (packages/generator/src/printCheck.ts); this holds every file to them.
const { checkPrintPdf, PDF_LEGACY } = await import("./lib/pdf-print.mjs");
const pdfPrint = new Map();
for (const f of new Set(articleUrls.flatMap((u) => pdfLinks(html[u])))) if (existsSync(fileOf(f))) pdfPrint.set(f, await checkPrintPdf(fileOf(f)));
const legacyOf = (f) => Object.keys(PDF_LEGACY).find((k) => f.startsWith(`/news/downloads/${k}`));
const printFails = (key, skip = () => false) => [...pdfPrint].filter(([f, r]) => r[key].length && !skip(f)).map(([f, r]) => `${f}: ${r[key].join("; ")}`);
check("10-PDF-PAGE", "Printable PDFs are US Letter (612 x 792 pt, either way up); A4 or tabloid only when the file name ends in -a4 or -tabloid", () => printFails("page"));
check("10-PDF-FONTS", "Every font in a printable PDF is embedded, so it prints the same on every machine", () => printFails("fonts", legacyOf));
check("10-PDF-SAFE-AREA", "No text within 12 pt (1/6 in) of a page edge, where home printers cut it off", () => printFails("safe"));
check("10-PDF-OVERLAP", "No two lines of text printed on top of each other (a note under the footer, a label on a badge)", () => printFails("overlap"));
check("10-PDF-TEXT", "Page 1 of every printable PDF has extractable text, including the top link to its story", () => printFails("text"));
warn("10-PDF-RASTER", "Printable PDFs with raster images (Chromium rasterizes box-shadow, filters, SVG patterns, some gradients); redraw them as vector when you regenerate — informational", () => {
  const r = printFails("vector");
  return r.length ? [`${r.length} PDFs`, ...r.slice(0, 7)] : [];
});
warn("10-PDF-TITLE", "Sheet heading does not use the words of its download title (title and h1 should match) — review", () => printFails("title"));
warn("10-PDF-LEGACY", "Printable PDFs exempt from the font rule until regenerated (PDF_LEGACY in scripts/lib/pdf-print.mjs) — informational", () =>
  Object.entries(PDF_LEGACY).map(([k, why]) => `${k} (${[...pdfPrint.keys()].filter((f) => legacyOf(f) === k).length} files): ${why}`));
/** Google Discover: headlines that hide or hype the content (clickbait, outrage) are demoted since the Feb. 2026 core update. */
const CLICKBAIT = ["you won't believe", "won't believe", "shocking", "shocked", "jaw-dropping", "mind-blowing", "what happens next", "this one trick",
  "you need to know", "everyone is talking", "goes viral", "gone wrong", "must see", "must-see", "the truth about", "will shock", "insane", "unbelievable"];
check("11-DISCOVER-HEADLINE", "Headline, social title and lede are plain: no clickbait phrases, no exclamation marks (Google Discover)", () =>
  each(articleUrls, (u, h) => {
    const text = [h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1], h.match(/<meta property="og:title" content="([^"]*)"/)?.[1], h.match(/<meta name="description" content="([^"]*)"/)?.[1]]
      .map((s) => plain(s ?? "")).join(" | ");
    const hit = CLICKBAIT.filter((w) => text.toLowerCase().includes(w));
    if (text.includes("!")) hit.push("exclamation mark");
    return hit.length ? hit.join(", ") : null;
  }));
check("11-DISCOVER-IMAGE", "og:image is at least 1200 px wide, over 300,000 pixels and 16:9 (Google Discover)", () =>
  each(articleUrls, (u, h) => {
    const w = +(h.match(/<meta property="og:image:width" content="(\d+)"/)?.[1] ?? 0), ht = +(h.match(/<meta property="og:image:height" content="(\d+)"/)?.[1] ?? 0);
    return w >= 1200 && w * ht > 300000 && Math.abs(w / ht - 16 / 9) < 0.02 ? null : `og:image ${w}×${ht}`;
  }));
// ── 12 Unique heroes ───────────────────────────────────────────────────────
// Discover and image search treat a repeated picture as a repeated page; every story gets its own.
const { UNIQUE_SINCE, storyHeroes, heroProblems, duplicateHeroes } = await import("./lib/hero-hash.mjs");
const heroStories = storyHeroes(ARTICLES_SRC);
const heroFails = [];
for (const s of heroStories.filter((s) => s.published >= UNIQUE_SINCE)) for (const p of await heroProblems(s.slug, heroStories)) heroFails.push(`${s.slug}: ${p}`);
check("12-HERO-UNIQUE", `Every story published since ${UNIQUE_SINCE} has its own hero: no illustrated scene or picture shared with another story`, () => heroFails);
const oldRepeats = (await duplicateHeroes(heroStories)).filter((p) => p.a.published < UNIQUE_SINCE && p.b.published < UNIQUE_SINCE);
warn("12-HERO-REPEATS", "Older stories that share a hero picture (redraw with a photo or another scene when you update them) — informational", () =>
  oldRepeats.length ? [`${oldRepeats.length} pairs`, ...oldRepeats.slice(0, 7).map((p) => `${p.a.slug} = ${p.b.slug} (${p.d} bits)`)] : []);

warn("10-PDF-ORPHANS", "Printable PDFs that no story links to (not stamped, no canonical) — informational", () => {
  const linked = new Set(articleUrls.flatMap((u) => pdfLinks(html[u])));
  const all = [];
  (function walk(d) { if (!existsSync(d)) return; for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith(".pdf")) all.push("/news/" + path.relative(dist, p).split(path.sep).join("/")); } })(path.join(dist, "downloads"));
  return all.filter((f) => !linked.has(f));
});

warn("02-OXFORD", "Oxford comma use is not 100% uniform (§02 B l.610) — informational", () => {
  const all = articleUrls.map((u) => plain(proseOf(html[u]))).join(" ");
  const withC = (all.match(/\w+, \w+(?: \w+)?, (and|or) \w+/g) ?? []).length;
  const without = (all.match(/\w+, \w+(?: \w+)? (and|or) \w+/g) ?? []).length;
  return without === 0 && withC > 3 ? [`${withC} serial lists, all with Oxford comma`] : [];
});
warn("08-VAGUE", "Vague quantifiers in factual prose (prefer numbers) (§08 l.2331) — review", () =>
  each(articleUrls, (u, h) => { const n = (plain(proseOf(h)).match(/\b(many|some|several|a lot of|lots of|various)\b/gi) ?? []).length; return n > 4 ? `${n} vague quantifiers` : null; }));

// ── Report ─────────────────────────────────────────────────────────────────
let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id.padEnd(20)} ${r.label}`);
  if (!r.ok) { failed++; for (const f of r.fails.slice(0, 8)) console.log(`        · ${f}`); }
}
for (const w of WARN) { console.log(`WARN  ${w.id.padEnd(20)} ${w.label}`); for (const f of w.fails.slice(0, 8)) console.log(`        · ${f}`); }
console.log(`\n${results.length - failed}/${results.length} checks passed · ${WARN.length} warning(s) · ${urls.length} pages · ${articleUrls.length} articles`);
process.exit(failed ? 1 : 0);
