import type { APIRoute } from "astro";
import { getPublishedArticles, lastModified, type Article } from "../../lib/articles";
import { icsCalendar } from "../../lib/ics";
import { keyDateUid, upcomingFor } from "../../lib/keydates";
import { articlePath } from "../../lib/seo";
import { absNewsUrl } from "../../lib/site";

/** /news/<slug>/dates.ics: the story's upcoming key dates, for stories that have any. */
export async function getStaticPaths() {
  return (await getPublishedArticles())
    .filter((a) => upcomingFor(new Set([a.id])).length > 0)
    .map((article) => ({ params: { slug: article.id }, props: { article } }));
}

export const GET: APIRoute = ({ props }) => {
  const a = (props as { article: Article }).article;
  const url = absNewsUrl(articlePath(a.id));
  const events = upcomingFor(new Set([a.id])).map((k) => ({ date: k.date, title: k.label, url, uid: keyDateUid(k) }));
  return new Response(icsCalendar(a.data.title, events, lastModified(a)), { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
};
