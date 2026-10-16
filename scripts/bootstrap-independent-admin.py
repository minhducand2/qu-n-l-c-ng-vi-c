"""Generate one-time LOCAL bootstrap SQL. Never sends credentials to a service.

Run from TEAM360 project root: py -3.13 scripts/bootstrap-independent-admin.py
Uses PBKDF2-SHA256, 600000 rounds, same format as lib/password-core.ts.
"""
from __future__ import annotations
import getpass
import hashlib
import os
from pathlib import Path
import re
import secrets
import sys
import uuid
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / '.bootstrap-local'
ITERATIONS = 600_000

def quoted(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"

def main() -> int:
    if not (ROOT / 'wrangler.local.json').is_file():
        print('ERROR: Run inside TEAM360, missing wrangler.local.json')
        return 1
    print('LOCAL ONLY: create NEW admin user and NEW separate workspace; no link to local_seedy.')
    print('IMPORTANT: Confirm auth_users is EMPTY in the target local D1 before running SQL.')
    email = input('Admin email: ').strip().lower()
    if not re.fullmatch(r'[^\s@]{1,64}@[^\s@]{1,255}', email) or len(email) > 254:
        print('ERROR: invalid email'); return 1
    name = input('Admin display name: ').strip()
    ws_name = input('NEW workspace name: ').strip()
    if not (1 <= len(name) <= 120 and 1 <= len(ws_name) <= 120):
        print('ERROR: names must be 1-120 characters'); return 1
    first = getpass.getpass('Admin password (12-256 characters, hidden): ')
    second = getpass.getpass('Repeat admin password (hidden): ')
    if first != second or len(first) < 12 or len(first) > 256 or len(first.encode('utf-8')) > 1024:
        print('ERROR: password mismatch or invalid length'); return 1
    confirm = input('Type CREATE to produce local bootstrap SQL: ').strip()
    if confirm != 'CREATE':
        print('Cancelled'); return 1
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', first.encode('utf-8'), salt, ITERATIONS, dklen=32)
    stored = f'pbkdf2-sha256${ITERATIONS}${salt.hex()}${dk.hex()}'
    del first, second
    user_id = 'usr_' + uuid.uuid4().hex
    workspace_id = 'ws_' + uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
    sql = f'''-- TEAM360 local one-time bootstrap. SENSITIVE: contains password HASH, not plaintext.
-- Intended only for an EMPTY auth_users table, local DB; manual confirmation required.
INSERT INTO auth_users (id,email,password_hash,display_name,status,password_changed_at,created_at,updated_at)
SELECT {quoted(user_id)}, {quoted(email)}, {quoted(stored)}, {quoted(name)}, 'active', {quoted(now)}, {quoted(now)}, {quoted(now)}
WHERE NOT EXISTS (SELECT 1 FROM auth_users);
INSERT INTO workspaces (id,name,created_by,created_at,updated_at)
SELECT {quoted(workspace_id)}, {quoted(ws_name)}, {quoted(user_id)}, {quoted(now)}, {quoted(now)}
WHERE EXISTS (SELECT 1 FROM auth_users WHERE id={quoted(user_id)});
INSERT INTO memberships (workspace_id,user_id,role,status,joined_at)
SELECT {quoted(workspace_id)}, {quoted(user_id)}, 'admin', 'active', {quoted(now)}
WHERE EXISTS (SELECT 1 FROM auth_users WHERE id={quoted(user_id)})
  AND EXISTS (SELECT 1 FROM workspaces WHERE id={quoted(workspace_id)});
'''
    OUT_DIR.mkdir(exist_ok=True)
    path = OUT_DIR / ('bootstrap-' + uuid.uuid4().hex + '.sql')
    with path.open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(sql)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    print('\nGENERATED (NOT EXECUTED):', path.relative_to(ROOT))
    print('NEW user_id:', user_id)
    print('NEW workspace_id:', workspace_id)
    print('Do NOT paste SQL or password hash into chat. Apply only with wrangler --local and delete SQL after use.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
