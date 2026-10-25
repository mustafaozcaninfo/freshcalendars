/**
 * News content model (docs/NEWS-ROADMAP.md §4). Every rule here fails the build,
 * so a malformed article can never reach /news/.
 */
import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import path from "node:path";

/** ISO-8601 with an explicit offset — Google News needs an unambiguous time. */
const ISO_WITH_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/;
/** Internal links must point at the calendar site, never back into /news/. */
const INTERNAL_PATH = /^\/(?!news\/)[a-z0-9\-/.]*$/;

const isoDate = z
  .string()
  .regex(ISO_WITH_TZ, "use ISO-8601 with offset, e.g. 2026-10-18T09:30:00-04:00")
  .transform((s) => new Date(s));

/** Clock skew allowed between a writer's machine and the build server before a date counts as future. */
const FUTURE_SLACK_MS = 10 * 60_000;

/** File name (without folders/extension) is the URL slug: articles/2026/10/<slug>.md */
const slugFromFile = ({ entry }: { entry: string }) => path.basename(entry, path.extname(entry));

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles", generateId: slugFromFile }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(20).max(110),
        seoTitle: z.string().min(20).max(60).optional(),
        description: z.string().min(120).max(160),
        type: z.enum(["news", "explainer", "analysis", "update"]),
        publishedAt: isoDate,
        updatedAt: isoDate.optional(),
        authors: z.array(reference("authors")).min(1),
        category: reference("categories"),
        keywords: z.array(z.string().min(2)).min(1).max(5),
        // Legacy: no longer rendered or put in JSON-LD (a default city we did not report from
        // would mislead readers). Kept optional so older stories still parse.
        dateline: z.string().min(2).optional(),
        hero: z.object({
          // Width can't be refined here (image() resolves after parsing); checked in lib/articles.ts.
          src: image(),
          alt: z.string().min(10).max(160),
          /** Tooltip/title text for the image; defaults to the article title. */
          title: z.string().min(10).max(110).optional(),
          /** Visible caption under the hero (also ImageObject.caption). */
          caption: z.string().min(20).max(220).optional(),
          credit: z.string().optional(),
          /** Third-party photo license, written by `pnpm fc news-photo use`; absent for our own illustrations. */
          license: z
            .object({
              name: z.string().min(2),
              url: z.string().url(),
              source: z.string().url(),
              author: z.string().min(2),
              authorUrl: z.string().url().optional(),
            })
            .optional(),
        }),
        summary: z.array(z.string().min(10)).min(2).max(4),
        faq: z.array(z.object({ q: z.string().min(5), a: z.string().min(10) })).default([]),
        sources: z
          .array(
            z.object({
              title: z.string().min(3),
              url: z.string().url(),
              publisher: z.string().min(2),
              date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
            }),
          )
          .default([]),
        internalLinks: z
          .array(z.object({ href: z.string().regex(INTERNAL_PATH), label: z.string().min(3) }))
          .min(2, "link at least two calendar pages (outer → core)"),
        related: z.array(reference("articles")).default([]),
        /** Free printables offered on the page (rendered as a download grid + MediaObject JSON-LD). */
        downloads: z
          .array(
            z.object({
              group: z.string().min(2),
              title: z.string().min(5).max(80),
              description: z.string().min(20).max(200),
              preview: image(),
              alt: z.string().min(10).max(160),
              pdf: z.string().regex(/^\/news\/downloads\/[a-z0-9\-/]+\.pdf$/),
              png: z.string().regex(/^\/news\/downloads\/[a-z0-9\-/]+\.png$/),
              pages: z.number().int().min(1),
              paper: z.string().default("US Letter"),
              /** One line per file, no thumbnail: long same-format sets (one sheet per team). */
              compact: z.boolean().default(false),
            }),
          )
          .default([]),
        corrections: z.array(z.object({ date: isoDate, text: z.string().min(10) })).default([]),
        draft: z.boolean().default(false),
        noindex: z.boolean().default(false),
      })
      .superRefine((a, ctx) => {
        if (a.updatedAt && a.updatedAt < a.publishedAt) {
          ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "updatedAt is before publishedAt" });
        }
        // A future publishedAt schedules a story; a future updatedAt or correction on a live story is a typo
        // (usually a time copied from the writer's own time zone), and readers would see a date that has not come.
        const now = Date.now() + FUTURE_SLACK_MS;
        if (a.publishedAt.getTime() <= now) {
          if (a.updatedAt && a.updatedAt.getTime() > now) {
            ctx.addIssue({ code: "custom", path: ["updatedAt"], message: `updatedAt ${a.updatedAt.toISOString()} is in the future; use the current America/New_York time` });
          }
          for (const [i, c] of a.corrections.entries()) {
            if (c.date.getTime() > now) {
              ctx.addIssue({ code: "custom", path: ["corrections", i, "date"], message: `correction date ${c.date.toISOString()} is in the future` });
            }
          }
        }
        if (a.hero.license && !a.hero.credit) {
          ctx.addIssue({ code: "custom", path: ["hero", "credit"], message: "a licensed photo needs a visible credit" });
        }
        if (!a.hero.license && /^photo\b/i.test(a.hero.credit ?? "")) {
          ctx.addIssue({ code: "custom", path: ["hero", "license"], message: "a photo credit needs hero.license (use pnpm fc news-photo)" });
        }
        if ((a.type === "news" || a.type === "update") && a.sources.length === 0) {
          ctx.addIssue({ code: "custom", path: ["sources"], message: `${a.type} articles need at least one source` });
        }
        for (const [i, c] of a.corrections.entries()) {
          if (!a.updatedAt || c.date > a.updatedAt) {
            ctx.addIssue({
              code: "custom",
              path: ["corrections", i, "date"],
              message: "a correction must be covered by updatedAt",
            });
          }
        }
      }),
});

const authors = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/authors", generateId: slugFromFile }),
  schema: ({ image }) =>
    z.object({
      /** Organization = desk byline (Google allows Organization as author); Person = named reporter. */
      kind: z.enum(["Organization", "Person"]),
      name: z.string().min(3),
      role: z.string().min(3),
      bio: z.string().refine((s) => s.trim().split(/\s+/).length >= 50, "bio needs at least 50 words"),
      photo: image().optional(),
      sameAs: z.array(z.string().url()).default([]),
      email: z.string().email().optional(),
    }),
});

const categories = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/categories", generateId: slugFromFile }),
  schema: z.object({
    name: z.string().min(3),
    description: z.string().refine((s) => s.trim().split(/\s+/).length >= 80, "description needs at least 80 words"),
    order: z.number().int(),
  }),
});

/** Trust pages (About News, Editorial Policy, Corrections, Masthead) — NEWS-ROADMAP N8. */
const policies = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/policies", generateId: slugFromFile }),
  schema: z.object({
    title: z.string().min(5).max(70),
    description: z.string().min(120).max(160),
    schemaType: z.enum(["AboutPage", "WebPage"]).default("WebPage"),
    updatedAt: isoDate,
  }),
});

export const collections = { articles, authors, categories, policies };
