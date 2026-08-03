# Templates — Fresh Calendars

Print HTML roots live in `packages/templates`. Each family is an **independent** HTML/CSS root using [`DESIGN.md`](DESIGN.md) tokens.

## Families (v1)

| Family | Variants | Notes |
|--------|----------|-------|
| `yearly/` | classic, with-holidays, poster | Matches legacy yearly JPG set naming spirit |
| `monthly/` | classic, color, holidays, planner, landscape | Five distinct roots |
| `blank/` | monthly blank grid(s) + undated yearly | Hub: `/blank-calendars.html` |
| `weekly/` | optional v1.1 | |
| `school/` | Aug–Jul overview | Ties to `/page/school-holidays` |

## Legacy salvage

Useful references under `backup/public_html/`:

- `printable/yearly/2026/*.jpg` — composition cues (not final art)
- `printable/monthly/2026/{month}/` — density / margins
- `css/app.css` — site chrome only (not print CSS)

Do **not** ship Bootstrap 4 CDN or Gotham webfonts in production SSG.

## Generator contract

Each printable emits:

1. Source HTML (print)
2. PNG + PDF via Playwright
3. WebP preview(s)
4. Meta JSON consumed by `sitePages.ts`
