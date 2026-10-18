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
        dateline: z.string().min(2),
        hero: z.object({
          // Width can't be refined here (image() resolves after parsing); checked in lib/articles.ts.
          src: image(),
          alt: z.string().min(10).max(160),
          caption: z.string().optional(),
          credit: z.string().optional(),
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
        corrections: z.array(z.object({ date: isoDate, text: z.string().min(10) })).default([]),
        draft: z.boolean().default(false),
        noindex: z.boolean().default(false),
      })
      .superRefine((a, ctx) => {
        if (a.updatedAt && a.updatedAt < a.publishedAt) {
          ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "updatedAt is before publishedAt" });
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

export const collections = { articles, authors, categories };
