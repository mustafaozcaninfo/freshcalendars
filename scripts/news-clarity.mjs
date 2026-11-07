#!/usr/bin/env node
// Daily Microsoft Clarity numbers for the desk (Data Export API, project-live-insights): per page,
// per channel and per device for the last 24 hours, with every metric Clarity returns (traffic,
// scroll depth, engagement time, dead, rage and quick-back clicks, script errors). Writes
// docs/desk/clarity.{md,json}; the daily Search Console workflow runs it with CLARITY_API_TOKEN
// (Clarity > Settings > Data Export, a project admin's token).
//   node scripts/news-clarity.mjs [--stdout]
// The API allows 10 requests a day per project and 1,000 rows each; this uses 3. Optional:
// without the token it exits 0, and a refused request is reported, never fatal.
// Clarity documents only the Traffic fields, so the tables print whatever fields each metric has.
import { writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const API = "https://www.clarity.ms/export-data/api/v1/project-live-insights";
export const VIEWS = { pages: "URL", channels: "Channel", devices: "Device" };

/** Number from a Clarity field (counts arrive as strings). */
const num = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

/** One metric block as a Markdown table: dimension column first, then every numeric field. */
export function metricTable(metric, dim, top = 25) {
  const rows = metric.information ?? [];
  if (!rows.length) return [];
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const label = keys.includes(dim) ? dim : keys.find((k) => num(rows[0][k]) === null) ?? keys[0];
  const fields = keys.filter((k) => k !== label && rows.some((r) => num(r[k]) !== null));
  const sortKey = fields.find((k) => /session|count|visit/i.test(k)) ?? fields[0];
  const sorted = [...rows].sort((a, b) => (num(b[sortKey]) ?? 0) - (num(a[sortKey]) ?? 0)).slice(0, top);
  const cell = (v) => { const n = num(v); return n === null ? String(v ?? "") : Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(2); };
  const short = (s) => String(s ?? "").replace(/^https?:\/\/(www\.)?freshcalendars\.com/, "").slice(0, 90) || "/";
  return [`#### ${metric.metricName}`, "", `| ${label} | ${fields.join(" | ")} |`, `|---|${fields.map(() => "---:").join("|")}|`,
    ...sorted.map((r) => `| ${short(r[label])} | ${fields.map((k) => cell(r[k])).join(" | ")} |`), ""];
}

export function report(now, data, failed) {
  const out = ["# Microsoft Clarity (generated, do not edit)", "",
    `Read ${now.toISOString().slice(0, 16)} UTC from the Clarity Data Export API, last 24 hours (UTC). Sessions are Clarity's; bot sessions are counted apart. Heatmaps and recordings are in the Clarity dashboard. Source: \`scripts/news-clarity.mjs\`, daily.`, ""];
  const titles = { pages: "By page", channels: "By channel", devices: "By device" };
  for (const [view, dim] of Object.entries(VIEWS)) {
    if (!data[view]) continue;
    out.push(`## ${titles[view]}`, "");
    for (const m of data[view]) out.push(...metricTable(m, dim));
  }
  if (failed.length) out.push("## Not available this run", "", ...failed.map((f) => `- ${f}`), "");
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const token = process.env.CLARITY_API_TOKEN;
  if (!token) {
    console.log("clarity: CLARITY_API_TOKEN not set; no Clarity report");
    process.exit(0);
  }
  const now = new Date(), data = {}, failed = [];
  for (const [view, dim] of Object.entries(VIEWS)) {
    try {
      const res = await fetch(`${API}?numOfDays=1&dimension1=${encodeURIComponent(dim)}`, {
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 160)}`);
      data[view] = JSON.parse(text);
    } catch (e) {
      failed.push(`${view}: ${e.message}`);
      console.log(`::warning::clarity: ${view}: ${e.message}`);
    }
  }
  const md = report(now, data, failed);
  if (process.argv.includes("--stdout")) console.log(md);
  else {
    writeFileSync(path.join(ROOT, "docs/desk/clarity.md"), md + "\n");
    writeFileSync(path.join(ROOT, "docs/desk/clarity.json"), JSON.stringify({ generatedAt: now.toISOString(), ...data, failed }, null, 1) + "\n");
    console.log(`clarity: wrote docs/desk/clarity.{md,json} (${failed.length} view(s) unavailable)`);
  }
}
