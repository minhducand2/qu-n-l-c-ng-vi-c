-- TEAM360 v0.5: independent employee authentication schema.
-- Additive migration: does not modify existing workspace, membership or task data.
-- Apply to a disposable database first; do not use on production without a tested backup.

CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    password_changed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx
ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS auth_sessions_expires_idx
ON auth_sessions(expires_at);

-- Important: existing memberships.user_id values are not rewritten here.
-- Account migration / identity mapping must be performed explicitly and verified.
-- Password hashes and session token hashes are produced by application code, never in this migration.
