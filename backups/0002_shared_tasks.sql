-- New workspace-owned tasks. No changes to existing personal records.
CREATE TABLE IF NOT EXISTS shared_tasks (
 id TEXT PRIMARY KEY NOT NULL,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id),
 title TEXT NOT NULL,
 data TEXT NOT NULL,
 assigned_to TEXT,
 created_by TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 archived INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 FOREIGN KEY (workspace_id, assigned_to) REFERENCES memberships(workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS shared_tasks_workspace_idx ON shared_tasks(workspace_id, archived, updated_at);
CREATE INDEX IF NOT EXISTS shared_tasks_assignee_idx ON shared_tasks(workspace_id, assigned_to);
CREATE TABLE IF NOT EXISTS shared_task_audit (
 id TEXT PRIMARY KEY NOT NULL,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id),
 task_id TEXT NOT NULL REFERENCES shared_tasks(id),
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL,
 before_data TEXT,
 after_data TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS shared_task_audit_task_idx ON shared_task_audit(workspace_id, task_id, created_at);
