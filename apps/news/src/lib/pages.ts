/** Static paths for every listing page, shared by the page-1 and /page/N/ routes. */
import { getCollection } from "astro:content";
import {
  authorHref,
  categoryHref,
  getActiveCategories,
  getPublishedArticles,
  type Article,
  type Author,
  type Category,
} from "./articles";
import { paginate, PER_PAGE, type Page } from "./listing";
import { liveTopics } from "./storygraph";
import { topicPath, type Topic } from "./topics";

export const HOME = {
  heading: "Calendar & Holiday News",
  intro: "Dates that change your calendar: holidays, clock changes, Social Security and Medicare deadlines, the Moon and religious calendars, each with free printables.",
  description: "Holiday dates, clock changes, Social Security and Medicare deadlines, moon phases and religious calendars from the Fresh Calendars News Desk.",
};

export async function homePages(): Promise<Page<Article>[]> {
  return paginate(await getPublishedArticles(), "/news/");
}

export async function categoryPages(): Promise<{ category: Category; page: Page<Article> }[]> {
  const articles = await getPublishedArticles();
  const out: { category: Category; page: Page<Article> }[] = [];
  for (const category of await getActiveCategories(articles)) {
    const items = articles.filter((a) => a.data.category.id === category.id);
    for (const page of paginate(items, categoryHref(category.id))) out.push({ category, page });
  }
  return out;
}

/**
 * Topic hub pages. A daily-puzzle hub gains a story a day, so hubs page like categories, with
 * larger pages: most hubs stay one page and a year of Wordle is about seven.
 */
export const HUB_PER_PAGE = PER_PAGE * 3;

export async function topicPages(): Promise<{ topic: Topic; items: Article[]; page: Page<Article>; all: Article[] }[]> {
  const all = await getPublishedArticles();
  return liveTopics(all).flatMap(({ topic, items }) =>
    paginate(items, topicPath(topic.slug), HUB_PER_PAGE).map((page) => ({ topic, items, page, all })),
  );
}

/** Every author gets a profile page, even before their first story (byline links must resolve). */
export async function authorPages(): Promise<{ author: Author; page: Page<Article> }[]> {
  const articles = await getPublishedArticles();
  const out: { author: Author; page: Page<Article> }[] = [];
  for (const author of await getCollection("authors")) {
    const items = articles.filter((a) => a.data.authors.some((r) => r.id === author.id));
    for (const page of paginate(items, authorHref(author.id))) out.push({ author, page });
  }
  return out;
}

export function categoryHeading(c: Category): string {
  return `${c.data.name} News`;
}

/** First sentence of a long description, for meta description use (≤160 chars). */
export function shortDescription(text: string, max = 160): string {
  const first = text.split(/(?<=\.)\s/)[0] ?? text;
  return first.length <= max ? first : `${first.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
