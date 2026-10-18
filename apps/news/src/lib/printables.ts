/** Every free printable across published stories, newest story first (printables hub + home strip). */
import type { Article } from "./articles";
import { articlePath } from "./seo";

export type Printable = Article["data"]["downloads"][number] & { article: { id: string; title: string; href: string; category: string; publishedAt: Date } };

export function allPrintables(articles: Article[]): Printable[] {
  return articles.flatMap((a) =>
    a.data.downloads.map((d) => ({
      ...d,
      article: { id: a.id, title: a.data.title, href: articlePath(a.id), category: a.data.category.id, publishedAt: a.data.publishedAt },
    })),
  );
}

export const PRINTABLES_PATH = "/news/printables/";
