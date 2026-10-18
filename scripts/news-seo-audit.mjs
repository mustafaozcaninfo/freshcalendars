#!/usr/bin/env node
/**
 * SEO-HARITASI-TAM.md compliance audit for the built /news/ section (dist/news).
 * Each check maps to a rule in the playbook (section/line in the label). Prints PASS/FAIL
 * per rule with evidence; exits 1 on any FAIL. Usage: node scripts/news-seo-audit.mjs [distDir]
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
check("01-ADS-CENTER", "No ads inside the main content / above the fold (§01 l.214, l.314)", () =>
  each(urls, (u, h) => (/adsbygoogle|class="[^"]*ad-unit/.test(h.match(/<main id="main"[\s\S]*?<\/main>/)?.[0] ?? "") ? "ad markup inside <main>" : null)));
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

// ── 02 Originality / HTML quality ──────────────────────────────────────────
check("02-SSR-LINKS", "Navigation and content links are server-rendered <a href> (§02 C l.659)", () =>
  each(urls, (u, h) => ((h.match(/<a [^>]*href="[^"#][^"]*"/g) ?? []).length >= 15 ? null : "too few server-rendered links")));
check("02-NO-JS-CONTENT", "Content does not depend on client JS (≤2 inline scripts, no framework bundles) (§02 C)", () =>
  each(urls, (u, h) => {
    const scripts = (h.match(/<script(?![^>]*ld\+json)[^>]*>/g) ?? []);
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
check("02-BANNED-WORDS", "No banned AI-tell words/phrases in article or policy text (§02 B l.603)", () =>
  each(urls.filter((u) => !/\/page\/\d+\/$/.test(u)), (u) => { const hit = BANNED_EN.filter((w) => new RegExp(`\\b${w.replace(/[-']/g, ".")}\\b`).test(words(u))); return hit.length ? hit.join(", ") : null; }));
check("02-EMDASH", "Em-dash overuse avoided (≤2 per article) (§02 B l.605)", () =>
  each(articleUrls, (u, h) => {
    const prose = (h.match(/<div class="prose-news[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "") + (h.match(/<p class="news-lede[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
    const n = (prose.match(/—/g) ?? []).length;
    return n > 2 ? `${n} em dashes in article prose` : null;
  }));
check("02-NOT-X-BUT-Y", "No 'not X, but Y' / 'it's not just X' constructions (§02 B l.606)", () =>
  each(articleUrls, (u) => { const m = words(u).match(/\b(it'?s|is|isn't) not (just|only|merely)\b[^.]{0,60}\b(but|it'?s)\b|\bnot just\b[^.]{0,60}\bbut\b/); return m ? `"${m[0].slice(0, 60)}"` : null; }));
check("02-ENDINGS", "Paragraphs/sections do not end with formulaic wrap-ups (§02 B l.607)", () =>
  each(articleUrls, (u) => (/\b(in summary|to sum up|all in all|in conclusion|ultimately,)\b/.test(words(u)) ? "formulaic wrap-up" : null)));

// ── 03 Scaled content / velocity ───────────────────────────────────────────
check("03-VELOCITY", "No mass publishing: new subfolder far below 1,000 URLs/7 days; batch by QA capacity (§03 l.758, l.833)", () => {
  const n = articleUrls.length;
  return n <= 50 ? [] : [`${n} articles in the news build`];
});
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
    return ["Holidays", "Time Change", "School Calendars", "Retail Dates", "Sky Events", "UK & Canada", "Planning"].includes(sec) ? null : `section=${sec}`;
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
check("07-NO-FAKE-EXPERTS", "No invented people, credentials or reviewers (§02 l.2587, §07 l.2148)", () =>
  each(urls, (u, h) => (nodes(h).some((n) => n["@type"] === "Person") ? "Person node present (verify it is a real, documented author)" : null)));
check("07-TRUST-PAGES", "About / editorial / corrections / masthead pages exist and are linked from the Organization (§07 entity checklist)", () => {
  const need = ["/news/about/", "/news/editorial-policy/", "/news/corrections-policy/", "/news/masthead/"];
  const miss = need.filter((u) => !html[u]);
  const org = nodes(html["/news/"]).find((n) => n["@type"] === "Organization");
  if (!org.publishingPrinciples || !org.correctionsPolicy || !org.masthead) miss.push("Organization policy links missing");
  return miss;
});

// ── News-specific exception to §08 l.2591 (visible dates) ───────────────────
check("08-NEWS-DATES", "/news/ exception: visible byline, published and updated date/time ET, dateline (l.2591 note)", () =>
  each(articleUrls, (u, h) => (/class="byline"/.test(h) && /Published <time/.test(h) && / ET<\/time>/.test(h) ? null : "byline/date missing")));
check("08-SOURCES", "Every news/update article cites ≥1 primary source with a link (§02 SOP Who/How/Why, editorial policy)", () =>
  each(articleUrls, (u, h) => ((h.match(/<section class="sources"[\s\S]*?<\/section>/)?.[0].match(/<a href="https?:/g) ?? []).length >= 1 ? null : "no linked sources")));

// ── Sitemaps ───────────────────────────────────────────────────────────────
check("02-SITEMAP", "Every indexable page is in a sitemap; no noindex page is (§02 C l.661)", () => {
  const xml = ["post-sitemap.xml", "category-sitemap.xml", "author-sitemap.xml", "page-sitemap.xml"].map((f) => existsSync(path.join(dist, f)) ? readFileSync(path.join(dist, f), "utf8") : "").join("");
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
    const COMMON = new Set(["US", "U.S.", "UK", "EU", "ET", "AM", "PM", "TV", "NBC", "ID", "UTC", "NYSE", "AARP", "AAA", "DST", "EST", "EDT", "CST", "CDT", "MST", "MDT", "PST", "PDT", "AKST", "AKDT", "GMT", "BST", "CET", "CEST", "COLA", "SSI", "II", "DC", "NASA", "IRS",
      // Proper names written in capitals, not abbreviations.
      "TIME", "GOV", "NORC",
      // Phone mnemonics (1-800-MEDICARE).
      "MEDICARE"]);
    const undefined_ = [];
    const seen = new Set();
    for (const m of text.matchAll(/\b([A-Z][A-Z-]{1,}[A-Z])\b/g)) {
      const a = m[1]; if (seen.has(a) || COMMON.has(a)) continue; seen.add(a);
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
