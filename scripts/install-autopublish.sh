#!/usr/bin/env bash
# Installs (or with --remove, removes) the launchd job that runs scripts/news-autopublish.sh every
# 5 minutes on the owner's Mac.
#
# The job works in its own clone, ~/.freshcalendars-publish: macOS does not let background jobs
# read ~/Documents, so it cannot use the main checkout. The clone is moved to each green commit of
# main, so the script updates itself with main and never runs a local edit. The main checkout's
# .env is copied in (mode 600); run this again after changing .env.
# Log: ~/Library/Logs/freshcalendars-autopublish.log
set -euo pipefail
LABEL="com.freshcalendars.news-autopublish"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
# The main checkout (holds .env), even when this runs from a worktree.
REPO="$(cd "$(dirname "$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)")" && pwd)"
WT="${FC_PUBLISH_WT:-$HOME/.freshcalendars-publish}"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if [[ "${1:-}" == "--remove" ]]; then rm -f "$PLIST"; echo "auto-publish removed (clone kept at $WT)"; exit 0; fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
[[ -d "$WT/.git" ]] || git clone -q "$(git -C "$REPO" remote get-url origin)" "$WT"
git -C "$WT" fetch -q origin main
[[ -f "$WT/scripts/news-autopublish.sh" ]] || git -C "$WT" checkout -q --force --detach origin/main
[[ -f "$WT/scripts/news-autopublish.sh" ]] || { echo "scripts/news-autopublish.sh is not on main yet; merge it first"; exit 1; }
install -m 600 "$REPO/.env" "$WT/.env"

cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$WT/scripts/news-autopublish.sh</string></array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>FC_REPO</key><string>$WT</string>
    <key>FC_PUBLISH_WT</key><string>$WT</string>
  </dict>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/freshcalendars-autopublish.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/freshcalendars-autopublish.log</string>
</dict>
</plist>
EOF
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "auto-publish installed: every 5 min from $WT, log ~/Library/Logs/freshcalendars-autopublish.log"
