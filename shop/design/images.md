# Photos set on the store

Stock photos chosen by hand on Nov. 11, 2026 through the store's stock search (`GET images/stock`) and uploaded with the image endpoints, so the store serves its own copies. All are from Pexels under the Pexels License (free to use, no attribution required).

| Where | Pexels photo | Photographer |
|---|---|---|
| Homepage hero | https://www.pexels.com/photo/5706225/ | see the Pexels page |
| Category tile: 2027 Planners (dated-planners) (id 61) | https://www.pexels.com/photo/273153/ | Pixabay |
| Category tile: Weekly Planners (id 3) | https://www.pexels.com/photo/6690924/ | Tara Winstead |
| Category tile: Wall Calendars (id 20) | https://www.pexels.com/photo/11706725/ | photoGraph |
| Category tile: Hardcover Bullet Journals (id 7) | https://www.pexels.com/photo/3622342/ | Telstarboy |
| Category tile: Highlighters (id 53) | https://www.pexels.com/photo/6193094/ | KATRIN  BOLOVTSOVA |
| Category tile: Gift Sets and Kits (journal-gift-sets) (id 62) | https://www.pexels.com/photo/4464823/ | https://kaboompics.com/ |

## Rules for the next photo

- **Hero:** the subject sits on the right or bottom right and the left half stays calm, because the text sits left over a scrim. No visible year, no brand names, no faces. Set it with `POST store/images` (`collection: hero`), then set the hero section's `image.alt`.
- **Category tiles:** a real photo of the product type, landscape, no year or foreign-language calendar. Set it with `POST categories/{id}/images` (`collection: listing`). A category without a listing image shows a random product photo instead.
- One photo per place: do not reuse the hero or another tile's photo.
