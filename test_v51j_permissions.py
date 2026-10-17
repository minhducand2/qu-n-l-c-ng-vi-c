"""V5.1J: isolated tests of the SQL actually embedded in TEAM360's approval API.

No network access, no live accounts, no D1 access or writes. These tests are
SQL integration checks plus static checks of TypeScript authorization branches;
they do NOT emulate authenticated HTTP requests or prove those branches execute.
"""
from __future__ import annotations
import json
import re
import sqlite3
import sys
from pathlib import Path

API = Path('app/api/directive-approvals/route.ts')


def check(condition: bool, label: str) -> None:
    if not condition:
        raise AssertionError('FAIL: ' + label)
    print('PASS:', label)


def sql_from_ts(source: str, prefix: str) -> str:
    # Take actual concatenated SQL literals passed to db.prepare(), not a
    # hand-written approximation of the decision query.
    pattern = r'db\.prepare\(\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)\)\.bind\('
    for match in re.finditer(pattern, source):
        pieces = re.findall(r'"(?:[^"\\]|\\.)*"', match.group(1))
        statement = ''.join(json.loads(piece) for piece in pieces)
        if statement.startswith(prefix):
            return statement
    raise RuntimeError('Cannot locate SQL in current API: ' + prefix)


def db_factory():
    db = sqlite3.connect(':memory:', isolation_level=None)
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
       CREATE TABLE directive_drafts (
         id TEXT PRIMARY KEY, status TEXT NOT NULL, version INTEGER NOT NULL
       );
       CREATE TABLE memberships (
         workspace_id TEXT NOT NULL, user_id TEXT NOT NULL,
         status TEXT NOT NULL, role TEXT NOT NULL,
         PRIMARY KEY(workspace_id,user_id)
       );
       CREATE TABLE directive_approvals (
         draft_id TEXT PRIMARY KEY NOT NULL REFERENCES directive_drafts(id),
         status TEXT NOT NULL, submitted_version INTEGER NOT NULL,
         submitted_by TEXT NOT NULL, submitted_at TEXT NOT NULL,
         reviewer_id TEXT NOT NULL, decided_by TEXT, decided_at TEXT,
         decision_reason TEXT, workflow_version INTEGER NOT NULL,
         updated_at TEXT NOT NULL
       );
       CREATE TABLE directive_approval_events (
         id TEXT PRIMARY KEY,
         draft_id TEXT NOT NULL REFERENCES directive_drafts(id),
         workflow_version INTEGER NOT NULL,
         action TEXT NOT NULL, actor_id TEXT NOT NULL,
         reviewer_id TEXT NOT NULL, draft_version INTEGER NOT NULL,
         reason TEXT, created_at TEXT NOT NULL,
         UNIQUE(draft_id,workflow_version)
       );
    ''')
    db.execute("INSERT INTO directive_drafts VALUES('draft_test','draft',3)")
    db.execute("INSERT INTO directive_approvals VALUES('draft_test','submitted',3,'author','time0','reviewer',NULL,NULL,NULL,1,'time0')")
    db.execute("INSERT INTO memberships VALUES('ws_test','reviewer','active','leader')")
    db.execute("INSERT INTO memberships VALUES('ws_test','author','active','admin')")
    return db


def test_decision(update_sql: str, audit_sql: str, role='leader', status='active', old_ver=1, action='approve'):
    db = db_factory()
    db.execute('UPDATE memberships SET role=?,status=? WHERE user_id=?', (role,status,'reviewer'))
    now = 'time1'
    new_status = 'approved' if action == 'approve' else 'rejected'
    params = (
        new_status, 3, 'author', 'time0', 'reviewer',
        'reviewer', now, 'explanation' if action == 'reject' else None,
        old_ver+1, now,
        'draft_test', old_ver, 'submitted', 3,
        action, 'ws_test', 'draft_test', 3,
    )
    db.execute('BEGIN IMMEDIATE')
    try:
        changed = db.execute(update_sql, params).rowcount
        # SQL event should force an IntegrityError if UPDATE did not match.
        try:
            db.execute(audit_sql, (
                'event_test', 'draft_test', old_ver+1, now,
                new_status, old_ver+1, action, 'reviewer',
                'reviewer', 3,
                'explanation' if action == 'reject' else None, now,
            ))
            event_error = False
        except sqlite3.IntegrityError:
            event_error = True
        if event_error:
            db.rollback()  # Same all-or-nothing response as D1 batch failure.
        else:
            db.commit()
        state = db.execute('SELECT status,workflow_version FROM directive_approvals WHERE draft_id=?',('draft_test',)).fetchone()
        events = db.execute('SELECT COUNT(*) FROM directive_approval_events').fetchone()[0]
        return changed, event_error, state, events
    finally:
        db.close()


def main():
    if not API.is_file():
        raise RuntimeError('Run from the TEAM360 root folder; approval API not found')
    api = API.read_text(encoding='utf-8-sig')
    check('TEAM360_APPROVAL_GUARD_V51I' in api, 'V5.1I API version found')
    for label, part in [
        ('session authentication gate', 'getChatGPTUser()'),
        ('Origin gate', 'validWriteOrigin(req)'),
        ('author cannot decide', 'draft.created_by === user.userId'),
        ('assigned reviewer gate', 'approval.reviewer_id !== user.userId'),
        ('leader role gate', '!leaders.has(member.role)'),
        ('reviewer membership SQL gate', "m.status='active' AND m.role IN ('admin','leader')"),
    ]:
        check(part in api, 'static guard present: '+label)
    update = sql_from_ts(api, 'UPDATE directive_approvals SET ')
    audit = sql_from_ts(api, 'INSERT INTO directive_approval_events ')
    # There are two audit inserts; select the decision insert, which has reason.
    if 'reason,created_at' not in audit:
        pattern = r'db\.prepare\(\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)\)\.bind\('
        candidates = []
        for match in re.finditer(pattern,api):
            s = ''.join(json.loads(p) for p in re.findall(r'"(?:[^"\\]|\\.)*"', match.group(1)))
            if s.startswith('INSERT INTO directive_approval_events ') and 'reason,created_at' in s:
                candidates.append(s)
        if len(candidates) != 1:
            raise RuntimeError('Decision audit SQL not uniquely found')
        audit = candidates[0]
    check(update.count('?') == 18, 'current UPDATE bind count matches V5.1I')
    check(audit.count('?') == 12, 'current audit bind count matches V5.1I')
    changes, err, state, events = test_decision(update,audit)
    check((changes,err,state,events)==(1,False,('approved',2),1),'active leader decision and history succeed')
    changes, err, state, events = test_decision(update,audit,role='member')
    check((changes,err,state,events)==(0,True,('submitted',1),0),'ordinary member reviewer blocked and no audit')
    changes, err, state, events = test_decision(update,audit,status='inactive')
    check((changes,err,state,events)==(0,True,('submitted',1),0),'revoked reviewer blocked and no audit')
    changes, err, state, events = test_decision(update,audit,old_ver=2)
    check((changes,err,state,events)==(0,True,('submitted',1),0),'stale workflow decision blocked and no audit')
    changes, err, state, events = test_decision(update,audit,action='reject')
    check((changes,err,state,events)==(1,False,('rejected',2),1),'rejection with reason and history succeed')
    print('SOURCE D1: NOT OPENED OR MODIFIED')
    print('TEST ACCOUNTS: SYNTHETIC ONLY; ALL SQL IN MEMORY')
    print('V5.1J EXTRACTED-SQL ISOLATED TEST PASS')
    print('LIMIT: This is not an authenticated HTTP or two-account authorization test.')

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('V5.1J TEST FAILED:',exc,file=sys.stderr)
        sys.exit(1)
