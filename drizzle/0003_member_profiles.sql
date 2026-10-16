CREATE TABLE IF NOT EXISTS workspace_member_profiles (
 workspace_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 display_name TEXT NOT NULL,
 department_name TEXT NOT NULL DEFAULT '',
 account_claimed_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 updated_by TEXT NOT NULL,
 PRIMARY KEY (workspace_id, user_id),
 FOREIGN KEY (workspace_id, user_id) REFERENCES memberships(workspace_id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS member_profiles_department_idx ON workspace_member_profiles(workspace_id,department_name);
