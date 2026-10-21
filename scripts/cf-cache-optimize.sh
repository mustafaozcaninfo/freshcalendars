#!/usr/bin/env bash
# Tune Cloudflare for monthly static SSG: long edge TTL, respect origin browser TTL,
# speed features on, Rocket Loader off (Lighthouse-safe). Free-plan features only.
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
# Polish is a Pro feature; the zone is on the Free plan, so keep it off (images are pre-optimized
# at build time: AVIF/WebP from Astro, compressed PNG/PDF printables).
patch_setting polish '{"value":"off"}'
# Auto Minify stays off (live zone value since 2026-08; Cloudflare deprecated it). Build output is already compact.
patch_setting minify '{"value":{"css":"off","html":"off","js":"off"}}'
# Email Obfuscation injects an external decoder script and hides contact addresses from crawlers.
patch_setting email_obfuscation '{"value":"off"}'
# HSTS: every hostname (apex, www, cdn) is proxied over HTTPS; no preload list submission.
patch_setting security_header '{"value":{"strict_transport_security":{"enabled":true,"max_age":15552000,"include_subdomains":true,"preload":false,"nosniff":true}}}'

echo "→ Smart Tiered Cache (upper-tier data centers near the origin; free plan)"
curl -sS -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE/cache/tiered_cache_smart_topology_enable" \
  "${AUTH[@]}" --data '{"value":"on"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print("  success", d.get("success"), d.get("errors") or d.get("result",{}).get("value"))'

echo "→ Cache Rules entrypoint (http_request_cache_settings)"
# Edge: 31d for HTML+static on apex; browser respects origin (7d HTML / 30d assets).
# respect_strong_etags is false: with it on, a response cached without compression (strong
# ETag from nginx) was never compressed for later visitors (/news/ went out as 123 KB raw HTML).
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
        "respect_strong_etags": false
      }
    },
    {
      "expression": "(http.host eq \"freshcalendars.com\" and starts_with(http.request.uri.path, \"/news/\") and not starts_with(http.request.uri.path, \"/news/_astro/\") and not starts_with(http.request.uri.path, \"/news/downloads/\"))",
      "description": "FreshCalendars /news/ — 1-day edge TTL (later rule overrides the site-wide 31d); every publish purges changed URLs",
      "action": "set_cache_settings",
      "action_parameters": {
        "cache": true,
        "edge_ttl": {
          "mode": "override_origin",
          "default": 86400,
          "status_code_ttl": [
            { "status_code_range": { "from": 200, "to": 299 }, "value": 86400 },
            { "status_code_range": { "from": 300, "to": 399 }, "value": 3600 },
            { "status_code_range": { "from": 400, "to": 499 }, "value": 60 },
            { "status_code_range": { "from": 500, "to": 599 }, "value": 0 }
          ]
        },
        "browser_ttl": { "mode": "respect_origin" },
        "serve_stale": { "disable_stale_while_updating": false },
        "respect_strong_etags": false
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
