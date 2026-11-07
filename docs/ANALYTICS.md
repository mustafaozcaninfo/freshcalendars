# Measuring traffic

Three tools, three different questions. Their numbers never match, and that is expected.

| Tool | Answers | Counts | Misses |
|---|---|---|---|
| Cloudflare edge analytics (`docs/desk/traffic.md`, daily) | How many pages and printables did readers open, and where from? | Every HTML page and PDF the edge served to a client that does not call itself a bot | Unlabeled bots are counted (the first run, Nov. 7, 2026, showed 94% desktop, so bots inflate the totals); no referrer on this plan; no behaviour inside the page |
| Google Analytics 4 (`G-VT08H0GXHZ`, `apps/news/src/lib/analytics.ts`) | What did readers do on the page (engagement, events)? | Visits whose browser ran gtag.js | Ad-blocked visits, and readers who leave before window load (gtag.js loads after it, on purpose, for page speed) |
| Search Console and Bing Webmaster Tools | How did we do in search results? | Clicks and impressions on the search page | Everything after the click |

So: **the Cloudflare report is an upper bound and a ranking**, GA4 a lower bound; search performance from Search Console, behaviour from GA4 and Clarity.

## Cloudflare traffic report

`scripts/news-traffic.mjs` runs in the daily Search Console workflow (`.github/workflows/search-console.yml`) with the read-only `CF_ANALYTICS_TOKEN` already used for "Trending now". It writes `docs/desk/traffic.{md,json}`: views per day (stories, calendar pages, PDFs), top stories, sources (Google, Bing, DuckDuckGo, AI assistants, social, direct), countries and devices. Self-declared bots are filtered out by user agent. Run it by hand with the two variables set: `node scripts/news-traffic.mjs --stdout`.

## Microsoft Clarity

Heatmaps, scroll maps, session recordings, rage and dead clicks: where readers stop, which ads and printables they see, what confuses them. Free, no traffic limit.

- Turn on: set `CLARITY_ID` in `apps/news/src/lib/analytics.ts` to the project id from clarity.microsoft.com (Settings > Overview). It is public, not a secret. It loads with gtag.js after window load, so page speed is unchanged.
- In Clarity, link the Google Analytics property (Settings > Setup > Google Analytics integration) and turn on masking "Balanced" (default).
- **Consent:** no consent banner exists yet. Without a consent signal Clarity records visitors from the European Economic Area (EEA), the United Kingdom (UK) and Switzerland without cookies, so their sessions are not joined across pages. When a consent banner is added (AdSense requires a Google-certified one for those visitors), pass its answer with `clarity('consentv2', ...)` and Google consent mode.
