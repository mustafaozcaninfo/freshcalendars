#!/usr/bin/env bash
# Back-compat: ITS_CRON=generate-next|rollover → FC_JOB
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${ITS_CRON:-generate-next}"
case "$MODE" in
  generate-next) export FC_JOB=generate-next ;;
  rollover) export FC_JOB=rollover ;;
  *) echo "Unknown ITS_CRON=$MODE" >&2; exit 1 ;;
esac
exec bash "$DIR/server-cron.sh"
