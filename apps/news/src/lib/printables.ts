/**
 * Every free printable across published stories, newest story first (printables hub + home strip).
 * Compact items (one sheet per team and the like) stay on their story; the hub shows the set's main files.
 * An "(ink saver)" copy rides on its full-color sheet as `inkSaver`, so each design is listed once.
 */
import type { Article } from "./articles";
import { articlePath } from "./seo";

type Download = Article["data"]["downloads"][number];
export type Printable = Download & {
  inkSaver?: Pick<Download, "pdf" | "png">;
  article: { id: string; title: string; href: string; category: string; publishedAt: Date };
};

const INK = /\s*\(ink saver\)$/i;

export function allPrintables(articles: Article[]): Printable[] {
  return articles.flatMap((a) => {
    const files = a.data.downloads.filter((d) => !d.compact);
    const base = new Map(files.filter((d) => !INK.test(d.title)).map((d) => [d.title, d]));
    const ink = new Map(files.filter((d) => INK.test(d.title) && base.has(d.title.replace(INK, ""))).map((d) => [d.title.replace(INK, ""), d]));
    const article = { id: a.id, title: a.data.title, href: articlePath(a.id), category: a.data.category.id, publishedAt: a.data.publishedAt };
    return files
      .filter((d) => !INK.test(d.title) || !base.has(d.title.replace(INK, "")))
      .map((d) => {
        const i = ink.get(d.title);
        return { ...d, ...(i ? { inkSaver: { pdf: i.pdf, png: i.png } } : {}), article };
      });
  });
}

export const PRINTABLES_PATH = "/news/printables/";
