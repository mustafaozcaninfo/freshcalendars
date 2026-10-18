#!/usr/bin/env bash
# Install / refresh FreshCalendars crontab on the VPS (idempotent).
# Run once on the server: bash scripts/install-crontab.sh
set -euo pipefail

APP_DIR="${FRESHCALENDARS_APP:-/home/yuzdehesaplama/private/freshcalendars-app}"
CRON_SH="$APP_DIR/scripts/server-cron.sh"
MARKER="# freshcalendars-factory"

chmod +x "$APP_DIR/scripts/"*.sh 2>/dev/null || true

BLOCK=$(cat <<EOF
$MARKER
# Daily HTML: 05:25 UTC ≈ 01:25 America/New_York (Today, when-is, this-week + logo)
25 5 * * * FC_JOB=refresh-meta $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
# Monthly PNG/PDF/CDN: 06:30 UTC ≈ 02:30 ET, 1st of Feb–Dec (Jan = rollover instead)
30 6 1 2-12 * FC_JOB=refresh $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
# Sep 1 after Fresh monthly refresh: bake next civil year
45 8 1 9 * FC_JOB=generate-next $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
# Jan 1 06:30 UTC ≈ 01:30 ET: Y-1 / Y / Y+1 lock
30 6 1 1 * FC_JOB=rollover $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
# Monday after daily bake
15 7 * * 1 FC_JOB=health $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
EOF
)

TMP="$(mktemp)"
# Drop only this factory's block (until the next "# *-factory" marker).
# Do NOT delete other sites' server-cron.sh lines.
crontab -l 2>/dev/null | awk -v m="$MARKER" -v app="$APP_DIR" '
  $0 == m { skip=1; next }
  skip {
    if ($0 ~ /^# [A-Za-z0-9._-]+-factory$/) { skip=0; print; next }
    next
  }
  index($0, app "/scripts/") { next }
  { print }
' >"$TMP" || true

printf '\n%s\n' "$BLOCK" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "Crontab installed:"
crontab -l | awk -v m="$MARKER" '$0==m{p=1} p{print; n++} p && n>=12{exit}'

php -r '
  $c = require "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
  $pdo = new PDO(
    sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $c["db_host"], $c["db_name"]),
    $c["db_user"], $c["db_pass"],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
  $rows = [
    ["refresh-meta", "25 5 * * *", "Daily HTML bake (Eastern today) + html-only deploy + week/logo smoke"],
    ["refresh", "30 6 1 2-12 *", "Monthly evergreen PNG/PDF/CDN — 1st Feb–Dec 06:30 UTC"],
    ["generate-next", "45 8 1 9 *", "September 08:45 UTC: bake next civil year after monthly refresh"],
    ["rollover", "30 6 1 1 *", "January 1 06:30 UTC: planning-year rollover (no monthly refresh)"],
    ["health", "15 7 * * 1", "Monday 07:15 UTC smoke + stale refresh / refresh-meta"],
  ];
  $st = $pdo->prepare("INSERT INTO cron_schedule (job_name, cron_expr, description, enabled) VALUES (?,?,?,1)
    ON DUPLICATE KEY UPDATE cron_expr=VALUES(cron_expr), description=VALUES(description), enabled=1");
  foreach ($rows as $r) $st->execute($r);
  if (getenv("CRON_SKIP_SEED") !== "1") {
    $ins = $pdo->prepare("INSERT INTO cron_runs (job_name, status, message, finished_at) VALUES (?,?,?,NOW())");
    $ins->execute(["refresh", "ok", "seed after crontab install"]);
    $ins->execute(["refresh-meta", "ok", "seed after crontab install"]);
    echo "cron_schedule upserted + refresh seeds ok\n";
  } else {
    echo "cron_schedule upserted (seed skipped)\n";
  }
'

touch /var/log/freshcalendars-cron.log 2>/dev/null || true
echo "Done. Set CRON_NOTIFY_TO in $APP_DIR/.env for fail email."
