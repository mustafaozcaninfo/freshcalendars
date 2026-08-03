<?php
declare(strict_types=1);
require __DIR__ . '/_auth.php';
ic_admin_require();

$pdo = ic_db();
$schedule = $pdo->query('SELECT * FROM cron_schedule ORDER BY job_name')->fetchAll();
$runs = $pdo->query('SELECT * FROM cron_runs ORDER BY id DESC LIMIT 50')->fetchAll();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Automation · Fresh Calendars Admin</title>
<link rel="stylesheet" href="/admin/admin.css" />
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="brand" href="/admin/">Fresh Calendars Admin</a>
    <nav class="nav">
      <a href="/admin/">Inbox</a>
      <a class="active" href="/admin/automation.php">Automation</a>
      <a href="/" target="_blank" rel="noopener">Site</a>
      <a href="/admin/logout.php">Logout</a>
    </nav>
  </header>

  <h1>Site automation</h1>
  <p class="muted">Factory crontab (via <code>scripts/server-cron.sh</code>): monthly refresh, September next-year bake, January rollover, weekly smoke. Every Mac <code>pnpm fc deploy</code> also syncs factory code to the VPS app dir. Failures email <code>CRON_NOTIFY_TO</code>.</p>

  <h2 style="font-family:Georgia,serif;margin:1.5rem 0 .75rem">Scheduled jobs</h2>
  <table>
    <thead><tr><th>Job</th><th>Cron</th><th>Next run</th><th>Last run</th><th>Enabled</th></tr></thead>
    <tbody>
    <?php foreach ($schedule as $s): ?>
      <tr>
        <td>
          <strong><?= htmlspecialchars((string) $s['job_name'], ENT_QUOTES) ?></strong><br>
          <span class="muted"><?= htmlspecialchars((string) $s['description'], ENT_QUOTES) ?></span>
        </td>
        <td><code><?= htmlspecialchars((string) $s['cron_expr'], ENT_QUOTES) ?></code></td>
        <td><?= htmlspecialchars((string) ($s['next_run_at'] ?? '—'), ENT_QUOTES) ?></td>
        <td><?= htmlspecialchars((string) ($s['last_run_at'] ?? '—'), ENT_QUOTES) ?></td>
        <td><?= ((int) $s['enabled']) ? 'Yes' : 'No' ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$schedule): ?>
      <tr><td colspan="5" class="muted">No schedule rows yet — run SQL schema / install cron.</td></tr>
    <?php endif; ?>
    </tbody>
  </table>

  <h2 style="font-family:Georgia,serif;margin:1.5rem 0 .75rem">Recent runs</h2>
  <table>
    <thead><tr><th>Started</th><th>Job</th><th>Status</th><th>Message</th></tr></thead>
    <tbody>
    <?php foreach ($runs as $r): ?>
      <tr>
        <td><?= htmlspecialchars((string) $r['started_at'], ENT_QUOTES) ?></td>
        <td><?= htmlspecialchars((string) $r['job_name'], ENT_QUOTES) ?></td>
        <td><span class="badge"><?= htmlspecialchars((string) $r['status'], ENT_QUOTES) ?></span></td>
        <td class="msg"><?= htmlspecialchars((string) ($r['message'] ?? ''), ENT_QUOTES) ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$runs): ?>
      <tr><td colspan="4" class="muted">No runs logged yet.</td></tr>
    <?php endif; ?>
    </tbody>
  </table>
</div>
</body>
</html>
