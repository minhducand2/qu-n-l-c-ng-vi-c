-- TEAM360 V5.1A - Directive approval workflow.
-- Separate from directive_drafts to preserve existing V5.0 data.
-- This file does not activate approval actions by itself.

CREATE TABLE IF NOT EXISTS directive_approvals (
  draft_id TEXT PRIMARY KEY NOT NULL
    REFERENCES directive_drafts(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'rejected')),

  submitted_version INTEGER NOT NULL CHECK (submitted_version >= 1),
  submitted_by TEXT NOT NULL,
  submitted_at TEXT NOT NULL,

  reviewer_id TEXT NOT NULL,
  decided_by TEXT,
  decided_at TEXT,
  decision_reason TEXT,

  workflow_version INTEGER NOT NULL DEFAULT 1
    CHECK (workflow_version >= 1),

  updated_at TEXT NOT NULL,

  CHECK (
    (status = 'submitted'
      AND decided_by IS NULL AND decided_at IS NULL)
    OR
    (status IN ('approved', 'rejected')
      AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS directive_approvals_reviewer_idx
  ON directive_approvals(reviewer_id, status, updated_at);

CREATE INDEX IF NOT EXISTS directive_approvals_status_idx
  ON directive_approvals(status, updated_at);

CREATE TABLE IF NOT EXISTS directive_approval_events (
  id TEXT PRIMARY KEY NOT NULL,

  draft_id TEXT NOT NULL
    REFERENCES directive_drafts(id) ON DELETE RESTRICT,

  workflow_version INTEGER NOT NULL CHECK (workflow_version >= 1),

  action TEXT NOT NULL
    CHECK (action IN ('submit', 'approve', 'reject', 'resubmit')),

  actor_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,

  draft_version INTEGER NOT NULL CHECK (draft_version >= 1),
  reason TEXT,

  created_at TEXT NOT NULL,

  UNIQUE(draft_id, workflow_version)
);

CREATE INDEX IF NOT EXISTS directive_approval_events_draft_idx
  ON directive_approval_events(draft_id, created_at);
