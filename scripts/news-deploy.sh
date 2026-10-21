#!/usr/bin/env bash
# Mac → live /news/: test + build + verify locally, ship sources to the VPS, then let the
# VPS build and publish (one builder, so cron and manual runs never fight over hashes).
# Usage: pnpm news:deploy                       (full factory sync: code + content + deps)
#        NEWS_CONTENT_ONLY=1 pnpm news:deploy   (articles/images only, no pnpm install)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a; source "$ROOT/.env"; set +a
REMOTE_HOST="${DEPLOY_HOST:-root@2.25.147.42}"
APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"

cd "$ROOT"
pnpm test
pnpm news:build
pnpm news:verify

if [[ "${NEWS_CONTENT_ONLY:-0}" == "1" ]]; then
  rsync -avz --delete --exclude '.DS_Store' -e ssh "$ROOT/apps/news/src/content/" "$REMOTE_HOST:$APP_DIR/apps/news/src/content/"
  rsync -avz --delete --exclude '.DS_Store' -e ssh "$ROOT/apps/news/src/assets/" "$REMOTE_HOST:$APP_DIR/apps/news/src/assets/"
else
  bash "$ROOT/scripts/sync-app.sh"
fi

ssh -o BatchMode=yes "$REMOTE_HOST" "FC_JOB=news-publish '$APP_DIR/scripts/server-cron.sh'"

# Smoke (N7.8): live /news/ answers 200 with the short news TTL, the News sitemap parses,
# and a deep pagination path is not swallowed by the calendar site's /page/ redirects.
BASE="${SMOKE_BASE:-https://freshcalendars.com}"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
# Ask for compression like a browser: the first request after a purge fills the edge cache, and an
# uncompressed fill would be served raw to everyone (seen on /news/ before respect_strong_etags was off).
AE=(-H "Accept-Encoding: br, gzip")
hdrs="$(curl -fsS -o /dev/null -D - -A "$UA" "${AE[@]}" "$BASE/news/")" || { echo "✖ $BASE/news/ not reachable"; exit 1; }
grep -qi '^cache-control: .*max-age=300' <<<"$hdrs" || { echo "✖ /news/ Cache-Control is not the 300s news TTL"; grep -i '^cache-control' <<<"$hdrs"; exit 1; }
grep -qiE '^content-encoding: (br|gzip|zstd)' <<<"$hdrs" || echo "⚠ /news/ answered without compression"
# Read the whole body first: `curl | grep -q` fails under pipefail once grep exits early (SIGPIPE).
sm="$(curl -fsS --compressed -A "$UA" "${AE[@]}" "$BASE/news/news-sitemap.xml")" || { echo "✖ news-sitemap.xml not reachable"; exit 1; }
grep -q '<urlset' <<<"$sm" || { echo "✖ news-sitemap.xml invalid"; exit 1; }
code="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "${AE[@]}" "$BASE/news/page/99/")"
[[ "$code" == "404" ]] || { echo "✖ /news/page/99/ returned $code (expected 404, not a redirect)"; exit 1; }
echo "✔ /news/ live: $(grep -i '^cf-cache-status' <<<"$hdrs" | tr -d '\r')"
