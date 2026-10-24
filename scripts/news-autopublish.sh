#!/usr/bin/env bash
# Automatic /news/ publishing on the owner's Mac (the only machine with .env and the server key).
# launchd runs this every 5 minutes (scripts/install-autopublish.sh). Each run:
#   1. fetches origin/main;
#   2. if main moved and GitHub CI finished green on that exact commit, deploys it with
#      `pnpm news:deploy` from a clean worktree (content-only when only stories, images or
#      printables changed; a full sync otherwise);
#   3. if main did not move but a scheduled story's publishedAt has passed since the last
#      publish, redeploys content so it goes live.
# A red or cancelled CI run is never published; the next green commit is. Writers keep pushing
# to main; nobody runs news:deploy by hand unless this is switched off.
#
# Env: FC_PUBLISH_WT (the publish clone, default ~/.freshcalendars-publish), FC_REPO (where to fetch),
#      FC_AUTOPUBLISH_DRY=1 (decide and log, do not deploy).
set -euo pipefail

WT="${FC_PUBLISH_WT:-$HOME/.freshcalendars-publish}"
# Where to fetch and diff; the installed job uses its own clone for both (launchd cannot read ~/Documents).
REPO="${FC_REPO:-$WT}"
STATE="$HOME/Library/Application Support/FreshCalendars/autopublish"
DEPLOY_LOG="$HOME/Library/Logs/freshcalendars-deploy-last.log"
mkdir -p "$STATE" "$(dirname "$DEPLOY_LOG")"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*"; }
notify() { osascript -e "display notification \"$2\" with title \"Fresh Calendars: $1\"" >/dev/null 2>&1 || true; }

# One run at a time; a lock older than an hour is from a crashed run.
LOCK="$STATE/lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [[ -n "$(find "$LOCK" -maxdepth 0 -mmin +60 2>/dev/null)" ]]; then rm -rf "$LOCK"; mkdir "$LOCK"; else exit 0; fi
fi
trap 'rm -rf "$LOCK"' EXIT

git -C "$REPO" fetch -q origin main
SHA="$(git -C "$REPO" rev-parse origin/main)"
LAST="$(cat "$STATE/last-sha" 2>/dev/null || true)"
LAST_TIME="$(cat "$STATE/last-time" 2>/dev/null || echo 0)"
GH_REPO="$(cd "$REPO" && gh repo view --json nameWithOwner -q .nameWithOwner)"

# Story publishedAt values that fell between the last publish and now (scheduled stories).
due_stories() {
  [[ -d "$WT/apps/news/src/content/articles" ]] || return 0
  LAST_TIME="$LAST_TIME" node -e '
    const fs = require("fs"), path = require("path");
    const since = Number(process.env.LAST_TIME) * 1000, now = Date.now(), out = [];
    (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".md")) { const m = /^publishedAt:\s*"?([^"\n]+)/m.exec(fs.readFileSync(p, "utf8")); const t = m ? Date.parse(m[1]) : NaN;
        if (t > since && t <= now) out.push(f.replace(/\.md$/, "")); } } })(process.argv[1]);
    console.log(out.join(" "));' "$WT/apps/news/src/content/articles"
}

MODE=""
if [[ "$SHA" != "$LAST" ]]; then
  [[ "$SHA" == "$(cat "$STATE/failed-sha" 2>/dev/null || true)" ]] && exit 0
  CI="$(gh run list -R "$GH_REPO" --commit "$SHA" --workflow CI --event push --limit 1 --json status,conclusion -q '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null || true)"
  case "$CI" in
    "completed success") ;;
    "completed "*)
      log "main ${SHA:0:7}: CI ${CI#completed }, not publishing"
      notify "not published" "CI ${CI#completed } on main ${SHA:0:7}. Fix it with a new commit."
      echo "$SHA" >"$STATE/failed-sha"; exit 0 ;;
    *) exit 0 ;; # CI still running or not started: wait for the next run
  esac
  if [[ -z "$LAST" ]] || ! git -C "$REPO" cat-file -e "$LAST" 2>/dev/null; then MODE=full
  # Read the list first: `grep -q` exits early and pipefail would turn that into "no match".
  elif FILES="$(git -C "$REPO" diff --name-only "$LAST" "$SHA")"; grep -vE '^apps/news/(src/content|src/assets|public)/' <<<"$FILES" | grep -q .; then MODE=full
  else MODE=content; fi
  REASON="main ${SHA:0:7} (CI green)"
else
  # First run: start the scheduled-story clock now instead of treating every story as due.
  if [[ "$LAST_TIME" == "0" ]]; then date +%s >"$STATE/last-time"; exit 0; fi
  DUE="$(due_stories)"
  [[ -z "$DUE" ]] && exit 0
  MODE=content REASON="scheduled: $DUE"
fi

log "publishing $REASON, mode $MODE"
if [[ "${FC_AUTOPUBLISH_DRY:-0}" == "1" ]]; then log "dry run: not deploying"; exit 0; fi

# A dedicated worktree at exactly the green commit, so local edits in the main checkout never ship.
if [[ ! -d "$WT/.git" && ! -f "$WT/.git" ]]; then
  git -C "$REPO" worktree add -q --detach "$WT" "$SHA"
  ln -sf "$REPO/.env" "$WT/.env"
fi
git -C "$WT" checkout -q --force --detach "$SHA"
git -C "$WT" clean -fdq
(cd "$WT" && pnpm install --frozen-lockfile --silent)

START=$(date +%s)
if (cd "$WT" && if [[ "$MODE" == "content" ]]; then NEWS_CONTENT_ONLY=1 pnpm news:deploy; else pnpm news:deploy; fi) >"$DEPLOY_LOG" 2>&1; then
  echo "$SHA" >"$STATE/last-sha"; echo "$START" >"$STATE/last-time"; rm -f "$STATE/failed-sha"
  CHANGED="$(grep -o 'changed=[0-9]*' "$DEPLOY_LOG" | tail -1)"
  log "published $REASON in $(( $(date +%s) - START ))s, $CHANGED"
  notify "published" "$REASON, $CHANGED, $(( $(date +%s) - START ))s"
else
  # The live smoke check can fail on a dropped connection after the publish itself finished.
  if grep -q '^changed=' "$DEPLOY_LOG" && grep -q 'purge ok\|no changes' "$DEPLOY_LOG"; then
    echo "$SHA" >"$STATE/last-sha"; echo "$START" >"$STATE/last-time"
    log "published $REASON; the final live check failed, see $DEPLOY_LOG"
    notify "published, check failed" "$REASON. The final live check failed; open the page to confirm."
  else
    echo "$SHA" >"$STATE/failed-sha"
    log "deploy FAILED for $REASON; see $DEPLOY_LOG"
    notify "deploy failed" "$REASON. See ~/Library/Logs/freshcalendars-deploy-last.log"
  fi
fi
