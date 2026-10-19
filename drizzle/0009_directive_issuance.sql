-- TEAM360 V5.2A - Issuance and execution tracking schema.
-- Only a migration file. No automatic issue, email, Zalo or external dispatch.
-- Production application requires a reviewed migration strategy.

CREATE TABLE directive_issuances (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  draft_id TEXT NOT NULL UNIQUE REFERENCES directive_drafts(id) ON DELETE RESTRICT,
  approved_workflow_version INTEGER NOT NULL CHECK (approved_workflow_version >= 1),
  approved_draft_version INTEGER NOT NULL CHECK (approved_draft_version >= 1),
  document_number TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'closed')),
  closed_by TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  CHECK ((status = 'issued' AND closed_by IS NULL AND closed_at IS NULL)
      OR (status = 'closed' AND closed_by IS NOT NULL AND closed_at IS NOT NULL))
);

CREATE INDEX directive_issuances_workspace_idx
  ON directive_issuances(workspace_id, issued_at DESC);

-- Database-level enforcement: only the *current* approved revision may be issued.
CREATE TRIGGER directive_issuance_requires_approval
BEFORE INSERT ON directive_issuances
WHEN NOT EXISTS (
  SELECT 1 FROM directive_approvals a
  JOIN directive_drafts d ON d.id = a.draft_id
  WHERE a.draft_id = NEW.draft_id
    AND d.workspace_id = NEW.workspace_id
    AND a.status = 'approved'
    AND a.workflow_version = NEW.approved_workflow_version
    AND a.submitted_version = NEW.approved_draft_version
    AND d.version = NEW.approved_draft_version
)
BEGIN
  SELECT RAISE(ABORT, 'DIRECTIVE_NOT_CURRENTLY_APPROVED');
END;

-- The approved source version and document number are immutable once issued.
CREATE TRIGGER directive_issuance_identity_immutable
BEFORE UPDATE OF workspace_id, draft_id, approved_workflow_version,
  approved_draft_version, document_number, issued_by, issued_at
ON directive_issuances
BEGIN
  SELECT RAISE(ABORT, 'DIRECTIVE_ISSUANCE_IMMUTABLE');
END;

CREATE TABLE directive_execution_items (
  id TEXT PRIMARY KEY NOT NULL,
  issuance_id TEXT NOT NULL REFERENCES directive_issuances(id) ON DELETE RESTRICT,
  assignee_id TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX directive_execution_items_issuance_idx
  ON directive_execution_items(issuance_id, status, due_date);

CREATE TABLE directive_execution_events (
  id TEXT PRIMARY KEY NOT NULL,
  execution_item_id TEXT NOT NULL REFERENCES directive_execution_items(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('created', 'started', 'completed', 'cancelled', 'reopened', 'comment')),
  actor_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX directive_execution_events_item_idx
  ON directive_execution_events(execution_item_id, created_at);

CREATE TABLE directive_issuance_events (
  id TEXT PRIMARY KEY NOT NULL,
  issuance_id TEXT NOT NULL REFERENCES directive_issuances(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('issued', 'closed')),
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  note TEXT
);

CREATE INDEX directive_issuance_events_idx
  ON directive_issuance_events(issuance_id, created_at);
