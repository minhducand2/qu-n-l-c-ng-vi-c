-- TEAM360 V5.0A
-- Directive draft storage and immutable revision history.
-- This migration does not alter existing tables.
-- Approval and issuance are NOT enabled by this migration.

CREATE TABLE IF NOT EXISTS directive_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  task_id TEXT NOT NULL,

  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status = 'draft'),

  version INTEGER NOT NULL DEFAULT 1
    CHECK (version >= 1),

  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS directive_drafts_workspace_idx
  ON directive_drafts (workspace_id, updated_at);

CREATE INDEX IF NOT EXISTS directive_drafts_task_idx
  ON directive_drafts (workspace_id, task_id, updated_at);

CREATE TABLE IF NOT EXISTS directive_draft_versions (
  draft_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),

  title TEXT NOT NULL,
  body TEXT NOT NULL,

  edited_by TEXT NOT NULL,
  edited_at TEXT NOT NULL,

  PRIMARY KEY (draft_id, version),

  FOREIGN KEY (draft_id)
    REFERENCES directive_drafts (id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS directive_versions_draft_idx
  ON directive_draft_versions (draft_id, version DESC);
