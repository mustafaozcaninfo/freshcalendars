# Design system — Fresh Calendars

Original identity from **live freshcalendars.com** + brand marks in `/img/fresh-logo.png` and `/logo.png`.  
Not an ItsCalendar clone. Not Bootstrap-default forever. Not AI purple/cream.

## Brand

- Name: **Fresh Calendars** / `FreshCalendars.com` — hero-level on every first viewport
- Mark: yellow disc + red/white calendar glyph + wordmark (`img/fresh-logo.png`)
- Alternate lockup: **FRESH** (red) + **CALENDARS** (white) on charcoal (`logo.png`) — use for dark OG / PWA splash
- Voice: crisp, practical, print-first, “fresh for this year”

## Tokens (CSS variables)

Derived from live `css/app.css` + logo accents (modernize, don’t abandon):

```css
:root {
  /* Chrome */
  --fc-ink: #37474f;          /* body text (live) */
  --fc-ink-strong: #2e2f2f;
  --fc-muted: #777777;
  --fc-paper: #ffffff;
  --fc-wash: #e8eef3;         /* cool gray-blue page wash (was #e0e0e0) */
  --fc-line: #d0d7de;

  /* Brand */
  --fc-blue: #007bff;         /* header / th (live primary) */
  --fc-blue-deep: #004a7f;    /* CTA glow / focus */
  --fc-cyan: #0092d1;         /* secondary buttons / selected */
  --fc-gold: #fccc00;         /* footer top rule + logo disc */
  --fc-gold-soft: #f5cc3e;    /* “new” badge */
  --fc-red: #ec1d00;          /* weekend / logo calendar header */
  --fc-red-deep: #b20000;
  --fc-footer: #37474f;

  /* Print families (must diverge from site chrome AND from each other) */
  --fc-yearly-ink: #0b3d66;
  --fc-yearly-accent: #007bff;
  --fc-monthly-ink: #1c2430;
  --fc-monthly-accent: #0092d1;
  --fc-blank-ink: #2a3439;
  --fc-blank-accent: #5a6b75;
}
```

## Typography

Live stack used Gotham SSm (licensed) — **do not hotlink**; self-host open alternatives:

| Role | Font | Notes |
|------|------|-------|
| Display / H1 | **Sora** or **Outfit** | Geometric, matches logo sans |
| UI / nav | **Manrope** | Clean chrome |
| Body | **Source Sans 3** | Readable articles / when-is |
| Print numerals | **IBM Plex Sans** | Tabular-ish grids |

Never Inter / Roboto / Arial as primary. Inline `@font-face` + `font-display: optional` + preload (CLS pack).

## Logo usage

1. Header on `--fc-blue`: use `fresh-logo.png` (white wordmark) — never invert wrongly
2. Favicon / apple-touch: existing multi-size icons in `legacy/brand/` (blue tile identity)
3. OG default: dark charcoal + FRESH/CALENDARS lockup or calendar glyph on gold disc
4. Do not place floating badges on top of printable previews

## Three visual families

| Family | Character |
|--------|-----------|
| Yearly | Cool blue poster; oversized year; 12 mini-months; gold hairline accents |
| Monthly | White paper + cyan/blue headers; weekend red; holiday chips; 5 independent print roots |
| Blank | Quiet graphite chrome; max writing space; no holiday clutter |

Recoloring one layout for another family is forbidden.

## Site composition rules

1. First viewport: **Fresh Calendars** mark + one H1 + one sentence + one CTA group + one dominant calendar visual
2. No card grids in the hero
3. Ads only below the fold; manual slots with min-height
4. 2–3 motions: gallery crossfade, CTA press, month chip underline
5. Footer keeps gold top border (`--fc-gold`) — signature of live site

## Anti-patterns

- ItsCalendar cream + terracotta (different brand)
- Purple-on-white gradients
- Dark-mode-by-default chrome (logo is dark; **site chrome stays bright blue/white**)
- Soft-404 SPA (`ErrorDocument 404 /index.html`)
- Dashboard / stat strips in the hero
