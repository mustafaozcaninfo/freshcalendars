/**
 * Build-time glue between published articles and the pure engines: one similarity index and one
 * topic map per article list (every page of a build shares the list, so each is computed once).
 */
import type { Article } from "./articles";
import { KEY_DATES, todayET } from "./keydates";
import { isPast, seriesKey, storySpan, type StorySpan } from "./series";
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

const hubsById = new WeakMap<Article[], Map<string, Topic[]>>();

/** Topics a story belongs to. One lookup table per list: relatedFor asks for every candidate of every story. */
export function topicsOf(all: Article[], id: string): Topic[] {
  let m = hubsById.get(all);
  if (!m) {
    m = new Map();
    for (const { topic, items } of liveTopics(all)) for (const a of items) m.set(a.id, [...(m.get(a.id) ?? []), topic]);
    hubsById.set(all, m);
  }
  return m.get(id) ?? [];
}

/** Added to a related candidate that shares a topic hub with the story. */
export const TOPIC_BONUS = 0.12;

const keyDatesBySlug = new Map<string, string[]>();
for (const k of KEY_DATES) keyDatesBySlug.set(k.slug, [...(keyDatesBySlug.get(k.slug) ?? []), k.date]);
const spans = new Map<string, StorySpan | undefined>();
const titles = new Map<string, string>();

/** Story titles for spanOf; the article page registers the published list once per build. */
export function registerTitles(all: Article[]): void {
  if (titles.size) return;
  for (const a of all) titles.set(a.id, a.data.title);
  spans.clear();
}

/** The dates a story is about (slug, title and KEY_DATES, lib/series.ts); undefined for an evergreen story. */
export function spanOf(id: string): StorySpan | undefined {
  if (!spans.has(id)) spans.set(id, storySpan(id, keyDatesBySlug.get(id), titles.get(id)));
  return spans.get(id);
}

/**
 * A story worth sending a reader to from `id`: not in its dated series (the series nav links
 * those) and not about dates that have all passed. `today` is the build's date in New York.
 */
export function linkable(id: string, today = todayET()): (c: string) => boolean {
  const key = seriesKey(id);
  return (c) => c !== id && seriesKey(c) !== key && !isPast(spanOf(c), today);
}

/** Related stories shown under a story: a row of four on wide screens, two by two on tablets, a list on phones (RelatedGrid). */
export const RELATED_COUNT = 4;

/**
 * Related story ids: the writer's picks, then similar stories, favoring ones in the same topic hub.
 * Picks from the story's own series are left to the series nav; automatic picks skip past events
 * and take one story per series.
 */
export function relatedFor(all: Article[], id: string, pinned: string[], limit = RELATED_COUNT, today = todayET()): string[] {
  registerTitles(all);
  const mine = new Set(topicsOf(all, id).map((t) => t.slug));
  const shares = (c: string) => topicsOf(all, c).some((t) => mine.has(t.slug));
  const allow = linkable(id, today);
  const key = seriesKey(id);
  return related(storyIndex(all), id, pinned.filter((p) => seriesKey(p) !== key), limit, (c) => (mine.size && shares(c) ? TOPIC_BONUS : 0), { allow, group: seriesKey });
}
