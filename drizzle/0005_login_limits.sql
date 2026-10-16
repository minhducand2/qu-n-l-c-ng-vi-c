-- Stage 5B.4.4: account-based, atomic login attempt throttling.
CREATE TABLE IF NOT EXISTS auth_login_limits (
  account_key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_login_limits_updated_idx ON auth_login_limits(updated_at);
