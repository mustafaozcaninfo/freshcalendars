#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
set -a
source "$ROOT/.env"
set +a

MODE="${1:---all}"
REMOTE_HOST="${DEPLOY_HOST:-root@2.25.147.42}"
REMOTE_PATH="${DEPLOY_PATH:-/home/yuzdehesaplama/web/freshcalendars.com/public_html/}"
PRIVATE_PATH="${DEPLOY_PRIVATE:-/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/}"
SITE_DIR="$ROOT/dist/site"

if [[ ! -d "$SITE_DIR" ]]; then
  echo "Missing $SITE_DIR — run pnpm fc build first" >&2
  exit 1
fi

export COPYFILE_DISABLE=1
echo "Deploying $SITE_DIR → $REMOTE_HOST:$REMOTE_PATH ($MODE)"
# news/ is published by its own pipeline (apps/news) — never delete it from here.
rsync -avz --delete \
  --exclude '.DS_Store' \
  --exclude 'name-of-archive.tar.gz' \
  --exclude 'news/' \
  -e ssh \
  "$SITE_DIR/" \
  "$REMOTE_HOST:$REMOTE_PATH"

echo "Fixing public_html ownership (yuzdehesaplama:www-data)"
ssh -o BatchMode=yes "$REMOTE_HOST" \
  "chown -R yuzdehesaplama:www-data '$REMOTE_PATH' && find '$REMOTE_PATH' -type d -exec chmod 755 {} + && find '$REMOTE_PATH' -type f -exec chmod 644 {} +"

echo "Syncing private PHP lib → $REMOTE_HOST:$PRIVATE_PATH"
ssh -o BatchMode=yes "$REMOTE_HOST" "mkdir -p ${PRIVATE_PATH}lib"
rsync -avz -e ssh \
  "$ROOT/server/php/lib/" \
  "$REMOTE_HOST:${PRIVATE_PATH}lib/"
ssh -o BatchMode=yes "$REMOTE_HOST" \
  "chown -R yuzdehesaplama:yuzdehesaplama '${PRIVATE_PATH%/}'"
# Keep VPS factory (cron) on the same code as this deploy — no hand sync.
if [[ "${SKIP_APP_SYNC:-}" != "1" ]]; then
  bash "$ROOT/scripts/sync-app.sh"
fi

if [[ -n "${CF_ZONE_ID:-}" && -n "${CF_API_KEY:-}" && -n "${CF_EMAIL:-}" ]]; then
  echo "Purging Cloudflare zone $CF_ZONE_ID"
  curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "X-Auth-Email: ${CF_EMAIL}" \
    -H "X-Auth-Key: ${CF_API_KEY}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' | head -c 400
  echo
else
  echo "CF credentials missing — skipped purge"
fi

echo "Deploy done"
