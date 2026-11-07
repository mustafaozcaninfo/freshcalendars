#!/usr/bin/env node
// Turns the day's reader data into work and into one page for the owner. Reads what the daily
// workflow just wrote (docs/desk/traffic.json: the first-party beacon; docs/desk/clarity.json:
// Microsoft Clarity; docs/desk/search-console.json) and the stories, then writes:
//   docs/desk/readers.md        signals for the desks: pages readers leave fast, Clarity problems,
//                               reads per category (search desk: UX briefs; research desk: topics)
//   docs/desk/weekly.md         one page for the owner: this week against the week before
//   docs/desk/clarity-history.json  one compact Clarity row per day (the API only sees 3 days)
// Runs after scripts/news-traffic.mjs and scripts/news-clarity.mjs; no network, no secrets.
//   node scripts/news-readers.mjs [--stdout]
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const DESK = path.join(ROOT, "docs/desk");
const read = (f) => { try { return JSON.parse(readFileSync(path.join(DESK, f), "utf8")); } catch { return null; } };

/** Thresholds the desks act on; docs/DESK.md "Reader data" explains them. */
export const RULES = {
  minViews: 30,          // beacon views in 7 days before a page is judged
  fastShare: 0.6,        // average seconds below 60% of the site average: readers leave fast
  lowScroll: 20,         // average deepest scroll below 20%: the answer is not where they look
  minSessions: 10,       // Clarity sessions in 24 hours before a page is judged
  deadClick: 15,         // % of sessions with a dead click
  rageClick: 5,          // % of sessions with a rage click
  quickback: 10,         // % of sessions that went straight back
  scriptError: 30,       // % of sessions with a script error (manager: usually ads or code)
};

/** slug -> { category, title, updatedAt } from the stories on disk. */
export function storyIndex(dir = path.join(ROOT, "apps/news/src/content/articles")) {
  const out = new Map();
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".md")) { const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(p, "utf8"))?.[1] ?? ""; const g = (k) => new RegExp(`^${k}:\\s*"?([^"\\n]*)"?`, "m").exec(fm)?.[1] ?? ""; out.set(e.name.slice(0, -3), { category: g("category"), title: g("title"), updatedAt: g("updatedAt") || g("publishedAt") }); } } };
  if (existsSync(dir)) walk(dir);
  return out;
}

const slugOf = (p) => /^\/news\/([a-z0-9-]+)\/$/.exec(String(p).replace(/^https?:\/\/[^/]+/, "").replace(/#.*$/, ""))?.[1] ?? null;
const weighted = (rows, key) => { const n = rows.reduce((s, r) => s + r.n, 0); return n ? rows.reduce((s, r) => s + r.n * (r[key] ?? 0), 0) / n : 0; };
const sum = (rows) => rows.reduce((s, r) => s + r.n, 0);

/** Pages with enough beacon views whose readers leave fast or never scroll to the answer. */
export function fastLeavers(pages, stories, rules = RULES) {
  const story = pages.filter((r) => slugOf(r.k) && r.n >= rules.minViews && stories.get(slugOf(r.k))?.category !== "puzzles");
  const avgSec = weighted(story, "sec");
  return story.filter((r) => r.sec < rules.fastShare * avgSec || r.scroll < rules.lowScroll)
    .map((r) => ({ slug: slugOf(r.k), views: r.n, sec: r.sec, scroll: r.scroll, siteSec: avgSec, why: [r.sec < rules.fastShare * avgSec ? "leave fast" : null, r.scroll < rules.lowScroll ? "low scroll" : null].filter(Boolean).join(", ") }))
    .sort((a, b) => b.views - a.views);
}

/** Clarity page rows -> { slug: { sessions, dead, rage, quickback, scriptError } } (fragments folded in). */
export function clarityPages(clarity) {
  const out = new Map();
  for (const m of clarity?.pages ?? []) {
    const field = { DeadClickCount: "dead", RageClickCount: "rage", QuickbackClick: "quickback", ScriptErrorCount: "scriptError" }[m.metricName];
    for (const r of m.information ?? []) {
      const slug = slugOf(r.Url ?? r.URL ?? ""); if (!slug) continue;
      const row = out.get(slug) ?? out.set(slug, { sessions: 0 }).get(slug);
      const s = Number(r.sessionsCount ?? r.totalSessionCount ?? 0);
      if (m.metricName === "Traffic") row.sessions += s;
      if (field) { row[`_${field}`] = (row[`_${field}`] ?? 0) + s * Number(r.sessionsWithMetricPercentage ?? 0) / 100; row[`_${field}N`] = (row[`_${field}N`] ?? 0) + s; }
    }
  }
  for (const row of out.values()) for (const f of ["dead", "rage", "quickback", "scriptError"]) row[f] = row[`_${f}N`] ? (100 * row[`_${f}`]) / row[`_${f}N`] : 0;
  return out;
}

/** Pages whose Clarity numbers call for a fix: content (desk) or code and ads (manager). */
export function clarityFlags(pages, stories, rules = RULES) {
  const out = [];
  for (const [slug, r] of pages) {
    if (r.sessions < rules.minSessions) continue;
    const why = [];
    if (r.dead >= rules.deadClick) why.push(`dead clicks ${r.dead.toFixed(0)}%`);
    if (r.rage >= rules.rageClick) why.push(`rage clicks ${r.rage.toFixed(0)}%`);
    if (r.quickback >= rules.quickback) why.push(`quick-back ${r.quickback.toFixed(0)}%`);
    const manager = r.scriptError >= rules.scriptError ? `script errors ${r.scriptError.toFixed(0)}%` : null;
    if (why.length || manager) out.push({ slug, sessions: r.sessions, desk: why.join(", "), manager, puzzle: stories.get(slug)?.category === "puzzles" });
  }
  return out.sort((a, b) => b.sessions - a.sessions);
}

/** Beacon views and reading per category, this window and the one before. */
export function byCategory(pages, prev, stories) {
  const acc = new Map();
  const add = (rows, key) => { for (const r of rows ?? []) { const s = slugOf(r.k); if (!s) continue; const c = stories.get(s)?.category || "(other)"; const a = acc.get(c) ?? acc.set(c, { category: c, views: 0, prev: 0, secW: 0, pages: new Set() }).get(c); if (key === "views") { a.views += r.n; a.secW += r.n * r.sec; a.pages.add(s); } else a.prev += r.n; } };
  add(pages, "views"); add(prev, "prev");
  return [...acc.values()].map((a) => ({ category: a.category, views: a.views, prev: a.prev, sec: a.views ? a.secW / a.views : 0, stories: a.pages.size, perStory: a.pages.size ? a.views / a.pages.size : 0 })).sort((x, y) => y.views - x.views);
}

/** A compact daily Clarity row for the history file. */
export function clarityRow(clarity, day) {
  const metric = (view, name) => (clarity?.[view] ?? []).find((m) => m.metricName === name)?.information ?? [];
  const traffic = metric("devices", "Traffic");
  const sessions = traffic.reduce((s, r) => s + Number(r.totalSessionCount ?? 0), 0);
  const bots = traffic.reduce((s, r) => s + Number(r.totalBotSessionCount ?? 0), 0);
  const pps = sessions ? traffic.reduce((s, r) => s + Number(r.totalSessionCount ?? 0) * Number(r.pagesPerSessionPercentage ?? r.PagesPerSessionPercentage ?? 0), 0) / sessions : 0;
  const by = (name, key) => Object.fromEntries(metric("devices", name).map((r) => [r.Device, Number(r[key] ?? 0)]));
  return { day, sessions, bots, pagesPerSession: Number(pps.toFixed(3)), scroll: by("ScrollDepth", "averageScrollDepth"), activeTime: by("EngagementTime", "activeTime"), channels: Object.fromEntries(metric("channels", "Traffic").map((r) => [r.Channel, Number(r.totalSessionCount ?? 0)])) };
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const pct = (a, b) => (b ? `${a >= b ? "+" : ""}${(((a - b) / b) * 100).toFixed(0)}%` : "new");

export function readersMd({ now, leavers, flags, cats, uxExperiments }) {
  const out = ["# Reader signals (generated, do not edit)", "",
    `Built ${now.toISOString().slice(0, 16)} UTC by \`scripts/news-readers.mjs\` from the first-party beacon (last 7 days, \`traffic.md\`) and Microsoft Clarity (last 24 hours, \`clarity.md\`). What each desk does with it: \`docs/DESK.md\`, "Reader data". Puzzle pages are left out of the desk lists (the puzzle desk owns them).`, ""];
  out.push("## Readers leave fast (search desk: UX briefs)", "", `Story pages with ${RULES.minViews}+ beacon views whose readers stay under ${RULES.fastShare * 100}% of the site's average time or scroll less than ${RULES.lowScroll}% of the page.`, "");
  out.push(...(leavers.length ? ["| Story | Views | Avg. seconds (site) | Avg. scroll | Why |", "|---|---:|---:|---:|---|", ...leavers.slice(0, 25).map((r) => `| ${r.slug} | ${fmt(r.views)} | ${fmt(r.sec)} (${fmt(r.siteSec)}) | ${fmt(r.scroll)}% | ${r.why} |`)] : ["- none this week (or not enough beacon data yet)"]), "");
  const desk = flags.filter((f) => f.desk && !f.puzzle), mgr = flags.filter((f) => f.manager);
  out.push("## Clarity: what readers struggle with (search desk: UX briefs)", "", `Pages with ${RULES.minSessions}+ sessions in 24 hours and dead clicks ${RULES.deadClick}%+, rage clicks ${RULES.rageClick}%+ or quick-backs ${RULES.quickback}%+. Watch the page's recordings in Clarity before writing the brief.`, "");
  out.push(...(desk.length ? ["| Story | Sessions | Problem |", "|---|---:|---|", ...desk.slice(0, 20).map((f) => `| ${f.slug} | ${fmt(f.sessions)} | ${f.desk} |`)] : ["- none today"]), "");
  out.push("## For the manager (code, layout or ads)", "", `Script errors in ${RULES.scriptError}%+ of sessions come from code or ad scripts, never from a story's text.`, "");
  out.push(...(mgr.length ? mgr.slice(0, 15).map((f) => `- ${f.slug}: ${f.manager} of ${fmt(f.sessions)} sessions`) : ["- none today"]), "");
  out.push("## Reading by category (research desk: weigh topics)", "", "Beacon views of the last 7 days against the 7 before, per category, and views per story read.", "",
    ...(cats.length ? ["| Category | Views | Week before | Change | Stories read | Views per story | Avg. seconds |", "|---|---:|---:|---:|---:|---:|---:|", ...cats.map((c) => `| ${c.category} | ${fmt(c.views)} | ${fmt(c.prev)} | ${pct(c.views, c.prev)} | ${c.stories} | ${fmt(c.perStory)} | ${fmt(c.sec)} |`)] : ["- no beacon data yet"]), "");
  if (uxExperiments?.length) out.push("## Reader experiments", "", ...uxExperiments.map((e) => `- ${e.slug} (changed ${e.changedAt}): ${e.result ?? "waiting for 8 days of data"}`), "");
  return out.join("\n");
}

export function weeklyMd({ now, beacon, history, gsc, cats }) {
  const out = ["# The week in numbers (generated, do not edit)", "", `Built ${now.toISOString().slice(0, 16)} UTC. Last 7 days against the 7 before. Sources: \`traffic.md\` (beacon), \`clarity.md\`, \`search-console.md\`. How to read them: \`docs/ANALYTICS.md\`.`, ""];
  const daily = beacon?.daily ?? [];
  const cur = daily.slice(-7), prev = daily.slice(-14, -7);
  if (cur.length) {
    const internal = (rows) => (rows ?? []).filter((r) => /freshcalendars\.com$/.test(r.k)).reduce((s, r) => s + r.n, 0);
    const iNow = sum(beacon.sources ?? []) ? internal(beacon.sources) / sum(beacon.sources) : 0;
    const iPrev = sum(beacon.sourcesPrev ?? []) ? internal(beacon.sourcesPrev) / sum(beacon.sourcesPrev) : 0;
    out.push("## Real readers (beacon)", "", "| | This week | Week before | Change |", "|---|---:|---:|---:|",
      `| Page views | ${fmt(sum(cur))} | ${fmt(sum(prev))} | ${pct(sum(cur), sum(prev))} |`,
      `| Avg. seconds on page | ${fmt(weighted(cur, "sec"))} | ${fmt(weighted(prev, "sec"))} | ${pct(weighted(cur, "sec"), weighted(prev, "sec"))} |`,
      `| Avg. deepest scroll | ${fmt(weighted(cur, "scroll"))}% | ${fmt(weighted(prev, "scroll"))}% | |`,
      `| Views from inside the site | ${(iNow * 100).toFixed(1)}% | ${(iPrev * 100).toFixed(1)}% | |`, "");
    if (beacon.devices?.length) out.push("Devices: " + beacon.devices.map((r) => `${r.k} ${fmt(r.n)} (${fmt(r.sec)} s, ${fmt(r.scroll)}% scroll)`).join(" · "), "");
  } else out.push("## Real readers (beacon)", "", "- no beacon data yet", "");
  const h = (history ?? []).slice(-14), hc = h.slice(-7), hp = h.slice(-14, -7);
  if (hc.length) {
    const avg = (rows, f) => (rows.length ? rows.reduce((s, r) => s + f(r), 0) / rows.length : 0);
    out.push("## Clarity (daily average)", "", "| | This week | Week before |", "|---|---:|---:|",
      `| Sessions a day | ${fmt(avg(hc, (r) => r.sessions))} | ${hp.length ? fmt(avg(hp, (r) => r.sessions)) : "-"} |`,
      `| Pages per session | ${avg(hc, (r) => r.pagesPerSession).toFixed(2)} | ${hp.length ? avg(hp, (r) => r.pagesPerSession).toFixed(2) : "-"} |`,
      `| Mobile scroll | ${fmt(avg(hc, (r) => r.scroll?.Mobile ?? 0))}% | ${hp.length ? `${fmt(avg(hp, (r) => r.scroll?.Mobile ?? 0))}%` : "-"} |`,
      `| Mobile active seconds | ${fmt(avg(hc, (r) => r.activeTime?.Mobile ?? 0))} | ${hp.length ? fmt(avg(hp, (r) => r.activeTime?.Mobile ?? 0)) : "-"} |`, "");
  }
  const wk = Array.isArray(gsc?.weeks?.news) ? gsc.weeks.news : gsc?.weeks?.news?.web;
  if (Array.isArray(wk) && wk.length) out.push("## Google search (/news/, web)", "", ...wk.slice(0, 2).map((w) => `- ${w.start ?? w.from}..${w.end ?? w.to}: ${fmt(w.clicks)} clicks, ${fmt(w.impressions)} impressions`), "");
  if (cats?.length) out.push("## Most read categories", "", ...cats.slice(0, 6).map((c) => `- ${c.category}: ${fmt(c.views)} views (${pct(c.views, c.prev)}), ${fmt(c.perStory)} per story`), "");
  if (beacon?.pages?.length) out.push("## Most read stories", "", ...beacon.pages.slice(0, 10).map((r) => `- ${r.k}: ${fmt(r.n)} views, ${fmt(r.sec)} s`), "");
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const traffic = read("traffic.json"), clarity = read("clarity.json"), gsc = read("search-console.json");
  const stories = storyIndex();
  const beacon = traffic?.beacon ?? {};
  const leavers = beacon.pages ? fastLeavers(beacon.pages, stories) : [];
  const flags = clarity ? clarityFlags(clarityPages(clarity), stories) : [];
  const cats = beacon.pages ? byCategory(beacon.pages, beacon.pagesPrev, stories) : [];
  let history = read("clarity-history.json") ?? [];
  if (clarity?.devices && !clarity.failed?.length && clarity.generatedAt?.slice(0, 10) === day) history = [...history.filter((r) => r.day !== day), clarityRow(clarity, day)].slice(-120);
  const readers = readersMd({ now, leavers, flags, cats, uxExperiments: beacon.experiments });
  const weekly = weeklyMd({ now, beacon, history, gsc, cats });
  if (process.argv.includes("--stdout")) console.log(readers + "\n\n" + weekly);
  else {
    writeFileSync(path.join(DESK, "readers.md"), readers + "\n");
    writeFileSync(path.join(DESK, "weekly.md"), weekly + "\n");
    writeFileSync(path.join(DESK, "clarity-history.json"), JSON.stringify(history, null, 1) + "\n");
    console.log(`readers: ${leavers.length} fast-leaving pages, ${flags.length} Clarity flags, ${cats.length} categories, history ${history.length} days`);
  }
}
