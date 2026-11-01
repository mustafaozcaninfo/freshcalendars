/**
 * Official embeds for /news/ story bodies: the post or picture stays on its platform, shown with the
 * platform's own embed, which its terms allow. This is how a story shows an agency photo (Getty's
 * embed) or a company's or official's post without copying the file.
 *
 *   pnpm fc news-embed <url> [--caption "…"]
 *
 * YouTube: privacy-enhanced player (youtube-nocookie.com). X: the post's text from X's oEmbed, as a
 * plain blockquote with no script. TikTok, Instagram, Threads, Facebook: a quote card that links to the
 * post. Getty Images: the iframe link from the image's "Embed" button (embed.gettyimages.com/embed/<id>
 * with its et= and sig= parameters); Getty only allows its own embed code, so never download the image.
 * Prints the HTML to paste into the story where it belongs.
 */
const UA = "FreshCalendarsNews/1.0 (https://freshcalendars.com/news/; embed tool)";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function oembed(url: string): Promise<any> {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${r.status} from ${new URL(url).hostname} oEmbed (is the post public?)`);
  return r.json();
}

const IFRAME_STYLE = "display:block;width:100%;height:auto;border:0;border-radius:12px;background:#111";

export async function newsEmbed(url: string, caption?: string): Promise<void> {
  if (!url) throw new Error('usage: pnpm fc news-embed <youtube|x|tiktok|instagram|threads|facebook post url | Getty embed link> [--caption "…"]');
  const u = new URL(url), host = u.hostname.replace(/^(www|m|mobile)\./, "");
  let html: string;
  if (host === "youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") ?? /\/(?:shorts|embed|live)\/([\w-]{11})/.exec(u.pathname)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error("no YouTube video id in the link");
    const o = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
    html = `<figure class="video-embed">
<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(o.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="${IFRAME_STYLE};aspect-ratio:16/9"></iframe>
<figcaption>${esc(caption ?? `"${o.title}," a video by ${o.author_name} on its YouTube channel.`)}</figcaption>
</figure>`;
  } else if (host === "x.com" || host === "twitter.com") {
    // No widgets.js: the quote and link render on their own, with no third-party script or cookies.
    const o = await oembed(`https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=${encodeURIComponent(url)}`);
    html = `<figure class="social-embed">
${String(o.html).replace(/<script[\s\S]*?<\/script>/g, "").replace(/\?ref_src=[^"]*/g, "").trim()}
<figcaption>${esc(caption ?? `A post by ${o.author_name} on X.`)}</figcaption>
</figure>`;
  } else if (["tiktok.com", "instagram.com", "threads.net", "threads.com", "facebook.com"].includes(host)) {
    const name = { "tiktok.com": "TikTok", "instagram.com": "Instagram", "threads.net": "Threads", "threads.com": "Threads", "facebook.com": "Facebook" }[host]!;
    // TikTok's oEmbed is open; the others need an app token, so the writer describes the post.
    const o = host === "tiktok.com" ? await oembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`).catch(() => ({})) : {};
    const who = o.author_name ?? "<account name>", what = o.title ?? "<what the post says or shows, in your words>";
    html = `<figure class="social-embed">
<blockquote cite="${esc(url)}"><p>${esc(what)}</p>— ${esc(who)} on <a href="${esc(url)}" rel="noopener">${name}</a></blockquote>
<figcaption>${esc(caption ?? `A post by ${who} on ${name}.`)}</figcaption>
</figure>`;
  } else if (host === "embed.gettyimages.com") {
    if (!/^\/embed\/\d+/.test(u.pathname) || !u.searchParams.get("sig")) throw new Error("use the iframe src from the image's Embed button on gettyimages.com (embed.gettyimages.com/embed/<id>?et=…&sig=…)");
    html = `<figure class="photo-embed">
<iframe src="https://embed.gettyimages.com${u.pathname}${u.search}" title="${esc(caption ?? "Getty Images photo")}" loading="lazy" scrolling="no" referrerpolicy="strict-origin-when-cross-origin" style="${IFRAME_STYLE};aspect-ratio:594/465"></iframe>
<figcaption>${esc(caption ?? "<what the photo shows>")} (Getty Images embed)</figcaption>
</figure>`;
  } else if (host === "gettyimages.com") {
    throw new Error("open the image on gettyimages.com, press Embed, and pass the iframe src (embed.gettyimages.com/embed/…); Getty images are never downloaded");
  } else throw new Error(`${host} has no official embed here; supported: YouTube, X, TikTok, Instagram, Threads, Facebook, Getty Images embed`);
  console.log(`Paste where it belongs in the story (leave a blank line before and after):\n\n${html}`);
}
