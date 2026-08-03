#!/usr/bin/env bash
# Unified VPS cron entry — monthly refresh, Sep next-year bake, Jan rollover, health.
# Usage: FC_JOB=refresh|generate-next|rollover|health ./scripts/server-cron.sh
set -euo pipefail

APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"
PUBLIC_HTML="${DEPLOY_PATH:-/home/yuzdehesaplama/web/freshcalendars.com/public_html/}"
PRIVATE_PATH="${DEPLOY_PRIVATE:-/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/}"
JOB="${FC_JOB:-${ITS_JOB:-refresh}}"
SMOKE_BASE="${SMOKE_BASE:-https://freshcalendars.com}"
export PATH="/usr/local/bin:/usr/bin:$HOME/.local/share/pnpm:$PATH"
export COPYFILE_DISABLE=1

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

YEAR_NOW="$(date +%Y)"
YEAR_NEXT=$((YEAR_NOW + 1))
MONTH_DAY="$(date +%m-%d)"

php_log() {
  local status="$1"
  local message="$2"
  php -r '
    $c = require "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
    $pdo = new PDO(
      sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $c["db_host"], $c["db_name"]),
      $c["db_user"], $c["db_pass"],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $job = $argv[1];
    $st = $pdo->prepare("INSERT INTO cron_runs (job_name, status, message, finished_at) VALUES (?,?,?,NOW())");
    $st->execute([$job, $argv[2], $argv[3]]);
    $pdo->prepare("UPDATE cron_schedule SET last_run_at=NOW() WHERE job_name=?")->execute([$job]);
  ' "$JOB" "$status" "$message"
}

notify() {
  local subject="$1"
  local body="$2"
  local to="${CRON_NOTIFY_TO:-${CONTACT_NOTIFY_TO:-}}"
  if [[ -z "$to" ]]; then
    # Fall back to private PHP config contact_notify_to
    to="$(php -r '
      $c=@include "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
      echo is_array($c) ? trim((string)($c["contact_notify_to"] ?? "")) : "";
    ' 2>/dev/null || true)"
  fi
  [[ -z "$to" ]] && return 0
  printf '%s\n' "$body" | mail -s "$subject" "$to" 2>/dev/null || \
    php -r '
      $to=$argv[1]; $sub=$argv[2]; $body=$argv[3];
      @mail($to, $sub, $body, "From: cron@freshcalendars.com\r\nContent-Type: text/plain; charset=UTF-8");
    ' "$to" "$subject" "$body" || true
}

fail() {
  local msg="$1"
  echo "[freshcalendars] FAIL $JOB: $msg" >&2
  php_log "error" "$msg"
  notify "[FreshCalendars] CRON FAIL · $JOB" "Job=$JOB"$'\n'"When=$(date -Is)"$'\n'"Host=$(hostname)"$'\n'"Message=$msg"$'\n'"App=$APP_DIR"
  exit 1
}

deploy_site() {
  rsync -a --delete --exclude '.DS_Store' "$APP_DIR/dist/site/" "$PUBLIC_HTML"
  rsync -a "$APP_DIR/server/php/lib/" "${PRIVATE_PATH}lib/"
  if [[ -n "${CF_ZONE_ID:-}" && -n "${CF_API_KEY:-}" && -n "${CF_EMAIL:-}" ]]; then
    curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
      -H "X-Auth-Email: ${CF_EMAIL}" \
      -H "X-Auth-Key: ${CF_API_KEY}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' >/dev/null || true
  fi
}

post_smoke() {
  echo "[freshcalendars] post-deploy automation smoke…"
  # Prefer full automation suite; fall back to HTTP-only smoke.
  if [[ -f "$APP_DIR/scripts/smoke-automation.mjs" ]]; then
    SMOKE_BASE="$SMOKE_BASE" pnpm exec tsx "$APP_DIR/scripts/smoke-automation.mjs" \
      || fail "smoke-automation failed"
  else
    SMOKE_BASE="$SMOKE_BASE" bash "$APP_DIR/scripts/smoke.sh" || fail "smoke.sh failed"
  fi
}

run_refresh() {
  pnpm fc refresh-evergreen || fail "refresh-evergreen exit $?"
  pnpm fc verify || fail "verify exit $?"
  pnpm fc sync-cdn || fail "sync-cdn exit $?"
  deploy_site || fail "deploy exit $?"
  post_smoke
}

run_generate_next() {
  pnpm fc gen --year "$YEAR_NEXT" || fail "gen --year $YEAR_NEXT exit $?"
  pnpm fc verify || fail "verify exit $?"
  pnpm fc sync-cdn || fail "sync-cdn exit $?"
  deploy_site || fail "deploy exit $?"
  post_smoke
}

run_rollover() {
  # Planning year = civil year; on Jan 1 this locks Y-1 / Y / Y+1 assets.
  pnpm fc rollover --to "$YEAR_NOW" --confirm || fail "rollover exit $?"
  pnpm fc verify || fail "verify exit $?"
  pnpm fc sync-cdn || fail "sync-cdn exit $?"
  deploy_site || fail "deploy exit $?"
  post_smoke
}

run_health() {
  post_smoke
  # Stale cron guard: monthly refresh must have succeeded in last 40 days
  local stale
  stale="$(php -r '
    $c = require "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
    $pdo = new PDO(
      sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $c["db_host"], $c["db_name"]),
      $c["db_user"], $c["db_pass"],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $row = $pdo->query("SELECT status, finished_at FROM cron_runs WHERE job_name IN (\"refresh\",\"refresh-evergreen\") AND status=\"ok\" ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if (!$row) { echo "missing"; exit; }
    $age = time() - strtotime((string)$row["finished_at"]);
    if ($age < 40*86400) { echo "fresh"; }
    else { echo "stale:" . $row["finished_at"]; }
  ' 2>/dev/null || echo "missing")"
  if [[ "$stale" != "fresh" ]]; then
    fail "refresh looks stale ($stale) — monthly job may have stopped"
  fi
}

echo "[freshcalendars] job=$JOB start $(date -Is) (month_day=$MONTH_DAY)"
php_log "running" "started"

case "$JOB" in
  refresh|refresh-evergreen)
    JOB="refresh"
    run_refresh
    ;;
  generate-next)
    run_generate_next
    ;;
  rollover)
    run_rollover
    ;;
  health)
    run_health
    ;;
  *)
    fail "Unknown FC_JOB=$JOB (ITS_JOB also supported)"
    ;;
esac

php_log "ok" "$JOB succeeded $(date -Is)"
echo "[freshcalendars] job=$JOB ok $(date -Is)"
exit 0
