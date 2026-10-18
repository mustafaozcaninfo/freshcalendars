#!/usr/bin/env bash
# Unified VPS cron entry — daily HTML bake, monthly refresh, Sep next-year, Jan rollover, health.
# Usage: FC_JOB=refresh-meta|refresh|generate-next|rollover|health ./scripts/server-cron.sh
set -euo pipefail

APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"
PUBLIC_HTML="${DEPLOY_PATH:-/home/yuzdehesaplama/web/freshcalendars.com/public_html/}"
PRIVATE_PATH="${DEPLOY_PRIVATE:-/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/}"
JOB="${FC_JOB:-${ITS_JOB:-refresh}}"
SMOKE_BASE="${SMOKE_BASE:-https://freshcalendars.com}"
SMOKE_UA="${SMOKE_UA:-Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0}"
export PATH="/usr/local/bin:/usr/bin:$HOME/.local/share/pnpm:$PATH"
export COPYFILE_DISABLE=1

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$APP_DIR/.playwright}"

YEAR_NOW="$(date +%Y)"
YEAR_NEXT=$((YEAR_NOW + 1))
MONTH_DAY="$(date +%m-%d)"

job_ok_today() {
  local name="$1"
  php -r '
    $c = require "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
    $pdo = new PDO(
      sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $c["db_host"], $c["db_name"]),
      $c["db_user"], $c["db_pass"],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $st = $pdo->prepare("SELECT 1 FROM cron_runs WHERE job_name=? AND status=\"ok\" AND finished_at >= UTC_DATE() LIMIT 1");
    $st->execute([$argv[1]]);
    echo $st->fetchColumn() ? "yes" : "no";
  ' "$name" 2>/dev/null || echo "no"
}

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
  ' "$JOB" "$status" "$message" || echo "[freshcalendars] php_log failed (db)" >&2
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
  # $1 = "html-only" → never touch origin /assets (PNG/PDF live there + on CDN)
  local mode="${1:-all}"
  # news/ is published by its own pipeline (apps/news) — never delete it from here.
  local -a rsync_args=(-a --delete --exclude '.DS_Store' --exclude 'news/')
  if [[ "$mode" == "html-only" ]]; then
    rsync_args+=(--exclude 'assets/')
  fi
  rsync "${rsync_args[@]}" "$APP_DIR/dist/site/" "$PUBLIC_HTML"
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

ensure_playwright() {
  echo "[freshcalendars] ensuring Playwright Chromium ($PLAYWRIGHT_BROWSERS_PATH)…"
  local pw="$APP_DIR/packages/generator/node_modules/.bin/playwright"
  if [[ ! -x "$pw" ]]; then
    fail "playwright CLI missing ($pw) — run pnpm install in $APP_DIR"
  fi
  "$pw" install chromium \
    || fail "playwright install chromium failed (PNG/PDF render needs it)"
}

run_refresh() {
  if [[ "$(job_ok_today refresh)" == "yes" ]]; then
    echo "[freshcalendars] skip refresh — already ok today"
    return 0
  fi
  ensure_playwright
  pnpm fc refresh-evergreen || fail "refresh-evergreen exit $?"
  pnpm fc verify || fail "verify exit $?"
  pnpm fc sync-cdn || fail "sync-cdn exit $?"
  deploy_site || fail "deploy exit $?"
  post_smoke
}

# Daily HTML-only bake (no PNG/PDF render, no CDN sync). Keeps sidebar Today +
# when-is next-occurrence fresh. Origin /assets is left untouched on deploy.
run_refresh_meta() {
  export TZ="${FC_TZ:-America/New_York}"
  echo "[freshcalendars] refresh-meta TZ=$TZ now=$(date -Is)"
  pnpm fc refresh-meta || fail "refresh-meta exit $?"
  deploy_site html-only || fail "deploy exit $?"
  local home_html
  home_html="$(curl -fsS -A "$SMOKE_UA" --max-time 30 "$SMOKE_BASE/" || true)"
  [[ "$home_html" == *data-today-date* ]] \
    || fail "homepage missing today card after refresh-meta"
  SMOKE_ONLY=week SMOKE_BASE="$SMOKE_BASE" pnpm exec tsx "$APP_DIR/scripts/smoke-automation.mjs" \
    || fail "weekly date smoke failed after refresh-meta"
  local sample
  sample="$(printf '%s' "$home_html" | grep -oE 'https://cdn\.freshcalendars\.com/assets/[^\" ]+\.png|/assets/[^\" ]+\.png' | head -1 || true)"
  if [[ -n "$sample" ]]; then
    local url="$sample"
    [[ "$url" == http* ]] || url="${SMOKE_BASE}${url}"
    local code
    code="$(curl -sS -o /dev/null -w "%{http_code}" -A "$SMOKE_UA" --max-time 20 -I "$url" || echo 000)"
    [[ "$code" == 200 || "$code" == 301 || "$code" == 302 ]] \
      || fail "sample asset not reachable: $url ($code)"
  fi
}

run_generate_next() {
  if [[ "$(job_ok_today generate-next)" == "yes" ]]; then
    echo "[freshcalendars] skip generate-next — already ok today"
    return 0
  fi
  ensure_playwright
  pnpm fc gen --year "$YEAR_NEXT" || fail "gen --year $YEAR_NEXT exit $?"
  pnpm fc verify || fail "verify exit $?"
  pnpm fc sync-cdn || fail "sync-cdn exit $?"
  deploy_site || fail "deploy exit $?"
  post_smoke
}

run_rollover() {
  if [[ "$(job_ok_today rollover)" == "yes" ]]; then
    echo "[freshcalendars] skip rollover — already ok today"
    return 0
  fi
  # Planning year = civil year; on Jan 1 this locks Y-1 / Y / Y+1 assets.
  ensure_playwright
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
  # Daily HTML bake should have run in the last ~36h
  local meta_stale
  meta_stale="$(php -r '
    $c = require "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
    $pdo = new PDO(
      sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $c["db_host"], $c["db_name"]),
      $c["db_user"], $c["db_pass"],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $row = $pdo->query("SELECT status, finished_at FROM cron_runs WHERE job_name=\"refresh-meta\" AND status=\"ok\" ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if (!$row) { echo "missing"; exit; }
    $age = time() - strtotime((string)$row["finished_at"]);
    if ($age < 36*3600) { echo "fresh"; }
    else { echo "stale:" . $row["finished_at"]; }
  ' 2>/dev/null || echo "missing")"
  if [[ "$meta_stale" != "fresh" ]]; then
    fail "refresh-meta looks stale ($meta_stale) — daily HTML job may have stopped"
  fi
}

echo "[freshcalendars] job=$JOB start $(date -Is) (month_day=$MONTH_DAY)"
php_log "running" "started"

case "$JOB" in
  refresh-meta|gen-meta-daily)
    JOB="refresh-meta"
    run_refresh_meta
    ;;
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
