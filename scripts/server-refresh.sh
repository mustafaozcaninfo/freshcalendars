#!/usr/bin/env bash
# Back-compat wrapper → unified server-cron.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
export FC_JOB=refresh
exec bash "$DIR/server-cron.sh"
