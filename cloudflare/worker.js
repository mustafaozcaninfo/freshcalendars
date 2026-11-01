// freshcalendars.com on Cloudflare Workers. Pages, feeds and sitemaps are static assets (dist/cf/public,
// built by cloudflare/assemble.mjs) and never reach this code. The Worker only runs for:
//   - /news/downloads/*  printables, read from R2 with the story canonical as a Link header;
//   - /api/contact       the contact form (Turnstile, then email to the owner and a copy in R2);
//   - anything no file answers: old calendar URLs (301) or the site's 404 page.
// Its cron trigger starts the timed GitHub Actions jobs (cron.js).
// Everything else that used to need PHP or nginx (/news/ 301s, image moves) is in _redirects.
import { legacyRedirect } from "./legacy-redirects.js";
import { scheduled } from "./cron.js";
import PDF_CANONICAL from "../dist/cf/pdf-canonical.json";
import NEWS_REDIRECTS from "../dist/cf/news-redirects.json";

const HTML_CACHE = "public, max-age=300, stale-while-revalidate=3600";
const NEWS_CACHE = "public, max-age=300, stale-while-revalidate=600";
const DOWNLOAD_CACHE = "public, max-age=86400, stale-while-revalidate=604800";
const SUBJECTS = ["general", "download", "licensing", "other"];

export default {
  scheduled,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/api/contact" || path === "/api/contact.php") return await contact(request, env, ctx);
      if (path.startsWith("/news/downloads/")) return await download(request, env, path);
      const target = legacyRedirect(path, url.search);
      if (target) return Response.redirect(target, 301);
      return await notFound(request, env, path);
    } catch (err) {
      console.error(path, err && err.stack ? err.stack : err);
      return new Response("Server error", { status: 500, headers: { "Cache-Control": "no-store" } });
    }
  },
};

/** The site's own 404 page (the /news/ one under /news/), sent with status 404 as nginx did. */
async function notFound(request, env, path) {
  const news = path === "/news" || path.startsWith("/news/");
  const page = await env.ASSETS.fetch(new URL(news ? "/news/404.html" : "/404.html", request.url));
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
  // nginx refused dotfiles (/.env, /.git/) before its cache headers applied.
  if (!/\/\./.test(path)) headers.set("Cache-Control", news ? NEWS_CACHE : HTML_CACHE);
  return new Response(request.method === "HEAD" ? null : page.body, { status: 404, headers });
}

/** Printables live in R2 under the same path; PDFs name their story as canonical (pdf-meta.mjs). */
async function download(request, env, path) {
  const moved = NEWS_REDIRECTS[path];
  if (moved) return Response.redirect(new URL(moved, request.url).href, 301);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  let key;
  try {
    key = decodeURIComponent(path.slice(1));
  } catch {
    return notFound(request, env, path);
  }
  const object = request.method === "HEAD"
    ? await env.CDN.head(key)
    : await env.CDN.get(key, { onlyIf: request.headers, range: request.headers });
  if (!object) return notFound(request, env, path);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Last-Modified", object.uploaded.toUTCString());
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", DOWNLOAD_CACHE);
  headers.set("CDN-Cache-Control", "public, max-age=2592000");
  const canonical = PDF_CANONICAL[path];
  if (canonical) headers.set("Link", `<${canonical}>; rel="canonical"`);

  if (request.method === "HEAD") {
    headers.set("Content-Length", String(object.size));
    return new Response(null, { headers });
  }
  // onlyIf failed: the client's copy is current.
  if (!("body" in object)) return new Response(null, { status: 304, headers });
  if (object.range && request.headers.has("Range")) {
    const { offset = 0, length = object.size - offset } = object.range;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(object.size));
  return new Response(object.body, { headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * The contact form (generator sitePages.ts, /page/contact/). Same checks and answers as the old
 * api/contact.php; Turnstile replaces nothing the PHP had, it is the spam gate the database rate
 * limit used to be. Each message is kept in the private state bucket first, so a mail failure
 * never loses one, then mailed to the verified owner address through Email Routing.
 */
async function contact(request, env, ctx) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Please fill in the form." }, 400);
  }
  const field = (name) => String(form.get(name) ?? "").trim();
  if (field("website")) return json({ ok: true }); // honeypot

  const name = field("name");
  const email = field("email");
  let subject = field("subject") || "general";
  const message = field("message");
  if (!name || [...name].length > 120) return json({ ok: false, error: "Please enter a valid name." }, 422);
  if (!email || [...email].length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Please enter a valid email." }, 422);
  }
  if (!SUBJECTS.includes(subject)) subject = "general";
  if (!message || [...message].length > 5000) {
    return json({ ok: false, error: "Please enter a message (max 5000 characters)." }, 422);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET ?? "", response: field("cf-turnstile-response"), remoteip: ip }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!verify.success) {
    return json({ ok: false, error: "Please complete the verification and try again." }, 403);
  }

  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const record = { name, email, subject, message, ip, userAgent: (request.headers.get("User-Agent") ?? "").slice(0, 255), createdAt: now.toISOString() };
  await env.STATE.put(`contact/${now.toISOString().slice(0, 7)}/${id}.json`, JSON.stringify(record, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });
  ctx.waitUntil(mailOwner(env, record).catch((err) => console.error("contact mail", err)));
  return json({ ok: true });
}

async function mailOwner(env, r) {
  if (!env.CONTACT_MAIL || !env.CONTACT_TO) return;
  const subject = `[FreshCalendars] Contact: ${r.subject}`;
  const text = `Fresh Calendars contact form\n\nName: ${r.name}\nEmail: ${r.email}\nSubject: ${r.subject}\nIP: ${r.ip}\n\n${r.message}\n`;
  await env.CONTACT_MAIL.send({
    from: { email: env.CONTACT_FROM, name: "Fresh Calendars" },
    to: env.CONTACT_TO,
    replyTo: r.email,
    subject,
    text,
  });
}
