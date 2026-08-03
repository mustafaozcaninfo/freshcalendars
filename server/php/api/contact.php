<?php
declare(strict_types=1);

require '/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ic_json(['ok' => false, 'error' => 'Method not allowed'], 405);
}

// Honeypot
if (!empty($_POST['website'])) {
    ic_json(['ok' => true]);
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$subject = trim((string) ($_POST['subject'] ?? 'general'));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
    ic_json(['ok' => false, 'error' => 'Please enter a valid name.'], 422);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
    ic_json(['ok' => false, 'error' => 'Please enter a valid email.'], 422);
}
$allowed = ['general', 'download', 'licensing', 'other'];
if (!in_array($subject, $allowed, true)) {
    $subject = 'general';
}
if ($message === '' || mb_strlen($message) > 5000) {
    ic_json(['ok' => false, 'error' => 'Please enter a message (max 5000 characters).'], 422);
}

$ip = ic_client_ip();
$ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

try {
    $pdo = ic_db();
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c FROM contact_messages WHERE ip = ? AND created_at > (NOW() - INTERVAL 1 HOUR)',
    );
    $stmt->execute([$ip]);
    $count = (int) ($stmt->fetch()['c'] ?? 0);
    if ($count >= 5) {
        ic_json(['ok' => false, 'error' => 'Too many messages. Try again later.'], 429);
    }

    $ins = $pdo->prepare(
        'INSERT INTO contact_messages (name, email, subject, message, ip, user_agent) VALUES (?,?,?,?,?,?)',
    );
    $ins->execute([$name, $email, $subject, $message, $ip, $ua]);

    // Optional notify — set contact_notify_to in private config.php
    $cfg = ic_config();
    $to = trim((string) ($cfg['contact_notify_to'] ?? ''));
    if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $safeSubject = preg_replace('/[\r\n]+/', ' ', $subject) ?: 'general';
        $body = "Fresh Calendars contact form\n\n"
            . "Name: {$name}\n"
            . "Email: {$email}\n"
            . "Subject: {$safeSubject}\n"
            . "IP: {$ip}\n\n"
            . $message
            . "\n";
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'From: noreply@freshcalendars.com',
            'Reply-To: ' . $email,
        ];
        @mail($to, '[FreshCalendars] Contact: ' . $safeSubject, $body, implode("\r\n", $headers));
    }

    ic_json(['ok' => true]);
} catch (Throwable $e) {
    error_log('freshcalendars contact: ' . $e->getMessage());
    ic_json(['ok' => false, 'error' => 'Server error. Please try again shortly.'], 500);
}
