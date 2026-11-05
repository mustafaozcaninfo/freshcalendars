#!/usr/bin/env node
// Real visitors of the last 7 days from Cloudflare's zone analytics, printed as a report: daily
// totals, the most opened pages, countries, referrers and devices. Read-only. Search Console only
// shows Google clicks; this sees everything that reaches the edge (direct, Pinterest, other search
// engines), minus clients that call themselves bots.
//
// Credentials come from the environment, never from the repo or the chat:
//   CF_ANALYTICS_TOKEN                  a token with Zone > Analytics > Read (the one CI already has), or
//   CF_EMAIL + CF_API_KEY               the account email and Global API Key (full power: use it on your own
//                                       machine only, and prefer the scoped token above).
//   CF_ZONE_ID (optional)               looked up by name when missing.
// Usage: node scripts/news-traffic.mjs [days=7] [--section=news|site|all]
// Totals count every client Cloudflare serves (bots included, "visitors" are its daily uniques);
// the page, country, referrer and device tables count page views from real browsers only.
const API = "https://api.cloudflare.com/client/v4";
const HOST = "freshcalendars.com";

/** Request headers for whichever credentials are set; null when none are. */
export function authHeaders(env) {
  if (env.CF_ANALYTICS_TOKEN) return { authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}` };
  if (env.CF_EMAIL && env.CF_API_KEY) return { "x-auth-email": env.CF_EMAIL, "x-auth-key": env.CF_API_KEY };
  return null;
}

/** Path filter for a section: the /news/ site, the calendar site (everything else) or both. */
export function pathFilter(section) {
  if (section === "news") return `clientRequestPath_like: "/news/%"`;
  if (section === "site") return `clientRequestPath_notlike: "/news/%"`;
  return "";
}

/** One grouped page-view query for a 24-hour window, by one dimension. */
export function groupQuery(dimension, section) {
  return `query($zone: String!, $since: Time!, $until: Time!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    httpRequestsAdaptiveGroups(limit: 100, orderBy: [count_DESC], filter: {
      datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball",
      clientRequestHTTPHost: "${HOST}", clientRequestHTTPMethodName: "GET",
      edgeResponseStatus: 200, edgeResponseContentTypeName: "html", ${pathFilter(section)}
      AND: [{ userAgent_notlike: "%bot%" }, { userAgent_notlike: "%spider%" }, { userAgent_notlike: "%crawl%" }]
    }) { count dimensions { ${dimension} } }
  } }
}`;
}

export const TOTALS_QUERY = `query($zone: String!, $from: Date!, $to: Date!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    httpRequests1dGroups(limit: 31, orderBy: [date_ASC], filter: { date_geq: $from, date_leq: $to }) {
      dimensions { date } sum { pageViews requests } uniq { uniques }
    }
  } }
}`;

/** Adds the counts of several days' rows by key, biggest first. */
export function merge(rowsByDay, key) {
  const total = new Map();
  for (const rows of rowsByDay) for (const r of rows) total.set(r.dimensions[key] || "(none)", (total.get(r.dimensions[key] || "(none)") ?? 0) + r.count);
  return [...total].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const fmt = (n) => n.toLocaleString("en-US");
const table = (title, rows, top, sum) => [
  `\n${title}`,
  ...rows.slice(0, top).map((r, i) => `${String(i + 1).padStart(3)}. ${fmt(r.count).padStart(8)}  ${sum ? ((r.count / sum) * 100).toFixed(1).padStart(5) + "%  " : ""}${r.name}`),
].join("\n");

/** The printed report from the merged data (pure, so it can be tested). */
export function report({ days, section, totals, pages, countries, referrers, devices, failed }) {
  const views = pages.reduce((s, r) => s + r.count, 0);
  return [
    `Cloudflare traffic, last ${days} days, ${section === "all" ? "whole site" : section === "news" ? "/news/" : "calendar site"} (page views from real browsers: ${fmt(views)})`,
    "\nDaily totals, whole zone (requests include bots; uniques are Cloudflare's daily unique visitors):",
    ...totals.map((t) => `  ${t.dimensions.date}  page views ${fmt(t.sum.pageViews).padStart(8)}  requests ${fmt(t.sum.requests).padStart(9)}  visitors ${fmt(t.uniq.uniques).padStart(7)}`),
    table("Most opened pages", pages, 25, views),
    table("Countries", countries, 12, views),
    table("Where visitors came from (referrer host; (none) = direct, bookmark or app)", referrers, 15, views),
    table("Devices", devices, 6, views),
    ...(failed.length ? [`\nNot loaded: ${failed.join("; ")}`] : []),
  ].join("\n");
}

async function gql(fetchImpl, headers, query, variables) {
  const res = await fetchImpl(`${API}/graphql`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors?.length) throw new Error(`${res.status} ${body.errors?.map((e) => e.message).join("; ") ?? "no body"}`);
  return body.data?.viewer?.zones?.[0] ?? {};
}

export async function zoneId(fetchImpl, headers, env) {
  if (env.CF_ZONE_ID) return env.CF_ZONE_ID;
  const res = await fetchImpl(`${API}/zones?name=${HOST}`, { headers });
  const body = await res.json().catch(() => ({}));
  const id = body.result?.[0]?.id;
  if (!id) throw new Error(`zone ${HOST} not found (${res.status}); set CF_ZONE_ID`);
  return id;
}

/** Collects the report data. One query per day and dimension: the free plan limits a window to a day. */
export async function collect({ fetchImpl = fetch, headers, zone, days, section, now = new Date() }) {
  const failed = [];
  const day = 86_400_000;
  const iso = (t) => new Date(t).toISOString().replace(/\.\d+Z$/, "Z");
  const windows = Array.from({ length: days }, (_, i) => ({ since: iso(now.getTime() - (i + 1) * day), until: iso(now.getTime() - i * day) }));
  const dims = { pages: "clientRequestPath", countries: "clientCountryName", referrers: "clientRefererHost", devices: "clientDeviceType" };
  const out = {};
  for (const [name, dim] of Object.entries(dims)) {
    const perDay = await Promise.all(windows.map((w) => gql(fetchImpl, headers, groupQuery(dim, section), { zone, ...w }).then((z) => z.httpRequestsAdaptiveGroups ?? []).catch((e) => { failed.push(`${name} ${w.since.slice(0, 10)}: ${e.message}`); return []; })));
    out[name] = merge(perDay, dim);
  }
  const from = iso(now.getTime() - days * day).slice(0, 10), to = iso(now.getTime()).slice(0, 10);
  out.totals = await gql(fetchImpl, headers, TOTALS_QUERY, { zone, from, to }).then((z) => z.httpRequests1dGroups ?? []).catch((e) => { failed.push(`totals: ${e.message}`); return []; });
  return { ...out, failed: [...new Set(failed)].slice(0, 6) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const headers = authHeaders(process.env);
  if (!headers) { console.error("Set CF_ANALYTICS_TOKEN, or CF_EMAIL and CF_API_KEY (see the top of this file)."); process.exit(1); }
  const days = Math.min(Math.max(Number(process.argv.find((a) => /^\d+$/.test(a))) || 7, 1), 14);
  const section = (process.argv.find((a) => a.startsWith("--section="))?.split("=")[1]) || "all";
  if (!["news", "site", "all"].includes(section)) { console.error("--section must be news, site or all"); process.exit(1); }
  try {
    const zone = await zoneId(fetch, headers, process.env);
    console.log(report({ days, section, ...(await collect({ headers, zone, days, section })) }));
  } catch (e) { console.error(`traffic: ${e.message}`); process.exit(1); }
}
