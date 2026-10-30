import type { APIRoute } from "astro";
import { getPublishedArticles, lastModified, newest } from "../../../lib/articles";
import { icsCalendar } from "../../../lib/ics";
import { calendarDatesFor, keyDateUid } from "../../../lib/keydates";
import { articlePath } from "../../../lib/seo";
import { absNewsUrl } from "../../../lib/site";
import { liveTopics } from "../../../lib/storygraph";
import type { Topic } from "../../../lib/topics";
import type { Article } from "../../../lib/articles";

/** /news/topic/<slug>/dates.ics: the key dates reported by the topic's stories (upcoming, else all of them). */
export async function getStaticPaths() {
  return liveTopics(await getPublishedArticles())
    .filter(({ items }) => calendarDatesFor(new Set(items.map((a) => a.id))).length > 0)
    .map(({ topic, items }) => ({ params: { topic: topic.slug }, props: { topic, items } }));
}

export const GET: APIRoute = ({ props }) => {
  const { topic, items } = props as { topic: Topic; items: Article[] };
  const events = calendarDatesFor(new Set(items.map((a) => a.id))).map((k) => ({ date: k.date, title: k.label, url: absNewsUrl(articlePath(k.slug)), uid: keyDateUid(k) }));
  return new Response(icsCalendar(`${topic.name} key dates`, events, newest(items.map(lastModified))!), { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
};
