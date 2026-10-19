"""V5.2F: executable SQL tests, strictly in SQLite memory, using live source SQL.
Run from TEAM360 project root: py -3.13 .\\test_v52f_isolated.py
Does not read or modify Cloudflare state/database.
"""
from pathlib import Path
import ast
import re
import sqlite3
import sys

ROOT = Path.cwd()
ISS = ROOT / 'app/api/directive-issuances/route.ts'
EXE = ROOT / 'app/api/directive-executions/route.ts'
MIG = ROOT / 'drizzle/0009_directive_issuance.sql'
for path in (ISS, EXE, MIG):
    if not path.is_file():
        sys.exit('STOP: required source missing: ' + str(path))
iss, exe, migration = (p.read_text(encoding='utf-8-sig') for p in (ISS, EXE, MIG))
if 'TEAM360_V52C_ISSUANCES' not in iss or 'TEAM360_V52E_ASSIGNEE_ACCESS' not in exe:
    sys.exit('STOP: unexpected API version. No tests executed.')

# Extract SQL only from literal concatenations within db.prepare() calls.
# These are the actual queries from the installed TS files, not recreated SQL.
LITERAL = re.compile(r"(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")")
def statements(code):
    matches = re.findall(r'db\.prepare\(\s*((?:(?!\)\s*\.bind\().)*?)\)\s*\.bind\(', code, re.S)
    result = []
    for fragment in matches:
        literals = LITERAL.findall(fragment)
        if not literals or re.sub(LITERAL, '', fragment).strip(' +\r\n\t '):
            raise RuntimeError('STOP: unexpected dynamic SQL in db.prepare')
        result.append(''.join(ast.literal_eval(lit) for lit in literals))
    return result

issuance_sql = statements(iss)
execution_sql = statements(exe)
def pick(pool, prefix):
    choices = [s for s in pool if s.lstrip().startswith(prefix)]
    if len(choices) != 1:
        raise RuntimeError(f'STOP: SQL statement {prefix!r}: expected 1, got {len(choices)}')
    return choices[0]

issue_insert = pick(issuance_sql, 'INSERT INTO directive_issuances ')
issue_event = pick(issuance_sql, 'INSERT INTO directive_issuance_events ')
assign_insert = pick(execution_sql, 'INSERT INTO directive_execution_items ')
assign_event = pick(execution_sql, 'INSERT INTO directive_execution_events (id,execution_item_id,action,actor_id,created_at)')
update_item = pick(execution_sql, 'UPDATE directive_execution_items SET ')
progress_event = pick(execution_sql, 'INSERT INTO directive_execution_events (id,execution_item_id,action,actor_id,note,created_at)')

checks = 0
def ok(label, condition):
    global checks
    if not condition:
        raise AssertionError('FAIL: ' + label)
    checks += 1
    print('PASS:', label)

db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
try:
    db.executescript('''
    CREATE TABLE directive_drafts(id TEXT PRIMARY KEY, workspace_id TEXT, task_id TEXT, version INTEGER);
    CREATE TABLE directive_approvals(draft_id TEXT PRIMARY KEY, status TEXT, workflow_version INTEGER, submitted_version INTEGER);
    CREATE TABLE memberships(workspace_id TEXT, user_id TEXT, role TEXT, status TEXT, PRIMARY KEY(workspace_id,user_id));
    ''')
    db.executescript(migration)
    db.executemany('INSERT INTO memberships VALUES (?,?,?,?)', [
        ('ws_test','leader_test','leader','active'),
        ('ws_test','member_test','member','active'),
        ('ws_test','other_test','member','active'),
        ('ws_test','revoked_test','member','disabled'),
    ])
    db.execute('INSERT INTO directive_drafts VALUES (?,?,?,?)', ('draft_test','ws_test','task_test',2))
    db.execute('INSERT INTO directive_approvals VALUES (?,?,?,?)', ('draft_test','submitted',3,2))
    stamp='2026-10-19T00:00:00Z'
    args=('iss_test','ws_test','draft_test',3,2,'DOC-TEST-001','leader_test',stamp,stamp)

    try:
        db.execute(issue_insert,args)
        ok('unapproved issuance rejected by trigger', False)
    except sqlite3.IntegrityError as e:
        ok('unapproved issuance rejected by trigger', 'DIRECTIVE_NOT_CURRENTLY_APPROVED' in str(e))
    db.execute("UPDATE directive_approvals SET status='approved' WHERE draft_id='draft_test'")
    db.execute(issue_insert,args)
    db.execute(issue_event,('ise_test','iss_test','ws_test','draft_test','leader_test',stamp))
    ok('approved issuance and event', db.execute('SELECT COUNT(*) FROM directive_issuance_events').fetchone()[0]==1)
    try:
        db.execute(issue_insert,('iss_duplicate',*args[1:]))
        ok('duplicate issuance blocked',False)
    except sqlite3.IntegrityError:
        ok('duplicate issuance blocked', True)
    try:
        db.execute("UPDATE directive_issuances SET document_number='REPLACED' WHERE id='iss_test'")
        ok('issued document identity immutable',False)
    except sqlite3.IntegrityError:
        ok('issued document identity immutable',True)

    def assign(item,assignee,event):
        db.execute(assign_insert,(item,assignee,'Test action', '2026-10-22','leader_test',stamp,stamp,'iss_test','ws_test','ws_test',assignee))
        db.execute(assign_event,(event,item,'iss_test','leader_test',stamp))
    assign('item_test','member_test','evt_created')
    ok('assignment and created audit', db.execute('SELECT status FROM directive_execution_items WHERE id="item_test"').fetchone()==('pending',) and db.execute('SELECT COUNT(*) FROM directive_execution_events').fetchone()[0]==1)
    # A revoked assignee produces 0 assignment rows; subsequent event NOT NULL must fail.
    db.execute('SAVEPOINT denied_assignment')
    db.execute(assign_insert,('item_denied','revoked_test','Test denied',None,'leader_test',stamp,stamp,'iss_test','ws_test','ws_test','revoked_test'))
    try:
        db.execute(assign_event,('evt_denied','item_denied','iss_test','leader_test',stamp))
        ok('revoked assignee event rejected',False)
    except sqlite3.IntegrityError:
        db.execute('ROLLBACK TO denied_assignment')
        db.execute('RELEASE denied_assignment')
        ok('revoked assignee event rejected + rollback', db.execute('SELECT COUNT(*) FROM directive_execution_items WHERE id="item_denied"').fetchone()[0]==0)

    def transition(status,previous,actor,event,action):
        now=stamp if event.endswith('1') else '2026-10-19T00:01:00Z'
        changed=db.execute(update_item,(status,now,'item_test','iss_test',previous,'iss_test','ws_test','ws_test',actor,actor,status,'ws_test',actor)).rowcount
        if changed:
            db.execute(progress_event,(event,'item_test','iss_test',status,now,action,actor,'test note',now))
        return changed
    ok('assignee moves pending to in_progress',transition('in_progress','pending','member_test','evt_progress1','started')==1)
    ok('member cannot cancel',transition('cancelled','in_progress','member_test','evt_cancel1','cancelled')==0)
    ok('unassigned user cannot change progress',transition('completed','in_progress','other_test','evt_other1','completed')==0)
    ok('revoked user cannot change progress',transition('completed','in_progress','revoked_test','evt_revoked1','completed')==0)
    ok('stale pending version cannot update',transition('completed','pending','member_test','evt_stale1','completed')==0)
    ok('assignee completes task',transition('completed','in_progress','member_test','evt_complete2','completed')==1)
    ok('progress audit consistent', [r[0] for r in db.execute('SELECT action FROM directive_execution_events ORDER BY rowid')] == ['created','started','completed'])
    ok('foreign key check clean', db.execute('PRAGMA foreign_key_check').fetchall()==[])
    # Verify runtime handler guards exist (static only; NOT simulated HTTP authentication).
    ok('handler read filtering present (static only)', 'row.assignee_id === user.userId' in exe)
    ok('handler cancellation gate present (static only)', "status==='cancelled' && !isLeader(member.role)" in exe)
    print(f'V5.2F EXTRACTED SQL ISOLATED TEST PASS: {checks} checks')
    print('DATABASE: SQLITE :memory: ONLY; D1 NOT OPENED')
    print('LIMIT: TS AUTH/GET HANDLERS NOT EXECUTED; CLOUDFLARE D1 HTTP NOT TESTED')
finally:
    db.close()
