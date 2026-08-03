CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  subject VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_created (created_at),
  KEY idx_unread (is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cron_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  message VARCHAR(500) NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  KEY idx_job_started (job_name, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cron_schedule (
  job_name VARCHAR(64) NOT NULL PRIMARY KEY,
  cron_expr VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL,
  next_run_at DATETIME NULL,
  last_run_at DATETIME NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO cron_schedule (job_name, cron_expr, description, next_run_at, enabled)
VALUES
(
  'refresh',
  '15 0 1 * *',
  'Monthly evergreen rebuild + CDN + deploy (includes current + next planning year)',
  DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) + INTERVAL 15 MINUTE,
  1
),
(
  'generate-next',
  '30 0 1 9 *',
  '1 September: bake next civil year monthly/yearly assets early',
  CONCAT(YEAR(CURDATE()), '-09-01 00:30:00'),
  1
),
(
  'rollover',
  '20 0 1 1 *',
  '1 January: planning-year rollover (Y-1 / Y / Y+1) + deploy',
  CONCAT(YEAR(CURDATE()) + 1, '-01-01 00:20:00'),
  1
),
(
  'health',
  '0 3 * * 1',
  'Weekly live smoke + alert if monthly refresh is stale',
  DATE_ADD(CURDATE(), INTERVAL (8 - DAYOFWEEK(CURDATE())) % 7 DAY) + INTERVAL 3 HOUR,
  1
)
ON DUPLICATE KEY UPDATE
  cron_expr = VALUES(cron_expr),
  description = VALUES(description),
  enabled = 1;

-- Keep legacy name visible in older admin queries
INSERT INTO cron_schedule (job_name, cron_expr, description, enabled)
VALUES (
  'refresh-evergreen',
  '15 0 1 * *',
  'Alias of refresh (legacy job_name)',
  0
)
ON DUPLICATE KEY UPDATE description = VALUES(description);
