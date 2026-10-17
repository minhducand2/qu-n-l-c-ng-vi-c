
UPDATE auth_login_limits
SET attempts = 4
WHERE account_key = 'team360_sql_probe_5b722';

INSERT INTO auth_login_limits
(account_key,attempts,window_started_at,updated_at)
VALUES ('team360_sql_probe_5b722',1,'2026-10-17T10:00:00.000Z','2026-10-17T10:00:00.000Z')
ON CONFLICT(account_key) DO UPDATE SET
  attempts = CASE WHEN window_started_at < '2026-10-17T09:45:00.000Z' THEN 1 ELSE attempts+1 END,
  window_started_at = CASE WHEN window_started_at < '2026-10-17T09:45:00.000Z' THEN excluded.window_started_at ELSE window_started_at END,
  updated_at = excluded.updated_at
WHERE window_started_at < '2026-10-17T09:45:00.000Z' OR attempts < 5
RETURNING attempts;

INSERT INTO auth_login_limits
(account_key,attempts,window_started_at,updated_at)
VALUES ('team360_sql_probe_5b722',1,'2026-10-17T10:00:00.000Z','2026-10-17T10:00:00.000Z')
ON CONFLICT(account_key) DO UPDATE SET
  attempts = CASE WHEN window_started_at < '2026-10-17T09:45:00.000Z' THEN 1 ELSE attempts+1 END,
  window_started_at = CASE WHEN window_started_at < '2026-10-17T09:45:00.000Z' THEN excluded.window_started_at ELSE window_started_at END,
  updated_at = excluded.updated_at
WHERE window_started_at < '2026-10-17T09:45:00.000Z' OR attempts < 5
RETURNING attempts;

SELECT attempts FROM auth_login_limits
WHERE account_key = 'team360_sql_probe_5b722';
