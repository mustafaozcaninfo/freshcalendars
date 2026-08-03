# Engine — Fresh Calendars

Package: `@freshcalendars/engine`

## Responsibilities

| Module | Job |
|--------|-----|
| `resolve.ts` | Planning year + per-month year (rolling) |
| `holidays/rules.ts` | Computable US (and later UK/CA) rules — **no hardcoded calendar dates** |
| `holidays/whenIs.ts` | Slug → rule map matching legacy `templates/holiday-dates.php` |
| `schoolYear.ts` | Aug–Jul label/span |
| `seo/buildMeta.ts` | Meta/JSON-LD field builders |
| `urls.ts` | Evergreen path helpers for Fresh spellings |

## Rolling rules (same math as ItsCalendar)

- Mid-August onward: **January** hub → next civil year  
- After **1 September**: **August** → next year  
- **1 January**: planning year flip  
- `refresh-evergreen` always bakes **Y and Y+1**

## URL helpers (Fresh)

```
yearlyHub()            → /printable-calendars.html
monthHub(month)        → /{month}-calendars.html
blankHub()             → /blank-calendars.html
holidaysHub()          → /holidays
whenIs(slug)           → /when-is/{slug}
page(slug)             → /page/{slug}
```

## Tests

`tsx --test` covering resolve edges (Aug 15, Sep 1, Jan 1) and holiday computus for sitemap slugs.
