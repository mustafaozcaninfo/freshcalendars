#!/usr/bin/env bash
# Publishes freshcalendars.com to Cloudflare. Runs in GitHub Actions only (the token lives there);
# writers never run it. The site has two halves built by different jobs:
#   /news/           dist/news + dist/news-data, built by CI on every green push to main and by
#                    the scheduled-story job (.github/workflows/ci.yml, scheduled.yml);
#   calendar pages   dist/site, built by the daily, monthly and yearly jobs (calendar.yml).
# A deploy always ships both: a half this run did not build comes from the last deploy, kept in
# the private R2 bucket freshcalendars-state. Binary files go to the public bucket freshcalendars
# (cdn.freshcalendars.com) before the pages that link them.
#
#   cloudflare/deploy.sh images     upload new /news/ images (CI, right after the checks pass)
#   cloudflare/deploy.sh deploy     the publish (NEWS_SHA set when dist/news is fresh from that
#                                   commit, CALENDAR_FRESH=1 when dist/site is fresh)
#   cloudflare/deploy.sh pull-calendar-state | push-calendar-state | pull-calendar-assets
#
# Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
#      CF_ZONE_ID (cdn purge), ANINDA_INDEX_KEY (optional), DRY_RUN=1 (everything but writes).
set -euo pipefail
cd "$(dirname "$0")/.."

: "${CLOUDFLARE_ACCOUNT_ID:?}" "${R2_ACCESS_KEY_ID:?}" "${R2_SECRET_ACCESS_KEY:?}"
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
CDN_BUCKET=r2:freshcalendars
STATE=r2:freshcalendars-state
CDN_ORIGIN="${CDN_ORIGIN:-https://cdn.freshcalendars.com}"
RCLONE=(rclone --transfers 32 --checkers 32 --fast-list --stats-one-line --stats 30s)
[[ "${DRY_RUN:-0}" == "1" ]] && RCLONE+=(--dry-run)
log() { echo "[deploy] $*"; }
summary() { [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && echo "$*" >>"$GITHUB_STEP_SUMMARY"; log "$*"; }

# News images are named by a hash of their content: upload only names R2 does not have yet.
upload_images() {
  [[ -d dist/news/_astro ]] || return 0
  "${RCLONE[@]}" copy dist/news/_astro "$CDN_BUCKET/news/_astro" --ignore-existing \
    --header-upload "Cache-Control: public, max-age=31536000, immutable"
}

# Changed objects on cdn.freshcalendars.com, purged 30 URLs per call (calendar files keep their URL).
purge_cdn() { # <file with one path per line, relative to the bucket>
  [[ -s "$1" && -n "${CF_ZONE_ID:-}" && "${DRY_RUN:-0}" != "1" ]] || return 0
  local n=0
  while mapfile -t -n 30 batch && ((${#batch[@]})); do
    jq -nc --arg o "$CDN_ORIGIN" '{files: [$ARGS.positional[] | "\($o)/\(.)"]}' --args "${batch[@]}" |
      curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" --data @- >/dev/null
    n=$((n + ${#batch[@]}))
  done <"$1"
  log "purged $n cdn URL(s)"
}

# Calendar PNG/PDF/WebP and Open Graph images: copy what changed (never delete: old URLs keep
# working, as on the VPS) and purge those URLs.
sync_calendar_assets() {
  local changes; changes="$(mktemp)"
  for d in assets og; do
    [[ -d "dist/$d" ]] || continue
    "${RCLONE[@]}" copy "dist/$d" "$CDN_BUCKET/$d" --checksum --exclude '.*' \
      --header-upload "Cache-Control: public, max-age=604800, immutable" --combined - |
      awk -v d="$d" '$1 == "*" { print d "/" $2 }' >>"$changes"
  done
  log "calendar files changed: $(wc -l <"$changes")"
  purge_cdn "$changes"
}

pull_calendar_assets() {
  mkdir -p dist/assets dist/og
  "${RCLONE[@]}" copy "$CDN_BUCKET/assets" dist/assets --checksum
  "${RCLONE[@]}" copy "$CDN_BUCKET/og" dist/og --checksum
}

# Build state the generator keeps between runs (sitemap lastmod dates, which studio files are current).
pull_calendar_state() {
  mkdir -p dist/assets/studio dist/news-data
  rclone copyto "$STATE/calendar/sitemap-lastmod.json" dist/sitemap-lastmod.json 2>/dev/null || true
  rclone copyto "$STATE/calendar/studio-build.json" dist/assets/studio/.build.json 2>/dev/null || true
  # The calendar pages' news boxes read the last deployed /news/ data.
  rclone copy "$STATE/news/news-data" dist/news-data 2>/dev/null || true
}
push_calendar_state() {
  [[ "${DRY_RUN:-0}" == "1" ]] && return 0
  rclone copyto dist/sitemap-lastmod.json "$STATE/calendar/sitemap-lastmod.json"
  [[ -f dist/assets/studio/.build.json ]] && rclone copyto dist/assets/studio/.build.json "$STATE/calendar/studio-build.json"
  return 0
}

state_get() { rclone cat "$STATE/$1" 2>/dev/null || true; }
state_put() { [[ "${DRY_RUN:-0}" == "1" ]] || printf '%s\n' "$2" | rclone rcat "$STATE/$1"; }

pull_half() { # <news|calendar> <tar target dir>
  local tmp; tmp="$(mktemp)"
  rclone copyto "$STATE/$1/build.tar.gz" "$tmp"
  tar -xzf "$tmp" -C "$2"
  rm -f "$tmp"
}
push_half() { # <news|calendar> <tar args...>
  local name="$1"; shift
  [[ "${DRY_RUN:-0}" == "1" ]] && return 0
  tar -czf - "$@" | rclone rcat "$STATE/$name/build.tar.gz"
}

deploy() {
  local start; start=$(date +%s)
  local news_fresh=0 deployed_news; deployed_news="$(state_get news/sha)"
  if [[ -n "${NEWS_SHA:-}" && -f dist/news/index.html ]]; then
    news_fresh=1
    # Deploys queue one at a time; a build of an older commit than the live one never replaces it.
    if [[ -n "$deployed_news" && "$deployed_news" != "$NEWS_SHA" ]] && git merge-base --is-ancestor "$NEWS_SHA" "$deployed_news" 2>/dev/null; then
      log "news build ${NEWS_SHA:0:7} is older than the deployed ${deployed_news:0:7}; keeping the deployed /news/"
      news_fresh=0
    fi
  fi
  mkdir -p dist/state-prev
  rm -rf dist/state-prev/* && pull_half news dist/state-prev || log "no deployed /news/ in state yet"
  if [[ "$news_fresh" == 0 ]]; then
    rm -rf dist/news dist/news-data
    pull_half news dist
    log "/news/ from the last deploy (${deployed_news:0:7})"
  fi
  if [[ "${CALENDAR_FRESH:-0}" != "1" ]]; then
    rm -rf dist/site
    pull_half calendar dist
    log "calendar pages from the last deploy ($(state_get calendar/sha | cut -c1-7))"
  fi

  # Files first, so no page ever links one that is not there yet.
  if [[ "$news_fresh" == 1 ]]; then
    upload_images
    # Printables keep their URL: sync (changed ones replaced, removed ones deleted, as rsync --delete did).
    "${RCLONE[@]}" sync dist/news/downloads "$CDN_BUCKET/news/downloads" --checksum
  fi
  node cloudflare/assemble.mjs
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    pnpm exec wrangler deploy --dry-run --outdir dist/cf/worker
  else
    pnpm exec wrangler deploy --message "news ${NEWS_SHA:-$deployed_news} calendar ${CALENDAR_SHA:-state}"
  fi

  # Record what is live. The tar leaves out what R2 already holds.
  if [[ "$news_fresh" == 1 ]]; then
    push_half news --exclude 'news/_astro' --exclude 'news/downloads' -C dist news news-data
    state_put news/sha "$NEWS_SHA"
    state_put news/built-at "${NEWS_BUILT_AT:-$start}"
    rclone copy dist/news-data "$STATE/news/news-data" 2>/dev/null || true
    if [[ "${DRY_RUN:-0}" != "1" ]]; then
      ANINDA_INDEX_STATE="$PWD/dist/index-submit/state.json" ; export ANINDA_INDEX_STATE
      rclone copy "$STATE/index-submit" dist/index-submit 2>/dev/null || true
      node cloudflare/index-ping.mjs dist/state-prev/news dist/news || true
      rclone copy dist/index-submit "$STATE/index-submit" || true
    fi
  fi
  if [[ "${CALENDAR_FRESH:-0}" == "1" ]]; then
    push_half calendar --exclude 'site/assets' -C dist site
    state_put calendar/sha "${CALENDAR_SHA:-unknown}"
    state_put calendar/built-at "$start"
  fi
  summary "Deployed: /news/ ${NEWS_SHA:-$deployed_news} ($([[ $news_fresh == 1 ]] && echo new || echo unchanged)), calendar $([[ "${CALENDAR_FRESH:-0}" == 1 ]] && echo "rebuilt" || echo unchanged), $(( $(date +%s) - start ))s"
}

# Astro's image cache (apps/news/node_modules/.astro/assets), kept in R2 as well as in the
# GitHub cache: a cold cache re-encodes every hero variant (~30 min).
IMAGE_CACHE=apps/news/node_modules/.astro/assets
pull_image_cache() { mkdir -p "$IMAGE_CACHE"; "${RCLONE[@]}" copy "$STATE/astro-cache" "$IMAGE_CACHE" --ignore-existing || true; }
push_image_cache() { "${RCLONE[@]}" copy "$IMAGE_CACHE" "$STATE/astro-cache" --ignore-existing || true; }

case "${1:-}" in
  images) upload_images ;;
  state-get) state_get "$2" ;;
  pull-image-cache) pull_image_cache ;;
  push-image-cache) push_image_cache ;;
  deploy) deploy ;;
  sync-calendar-assets) sync_calendar_assets ;;
  pull-calendar-assets) pull_calendar_assets ;;
  pull-calendar-state) pull_calendar_state ;;
  push-calendar-state) push_calendar_state ;;
  *) echo "usage: $0 images|pull-image-cache|push-image-cache|deploy|sync-calendar-assets|pull-calendar-assets|pull-calendar-state|push-calendar-state" >&2; exit 2 ;;
esac
