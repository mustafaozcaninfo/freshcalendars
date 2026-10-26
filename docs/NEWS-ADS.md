# /news/ ad placements

How AdSense units sit on /news/ pages, why each one is there, and the rules that keep them from
hurting rankings, Google Discover or the read. Code: `apps/news/src/lib/ad-units.mjs` (unit IDs,
`NEWS_AD_RULES`, the in-article plugin), `src/lib/ads.ts` (loader), `src/components/AdSlot.astro`
(one labeled, height-reserved slot), CSS in `src/layouts/NewsBase.astro`. Audit checks:
`01-ADS-CENTER`, `01-ADS-SPOILER`, `01-ADS-LOAD` in `scripts/news-seo-audit.mjs`.

Switch: ads are on unless the build runs with `NEWS_ADS=0`; then no slot, loader or AdSense hint
is rendered and every check still passes.

## Rules every slot follows

- Labeled "Advertisement" (CSS text, so it never enters the page text or the word count).
- Nothing above the H1. On stories nothing between the headline and the hero, so the hero (the
  LCP image) is never pushed down by an ad.
- Height reserved before fill (`min-height`, a full square on phones for the top unit), never
  shrinks after AdSense resizes it, and an unfilled unit collapses only while off screen: CLS ≈ 0.
- Not beside printables, download links or story tools (in-article plugin skips those H2
  boundaries); the after-story unit sits below the share bar and the Preferred Source box, not
  against the download grid.
- No ads inside puzzle spoiler sections (`01-ADS-SPOILER`), one in-article unit on election
  stories, none on policy, 404 or noindex pages or empty listings.
- No pop-ups, interstitials or custom sticky units. The only sticky units are the wide-screen
  sidebar rail (300 px wide, beside the text, never over it) and AdSense's own anchor, kept at
  the bottom of the screen (`data-overlays="bottom"`).
- At most 6 in-flow units and 3 rail units per page (`01-ADS-CENTER`).
- `adsbygoogle.js` is injected by the inline loader at the end of `<body>` (no render-blocking
  `<script src>`); each unit is requested when it comes within `lazyMargin` (two screens) of view.

## Story page (`/news/<slug>/`)

| # | Where | Unit | Why it earns clicks |
|---|---|---|---|
| 1 | Under the hero, above Key points | Fresh_News_Top (6) | Seen by every reader; the hero and headline stay unbroken above it. |
| 2 | Before the 3rd H2 | Fresh_News_1 | First natural pause after the reader has committed to the story; in-content units have the best CTR. |
| 3 | First later H2 with ≥250 story words above and ≥100 below (about one phone screen later) | Fresh_News_5 | Mid-to-late read, where long-form readers slow down. Before, only stories with 7+ sections got it. |
| 4 | After the story, share bar and Preferred Source | Fresh_News_2 | End-of-read moment, when readers decide what to do next. |
| 5 | After FAQ, sources and corrections | Fresh_News_4 | Readers who checked the FAQ are still engaged. |
| 6 | End of page, after Read next | Fresh_News_5 | Only when the story body did not already use Fresh_News_5. |
| R | Wide screens (≥1100 px): sticky sidebar rail, 1–3 segments | Fresh_News_3 | Visible for the whole read without covering text; 300×600 in tall windows. |

Puzzle pages follow the same plan with the spoiler rule: an in-article unit may come right before
the "(spoilers)" heading (a pause before the answers) but never between or after answer sections.

## News home, category, topic hubs, author pages, page 2+ and printables hub

- Top unit under the H1 and lede, after the first content block rule (`01-ADS-CENTER`).
- In-feed units between whole sections or after the 4th card, never inside a card row.
- End-of-page unit above the footer.

## Density

Measured on built pages at 375 px (phone) and 1280 px: see the numbers in the pull request.
Better Ads Standards cap mobile ad density at 30% of the main content height; the target here is
under 20%.

## Open decisions for the owner

1. Which of the new in-article units to keep after a week of AdSense data (CTR and RPM per unit
   in AdSense > Reports > Ad units).
2. Consent: an AdSense "Privacy & messaging" GDPR message (and US state message) must be on in the
   AdSense account for EEA, UK and Swiss visitors; nothing on the page changes.
3. Auto ads: keep only the bottom anchor (and optionally vignettes off) so Google cannot add
   unplanned in-page units.
