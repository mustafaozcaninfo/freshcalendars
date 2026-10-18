/**
 * Article <head> tags and JSON-LD @graph (docs/NEWS-ROADMAP.md §1.2, §1.3).
 * Pure functions on plain data so they can be unit-tested without Astro.
 */
import { NEWS_NAME, SITE_ORIGIN, TRUST_PAGES, absNewsUrl } from "./site.ts";

export const ORG_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const LOGO = { url: `${SITE_ORIGIN}/icons/icon-512.png`, width: 512, height: 512 };
export const ROBOTS_INDEX = "index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large";

export type ArticleType = "news" | "explainer" | "analysis" | "update";

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

export interface AuthorSeo {
  kind: "Organization" | "Person";
  name: string;
  /** Site-relative author page path, e.g. /news/author/news-desk/ */
  path: string;
  role?: string;
  image?: ImageVariant;
  sameAs: string[];
}

export interface ArticleSeo {
  slug: string;
  title: string;
  seoTitle?: string;
  description: string;
  type: ArticleType;
  publishedAt: Date;
  modifiedAt: Date;
  authors: AuthorSeo[];
  category: { slug: string; name: string };
  keywords: string[];
  dateline: string;
  hero: {
    /** 16:9 main image (og:image, primaryImageOfPage) */
    main: ImageVariant & { type: string };
    /** 16:9, 4:3, 1:1 crops ≥1200px for Article rich results */
    crops: ImageVariant[];
    alt: string;
    caption?: string;
    credit?: string;
  };
  wordCount: number;
  readingMinutes: number;
}

export type HeadTag =
  | { tag: "meta"; attrs: Record<string, string> }
  | { tag: "link"; attrs: Record<string, string> };

export function articlePath(slug: string): string {
  return `/news/${slug}/`;
}

export function categoryPath(slug: string): string {
  return `/news/category/${slug}/`;
}

export function pageTitle(a: Pick<ArticleSeo, "title" | "seoTitle">): string {
  return a.seoTitle ?? a.title;
}

/** W3C datetime with offset, no milliseconds (sitemaps, schema, article:* tags). */
export function isoDateTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

const SCHEMA_TYPE: Record<ArticleType, string> = {
  news: "NewsArticle",
  update: "NewsArticle",
  explainer: "BackgroundNewsArticle",
  analysis: "AnalysisNewsArticle",
};

/** Article-only tags; NewsBase adds title, description, robots, canonical, hreflang and og basics. */
export function articleHeadTags(a: ArticleSeo): HeadTag[] {
  const meta = (attrs: Record<string, string>): HeadTag => ({ tag: "meta", attrs });
  const img = a.hero.main;
  const firstAuthor = a.authors[0]!;
  return [
    meta({ name: "author", content: a.authors.map((x) => x.name).join(", ") }),
    meta({ property: "og:updated_time", content: isoDateTime(a.modifiedAt) }),
    meta({ property: "og:image", content: img.url }),
    meta({ property: "og:image:secure_url", content: img.url }),
    meta({ property: "og:image:width", content: String(img.width) }),
    meta({ property: "og:image:height", content: String(img.height) }),
    meta({ property: "og:image:alt", content: a.hero.alt }),
    meta({ property: "og:image:type", content: img.type }),
    meta({ property: "article:section", content: a.category.name }),
    ...a.keywords.map((k) => meta({ property: "article:tag", content: k })),
    meta({ property: "article:published_time", content: isoDateTime(a.publishedAt) }),
    meta({ property: "article:modified_time", content: isoDateTime(a.modifiedAt) }),
    meta({ property: "article:author", content: absNewsUrl(firstAuthor.path) }),
    meta({ name: "twitter:image", content: img.url }),
    meta({ name: "twitter:image:alt", content: a.hero.alt }),
    meta({ name: "twitter:label1", content: "Written by" }),
    meta({ name: "twitter:data1", content: firstAuthor.name }),
    meta({ name: "twitter:label2", content: "Time to read" }),
    meta({ name: "twitter:data2", content: `${a.readingMinutes} minute${a.readingMinutes === 1 ? "" : "s"}` }),
  ];
}

function organizationNode(): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: NEWS_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_ORIGIN}/#logo`,
      url: LOGO.url,
      contentUrl: LOGO.url,
      width: LOGO.width,
      height: LOGO.height,
      caption: NEWS_NAME,
      inLanguage: "en-US",
    },
  };
  // Trust pages are referenced only once they are published (N8) — no links to 404s.
  for (const [prop, path] of Object.entries(TRUST_PAGES)) {
    if (path) node[prop] = absNewsUrl(path);
  }
  return node;
}

function authorNode(au: AuthorSeo): Record<string, unknown> {
  const url = absNewsUrl(au.path);
  const node: Record<string, unknown> = {
    "@type": au.kind,
    "@id": url,
    name: au.name,
    url,
  };
  if (au.kind === "Person") node.worksFor = { "@id": ORG_ID };
  else node.parentOrganization = { "@id": ORG_ID };
  if (au.role && au.kind === "Person") node.jobTitle = au.role;
  if (au.image) {
    node.image = { "@type": "ImageObject", url: au.image.url, width: au.image.width, height: au.image.height };
  }
  if (au.sameAs.length) node.sameAs = au.sameAs;
  return node;
}

export function articleGraph(a: ArticleSeo): Record<string, unknown> {
  const url = absNewsUrl(articlePath(a.slug));
  const published = isoDateTime(a.publishedAt);
  const modified = isoDateTime(a.modifiedAt);
  const heroId = a.hero.main.url;
  const imageNode: Record<string, unknown> = {
    "@type": "ImageObject",
    "@id": heroId,
    url: heroId,
    contentUrl: heroId,
    width: a.hero.main.width,
    height: a.hero.main.height,
    caption: a.hero.caption ?? a.hero.alt,
    inLanguage: "en-US",
    creditText: a.hero.credit ?? NEWS_NAME,
    copyrightNotice: NEWS_NAME,
    creator: { "@id": ORG_ID },
  };
  if (TRUST_PAGES.license) {
    imageNode.license = absNewsUrl(TRUST_PAGES.license);
    imageNode.acquireLicensePage = absNewsUrl(TRUST_PAGES.license);
  }

  const crumbs = [
    { name: "Home", item: `${SITE_ORIGIN}/` },
    { name: "News", item: absNewsUrl("/news/") },
    { name: a.category.name, item: absNewsUrl(categoryPath(a.category.slug)) },
    { name: a.title, item: url },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${SITE_ORIGIN}/`,
        name: NEWS_NAME,
        publisher: { "@id": ORG_ID },
        inLanguage: "en-US",
      },
      imageNode,
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: { "@id": c.item, name: c.name },
        })),
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: pageTitle(a),
        description: a.description,
        datePublished: published,
        dateModified: modified,
        isPartOf: { "@id": WEBSITE_ID },
        primaryImageOfPage: { "@id": heroId },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        inLanguage: "en-US",
      },
      ...a.authors.map(authorNode),
      {
        "@type": SCHEMA_TYPE[a.type],
        "@id": `${url}#article`,
        url,
        headline: a.title,
        name: pageTitle(a),
        description: a.description,
        keywords: a.keywords.join(", "),
        articleSection: a.category.name,
        datePublished: published,
        dateModified: modified,
        author: a.authors.map((au) => ({ "@id": absNewsUrl(au.path), name: au.name })),
        publisher: { "@id": ORG_ID },
        image: a.hero.crops.map((c) => c.url),
        thumbnailUrl: a.hero.crops[0]?.url,
        dateline: a.dateline,
        wordCount: a.wordCount,
        timeRequired: `PT${a.readingMinutes}M`,
        isAccessibleForFree: true,
        inLanguage: "en-US",
        isPartOf: { "@id": `${url}#webpage` },
        mainEntityOfPage: { "@id": `${url}#webpage` },
      },
    ],
  };
}

export interface ListingSeo {
  /** Site-relative path of this page */
  path: string;
  name: string;
  description: string;
  /** Breadcrumb trail after Home, e.g. [{name:"News", path:"/news/"}] — last item is this page. */
  trail: { name: string; path: string }[];
  items: { path: string; name: string }[];
  /** CollectionPage for news home/category, ProfilePage for author pages */
  kind: "CollectionPage" | "ProfilePage";
  /** Author node for ProfilePage.mainEntity */
  author?: AuthorSeo & { description?: string };
}

export function listingGraph(l: ListingSeo): Record<string, unknown> {
  const url = absNewsUrl(l.path);
  const crumbs = [{ name: "Home", item: `${SITE_ORIGIN}/` }, ...l.trail.map((t) => ({ name: t.name, item: absNewsUrl(t.path) }))];
  const page: Record<string, unknown> = {
    "@type": l.kind,
    "@id": `${url}#webpage`,
    url,
    name: l.name,
    description: l.description,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    inLanguage: "en-US",
  };
  const nodes: Record<string, unknown>[] = [
    organizationNode(),
    { "@type": "WebSite", "@id": WEBSITE_ID, url: `${SITE_ORIGIN}/`, name: NEWS_NAME, publisher: { "@id": ORG_ID }, inLanguage: "en-US" },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, item: { "@id": c.item, name: c.name } })),
    },
    page,
  ];
  if (l.items.length) {
    page.mainEntity = { "@id": `${url}#itemlist` };
    nodes.push({
      "@type": "ItemList",
      "@id": `${url}#itemlist`,
      numberOfItems: l.items.length,
      itemListElement: l.items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: absNewsUrl(it.path), name: it.name })),
    });
  }
  if (l.kind === "ProfilePage" && l.author) {
    const node = authorNode(l.author);
    if (l.author.description) node.description = l.author.description;
    nodes.push(node);
    page.mainEntity = { "@id": node["@id"] };
    if (l.items.length) page.hasPart = { "@id": `${url}#itemlist` };
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** JSON for a <script type="application/ld+json"> — `<` escaped so text can't close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 225));
}

export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

const ET = "America/New_York";

/** "October 17, 2026" in New York time (visible date). */
export function formatDateET(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: ET, month: "long", day: "numeric", year: "numeric" }).format(d);
}

/** "October 17, 2026, 4:00 p.m. ET" — byline timestamps. */
export function formatDateTimeET(d: Date): string {
  const date = formatDateET(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit" })
    .format(d)
    .replace("AM", "a.m.")
    .replace("PM", "p.m.");
  return `${date}, ${time} ET`;
}
