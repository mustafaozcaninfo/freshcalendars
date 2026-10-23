/**
 * Build-time glue between published articles and the pure engines: one similarity index and one
 * topic map per article list (every page of a build shares the list, so each is computed once).
 */
import type { Article } from "./articles";
import { buildIndex, related, similarity, type SimIndex } from "./similarity";
import { topicMembers, type Topic } from "./topics";

const indexes = new WeakMap<Article[], SimIndex>();
const topicMaps = new WeakMap<Article[], { topic: Topic; items: Article[] }[]>();

export function storyIndex(all: Article[]): SimIndex {
  let ix = indexes.get(all);
  if (!ix) {
    ix = buildIndex(all.map((a) => ({
      id: a.id,
      title: a.data.title,
      description: a.data.description,
      keywords: a.data.keywords,
      category: a.data.category.id,
      links: a.data.internalLinks.map((l) => l.href),
      publishedAt: a.data.publishedAt,
    })));
    indexes.set(all, ix);
  }
  return ix;
}

/** Live topic hubs with their stories, newest first (indexable stories only: hubs are for search). */
export function liveTopics(all: Article[]): { topic: Topic; items: Article[] }[] {
  let t = topicMaps.get(all);
  if (!t) {
    const stories = all.filter((a) => !a.data.noindex).map((a) => ({ id: a.id, title: a.data.title, keywords: a.data.keywords, a }));
    const ix = storyIndex(all);
    t = topicMembers(stories, (a, b) => similarity(ix, a, b)).map(({ topic, items }) => ({ topic, items: items.map((s) => s.a) }));
    topicMaps.set(all, t);
  }
  return t;
}

export function topicsOf(all: Article[], id: string): Topic[] {
  return liveTopics(all).filter((t) => t.items.some((a) => a.id === id)).map((t) => t.topic);
}

/** Added to a related candidate that shares a topic hub with the story. */
export const TOPIC_BONUS = 0.12;

/** Related story ids: the writer's picks, then similar stories, favoring ones in the same topic hub. */
export function relatedFor(all: Article[], id: string, pinned: string[], limit = 3): string[] {
  const mine = new Set(topicsOf(all, id).map((t) => t.slug));
  const shares = (c: string) => topicsOf(all, c).some((t) => mine.has(t.slug));
  return related(storyIndex(all), id, pinned, limit, (c) => (mine.size && shares(c) ? TOPIC_BONUS : 0));
}
