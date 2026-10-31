#!/usr/bin/env bash
# Automatic /news/ publishing on the VPS, so publishing no longer waits for the owner's Mac.
# Cron starts this every minute from its own clone (SRC, set up by install-server-autopublish.sh);
# each start checks up to four times, 15 seconds apart, and stops after any build or publish:
#   1. fetch origin/main and read GitHub CI for its recent commits (one API call);
#   2. publish the newest commit since the last publish whose CI finished green. A newer commit
#      whose CI is still running, or went red, no longer holds back the green ones before it;
#   3. if nothing is green yet but main's newest commit only changes stories, images, printables
#      or keydates.ts and its CI is running, prebuild it (NEWS_BUILD_ONLY=1). When CI turns green
#      the publish only syncs files (NEWS_SKIP_BUILD=1), so the server build overlaps CI;
#   4. if main did not move but a scheduled story's publishedAt has passed, rebuild and publish.
# A red or cancelled CI run is never published. Copying a commit into the app directory works as
# scripts/sync-app.sh does from the Mac: content only when only stories, images, printables or
# keydates.ts changed. Reading the private repository and its CI status needs a GitHub token the
# owner places in TOKEN_FILE (read-only: Contents and Actions).
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/share/pnpm:$PATH"

SRC="${FC_SRC:-/home/yuzdehesaplama/private/freshcalendars-src}"
APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"
TOKEN_FILE="${FC_GITHUB_TOKEN_FILE:-/root/.config/freshcalendars/github-token}"
STATE="${FC_AUTOPUBLISH_STATE:-/var/lib/freshcalendars-autopublish}"
GH_REPO="${FC_GH_REPO:-mustafaozcaninfo/freshcalendars}"
POLLS="${FC_AUTOPUBLISH_POLLS:-4}"        # checks per cron start
POLL_GAP="${FC_AUTOPUBLISH_POLL_GAP:-15}" # seconds between them
# A prebuilt dist/news is used only this long; after that a publish builds again, so the 48-hour
# news sitemap window and other time-based output never go stale.
PREBUILD_MAX_AGE=900
# Paths that only change content; a commit of only these syncs three folders and rebuilds.
CONTENT_RE='^apps/news/(src/content/|src/assets/|public/|src/lib/keydates\.ts$)'
# Paths the published site never reads: docs, agent skills, CI and the local checks and audits.
# A commit of only these (and content-free) syncs the app directory and publishes nothing, instead
# of a three-minute rebuild that changes no file. Anything not listed counts as code.
NEUTRAL_RE='^(docs/|\.claude/|\.github/|\.githooks/|apps/news/test/|[^/]+\.md$|scripts/lib/(abbrev|pdf-print|story-patterns)\.mjs$|scripts/(news-seo-audit|news-abbrev-check|news-puzzle-check|news-puzzle-data|news-lighthouse|news-serve|news-parity-verify|smoke[^/]*|check-css-minify|concept-qa|design-[^/]*|diagnose-cls|download-smoke|feature-[^/]*|inner-pages-qa|measure-cls|qa-images|scan-layout|studio-lcp|surface-[^/]*|install-[^/]*|news-autopublish|news-deploy|sync-news-baseline|upsert-cron-notify)\.(mjs|sh|py)$)'
mkdir -p "$STATE"

log() { echo "$(date "+%Y-%m-%dT%H:%M:%S%z") $*"; }
get() { cat "$STATE/$1" 2>/dev/null || true; }
put() { echo "$2" >"$STATE/$1"; }

RUNS=""
# The last 100 push runs of the CI workflow on main, fetched once per check.
load_runs() {
  if [[ -n "${FC_TEST_RUNS:-}" ]]; then RUNS="$(cat "$FC_TEST_RUNS")"; return; fi  # dry-run tests without a token
  RUNS="$(curl -fsS -H "Authorization: Bearer $(cat "$TOKEN_FILE")" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GH_REPO/actions/runs?branch=main&event=push&per_page=100" \
    | jq -c '[.workflow_runs[] | select(.name == "CI") | {sha: .head_sha, s: "\(.status) \(.conclusion // "")"}]')"
}
# "completed success", "completed failure", "in_progress ", ... or "none" when CI never ran on it.
ci_of() { jq -r --arg s "$1" '([.[] | select(.sha == $s)][0].s) // "none"' <<<"$RUNS"; }

# What the files that differ between two commits need: full (any code), content (stories and
# their assets), or none (only neutral files: nothing published changes).
sync_mode() { # <from> <to>
  local files rest
  [[ -n "$1" ]] && git -C "$SRC" cat-file -e "$1" 2>/dev/null || { echo full; return; }
  # Read the lists first: `grep -q` exits early and pipefail would turn that into "no match".
  files="$(git -C "$SRC" diff --name-only "$1" "$2")"
  rest="$(grep -vE "$NEUTRAL_RE" <<<"$files" || true)"
  if grep -vE "$CONTENT_RE" <<<"$rest" | grep -q .; then echo full
  elif grep -q . <<<"$rest"; then echo content
  else echo none; fi
}

# Copy commit $1 into the app directory unless it is there already.
sync_app() {
  local sha="$1" mode
  [[ "$(get app-sha)" == "$sha" ]] && return 0
  mode="$(sync_mode "$(get app-sha)" "$sha")"
  git -C "$SRC" checkout -q --force --detach "$sha"
  git -C "$SRC" clean -fdq
  local R=(rsync -a --delete --exclude '.DS_Store')
  if [[ "$mode" == "none" ]]; then
    # Neutral files only: nothing the build or the publish reads. Code folders are copied on the
    # next full sync, which always copies them whole.
    :
  elif [[ "$mode" == "content" ]]; then
    # Same three folders as NEWS_CONTENT_ONLY=1 pnpm news:deploy.
    for d in src/content src/assets public; do "${R[@]}" "$SRC/apps/news/$d/" "$APP_DIR/apps/news/$d/"; done
    cp "$SRC/apps/news/src/lib/keydates.ts" "$APP_DIR/apps/news/src/lib/keydates.ts"  # stories add their dates here
  else
    # Same set as scripts/sync-app.sh; secrets (.env), node_modules, dist and caches stay as they are.
    "${R[@]}" --exclude 'node_modules' --exclude 'dist' "$SRC/packages/" "$APP_DIR/packages/"
    for d in scripts brand server; do "${R[@]}" "$SRC/$d/" "$APP_DIR/$d/"; done
    "${R[@]}" --exclude 'node_modules' --exclude '.astro' "$SRC/apps/news/" "$APP_DIR/apps/news/"
    for f in package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc; do [[ -f "$SRC/$f" ]] && cp "$SRC/$f" "$APP_DIR/$f"; done
    local stamp
    stamp="$(cat "$SRC/pnpm-lock.yaml" "$SRC/pnpm-workspace.yaml" | sha256sum | cut -d' ' -f1)"
    if [[ "$(cat "$APP_DIR/.deps-stamp" 2>/dev/null)" != "$stamp" || ! -d "$APP_DIR/node_modules" || ! -d "$APP_DIR/.playwright" ]]; then
      log "installing deps (lockfile changed)"
      rm -f "$APP_DIR/.deps-stamp"
      (cd "$APP_DIR" && (pnpm install --frozen-lockfile || pnpm install) \
        && PLAYWRIGHT_BROWSERS_PATH="$APP_DIR/.playwright" ./packages/generator/node_modules/.bin/playwright install chromium \
        && echo "$stamp" >.deps-stamp)
    fi
    chmod +x "$APP_DIR/scripts/"*.sh 2>/dev/null || true
  fi
  put app-sha "$sha"
  # The app directory no longer matches what was built (a neutral change leaves the build valid).
  [[ "$mode" == "none" ]] && [[ "$(get built-sha)" == "$(get last-sha)" ]] && put built-sha "$sha" || rm -f "$STATE/built-sha"
}

# The publish job builds (unless told not to), verifies, syncs public_html, purges Cloudflare,
# pings IndexNow and emails CRON_NOTIFY_TO on failure.
run_job() { FC_JOB=news-publish "$APP_DIR/scripts/server-cron.sh" 2>&1; }

publish() { # <sha> <reason> [force-build]
  local sha="$1" reason="$2" start out skip=0 clock built
  start=$(date +%s)
  # Only neutral files since the last publish: record it as published without building.
  if [[ -z "${3:-}" && -n "$(get last-sha)" && "$(sync_mode "$(get last-sha)" "$sha")" == "none" ]]; then
    sync_app "$sha"
    put last-sha "$sha"; rm -f "$STATE/failed-sha"
    log "main ${sha:0:7}: docs, skills or checks only; nothing to publish"
    return 0
  fi
  sync_app "$sha"
  clock="$start"
  built="$(get built-time)"
  if [[ -z "${3:-}" && "$(get built-sha)" == "$sha" ]] && (( start - ${built:-0} < PREBUILD_MAX_AGE )); then
    skip=1
    # Stories scheduled after the prebuild are not in it: count the schedule from the build time.
    clock="$(get built-time)"
  fi
  log "publishing $reason$([[ $skip == 1 ]] && echo ", prebuilt")"
  if out="$(NEWS_SKIP_BUILD=$skip run_job)"; then
    put last-sha "$sha"; put last-time "$clock"; rm -f "$STATE/failed-sha"
    put built-sha "$sha"; put built-time "$clock"
    log "published $reason in $(( $(date +%s) - start ))s, $(grep -o 'changed=[0-9]*' <<<"$out" | tail -1)"
  else
    put failed-sha "$sha"; rm -f "$STATE/built-sha"
    log "publish FAILED for $reason:"; tail -15 <<<"$out"
  fi
}

prebuild() { # <sha>
  local sha="$1" start out
  start=$(date +%s)
  sync_app "$sha"
  if out="$(NEWS_BUILD_ONLY=1 run_job)"; then
    put built-sha "$sha"; put built-time "$start"
    log "prebuilt main ${sha:0:7} in $(( $(date +%s) - start ))s while its CI runs"
  else
    rm -f "$STATE/built-sha"
    log "prebuild of ${sha:0:7} failed (CI will decide):"; tail -5 <<<"$out"
  fi
}

# Story publishedAt values that fell between the last publish and now (scheduled stories).
due_stories() {
  LAST_TIME="$(get last-time)" node -e '
    const fs = require("fs"), path = require("path");
    const since = Number(process.env.LAST_TIME) * 1000, now = Date.now(), out = [];
    (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".md")) { const m = /^publishedAt:\s*"?([^"\n]+)/m.exec(fs.readFileSync(p, "utf8")); const t = m ? Date.parse(m[1]) : NaN;
        if (t > since && t <= now) out.push(f.replace(/\.md$/, "")); } } })(process.argv[1]);
    console.log(out.join(" "));' "$SRC/apps/news/src/content/articles"
}

# One check. Sets DID=1 when it built or published (stop polling). It always returns 0, so
# errexit stays on inside it: a failed sync stops the run before anything is published.
DID=0
check() {
  git -C "$SRC" fetch -q origin main
  local head last cand="" c st
  head="$(git -C "$SRC" rev-parse origin/main)"
  last="$(get last-sha)"
  # First run: start the scheduled-story clock now instead of treating every story as due.
  [[ -z "$(get last-time)" ]] && put last-time "$(date +%s)"

  if [[ "$head" != "$last" ]]; then
    load_runs
    # main's own line since the last publish, newest first; the first green one wins.
    local range=("$head" -n 50)
    [[ -n "$last" ]] && git -C "$SRC" cat-file -e "$last" 2>/dev/null && range=("$last..$head")
    for c in $(git -C "$SRC" rev-list --first-parent "${range[@]}"); do
      [[ "$c" == "$(get failed-sha)" ]] && continue
      [[ "$(ci_of "$c")" == "completed success" ]] && { cand="$c"; break; }
    done
    st="$(ci_of "$head")"
    if [[ "$st" == completed* && "$st" != "completed success" && "$(get logged-red)" != "$head" ]]; then
      log "main ${head:0:7}: CI ${st#completed }, not publishing it"; put logged-red "$head"
    fi
    [[ "${FC_AUTOPUBLISH_DRY:-0}" == "1" ]] && { log "dry run: would publish ${cand:-nothing}, head CI: $st"; DID=1; return 0; }
    if [[ -n "$cand" ]]; then
      publish "$cand" "main ${cand:0:7} (CI green)$([[ "$cand" != "$head" ]] && echo ", newest green; ${head:0:7} is $st")"
      DID=1; return 0
    fi
    # Nothing green yet: build the newest commit while CI checks it, if it only changes content.
    if [[ "$st" != completed* && "$(get built-sha)" != "$head" && -n "$last" && "$(sync_mode "$last" "$head")" == "content" ]]; then
      prebuild "$head"
      DID=1; return 0
    fi
  fi

  # Scheduled stories go out from the last published commit, also while newer commits wait on CI.
  [[ -n "$last" ]] || return 0
  local due
  due="$(due_stories)"
  [[ -z "$due" ]] && return 0
  [[ "${FC_AUTOPUBLISH_DRY:-0}" == "1" ]] && { log "dry run: would publish scheduled: $due"; DID=1; return 0; }
  publish "$last" "scheduled: $due" force
  DID=1
}

main() {
  [[ -r "$TOKEN_FILE" || -n "${FC_TEST_RUNS:-}" ]] || { log "no GitHub token at $TOKEN_FILE; nothing to do"; exit 0; }
  # One run at a time (a publish outlasts the one-minute interval).
  exec 9>"$STATE/lock"
  if command -v flock >/dev/null; then flock -n 9 || exit 0; fi  # flock is on the VPS; local dry runs skip it
  # Before app-sha existed the app directory always held the last published commit.
  [[ -z "$(get app-sha)" && -n "$(get last-sha)" ]] && put app-sha "$(get last-sha)"
  local i
  for ((i = 1; i <= POLLS; i++)); do
    check
    (( DID )) && break
    (( i < POLLS )) && sleep "$POLL_GAP"
  done
  exit 0
}

# Everything above is only definitions: bash has read the whole file before main runs, so a
# checkout in SRC that rewrites this script mid-run cannot change what this run executes.
main "$@"
