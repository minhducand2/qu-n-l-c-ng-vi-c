from pathlib import Path
import sqlite3

# TEAM360 V5.2A: creates a migration only. Never opens or mutates D1.
root = Path.cwd()
prev = root / 'drizzle' / '0007_directive_approvals.sql'
guard = root / 'drizzle' / '0008_directive_edit_guard.sql'
target = root / 'drizzle' / '0009_directive_issuance.sql'
if not prev.is_file() or not guard.is_file():
    raise SystemExit('STOP: V5.1 migration files 0007/0008 missing')
if 'directive_approvals' not in prev.read_text(encoding='utf-8-sig') or 'DIRECTIVE_REVIEW_LOCKED' not in guard.read_text(encoding='utf-8-sig'):
    raise SystemExit('STOP: V5.1 schema markers do not match')
if target.exists() or list((root / 'drizzle').glob('0009*')):
    raise SystemExit('STOP: migration 0009 already exists; nothing changed')

sql = '''-- TEAM360 V5.2A - Issuance and execution tracking schema.
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
'''

# Validate syntax and the crucial approved-only issuance trigger in memory.
conn = sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('''CREATE TABLE directive_drafts (
 id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, version INTEGER NOT NULL);
 CREATE TABLE directive_approvals (
 draft_id TEXT PRIMARY KEY, status TEXT NOT NULL,
 workflow_version INTEGER NOT NULL, submitted_version INTEGER NOT NULL);''')
conn.executescript(sql)
conn.execute("INSERT INTO directive_drafts VALUES ('d1','w1',2)")
conn.execute("INSERT INTO directive_approvals VALUES ('d1','submitted',3,2)")
insert = "INSERT INTO directive_issuances (id,workspace_id,draft_id,approved_workflow_version,approved_draft_version,document_number,issued_by,issued_at,created_at) VALUES ('i1','w1','d1',3,2,'TEST/01','u1','2026-01-01','2026-01-01')"
try:
    conn.execute(insert)
    raise SystemExit('STOP: not-approved issuance was accepted')
except sqlite3.IntegrityError as err:
    if 'DIRECTIVE_NOT_CURRENTLY_APPROVED' not in str(err):
        raise
conn.execute("UPDATE directive_approvals SET status='approved' WHERE draft_id='d1'")
conn.execute(insert)
try:
    conn.execute("UPDATE directive_issuances SET document_number='OTHER' WHERE id='i1'")
    raise SystemExit('STOP: immutable issuance was editable')
except sqlite3.IntegrityError as err:
    if 'DIRECTIVE_ISSUANCE_IMMUTABLE' not in str(err):
        raise
assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
conn.close()
target.write_text(sql, encoding='utf-8')
print('MIGRATION:', target)
print('SCHEMA + APPROVAL TRIGGER TEST: PASS (SQLite in memory)')
print('UNAPPROVED ISSUANCE: BLOCKED')
print('APPROVED ISSUANCE: ALLOWED')
print('ISSUANCE IDENTITY: IMMUTABLE')
print('LOCAL/REMOTE D1: NOT OPENED OR CHANGED')
print('V5.2A MIGRATION FILE CREATED')
