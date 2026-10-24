---
name: news-visuals
description: Pick, make and check the hero image and printable for a Fresh Calendars /news/ story so every story gets its own picture (licensed photo with our overlay, an unused 3D scene, or a new scene). Use whenever a story needs a hero, a hero looks generic or repeats another story, or someone asks for better or unique news visuals.
---

# Unique visuals for /news/

Read `CLAUDE.md` first. The hero is the first thing Google Discover, image search and social cards show, and a picture that repeats across stories reads as a repeated page. **Every story gets its own hero.** The rule is enforced: `pnpm fc news-assets` refuses a hero that repeats another story's illustrated scene or picture, and the audit check `12-HERO-UNIQUE` fails the build for stories published since 2026-10-24.

## 1. Choose the hero (in this order)

1. **A real subject? Use a licensed photo with our overlay.** A place, event, building, landscape, vehicle, food or object that a photo can show (a marathon bridge, a national park, an airport, a ballot drop box, a store front without logos as the subject). This is the default, and it gives the strongest result.
2. **An abstract date topic with no honest photo? Use a free illustrated scene.** Run `pnpm fc news-heroes`: it lists the scenes already taken and the ones still free. A taken scene is the same picture to a reader whatever the seed does, so it is refused.
3. **Neither? Add a scene** (section 4). Do this when a topic will recur (a new holiday family, a sport, travel); a one-off story uses a photo.

Never ship the category's default scene without checking `news-heroes`: that default is how ten election stories ended up with the same ballot box.

## 2. Licensed photo with the overlay (default)

```bash
pnpm fc news-photo search "<subject> <place>" --source commons     # also nasa, openverse, pexels (PEXELS_API_KEY)
pnpm fc news-photo use <slug> <n>                                   # crops to 16:9, keeps <slug>.source.webp
# frontmatter: assets.overlay: true, plus kicker, date and card (below)
pnpm fc news-assets <slug>                                          # redraws the hero: photo, scrim, kicker, date tile, card, finish
```

Then paste the `hero:` block `news-photo use` printed, and replace `credit` with the line `news-assets` prints (it ends in `, edited`, which CC BY requires).

Searching well:
- Search the subject and the place in plain words ("runners Verrazzano Bridge", "Grand Teton autumn", "airplane wing sunset"). Try three or four phrasings; the first query is rarely the best.
- Prefer U.S. federal public-domain photos: the agency that runs the subject often posts on Commons (NPS park accounts such as GrandTetonNPS, NASA, NOAA, USDA, MTA under CC BY). They are accurate, free of licensing doubt and usually large.
- Look at every candidate before choosing it. Make a quick contact sheet of thumbnails in the scratchpad and read it; do not choose from titles.

A photo passes when:
- **License:** public domain, CC0, CC BY, CC BY-SA or the Pexels License (the tool refuses the rest). Flickr re-uploads need a manual check (`--allow-flickr`).
- **Size:** at least 1600 px wide after the 16:9 crop; 2400 px is better.
- **Composition:** the subject sits in the right 60% or fills the frame. The left 40% gets the kicker, date tile and card, so a subject there is covered.
- **People:** no recognizable private person as the subject. Crowds from behind or at a distance are fine.
- **No logos or brand marks as the subject** (a sponsor banner wall is out). Brand names belong in the text.
- **Honest:** a photo from another year or place is a "File photo" in the caption, with its year. Never let a 2014 crowd pass as this year's.
- **Unique:** not used by another story (the gate checks the picture itself).

Overlay text (`assets.kicker`, `assets.date`, `assets.card`):
- Kicker: the topic and the date, under 45 characters ("NYC Marathon · Sun., Nov. 1, 2026").
- Card: one fact a reader acts on. `big` is the date, time, price or count ("9:10 a.m. ET", "Tue., Oct. 27"); `top` says what it is; `bottom` adds the next fact. No headline on the image: Discover shows the real headline beside it.
- Alt: what the photo shows plus the main keyword. Caption: what it is, who took it if it adds trust, and why it is here (20 to 220 characters).

## 3. Illustrated scenes (3D engine)

`news-assets` draws scenes with three.js in headless Chromium (`packages/generator/render3d/`): studio image-based light, a warm key with soft shadows, a colored rim light, neutral tone mapping, a shadow catcher, then `fx.ts` adds bloom, vignette and seeded grain before the text layer goes on. Scenes listed in `SCENES_3D` (`src/news3d.ts`) render in 3D; `fireworks`, `spring` and `autumn` are still flat 2D and look weaker next to them, so treat those as last resorts.

- `pnpm fc news-scenes --only a,b` shows scenes side by side; `pnpm fc news-heroes` shows which are free.
- Set `assets.scene` explicitly. Set `assets.date` so the calendar scene circles the story's day.
- A scene can be used once. A second story on the same topic uses a photo or a new scene.

**Daily series (puzzle hints):** `pnpm fc news-heroes5` draws each day's board from the story slug: random tile colors (never the answer), a different tilt, scale and position, and a seeded scatter behind it. Add the day's rows to `PUZZLE_HEROES` and run it; never copy yesterday's hero file.

## 4. Adding a scene

A new scene is a reusable asset, so build it with care:

1. Model it in `render3d/models.js` from primitives and canvas textures: a function `({ THREE, r, color, accent, date, canvasTexture }) => ({ group, view?, zoom?, lift?, ground?, lights? })`, registered in `MODELS`. Use `r()` for small seeded variation (positions, counts, rotation), never for the subject itself.
2. Add the name to `SCENES` and `SCENE_COLOR` in `src/art.ts` (with a 2D fallback in `BUILDERS`), `SCENE_ICON`, and an accent in `SCENES_3D`.
3. Rules: original shapes only (no logos, mascots, trade dress, real product silhouettes); the subject inside the middle 900 px so the 4:3 and 1:1 crops still read; mark printed faces `userData.noShadow`; scatter extras under a group with `userData.extra` so framing ignores them.
4. Check it with `pnpm fc news-scenes --only <name>` and read the image before using it.

## 5. The printable is the product

Readers keep the printable, and AI Overviews cannot replace it, so it gets the same care as the hero (rules: "Printables" and "Printable PDF rules" in the `news-article` skill).

- One printable per story whose content can be acted on, built from that story's own facts: its dates, times, steps or checklist. A generic month grid is not a product.
- Pick the layout by the content (month, timeline, checklist, list) and add the notes label that fits the reader ("My runner, my cheer spot").
- The `Source:` note names the same sources as the story.

## 6. Check before you commit

- `pnpm fc news-assets <slug>` finished without "hero is not unique".
- Read the hero and the printable PNG once: subject visible, card readable, nothing covered, no stray text.
- `pnpm news:build && pnpm news:seo-audit`: `12-HERO-UNIQUE` passes. `12-HERO-REPEATS` lists older stories that share a picture; when you update one of them, give it its own hero.
- Commit `<slug>.webp` (or `.jpg`), `<slug>.hero.json`, and for photos `<slug>.photo.json` and `<slug>.source.webp`.
