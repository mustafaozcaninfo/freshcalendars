export type SeoMeta = {
  pageId: string;
  url: string;
  canonical: string;
  title: string;
  description: string;
  robots: string;
  author: string;
  themeColor: string;
  keywords?: string[];
  hreflang: { lang: string; href: string }[];
  openGraph: {
    type: string;
    siteName: string;
    title: string;
    description: string;
    url: string;
    locale: string;
    images: { url: string; width: number; height: number; alt: string }[];
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  jsonLd: string[];
  breadcrumbs: { name: string; url: string }[];
  faq: { q: string; a: string }[];
  download: { pdf: string; png: string };
  /** Accessible / SEO titles for download buttons */
  downloadTitles: { pdf: string; png: string };
  /** Monthly pages: five independent printable variants */
  variants?: {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
    png: string;
    pdf: string;
    pngTitle: string;
    pdfTitle: string;
  }[];
  calendar: {
    family:
      | "home"
      | "yearly"
      | "monthly"
      | "blank"
      | "holidays"
      | "holiday"
      | "legal"
      | "easter"
      | "guide";
    year: number | null;
    month: number | null;
    weekStartsOn: 0 | 1;
  };
  sitemap: {
    priority: number;
    changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    lastmod: string;
  };
  imageAlts: Record<string, string>;
  ogImagePath: string;
};

export const REQUIRED_SEO_KEYS = [
  "pageId",
  "url",
  "canonical",
  "title",
  "description",
  "robots",
  "author",
  "themeColor",
  "hreflang",
  "openGraph",
  "twitter",
  "jsonLd",
  "breadcrumbs",
  "faq",
  "download",
  "downloadTitles",
  "calendar",
  "sitemap",
  "imageAlts",
  "ogImagePath",
] as const;
