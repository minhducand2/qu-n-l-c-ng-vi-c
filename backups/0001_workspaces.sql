
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN (
            'admin',
            'leader',
            'manager',
            'member',
            'viewer'
        )),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended')),
    joined_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, user_id),
    FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS memberships_user_idx
ON memberships(user_id);

CREATE INDEX IF NOT EXISTS memberships_role_idx
ON memberships(workspace_id, role);
