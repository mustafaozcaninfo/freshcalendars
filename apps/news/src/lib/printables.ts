/**
 * Every free printable across published stories, newest story first (printables hub + home strip).
 * Compact items (one sheet per team and the like) stay on their story; the hub shows the set's main files.
 */
import type { Article } from "./articles";
import { articlePath } from "./seo";

export type Printable = Article["data"]["downloads"][number] & { article: { id: string; title: string; href: string; category: string; publishedAt: Date } };

export function allPrintables(articles: Article[]): Printable[] {
  return articles.flatMap((a) =>
    a.data.downloads.filter((d) => !d.compact).map((d) => ({
      ...d,
      article: { id: a.id, title: a.data.title, href: articlePath(a.id), category: a.data.category.id, publishedAt: a.data.publishedAt },
    })),
  );
}

export const PRINTABLES_PATH = "/news/printables/";
