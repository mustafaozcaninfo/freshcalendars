# Fresh Calendars

Generate-time (SSG) calendar factory for [freshcalendars.com](https://freshcalendars.com) — same architecture as ItsCalendar, **Fresh URLs + brand + hosting**.

## Status

**v1.0.0 — production release (2026-08-03).** Live on [freshcalendars.com](https://freshcalendars.com) · Hestia `yuzdehesaplama` · CDN `cdn.freshcalendars.com` · CF cache HIT.

| Artifact | Location |
|----------|----------|
| Infra checklist | [`docs/INFRA-STATUS.md`](docs/INFRA-STATUS.md) |
| Blueprint A→Z | [`docs/BLUEPRINT-A-Z.md`](docs/BLUEPRINT-A-Z.md) |
| CLI | `pnpm fc` → `packages/generator` |

## Commands

```bash
pnpm install
pnpm test
pnpm fc gen-meta --year 2026    # HTML/meta only
pnpm fc gen --year 2026         # + PNG/PDF via Playwright
pnpm fc verify
pnpm fc sync-cdn
pnpm fc deploy --confirm
```

## Product decisions

- Evergreen paths: `/printable-calendars.html`, `/{month}-calendars.html`, `/when-is/{slug}`, `/holidays`
- Year-qualified → 301 only
- CDN: `cdn.freshcalendars.com` · Deploy: `yuzdehesaplama` Hestia user
- Brand: blue / gold / red (`docs/DESIGN.md`)

Secrets: `.env` (never commit). See `.env.example`.
