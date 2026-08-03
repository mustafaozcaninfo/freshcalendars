#!/usr/bin/env bash
# Post-deploy smoke: 200s for core Fresh Calendars pages + 301s for legacy twins.
set -euo pipefail
BASE="${SMOKE_BASE:-https://freshcalendars.com}"
fail=0

ok() {
  local url="$1" expect="$2" code
  if [[ "$expect" == "301" || "$expect" == "302" ]]; then
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-redirs 0 "$url")
  else
    code=$(curl -sS -o /dev/null -w "%{http_code}" -L "$url")
  fi
  if [[ "$code" == "$expect" ]]; then
    echo "OK  $code $url"
  else
    echo "FAIL expected $expect got $code $url" >&2
    fail=1
  fi
}

echo "Smoke against $BASE"
ok "$BASE/" 200
ok "$BASE/printable-calendars.html" 200
ok "$BASE/blank-calendars.html" 200
ok "$BASE/january-calendars.html" 200
ok "$BASE/august-calendars.html" 200
ok "$BASE/holidays" 200
ok "$BASE/when-is/easter" 200
ok "$BASE/when-is/thanksgiving" 200
ok "$BASE/when-is/martin-luther-king-day" 200
ok "$BASE/page/school-holidays" 200
ok "$BASE/page/daylight-savings" 200
ok "$BASE/page/contact" 200
ok "$BASE/page/privacy-policy" 200
ok "$BASE/page/terms-of-use" 200
ok "$BASE/ads.txt" 200
ok "$BASE/sitemap.xml" 200
ok "$BASE/sitemap-images.xml" 200
ok "$BASE/feed.xml" 200
ok "$BASE/robots.txt" 200
ok "$BASE/favicon.svg" 200
ok "$BASE/favicon.ico" 200
ok "$BASE/apple-touch-icon.png" 200
ok "$BASE/site.webmanifest" 200
ok "$BASE/safari-pinned-tab.svg" 200
ok "$BASE/icons/icon-192.png" 200
ok "$BASE/icons/icon-512.png" 200

ok "$BASE/printable-calendar.html" 301
ok "$BASE/printable-calendars-2026.html" 301
ok "$BASE/january-calendars-2026.html" 301
ok "$BASE/2026-holidays.html" 301
ok "$BASE/when-is/easter-2026.html" 301
ok "$BASE/holidays.html" 301
ok "$BASE/when-is/easter.html" 301
ok "$BASE/page/contact.html" 301
ok "$BASE/editor/" 301

if [[ "$fail" -ne 0 ]]; then
  echo "Smoke FAILED" >&2
  exit 1
fi
echo "Smoke OK"
