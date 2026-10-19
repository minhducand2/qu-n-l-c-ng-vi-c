from pathlib import Path
from datetime import datetime
import sqlite3
import sys

# TEAM360 V5.2B: one-time local-only migration with verified backup.
root = Path.cwd()
schema = root / 'drizzle' / '0009_directive_issuance.sql'
db_dir = root / '.wrangler' / 'state' / 'v3' / 'd1' / 'miniflare-D1DatabaseObject'
if not schema.is_file() or not db_dir.is_dir():
    sys.exit('STOP: migration 0009 or local D1 folder missing')
sql = schema.read_text(encoding='utf-8-sig')
new_tables = {'directive_issuances','directive_execution_items','directive_execution_events','directive_issuance_events'}
new_triggers = {'directive_issuance_requires_approval','directive_issuance_identity_immutable'}
required_old = {'shared_tasks','memberships','directive_drafts','directive_draft_versions','directive_approvals','directive_approval_events'}
if any(('CREATE TABLE ' + name) not in sql for name in new_tables) or any(('CREATE TRIGGER ' + name) not in sql for name in new_triggers):
    sys.exit('STOP: unexpected 0009 migration; no database changed')
if 'DIRECTIVE_NOT_CURRENTLY_APPROVED' not in sql or 'DIRECTIVE_ISSUANCE_IMMUTABLE' not in sql:
    sys.exit('STOP: required approval guard missing')

def names(db, kind):
    return {r[0] for r in db.execute('SELECT name FROM sqlite_master WHERE type=?', (kind,))}

candidates=[]
for path in db_dir.glob('*.sqlite'):
    try:
        ro=sqlite3.connect(path.resolve().as_uri()+'?mode=ro', uri=True)
        try:
            if required_old <= names(ro, 'table'):
                candidates.append(path)
        finally:
            ro.close()
    except sqlite3.Error:
        continue
if len(candidates) != 1:
    sys.exit(f'STOP: expected 1 application DB; found {len(candidates)}')
path=candidates[0]
con=sqlite3.connect(path, timeout=2)
con.execute('PRAGMA foreign_keys=ON')
try:
    if (new_tables & names(con, 'table')) or (new_triggers & names(con, 'trigger')):
        sys.exit('STOP: V5.2 schema is already partially/fully installed. No changes made.')
    if con.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
        sys.exit('STOP: database integrity check failed')
    if con.execute('PRAGMA foreign_key_check').fetchall():
        sys.exit('STOP: existing foreign-key violations')

    # Rehearse migration on a full in-memory snapshot; source DB stays unchanged.
    rehearsal=sqlite3.connect(':memory:')
    try:
        con.backup(rehearsal)
        rehearsal.execute('PRAGMA foreign_keys=ON')
        rehearsal.executescript('BEGIN IMMEDIATE;\n'+sql+'\nCOMMIT;')
        if not (new_tables <= names(rehearsal,'table') and new_triggers <= names(rehearsal,'trigger')):
            sys.exit('STOP: rehearsal schema incomplete')
        if rehearsal.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            sys.exit('STOP: rehearsal integrity failed')
        if rehearsal.execute('PRAGMA foreign_key_check').fetchall():
            sys.exit('STOP: rehearsal FK failed')
    finally:
        rehearsal.close()
    print('ISOLATED REHEARSAL: PASS')

    backup_dir=root/'backups'/'database'
    backup_dir.mkdir(parents=True,exist_ok=True)
    backup=backup_dir/('d1-local-before-v52-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f')+'.sqlite')
    target=sqlite3.connect(backup)
    try:
        con.backup(target)
    finally:
        target.close()
    check=sqlite3.connect(backup.resolve().as_uri()+'?mode=ro',uri=True)
    try:
        if not required_old <= names(check,'table') or check.execute('PRAGMA integrity_check').fetchone()[0]!='ok':
            sys.exit('STOP: backup verification failed; original untouched')
    finally:
        check.close()
    print('LOCAL DB:',path)
    print('VERIFIED BACKUP:',backup)
    print('BACKUP: PASS')

    try:
        con.executescript('BEGIN IMMEDIATE;\n'+sql+'\nCOMMIT;')
    except BaseException:
        if con.in_transaction: con.rollback()
        raise
    if not (new_tables <= names(con,'table') and new_triggers <= names(con,'trigger')):
        raise RuntimeError('Migration finished but tables/triggers missing; recover from verified backup')
    if con.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or con.execute('PRAGMA foreign_key_check').fetchall():
        raise RuntimeError('Post migration validation failed; recover from verified backup')
    for item in sorted(new_tables): print('TABLE:',item,'PASS')
    for item in sorted(new_triggers): print('TRIGGER:',item,'PASS')
    print('FOREIGN KEY + INTEGRITY: PASS')
    print('PREEXISTING DRAFT RECORDS: PRESERVED')
    print('REMOTE D1: NOT TOUCHED')
    print('V5.2B LOCAL MIGRATION PASS')
finally:
    con.close()
