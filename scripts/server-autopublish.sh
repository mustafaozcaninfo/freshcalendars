#!/usr/bin/env bash
# Automatic /news/ publishing on the VPS, so publishing no longer waits for the owner's Mac.
# Cron runs this every 2 minutes from its own clone (SRC, set up by install-server-autopublish.sh):
#   1. fetch origin/main;
#   2. if main moved and GitHub CI finished green on that exact commit, copy it into the app
#      directory the way scripts/sync-app.sh does from the Mac (content only when only stories,
#      images or printables changed) and run the news-publish job (flock-protected);
#   3. if main did not move but a scheduled story's publishedAt has passed since the last
#      publish, run news-publish so it goes live.
# A red or cancelled CI run is never published. Reading the private repository and its CI status
# needs a GitHub token the owner places in TOKEN_FILE (read-only: Contents and Actions).
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/share/pnpm:$PATH"

SRC="${FC_SRC:-/home/yuzdehesaplama/private/freshcalendars-src}"
APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"
TOKEN_FILE="${FC_GITHUB_TOKEN_FILE:-/root/.config/freshcalendars/github-token}"
STATE="${FC_AUTOPUBLISH_STATE:-/var/lib/freshcalendars-autopublish}"
GH_REPO="${FC_GH_REPO:-mustafaozcaninfo/freshcalendars}"
mkdir -p "$STATE"

log() { echo "$(date "+%Y-%m-%dT%H:%M:%S%z") $*"; }

# One run at a time (a publish can outlast the 2-minute interval).
exec 9>"$STATE/lock"
if command -v flock >/dev/null; then flock -n 9 || exit 0; fi  # flock is on the VPS; local dry runs skip it

[[ -r "$TOKEN_FILE" || -n "${FC_TEST_CI:-}" ]] || { log "no GitHub token at $TOKEN_FILE; nothing to do"; exit 0; }
git -C "$SRC" fetch -q origin main
SHA="$(git -C "$SRC" rev-parse origin/main)"
LAST="$(cat "$STATE/last-sha" 2>/dev/null || true)"
LAST_TIME="$(cat "$STATE/last-time" 2>/dev/null || echo 0)"

ci_status() {
  curl -fsS -H "Authorization: Bearer $(cat "$TOKEN_FILE")" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GH_REPO/actions/runs?head_sha=$1&event=push&per_page=20" \
    | jq -r '[.workflow_runs[] | select(.name == "CI")][0] // {} | "\(.status // "none") \(.conclusion // "")"'
}

# Story publishedAt values that fell between the last publish and now (scheduled stories).
due_stories() {
  LAST_TIME="$LAST_TIME" node -e '
    const fs = require("fs"), path = require("path");
    const since = Number(process.env.LAST_TIME) * 1000, now = Date.now(), out = [];
    (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".md")) { const m = /^publishedAt:\s*"?([^"\n]+)/m.exec(fs.readFileSync(p, "utf8")); const t = m ? Date.parse(m[1]) : NaN;
        if (t > since && t <= now) out.push(f.replace(/\.md$/, "")); } } })(process.argv[1]);
    console.log(out.join(" "));' "$SRC/apps/news/src/content/articles"
}

MODE=""
if [[ "$SHA" != "$LAST" ]]; then
  [[ "$SHA" == "$(cat "$STATE/failed-sha" 2>/dev/null || true)" ]] && exit 0
  CI="${FC_TEST_CI:-$(ci_status "$SHA" || echo "error")}"  # FC_TEST_CI: dry-run tests without a token
  case "$CI" in
    "completed success") ;;
    "completed "*) log "main ${SHA:0:7}: CI ${CI#completed }, not publishing"; echo "$SHA" >"$STATE/failed-sha"; exit 0 ;;
    *) exit 0 ;; # running, not started, or the API did not answer: try again next run
  esac
  if [[ -z "$LAST" ]] || ! git -C "$SRC" cat-file -e "$LAST" 2>/dev/null; then MODE=full
  # Read the list first: `grep -q` exits early and pipefail would turn that into "no match".
  elif FILES="$(git -C "$SRC" diff --name-only "$LAST" "$SHA")"; grep -vE '^apps/news/(src/content|src/assets|public)/' <<<"$FILES" | grep -q .; then MODE=full
  else MODE=content; fi
  REASON="main ${SHA:0:7} (CI green)"
else
  # First run: start the scheduled-story clock now instead of treating every story as due.
  if [[ "$LAST_TIME" == "0" ]]; then date +%s >"$STATE/last-time"; exit 0; fi
  DUE="$(due_stories)"
  [[ -z "$DUE" ]] && exit 0
  MODE=schedule REASON="scheduled: $DUE"
fi

log "publishing $REASON, mode $MODE"
[[ "${FC_AUTOPUBLISH_DRY:-0}" == "1" ]] && { log "dry run: not publishing"; exit 0; }
START=$(date +%s)

if [[ "$MODE" != "schedule" ]]; then
  git -C "$SRC" checkout -q --force --detach "$SHA"
  git -C "$SRC" clean -fdq
fi
R=(rsync -a --delete --exclude '.DS_Store')
if [[ "$MODE" == "content" ]]; then
  # Same three folders as NEWS_CONTENT_ONLY=1 pnpm news:deploy.
  for d in src/content src/assets public; do "${R[@]}" "$SRC/apps/news/$d/" "$APP_DIR/apps/news/$d/"; done
elif [[ "$MODE" == "full" ]]; then
  # Same set as scripts/sync-app.sh; secrets (.env), node_modules, dist and caches stay as they are.
  "${R[@]}" --exclude 'node_modules' --exclude 'dist' "$SRC/packages/" "$APP_DIR/packages/"
  for d in scripts brand server; do "${R[@]}" "$SRC/$d/" "$APP_DIR/$d/"; done
  "${R[@]}" --exclude 'node_modules' --exclude '.astro' "$SRC/apps/news/" "$APP_DIR/apps/news/"
  for f in package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc; do [[ -f "$SRC/$f" ]] && cp "$SRC/$f" "$APP_DIR/$f"; done
  STAMP="$(cat "$SRC/pnpm-lock.yaml" "$SRC/pnpm-workspace.yaml" | sha256sum | cut -d' ' -f1)"
  if [[ "$(cat "$APP_DIR/.deps-stamp" 2>/dev/null)" != "$STAMP" || ! -d "$APP_DIR/node_modules" || ! -d "$APP_DIR/.playwright" ]]; then
    log "installing deps (lockfile changed)"
    rm -f "$APP_DIR/.deps-stamp"
    (cd "$APP_DIR" && (pnpm install --frozen-lockfile || pnpm install) \
      && PLAYWRIGHT_BROWSERS_PATH="$APP_DIR/.playwright" ./packages/generator/node_modules/.bin/playwright install chromium \
      && echo "$STAMP" >.deps-stamp)
  fi
  chmod +x "$APP_DIR/scripts/"*.sh 2>/dev/null || true
fi

# The publish job builds, verifies, syncs public_html, purges Cloudflare, pings IndexNow and
# emails CRON_NOTIFY_TO on failure.
if OUT="$(FC_JOB=news-publish "$APP_DIR/scripts/server-cron.sh" 2>&1)"; then
  [[ "$MODE" != "schedule" ]] && echo "$SHA" >"$STATE/last-sha"
  echo "$START" >"$STATE/last-time"; rm -f "$STATE/failed-sha"
  log "published $REASON in $(( $(date +%s) - START ))s, $(grep -o 'changed=[0-9]*' <<<"$OUT" | tail -1)"
else
  [[ "$MODE" != "schedule" ]] && echo "$SHA" >"$STATE/failed-sha"
  log "publish FAILED for $REASON:"; tail -15 <<<"$OUT"
fi
