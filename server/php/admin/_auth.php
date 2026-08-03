<?php
declare(strict_types=1);

require '/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/lib/bootstrap.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/admin/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function ic_admin_logged_in(): bool
{
    return !empty($_SESSION['ic_admin']);
}

function ic_admin_require(): void
{
    if (!ic_admin_logged_in()) {
        header('Location: /admin/login.php');
        exit;
    }
}

function ic_admin_login(string $user, string $pass): bool
{
    $c = ic_config();
    if (!hash_equals((string) $c['admin_user'], $user)) {
        return false;
    }
    return password_verify($pass, (string) $c['admin_pass_hash']);
}
