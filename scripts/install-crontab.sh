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
15 0 1 * * FC_JOB=refresh $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
30 0 1 9 * FC_JOB=generate-next $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
20 0 1 1 * FC_JOB=rollover $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
0 3 * * 1 FC_JOB=health $CRON_SH >> /var/log/freshcalendars-cron.log 2>&1
EOF
)

TMP="$(mktemp)"
# Drop previous factory block + legacy wrappers
crontab -l 2>/dev/null | awk -v m="$MARKER" '
  $0 == m { skip=1; next }
  skip && /^FC_JOB=/ { next }
  skip && /^[0-9*]/ { next }
  skip && /^#/ { next }
  skip { skip=0 }
  /server-refresh\.sh|cron-refresh\.sh|cron-yearly\.sh|server-cron\.sh/ { next }
  { print }
' >"$TMP" || true

printf '\n%s\n' "$BLOCK" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "Crontab installed:"
crontab -l | awk -v m="$MARKER" '($0==m){p=1} p{print} p && /^0 3/{exit}'

php -r '
  $c = require "/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/config.php";
  $pdo = new PDO(
    sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $c["db_host"], $c["db_name"]),
    $c["db_user"], $c["db_pass"],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
  $rows = [
    ["refresh", "15 0 1 * *", "Monthly evergreen rebuild + CDN + deploy"],
    ["generate-next", "30 0 1 9 *", "September: bake next civil year assets"],
    ["rollover", "20 0 1 1 *", "January 1: planning-year rollover"],
    ["health", "0 3 * * 1", "Weekly smoke + stale refresh alert"],
  ];
  $st = $pdo->prepare("INSERT INTO cron_schedule (job_name, cron_expr, description, enabled) VALUES (?,?,?,1)
    ON DUPLICATE KEY UPDATE cron_expr=VALUES(cron_expr), description=VALUES(description), enabled=1");
  foreach ($rows as $r) $st->execute($r);
  // Seed a fresh ok so health does not false-alarm right after install
  $pdo->prepare("INSERT INTO cron_runs (job_name, status, message, finished_at) VALUES (?,?,?,NOW())")
    ->execute(["refresh", "ok", "seed after crontab install"]);
  echo "cron_schedule upserted + refresh seed ok\n";
'

touch /var/log/freshcalendars-cron.log 2>/dev/null || true
echo "Done. Set CRON_NOTIFY_TO in $APP_DIR/.env for fail email."
