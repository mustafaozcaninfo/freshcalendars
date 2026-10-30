#!/usr/bin/env bash
# Build, verify and publish /news/ (NEWS-ROADMAP §3.3, N7). Runs on the VPS (cron job
# news-publish, or triggered by scripts/news-deploy.sh). Only changed files are synced;
# Cloudflare is purged by URL for exactly those files, changed articles go to IndexNow and
# new ones go once to the AnindaIndex API (scripts/index-submit.mjs).
# Prints "changed=N" on its last line. Exit 0 with changed=0 when nothing differs.
#
# Env: NEWS_TARGET (default $DEPLOY_PATH/news/), NEWS_OWNER (default yuzdehesaplama:www-data),
#      NEWS_DRY_RUN=1 (diff only), NEWS_PURGE=0 (skip Cloudflare), NEWS_INDEXNOW=0 (skip ping),
#      NEWS_INDEX_SUBMIT=0 (skip AnindaIndex; it also needs ANINDA_INDEX_KEY in .env),
#      NEWS_BUILD_ENV="NEWS_INCLUDE_DRAFTS=1" (test builds only), SITE_ORIGIN,
#      NEWS_BUILD_ONLY=1 (build and verify, publish nothing: server-autopublish.sh prebuilds a
#      commit while its CI still runs), NEWS_SKIP_BUILD=1 (publish the dist/news that prebuild made).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then set -a; source "$ROOT/.env"; set +a; fi
export PATH="/usr/local/bin:/usr/bin:$HOME/.local/share/pnpm:$PATH"

ORIGIN="${SITE_ORIGIN:-https://freshcalendars.com}"
TARGET="${NEWS_TARGET:-${DEPLOY_PATH:-/home/yuzdehesaplama/web/freshcalendars.com/public_html/}news/}"
OWNER="${NEWS_OWNER:-yuzdehesaplama:www-data}"
DIST="$ROOT/dist/news"
INDEXNOW_KEY="freshcalendars-indexnow-2026"

# nginx keeps open file handles for up to 60s (open_file_cache_valid), so right after a sync it can
# still serve the old copy of a replaced file; a purge in that window lets Cloudflare re-cache the old
# page. A graceful reload starts workers with an empty cache; without root or a valid config, wait it out.
refresh_origin_cache() {
  if [[ "$(id -u)" == "0" ]] && command -v nginx >/dev/null && nginx -t >/dev/null 2>&1 && systemctl reload nginx; then
    sleep 2
  else
    sleep 61
  fi
}

cd "$ROOT"
unset NEWS_INCLUDE_DRAFTS NEWS_SITE_ORIGIN NEWS_PER_PAGE
# dist/news-data (latest.json for the calendar pages' news boxes, the PDF canonical map) is read
# by the daily calendar bake and installed below, so a prebuild of a commit CI has not passed yet
# parks its copy in news-data.next and leaves the published one in place until the publish.
DATA="$ROOT/dist/news-data"
if [[ "${NEWS_SKIP_BUILD:-0}" == "1" ]]; then
  [[ -f "$DIST/index.html" ]] || { echo "[news] NEWS_SKIP_BUILD=1 but dist/news is empty" >&2; exit 1; }
  if [[ -d "$DATA.next" ]]; then rm -rf "$DATA"; mv "$DATA.next" "$DATA"; fi
else
  rm -rf "$DATA.next" "$DATA.prev"
  [[ "${NEWS_BUILD_ONLY:-0}" == "1" && -d "$DATA" ]] && cp -a "$DATA" "$DATA.prev"
  env ${NEWS_BUILD_ENV:-} pnpm --silent news:build >/dev/null
fi
node scripts/news-verify.mjs "$DIST"
if [[ "${NEWS_BUILD_ONLY:-0}" == "1" ]]; then
  if [[ -d "$DATA.prev" ]]; then mv "$DATA" "$DATA.next"; mv "$DATA.prev" "$DATA"; fi
  echo "[news] built and verified; not published"
  echo "changed=0"
  exit 0
fi

# nginx maps (scripts/hestia-apply-nginx-cache.sh includes them): printable PDF -> story canonical,
# and the /news/ 301s in apps/news/redirects.map. Each is installed and reloaded only when it
# changed; a failing config test restores the previous map.
install_nginx_map() { # <source> <installed path> <label>
  local src="$1" dst="$2" label="$3"
  [[ "$(id -u)" == "0" && -f "$src" && -d "$(dirname "$dst")" ]] && ! cmp -s "$src" "$dst" || return 0
  cp "$dst" "$dst.prev" 2>/dev/null || : >"$dst.prev"
  cp "$src" "$dst"
  if nginx -t >/dev/null 2>&1; then systemctl reload nginx && echo "[news] $label map updated ($(grep -c '^[^#]' "$dst") entries)"
  else cp "$dst.prev" "$dst"; echo "[news] $label map rejected by nginx -t; kept the previous one"; fi
}
install_nginx_map "$ROOT/dist/news-data/pdf-canonical.map" /etc/nginx/freshcalendars/pdf-canonical.map "pdf canonical"
install_nginx_map "$ROOT/apps/news/redirects.map" /etc/nginx/freshcalendars/news-redirects.map "redirect"

mkdir -p "$TARGET" "$TARGET/_astro"
# Itemized dry run → list of changed/deleted paths (files only). Astro names every _astro file
# by a hash of its content, so those are compared by name (new only; old ones are pruned after
# 90 days below), never checksummed:
# _astro holds about 80% of the bytes and checksumming it on each pass was the slow part.
# Each line is "N<TAB>path" for a file the target did not have yet, "-<TAB>path" otherwise.
CHANGES=()
NEW_FILES=$'\n'
while IFS= read -r line; do
  CHANGES+=("${line#*$'\t'}")
  if [[ "${line%%$'\t'*}" == N ]]; then NEW_FILES+="${line#*$'\t'}"$'\n'; fi
done < <({
  rsync -rcn --delete --exclude '/_astro/' --itemize-changes --out-format='%i %n' "$DIST/" "$TARGET"
  rsync -rn --ignore-existing --itemize-changes --out-format='%i %n' "$DIST/_astro/" "$TARGET/_astro/" | sed -E 's#^([^ ]+ +)#\1_astro/#'
} | awk '$1 ~ /^[<>ch*]f|^\*deleting/ { n = ($1 ~ /^[<>c]f\+\+\+/) ? "N" : "-"; sub(/^[^ ]+ +/, ""); print n "\t" $0 }' | grep -v '/$' || true)

submit_for_index() {
  [[ "${NEWS_INDEX_SUBMIT:-1}" == "1" && -n "${ANINDA_INDEX_KEY:-}" ]] || return 0
  node scripts/index-submit.mjs submit "$@" || true
}

if [[ ${#CHANGES[@]} -eq 0 ]]; then
  echo "[news] no changes"
  [[ "${NEWS_DRY_RUN:-0}" == "1" ]] || submit_for_index  # sends anything an earlier run left queued
  echo "changed=0"
  exit 0
fi
# Print at most 50 changed paths without a pipe (head would SIGPIPE printf under pipefail).
for ((i = 0; i < ${#CHANGES[@]} && i < 50; i++)); do echo "[news] ${CHANGES[i]}"; done
(( ${#CHANGES[@]} > 50 )) && echo "[news] … and $(( ${#CHANGES[@]} - 50 )) more"

# The page's article:modified_time (from updatedAt), empty when the file or tag is missing.
modified_time() { sed -n 's/.*article:modified_time" content="\([^"]*\)".*/\1/p' "$1" 2>/dev/null | head -1; }

# Public URLs to purge: pages (dir/index.html → dir/), xml/xsl; hashed _astro files never need it.
URLS=()
ARTICLE_URLS=()
NEW_URLS=()
for p in "${CHANGES[@]}"; do
  case "$p" in
    _astro/*) ;;
    index.html) URLS+=("$ORIGIN/news/") ;;
    */index.html)
      u="$ORIGIN/news/${p%index.html}"
      URLS+=("$u")
      # New stories and topic hubs go to IndexNow, and a story again only when its updatedAt moved.
      # A new story reshuffles "More in" and related lists on older pages (and a code change
      # rewrites them all); those get purged but not announced. Lists wait for the crawl.
      if [[ ( "$p" =~ ^[^/]+/index\.html$ && ! "$p" =~ ^(category|author|page)/ ) || "$p" =~ ^topic/[^/]+/index\.html$ ]]; then
        if [[ "$NEW_FILES" == *$'\n'"$p"$'\n'* ]]; then
          ARTICLE_URLS+=("$u"); NEW_URLS+=("$u")
        elif [[ "$p" != topic/* && "$(modified_time "$DIST/$p")" != "$(modified_time "$TARGET$p")" ]]; then
          ARTICLE_URLS+=("$u")
        fi
      fi
      ;;
    *) URLS+=("$ORIGIN/news/$p") ;;
  esac
done

if [[ "${NEWS_DRY_RUN:-0}" == "1" ]]; then
  printf '[news] would purge %s\n' "${URLS[@]}"
  printf '[news] would ping IndexNow %s\n' "${ARTICLE_URLS[@]:-}"
  printf '[news] would submit for indexing %s\n' "${NEW_URLS[@]:-}"
  echo "changed=${#CHANGES[@]}"
  exit 0
fi

# Assets first so new HTML never points at a file that is not there yet; delete last.
rsync -r --ignore-existing "$DIST/_astro/" "$TARGET/_astro/"
rsync -rc --delete --exclude '/_astro/' "$DIST/" "$TARGET"
# Hashed files that left the build (a redrawn hero, a renamed image) stay 90 days, so Google
# Images and pages cached elsewhere keep resolving until the new URLs are crawled instead of
# piling up 404s. Files still in the build are touched on every publish, so mtime means "last
# seen in a build" and only files gone for 90 days are pruned.
(cd "$DIST/_astro" && find . -type f -print0) | (cd "$TARGET/_astro" && xargs -0 -r touch -c)
find "$TARGET/_astro" -type f -mtime +90 -delete
find "$TARGET" -type d -exec chmod 755 {} + && find "$TARGET" -type f -exec chmod 644 {} +
if [[ "$(id -u)" == "0" ]]; then chown -R "$OWNER" "$TARGET"; fi
[[ "${NEWS_PURGE:-1}" == "1" ]] && refresh_origin_cache

if [[ "${NEWS_PURGE:-1}" == "1" && -n "${CF_ZONE_ID:-}" && -n "${CF_API_KEY:-}" && -n "${CF_EMAIL:-}" && ${#URLS[@]} -gt 0 ]]; then
  for ((i = 0; i < ${#URLS[@]}; i += 30)); do
    batch=$(printf '%s\n' "${URLS[@]:i:30}" | python3 -c 'import sys,json; print(json.dumps({"files":[l.strip() for l in sys.stdin if l.strip()]}))')
    curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
      -H "X-Auth-Email: ${CF_EMAIL}" -H "X-Auth-Key: ${CF_API_KEY}" -H "Content-Type: application/json" \
      --data "$batch" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("[news] purge", "ok" if d.get("success") else d.get("errors"))'
  done
fi

if [[ "${NEWS_INDEXNOW:-1}" == "1" && ${#ARTICLE_URLS[@]} -gt 0 ]]; then
  body=$(printf '%s\n' "${ARTICLE_URLS[@]}" | python3 -c "
import sys,json
print(json.dumps({'host':'${ORIGIN#https://}','key':'$INDEXNOW_KEY','keyLocation':'$ORIGIN/$INDEXNOW_KEY.txt','urlList':[l.strip() for l in sys.stdin if l.strip()]}))")
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/indexnow \
    -H 'Content-Type: application/json; charset=utf-8' --data "$body" || echo 000)
  echo "[news] IndexNow ${#ARTICLE_URLS[@]} url(s) → HTTP $code"
fi

# New stories and hubs only, once each; the script keeps the record and retries what failed.
submit_for_index ${NEW_URLS[@]+"${NEW_URLS[@]}"}

echo "changed=${#CHANGES[@]}"
