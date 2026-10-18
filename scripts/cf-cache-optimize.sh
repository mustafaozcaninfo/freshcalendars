#!/usr/bin/env bash
# Tune Cloudflare for monthly static SSG: long edge TTL, respect origin browser TTL,
# speed features on, Rocket Loader off (Lighthouse-safe).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a

ZONE="${CF_ZONE_ID:?CF_ZONE_ID required}"
AUTH=(-H "X-Auth-Email: ${CF_EMAIL}" -H "X-Auth-Key: ${CF_API_KEY}" -H "Content-Type: application/json")

patch_setting() {
  local id="$1" payload="$2"
  echo "→ settings/$id"
  curl -sS -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE/settings/$id" \
    "${AUTH[@]}" --data "$payload" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("  success", d.get("success"), d.get("errors") or d.get("result",{}).get("value"))'
}

# Browser TTL: respect origin Cache-Control (we set long max-age on HTML/assets)
patch_setting browser_cache_ttl '{"value":0}'
# Aggressive caching of static extensions + HTML eligible via Cache Rules
patch_setting cache_level '{"value":"aggressive"}'
patch_setting brotli '{"value":"on"}'
patch_setting early_hints '{"value":"on"}'
patch_setting http3 '{"value":"on"}'
patch_setting '0rtt' '{"value":"on"}'
patch_setting always_online '{"value":"on"}'
patch_setting rocket_loader '{"value":"off"}'
# Lossless polish for origin images (icons); calendars live on Spaces CDN
patch_setting polish '{"value":"lossless"}'
patch_setting minify '{"value":{"css":"on","html":"off","js":"on"}}'

echo "→ Cache Rules entrypoint (http_request_cache_settings)"
# Edge: 31d for HTML+static on apex; browser respects origin (7d HTML / 30d assets)
RULESET=$(cat <<'JSON'
{
  "rules": [
    {
      "expression": "(http.host eq \"www.freshcalendars.com\" or http.host eq \"freshcalendars.com\")",
      "description": "FreshCalendars monthly SSG — long edge TTL; browser respects origin",
      "action": "set_cache_settings",
      "action_parameters": {
        "cache": true,
        "edge_ttl": {
          "mode": "override_origin",
          "default": 2678400,
          "status_code_ttl": [
            { "status_code_range": { "from": 200, "to": 299 }, "value": 2678400 },
            { "status_code_range": { "from": 300, "to": 399 }, "value": 86400 },
            { "status_code_range": { "from": 400, "to": 499 }, "value": 60 },
            { "status_code_range": { "from": 500, "to": 599 }, "value": 0 }
          ]
        },
        "browser_ttl": { "mode": "respect_origin" },
        "serve_stale": { "disable_stale_while_updating": false },
        "respect_strong_etags": true
      }
    },
    {
      "expression": "(http.host eq \"freshcalendars.com\" and starts_with(http.request.uri.path, \"/news/\") and not starts_with(http.request.uri.path, \"/news/_astro/\"))",
      "description": "FreshCalendars /news/ — short edge TTL (later rule overrides the site-wide 31d); publish purges by URL",
      "action": "set_cache_settings",
      "action_parameters": {
        "cache": true,
        "edge_ttl": {
          "mode": "override_origin",
          "default": 600,
          "status_code_ttl": [
            { "status_code_range": { "from": 200, "to": 299 }, "value": 600 },
            { "status_code_range": { "from": 300, "to": 399 }, "value": 600 },
            { "status_code_range": { "from": 400, "to": 499 }, "value": 60 },
            { "status_code_range": { "from": 500, "to": 599 }, "value": 0 }
          ]
        },
        "browser_ttl": { "mode": "respect_origin" },
        "serve_stale": { "disable_stale_while_updating": false },
        "respect_strong_etags": true
      }
    }
  ]
}
JSON
)

curl -sS -X PUT \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/rulesets/phases/http_request_cache_settings/entrypoint" \
  "${AUTH[@]}" --data "$RULESET" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("  success", d.get("success"), "rules", len((d.get("result") or {}).get("rules") or []), "errors", d.get("errors"))'

echo "CF cache optimize done. Deploy still purges on each factory run."
