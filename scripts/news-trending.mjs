#!/usr/bin/env node
// The /news/ stories readers opened most in the last 24 hours, from Cloudflare's zone analytics,
// written to apps/news/.trending.json for the "Trending now" box (apps/news/src/lib/trending.ts).
// CI runs it before every build with CF_ANALYTICS_TOKEN (Zone > Analytics > Read, this zone only)
// and CF_ZONE_ID. Trending is optional: without the token, or when Cloudflare fails, it writes
// nothing, warns and exits 0, and the build leaves the box out. It never blocks a publish.
import { renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(import.meta.dirname, "../apps/news/.trending.json");
const HOURS = 24;
const TOP = 60;

// Page views only: successful GETs of story URLs on the main host from real clients, no
// prefetch or Cloudflare-internal traffic. Bots that identify themselves are left out.
const QUERY = `query($zone: String!, $since: Time!, $until: Time!, $top: Int!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    httpRequestsAdaptiveGroups(limit: $top, orderBy: [count_DESC], filter: {
      datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball",
      clientRequestHTTPHost: "freshcalendars.com", clientRequestHTTPMethodName: "GET",
      clientRequestPath_like: "/news/%/", edgeResponseStatus: 200,
      AND: [{ userAgent_notlike: "%bot%" }, { userAgent_notlike: "%spider%" }, { userAgent_notlike: "%crawl%" }]
    }) { count dimensions { clientRequestPath } }
  } }
}`;

/** Ranked story paths for the last HOURS hours. `headers` carry the Cloudflare credentials. */
export async function fetchTrending({ headers, zone, now = new Date() }) {
  const since = new Date(now.getTime() - HOURS * 3_600_000).toISOString().replace(/\.\d+Z$/, "Z");
  const until = now.toISOString().replace(/\.\d+Z$/, "Z");
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { zone, since, until, top: TOP } }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors?.length) throw new Error(`Cloudflare analytics ${res.status}: ${body.errors?.map((e) => e.message).join("; ") ?? "no body"}`);
  const rows = body.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];
  // Story pages only: one path segment under /news/ (category, topic and author pages have two).
  const pages = rows
    .filter((r) => /^\/news\/[a-z0-9-]+\/$/.test(r.dimensions.clientRequestPath))
    .map((r) => ({ path: r.dimensions.clientRequestPath, requests: r.count }));
  return { generatedAt: now.toISOString(), hours: HOURS, pages };
}

/** Writes the ranking where the build reads it, replacing the file in one step. */
export function writeTrending(data, file = OUT) {
  writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1));
  renameSync(`${file}.tmp`, file);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const token = process.env.CF_ANALYTICS_TOKEN, zone = process.env.CF_ZONE_ID;
  // A stale file from an earlier run must not pass for today's ranking.
  rmSync(OUT, { force: true });
  if (!token || !zone) {
    console.log("trending: CF_ANALYTICS_TOKEN or CF_ZONE_ID not set; the build shows no Trending box");
  } else {
    try {
      const data = await fetchTrending({ headers: { authorization: `Bearer ${token}` }, zone });
      writeTrending(data);
      console.log(`trending: ${data.pages.length} story pages ranked; top: ${data.pages.slice(0, 3).map((p) => p.path).join(", ")}`);
    } catch (e) {
      console.log(`::warning::trending: ${e.message}; the build shows no Trending box`);
    }
  }
}
