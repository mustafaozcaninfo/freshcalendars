#!/usr/bin/env bash
# Run on the VPS as root. Sets up scripts/server-autopublish.sh: a clone of the repository
# (read with the token in TOKEN_FILE; the token is never written into git config) and a cron line
# every minute in its own block (each run checks four times, 15 seconds apart). --remove deletes the cron block and keeps the clone.
#
# The token: a GitHub fine-grained token for this one repository with read-only "Contents" and
# "Actions" permissions, saved by the owner to TOKEN_FILE with mode 600.
set -euo pipefail
SRC="${FC_SRC:-/home/yuzdehesaplama/private/freshcalendars-src}"
TOKEN_FILE="${FC_GITHUB_TOKEN_FILE:-/root/.config/freshcalendars/github-token}"
GH_REPO="${FC_GH_REPO:-mustafaozcaninfo/freshcalendars}"
MARKER="# freshcalendars-autopublish-factory"
LINE="* * * * * $SRC/scripts/server-autopublish.sh >> /var/log/freshcalendars-autopublish.log 2>&1"

# Drop only our marker and our line, keep every other line in the crontab.
strip() { grep -vF -e "$MARKER" -e "server-autopublish.sh" || true; }

if [[ "${1:-}" == "--remove" ]]; then
  crontab -l 2>/dev/null | strip | crontab -
  echo "server auto-publish cron removed (clone kept at $SRC)"; exit 0
fi

[[ -s "$TOKEN_FILE" ]] || { echo "put the GitHub token in $TOKEN_FILE first (mode 600)"; exit 1; }
chmod 600 "$TOKEN_FILE"
# Git asks this helper for the password; it reads the file each time, so the token never lands in a config file.
HELPER="!f() { echo username=x-access-token; echo \"password=\$(cat $TOKEN_FILE)\"; }; f"
if [[ ! -d "$SRC/.git" ]]; then
  git -c credential.helper= -c "credential.helper=$HELPER" clone -q "https://github.com/$GH_REPO.git" "$SRC"
fi
git -C "$SRC" config credential.helper "$HELPER"
git -C "$SRC" fetch -q origin main
git -C "$SRC" checkout -q --force --detach origin/main
chmod +x "$SRC/scripts/"*.sh

{ crontab -l 2>/dev/null | strip; echo "$MARKER"; echo "$LINE"; } | crontab -
echo "server auto-publish installed: every minute (4 checks), log /var/log/freshcalendars-autopublish.log"
