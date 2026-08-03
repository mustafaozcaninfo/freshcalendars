# Year rollover — Fresh Calendars

## Monthly (`FC_JOB=refresh`)

1. `pnpm fc refresh-evergreen` (bake Y + Y+1 assets)  
2. `pnpm fc verify`  
3. `pnpm fc sync-cdn`  
4. Deploy HTML + CF purge  
5. `smoke:auto`  

## September (`FC_JOB=generate-next`)

Full `gen --year Y+1` so next planning season assets exist before January flip.

## January 1 (`FC_JOB=rollover`)

1. Planning year becomes new civil year  
2. Regenerate evergreen hubs  
3. Verify singular/year URL 301s still point at evergreen  
4. Smoke + notify  

## Legacy debt removed

`templates/year-config.php` fixed `2026` and `config.php` `$thisYear = "2026"` go away — engine resolve owns the year.
