import sqlite3
from pathlib import Path
sql = (Path(__file__).resolve().parents[1] / 'drizzle/0003_member_profiles.sql').read_text(encoding='utf-8')
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('CREATE TABLE memberships (workspace_id TEXT NOT NULL,user_id TEXT NOT NULL,role TEXT NOT NULL,status TEXT NOT NULL,PRIMARY KEY(workspace_id,user_id));')
db.executescript(sql)
db.execute("INSERT INTO memberships VALUES ('w','u','member','active')")
db.execute("INSERT INTO workspace_member_profiles VALUES ('w','u','User','', '2026-01-01','2026-01-01','u')")
assert db.execute('SELECT display_name FROM workspace_member_profiles').fetchone()[0] == 'User'
try:
 db.execute("INSERT INTO workspace_member_profiles VALUES ('w','unknown','X','','now','now','u')")
 raise AssertionError('Foreign key did not protect unknown membership')
except sqlite3.IntegrityError:
 pass
print('PASS: profile schema, membership foreign key and insertion')
