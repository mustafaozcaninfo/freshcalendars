<?php
declare(strict_types=1);
require __DIR__ . '/_auth.php';
ic_admin_require();

$pdo = ic_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['mark_read'])) {
    $id = (int) $_POST['mark_read'];
    if ($id > 0) {
        $pdo->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?')->execute([$id]);
    }
    header('Location: /admin/');
    exit;
}

$total = (int) $pdo->query('SELECT COUNT(*) FROM contact_messages')->fetchColumn();
$unread = (int) $pdo->query('SELECT COUNT(*) FROM contact_messages WHERE is_read = 0')->fetchColumn();
$lastCron = $pdo->query(
    "SELECT status, started_at, message FROM cron_runs WHERE job_name='refresh-evergreen' ORDER BY id DESC LIMIT 1",
)->fetch() ?: null;
$schedule = $pdo->query(
    "SELECT cron_expr, description, next_run_at, last_run_at, enabled FROM cron_schedule WHERE job_name='refresh-evergreen' LIMIT 1",
)->fetch() ?: null;

$rows = $pdo->query(
    'SELECT id, name, email, subject, message, ip, created_at, is_read FROM contact_messages ORDER BY id DESC LIMIT 100',
)->fetchAll();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Inbox · Fresh Calendars Admin</title>
<link rel="stylesheet" href="/admin/admin.css" />
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="brand" href="/admin/">Fresh Calendars Admin</a>
    <nav class="nav">
      <a class="active" href="/admin/">Inbox</a>
      <a href="/admin/automation.php">Automation</a>
      <a href="/" target="_blank" rel="noopener">Site</a>
      <a href="/admin/logout.php">Logout</a>
    </nav>
  </header>

  <h1>Contact inbox</h1>
  <p class="muted">Messages from the public contact form (stored in dreamcalendars_db1).</p>

  <div class="grid">
    <div class="stat"><span class="muted">Total</span><strong><?= $total ?></strong></div>
    <div class="stat"><span class="muted">Unread</span><strong><?= $unread ?></strong></div>
    <div class="stat">
      <span class="muted">Next refresh</span>
      <strong style="font-size:1.1rem">
        <?= htmlspecialchars((string) ($schedule['next_run_at'] ?? '—'), ENT_QUOTES) ?>
      </strong>
      <span class="muted" style="display:block;margin-top:.35rem;font-size:.85rem">
        Cron: <?= htmlspecialchars((string) ($schedule['cron_expr'] ?? 'not set'), ENT_QUOTES) ?>
      </span>
    </div>
  </div>

  <?php if ($lastCron): ?>
  <p class="muted">Last automation: <strong><?= htmlspecialchars((string) $lastCron['status'], ENT_QUOTES) ?></strong>
    at <?= htmlspecialchars((string) $lastCron['started_at'], ENT_QUOTES) ?>
    — <?= htmlspecialchars((string) ($lastCron['message'] ?? ''), ENT_QUOTES) ?>
  </p>
  <?php endif; ?>

  <table>
    <thead>
      <tr><th>When</th><th>From</th><th>Subject</th><th>Message</th><th></th></tr>
    </thead>
    <tbody>
    <?php if (!$rows): ?>
      <tr><td colspan="5" class="muted">No messages yet.</td></tr>
    <?php endif; ?>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td><?= htmlspecialchars((string) $r['created_at'], ENT_QUOTES) ?><br>
          <?php if (!(int) $r['is_read']): ?><span class="badge new">NEW</span><?php endif; ?>
        </td>
        <td>
          <?= htmlspecialchars((string) $r['name'], ENT_QUOTES) ?><br>
          <a href="mailto:<?= htmlspecialchars((string) $r['email'], ENT_QUOTES) ?>">
            <?= htmlspecialchars((string) $r['email'], ENT_QUOTES) ?>
          </a>
        </td>
        <td><?= htmlspecialchars((string) $r['subject'], ENT_QUOTES) ?></td>
        <td class="msg"><?= htmlspecialchars((string) $r['message'], ENT_QUOTES) ?></td>
        <td>
          <?php if (!(int) $r['is_read']): ?>
          <form method="post">
            <input type="hidden" name="mark_read" value="<?= (int) $r['id'] ?>" />
            <button type="submit">Mark read</button>
          </form>
          <?php else: ?>
          <span class="muted">Read</span>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
</body>
</html>
