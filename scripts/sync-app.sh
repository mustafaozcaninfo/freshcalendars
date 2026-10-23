#!/usr/bin/env bash
# Sync the generator factory (code the VPS cron runs) to the server app dir.
# Called automatically from deploy.sh so Mac → live site also updates cron code.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
set -a
source "$ROOT/.env"
set +a

REMOTE_HOST="${DEPLOY_HOST:-root@2.25.147.42}"
APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"

echo "Syncing factory → $REMOTE_HOST:$APP_DIR"
export COPYFILE_DISABLE=1

ssh -o BatchMode=yes "$REMOTE_HOST" "mkdir -p '$APP_DIR'"

rsync -avz --delete \
  --exclude '.DS_Store' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  -e ssh \
  "$ROOT/packages/" "$REMOTE_HOST:$APP_DIR/packages/"

rsync -avz --delete --exclude '.DS_Store' -e ssh \
  "$ROOT/scripts/" "$REMOTE_HOST:$APP_DIR/scripts/"

rsync -avz --delete --exclude '.DS_Store' -e ssh \
  "$ROOT/brand/" "$REMOTE_HOST:$APP_DIR/brand/"

rsync -avz --delete --exclude '.DS_Store' -e ssh \
  "$ROOT/server/" "$REMOTE_HOST:$APP_DIR/server/"

# News app (/news/) — built on the VPS by FC_JOB=news-publish.
ssh -o BatchMode=yes "$REMOTE_HOST" "mkdir -p '$APP_DIR/apps'"
rsync -avz --delete \
  --exclude '.DS_Store' \
  --exclude 'node_modules' \
  --exclude '.astro' \
  -e ssh \
  "$ROOT/apps/news/" "$REMOTE_HOST:$APP_DIR/apps/news/"

rsync -avz -e ssh \
  "$ROOT/package.json" \
  "$ROOT/pnpm-lock.yaml" \
  "$ROOT/pnpm-workspace.yaml" \
  "$REMOTE_HOST:$APP_DIR/"

if [[ -f "$ROOT/tsconfig.json" ]]; then
  rsync -avz -e ssh "$ROOT/tsconfig.json" "$REMOTE_HOST:$APP_DIR/"
fi
if [[ -f "$ROOT/.npmrc" ]]; then
  rsync -avz -e ssh "$ROOT/.npmrc" "$REMOTE_HOST:$APP_DIR/"
fi

# pnpm install and the Chromium download only when the lockfile changed: the Playwright version
# comes from the lockfile, so the same stamp means the same deps and browser. The stamp is written
# only after both succeed, so a failed install retries next time. FORCE_INSTALL=1 always installs.
DEPS_STAMP="$(cat "$ROOT/pnpm-lock.yaml" "$ROOT/pnpm-workspace.yaml" | shasum -a 256 | cut -d' ' -f1)"
ssh -o BatchMode=yes "$REMOTE_HOST" \
  "cd '$APP_DIR' && if [ '${FORCE_INSTALL:-0}' != 1 ] && [ \"\$(cat .deps-stamp 2>/dev/null)\" = '$DEPS_STAMP' ] && [ -d node_modules ] && [ -d .playwright ]; then echo 'Deps unchanged on VPS, skipping pnpm install and Chromium'; else echo 'Installing deps on VPS (pnpm)…' && rm -f .deps-stamp && export PATH=\"/usr/local/bin:\$HOME/.local/share/pnpm:\$PATH\" && (pnpm install --frozen-lockfile || pnpm install) && export PLAYWRIGHT_BROWSERS_PATH='$APP_DIR/.playwright' && ./packages/generator/node_modules/.bin/playwright install chromium && echo '$DEPS_STAMP' > .deps-stamp; fi"

# Upsert alert recipient without rewriting other VPS secrets
if [[ -n "${CRON_NOTIFY_TO:-}" ]]; then
  NOTIFY_B64="$(printf '%s' "$CRON_NOTIFY_TO" | base64 | tr -d '\n')"
  ssh -o BatchMode=yes "$REMOTE_HOST" \
    "APP_DIR='$APP_DIR' CRON_NOTIFY_B64='$NOTIFY_B64' python3 '$APP_DIR/scripts/upsert-cron-notify.py'"
fi

echo "Factory sync done → $APP_DIR"
