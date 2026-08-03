<?php
declare(strict_types=1);
require __DIR__ . '/_auth.php';

if (ic_admin_logged_in()) {
    header('Location: /admin/');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim((string) ($_POST['user'] ?? ''));
    $pass = (string) ($_POST['pass'] ?? '');
    if (ic_admin_login($user, $pass)) {
        $_SESSION['ic_admin'] = true;
        header('Location: /admin/');
        exit;
    }
    $error = 'Invalid credentials.';
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Admin login · Fresh Calendars</title>
<link rel="stylesheet" href="/admin/admin.css" />
</head>
<body class="auth">
<main class="card">
  <h1>Fresh Calendars Admin</h1>
  <p class="muted">Sign in to review contact messages and automation status.</p>
  <?php if ($error): ?><p class="err"><?= htmlspecialchars($error, ENT_QUOTES) ?></p><?php endif; ?>
  <form method="post">
    <label>Username <input type="text" name="user" required autocomplete="username" /></label>
    <label>Password <input type="password" name="pass" required autocomplete="current-password" /></label>
    <button type="submit">Sign in</button>
  </form>
</main>
</body>
</html>
