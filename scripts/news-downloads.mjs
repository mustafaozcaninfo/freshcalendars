#!/usr/bin/env node
// Printable PDF downloads per file for the last 7 days, from Cloudflare's zone analytics (the same
// token and query style as scripts/news-trending.mjs), so the desk can see which printables and
// kits readers keep. CI writes the table to the run summary; locally it prints it.
//   pnpm news:downloads [--days 7] [--json]
// Optional like trending: without CF_ANALYTICS_TOKEN / CF_ZONE_ID, or when Cloudflare fails, it
// warns and exits 0. It never blocks a build or a publish.
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const TOP = 100;

// Successful (200) and partial (206, PDF viewers fetch in ranges) GETs of printable PDFs from real clients.
const QUERY = `query($zone: String!, $since: Time!, $until: Time!, $top: Int!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    httpRequestsAdaptiveGroups(limit: $top, orderBy: [count_DESC], filter: {
      datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball",
      clientRequestHTTPMethodName: "GET", clientRequestPath_like: "/news/downloads/%.pdf",
      edgeResponseStatus_geq: 200, edgeResponseStatus_lt: 300,
      AND: [{ userAgent_notlike: "%bot%" }, { userAgent_notlike: "%spider%" }, { userAgent_notlike: "%crawl%" }]
    }) { count dimensions { clientRequestPath } }
  } }
}`;

/** Requests per PDF path over `days` days, queried one day at a time (the dataset's widest window). */
export async function fetchDownloads({ headers, zone, days = 7, now = new Date() }) {
  const totals = new Map();
  for (let d = 0; d < days; d++) {
    const until = new Date(now.getTime() - d * 86_400_000), since = new Date(until.getTime() - 86_400_000);
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { zone, since: since.toISOString().replace(/\.\d+Z$/, "Z"), until: until.toISOString().replace(/\.\d+Z$/, "Z"), top: TOP } }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length) throw new Error(`Cloudflare analytics ${res.status}: ${body.errors?.map((e) => e.message).join("; ") ?? "no body"}`);
    for (const r of body.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? []) totals.set(r.dimensions.clientRequestPath, (totals.get(r.dimensions.clientRequestPath) ?? 0) + r.count);
  }
  return [...totals].map(([pdf, requests]) => ({ pdf, requests })).sort((a, b) => b.requests - a.requests);
}

/** PDF path → { story, kit } from the stories' downloads and their .print.json records. */
export function pdfOwners() {
  const out = new Map();
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []));
  for (const file of walk(path.join(ROOT, "apps/news/src/content/articles"))) {
    const slug = path.basename(file, ".md"), md = readFileSync(file, "utf8");
    const rec = path.join(ROOT, "apps/news/src/assets/news", slug, `${slug}.print.json`);
    const kit = existsSync(rec) ? JSON.parse(readFileSync(rec, "utf8")).kit : "custom";
    for (const m of md.matchAll(/pdf:\s*"(\/news\/downloads\/[^"]+\.pdf)"/g)) out.set(m[1], { story: slug, kit });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), days = Number(args[args.indexOf("--days") + 1]) || 7;
  const token = process.env.CF_ANALYTICS_TOKEN, zone = process.env.CF_ZONE_ID;
  if (!token || !zone) {
    console.log("downloads: CF_ANALYTICS_TOKEN or CF_ZONE_ID not set; no download report");
  } else {
    try {
      const rows = await fetchDownloads({ headers: { authorization: `Bearer ${token}` }, zone, days });
      const owners = pdfOwners();
      const byKit = new Map();
      for (const r of rows) { const k = owners.get(r.pdf)?.kit ?? "unlisted"; byKit.set(k, (byKit.get(k) ?? 0) + r.requests); }
      if (args.includes("--json")) console.log(JSON.stringify({ days, rows, byKit: Object.fromEntries(byKit) }, null, 1));
      const md = [`### Printable downloads, last ${days} days`, "", "| Kit | Requests |", "|---|---:|",
        ...[...byKit].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${n} |`), "",
        "| PDF | Story | Kit | Requests |", "|---|---|---|---:|",
        ...rows.slice(0, 40).map((r) => { const o = owners.get(r.pdf); return `| ${r.pdf.replace("/news/downloads/", "")} | ${o?.story ?? "-"} | ${o?.kit ?? "-"} | ${r.requests} |`; })].join("\n");
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
      if (!args.includes("--json")) console.log(md);
    } catch (e) {
      console.log(`::warning::downloads: ${e.message}; no download report`);
    }
  }
}
