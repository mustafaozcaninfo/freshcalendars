#!/usr/bin/env bash
# Installs (or with --remove, removes) the launchd job that runs scripts/news-autopublish.sh every
# 5 minutes on the owner's Mac. The job runs the script from the publish worktree, which is moved
# to each green commit of main, so the script updates itself with main and never runs a local edit.
# Log: ~/Library/Logs/freshcalendars-autopublish.log
set -euo pipefail
LABEL="com.freshcalendars.news-autopublish"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
# The main checkout (holds .env), even when this runs from a worktree.
REPO="$(cd "$(dirname "$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)")" && pwd)"
WT="${FC_PUBLISH_WT:-$HOME/Documents/Workspace/FreshCalendars-publish}"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if [[ "${1:-}" == "--remove" ]]; then rm -f "$PLIST"; echo "auto-publish removed"; exit 0; fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
git -C "$REPO" fetch -q origin main
if [[ ! -e "$WT/.git" ]]; then git -C "$REPO" worktree add -q --detach "$WT" origin/main; ln -sf "$REPO/.env" "$WT/.env"; fi
[[ -f "$WT/scripts/news-autopublish.sh" ]] || git -C "$WT" checkout -q --force --detach origin/main
[[ -f "$WT/scripts/news-autopublish.sh" ]] || { echo "scripts/news-autopublish.sh is not on main yet; merge it first"; exit 1; }
cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$WT/scripts/news-autopublish.sh</string></array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>FC_REPO</key><string>$REPO</string>
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
echo "auto-publish installed: every 5 min, log ~/Library/Logs/freshcalendars-autopublish.log"
