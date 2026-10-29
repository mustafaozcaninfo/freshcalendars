// LCP of a page served from a local dist/site: phone (412px @1.75x), slow 4G, 4x CPU, median of N runs.
// Not Lighthouse: one page, our own bytes only. usage: node scripts/studio-lcp.mjs dist/site /october-calendars.html 5
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(new URL("../packages/generator/package.json", import.meta.url));
const { chromium } = require("playwright");

const [root = "dist/site", page = "/october-calendars.html", runs = "5"] = process.argv.slice(2);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  fs.readFile(fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, "index.html") : file, (err, body) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  });
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}${page}`;
const browser = await chromium.launch();
const results = [];
for (let i = 0; i < Number(runs); i++) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36" });
  // Third-party hosts (ads, analytics, CDN) are blocked in both runs so only our own bytes differ.
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  // Lighthouse "slow 4G" numbers: 150 ms RTT, 1.6 Mbps down, 750 kbps up; 4x CPU slowdown.
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => { window.__lcp = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp.push({ t: e.startTime, el: e.element ? e.element.tagName + (e.element.getAttribute("src") ? " " + (e.element.currentSrc || e.element.getAttribute("src")) : "") : "?", size: e.size }); }).observe({ type: "largest-contentful-paint", buffered: true }); });
  await p.goto(url, { waitUntil: "load", timeout: 120000 });
  await p.waitForTimeout(1500);
  const lcp = (await p.evaluate(() => window.__lcp)).at(-1);
  const bytes = await p.evaluate(() => performance.getEntriesByType("resource").filter(r => /studio\/.*(png|webp)$/.test(r.name)).map(r => `${r.name.replace(/^.*\/assets\//, "")} ${r.encodedBodySize}`));
  results.push(lcp.t);
  console.log(`run ${i + 1}: LCP ${Math.round(lcp.t)} ms  ${lcp.el.replace(/^.*\/assets\//, "IMG ")}  | studio images: ${bytes.join(", ")}`);
  await ctx.close();
}
results.sort((a, b) => a - b);
console.log(`median LCP: ${Math.round(results[Math.floor(results.length / 2)])} ms (${page}, ${root})`);
await browser.close(); server.close();
