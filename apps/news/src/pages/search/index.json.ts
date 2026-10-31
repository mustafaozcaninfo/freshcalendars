import type { APIRoute } from "astro";
import { getCategoryNames, getIndexableArticles } from "../../lib/articles";
import { articlePath } from "../../lib/seo";
import { liveTopics } from "../../lib/storygraph";
import { topicPath } from "../../lib/topics";

/** Daily puzzle pages kept in the index; older days are found through their game's hub. */
const PUZZLE_DAYS = 14;

/**
 * Search index for the site search box (packages/site-chrome/src/search.ts), fetched only when a
 * reader focuses it: t title, d description, k keywords, c category, u path. Daily puzzle pages
 * are most of the stories and nobody searches for one from months ago, so only the last
 * PUZZLE_DAYS of them are listed; every topic hub (one per puzzle game, plus the running topics)
 * is listed instead, so "wordle" still finds the full archive.
 */
export const GET: APIRoute = async () => {
  const now = new Date();
  const names = await getCategoryNames();
  const all = await getIndexableArticles(now);
  const cutoff = now.getTime() - PUZZLE_DAYS * 86_400_000;
  const stories = all
    .filter((a) => a.data.category.id !== "puzzles" || a.data.publishedAt.getTime() >= cutoff)
    .map((a) => ({
      t: a.data.title,
      d: a.data.description,
      k: a.data.keywords.join(" "),
      c: names.get(a.data.category.id) ?? "",
      u: articlePath(a.id),
    }));
  const hubs = liveTopics(all).map(({ topic }) => ({
    t: topic.name,
    d: topic.description,
    k: topic.match.join(" "),
    c: "Topic",
    u: topicPath(topic.slug),
  }));
  return new Response(JSON.stringify([...hubs, ...stories]), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
