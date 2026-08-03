# SEO / perf measure — Fresh Calendars

## Lab scripts (post-code)

```bash
pnpm smoke:auto
pnpm smoke:lighthouse
node scripts/measure-cls.mjs
node scripts/scan-layout.mjs
node scripts/diagnose-cls.mjs https://freshcalendars.com/printable-calendars.html
```

## Targets

| Metric | Target |
|--------|--------|
| CLS (lab) | ≈ 0 |
| Lighthouse perf | soft ≥70 (AdSense caps ~60–80) |
| Warm HTML TTFB | tens of ms at edge after cache rules |
| Sitemap coverage | all inventory A URLs 200 + canonical self |

## Field

- GSC: resubmit `sitemap.xml` after cutover  
- Compare legacy vs new URL inspection for top when-is + month hubs  
