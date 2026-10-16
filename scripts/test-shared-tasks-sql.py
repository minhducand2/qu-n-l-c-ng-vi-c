from pathlib import Path
import sqlite3
root = Path(__file__).resolve().parents[1]
conn=sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('CREATE TABLE workspaces (id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);\nCREATE TABLE memberships (workspace_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,status TEXT NOT NULL,joined_at TEXT NOT NULL, PRIMARY KEY(workspace_id,user_id));')
conn.executescript((root/'drizzle/0002_shared_tasks.sql').read_text(encoding='utf-8'))
conn.execute("INSERT INTO workspaces VALUES ('w','demo','u','t','t')")
conn.execute("INSERT INTO memberships VALUES ('w','u','admin','active','t')")
conn.execute("INSERT INTO shared_tasks (id,workspace_id,title,data,assigned_to,created_by,version,archived,created_at,updated_at) VALUES ('t','w','demo','{}','u','u',1,0,'t','t')")
conn.execute("INSERT INTO shared_task_audit VALUES ('a','w','t','u','create',NULL,'{}','t')")
assert conn.execute('SELECT count(*) FROM shared_tasks').fetchone()[0]==1
assert conn.execute('SELECT count(*) FROM shared_task_audit').fetchone()[0]==1
print('PASS: Shared Tasks migration creates tables, FK, insert and audit')
