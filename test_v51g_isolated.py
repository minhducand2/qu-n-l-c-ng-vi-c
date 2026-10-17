"""TEAM360 V5.1G: isolated SQLite workflow regression checks.
Runs against an in-memory backup, never writes to the source D1 database.
This checks database transitions, NOT real HTTP authentication/authorization.
"""
from __future__ import annotations
import sqlite3
import sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path.cwd()
DB_DIR = ROOT / '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
API = ROOT / 'app/api/directive-approvals/route.ts'
TABLES = {'directive_drafts', 'directive_approvals', 'directive_approval_events'}

def check(ok: bool, name: str):
    if not ok:
        raise AssertionError('FAIL: ' + name)
    print('PASS:', name)

def rollback_on_fail(db: sqlite3.Connection, action):
    db.execute('SAVEPOINT attempt')
    try:
        action()
    except sqlite3.IntegrityError:
        db.execute('ROLLBACK TO attempt')
        db.execute('RELEASE attempt')
        return True
    else:
        db.execute('ROLLBACK TO attempt')
        db.execute('RELEASE attempt')
        return False

def main():
    if not DB_DIR.is_dir() or not API.exists():
        raise RuntimeError('Run this file from TEAM360 project root')
    api = API.read_text(encoding='utf-8-sig')
    # Static guard checks; this is NOT a substitute for a multi-account API test.
    for label, token in [
        ('session authentication present', 'getChatGPTUser()'),
        ('origin validation present', 'validWriteOrigin(req)'),
        ('reviewer role check present', 'leaders.has(reviewer.role)'),
        ('self-approval guard present', 'draft.created_by === user.userId'),
        ('reviewer identity check present', 'approval.reviewer_id !== user.userId'),
        ('event rollback guard present', 'SELECT draft_id FROM directive_approvals'),
    ]:
        check(token in api, 'static: ' + label)
    sources = []
    for path in DB_DIR.glob('*.sqlite'):
        try:
            with sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True) as ro:
                present = {r[0] for r in ro.execute("SELECT name FROM sqlite_master WHERE type='table'")}
                if TABLES <= present:
                    sources.append(path)
        except sqlite3.Error:
            pass
    if len(sources) != 1:
        raise RuntimeError(f'Expected one local D1 with approval tables; found {len(sources)}')
    src = sources[0]
    print('SOURCE READ-ONLY:', src)
    with sqlite3.connect(src.resolve().as_uri() + '?mode=ro', uri=True) as ro:
        db = sqlite3.connect(':memory:', isolation_level=None)
        ro.backup(db)
    db.execute('PRAGMA foreign_keys=ON')
    check(db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok', 'memory snapshot integrity')
    check(bool(db.execute("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name='directive_draft_review_lock'").fetchone()), 'edit-lock trigger installed')
    row = db.execute('''SELECT d.id,d.version,d.title,d.body FROM directive_drafts d
        LEFT JOIN directive_approvals a ON a.draft_id=d.id
        WHERE a.draft_id IS NULL AND d.status='draft' LIMIT 1''').fetchone()
    if not row:
        raise RuntimeError('No unsubmitted draft available in read-only snapshot; no data changed')
    draft_id, dv, title, body = row
    stamp = datetime.now(timezone.utc).isoformat()
    submitter, reviewer = 'v51g_fake_submitter', 'v51g_fake_reviewer'
    db.execute('BEGIN IMMEDIATE')
    try:
        # Match V5.1D submit SQL, including conditional insert of audit event.
        inserted = db.execute('''INSERT INTO directive_approvals
            (draft_id,status,submitted_version,submitted_by,submitted_at,reviewer_id,workflow_version,updated_at)
            SELECT id,'submitted',version,?,?,?,?,? FROM directive_drafts
            WHERE id=? AND version=? AND status='draft'
            AND NOT EXISTS (SELECT 1 FROM directive_approvals WHERE draft_id=?)''',
            (submitter,stamp,reviewer,1,stamp,draft_id,dv,draft_id))
        check(inserted.rowcount == 1, 'submit conditional INSERT')
        db.execute('''INSERT INTO directive_approval_events
            (id,draft_id,workflow_version,action,actor_id,reviewer_id,draft_version,created_at)
            VALUES (?,(SELECT draft_id FROM directive_approvals
            WHERE draft_id=? AND status='submitted' AND workflow_version=1
            AND submitted_by=? AND submitted_version=?),1,'submit',?,?,?,?)''',
            ('v51g_submit',draft_id,submitter,dv,submitter,reviewer,dv,stamp))
        check(db.execute('SELECT COUNT(*) FROM directive_approval_events WHERE draft_id=?',(draft_id,)).fetchone()[0] == 1,'submit audit event persisted')
        def edit_locked():
            db.execute('UPDATE directive_drafts SET body=? WHERE id=?',(body+' CHANGED',draft_id))
        check(rollback_on_fail(db,edit_locked),'submitted draft cannot be edited')
        # Attempt duplicate submission: no insert, audit event must fail and rollback.
        def duplicate_submit():
            db.execute('''INSERT INTO directive_approvals
                (draft_id,status,submitted_version,submitted_by,submitted_at,reviewer_id,workflow_version,updated_at)
                SELECT id,'submitted',version,?,?,?,?,? FROM directive_drafts
                WHERE id=? AND version=? AND NOT EXISTS
                (SELECT 1 FROM directive_approvals WHERE draft_id=?)''',
                (submitter,stamp,reviewer,1,stamp,draft_id,dv,draft_id))
            db.execute('''INSERT INTO directive_approval_events
                (id,draft_id,workflow_version,action,actor_id,reviewer_id,draft_version,created_at)
                VALUES (?,(SELECT draft_id FROM directive_approvals WHERE draft_id=?
                AND status='submitted' AND workflow_version=1 AND submitted_by=?
                AND submitted_version=?),1,'submit',?,?,?,?)''',
                ('v51g_duplicate',draft_id,submitter,dv,submitter,reviewer,dv,stamp))
        check(rollback_on_fail(db,duplicate_submit),'duplicate submission blocked (unique history)')
        # Reject then edit, resubmit, approve; explicit workflow version checks.
        def transition(action: str, expected: str, status: str, new_ver: int, current_dv: int, reviewer_id: str, reason=None):
            result = db.execute('''UPDATE directive_approvals SET status=?, submitted_version=?,
                submitted_by=?, submitted_at=?, reviewer_id=?, decided_by=?, decided_at=?,
                decision_reason=?, workflow_version=?, updated_at=?
                WHERE draft_id=? AND workflow_version=? AND status=? AND submitted_version=?
                AND EXISTS(SELECT 1 FROM directive_drafts WHERE id=? AND version=? AND status='draft')''',
                (status,current_dv,submitter,stamp,reviewer_id,
                 reviewer if action in ('reject','approve') else None,
                 stamp if action in ('reject','approve') else None,
                 reason,new_ver,stamp,draft_id,new_ver-1,expected,
                 dv if action=='resubmit' else current_dv,draft_id,current_dv))
            if result.rowcount != 1:
                raise RuntimeError('Unexpected zero-row transition: '+action)
            db.execute('''INSERT INTO directive_approval_events
                (id,draft_id,workflow_version,action,actor_id,reviewer_id,draft_version,reason,created_at)
                VALUES (?,(SELECT draft_id FROM directive_approvals WHERE draft_id=?
                AND workflow_version=? AND updated_at=? AND status=?),?,?,?,?,?,?,?)''',
                ('v51g_'+action,draft_id,new_ver,stamp,status,new_ver,action,
                 submitter if action=='resubmit' else reviewer,reviewer_id,current_dv,reason,stamp))
        transition('reject','submitted','rejected',2,dv,reviewer,'Need revision')
        check(db.execute('SELECT status FROM directive_approvals WHERE draft_id=?',(draft_id,)).fetchone()[0]=='rejected','reviewer rejection')
        updated = db.execute('UPDATE directive_drafts SET body=?,version=version+1 WHERE id=?',(body+' revised',draft_id))
        check(updated.rowcount==1,'rejected draft editable')
        transition('resubmit','rejected','submitted',3,dv+1,reviewer)
        check(rollback_on_fail(db,edit_locked),'resubmitted draft is locked')
        transition('approve','submitted','approved',4,dv+1,reviewer)
        check(rollback_on_fail(db,edit_locked),'approved draft stays locked')
        def stale_decision():
            changed = db.execute("UPDATE directive_approvals SET status='rejected',workflow_version=5 WHERE draft_id=? AND status='submitted' AND workflow_version=3",(draft_id,))
            check(changed.rowcount==0,'stale decision changes zero rows')
            db.execute('''INSERT INTO directive_approval_events
                (id,draft_id,workflow_version,action,actor_id,reviewer_id,draft_version,created_at)
                VALUES (?,(SELECT draft_id FROM directive_approvals WHERE draft_id=? AND workflow_version=5 AND status='rejected'),5,'reject',?,?,?,?)''',
                ('v51g_stale',draft_id,reviewer,reviewer,dv+1,stamp))
        check(rollback_on_fail(db,stale_decision),'stale decision event forces rollback')
        history = db.execute('SELECT action,workflow_version FROM directive_approval_events WHERE draft_id=? ORDER BY workflow_version',(draft_id,)).fetchall()
        check(history==[('submit',1),('reject',2),('resubmit',3),('approve',4)],'complete immutable four-step history')
        check(not db.execute('PRAGMA foreign_key_check').fetchall(),'foreign keys valid')
    finally:
        db.rollback()
        db.close()
    print('SOURCE D1: NEVER WRITTEN')
    print('TEST USERS: SYNTHETIC VALUES ONLY')
    print('TEST DATA: IN-MEMORY, DISCARDED')
    print('V5.1G ISOLATED SQLITE TEST PASS')
    print('NOTE: REAL LOGIN/ROLE AND HTTP ENDPOINTS STILL NEED INTEGRATION TESTING')

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('V5.1G TEST FAILED:', exc, file=sys.stderr)
        sys.exit(1)
