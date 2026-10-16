"""Static preflight for TEAM360 v0.5. NOT an authorization/security integration test.
Reads real project API sources, checks key guards are present, and reports manual checks.
No database write, fake authentication, or network request.
"""
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parent.parent
FILES={
 'shared': ROOT/'app/api/shared-tasks/route.ts',
 'members': ROOT/'app/api/workspaces/[id]/members/route.ts',
 'mine': ROOT/'app/api/my-shared-tasks/route.ts',
}
missing=[str(p.relative_to(ROOT)) for p in FILES.values() if not p.is_file()]
if missing:
 print('MISSING source files:',', '.join(missing));sys.exit(2)
sources={k:v.read_text(encoding='utf-8-sig') for k,v in FILES.items()}
checks=[
 ('Shared Tasks authenticates server-side',r'getChatGPTUser\s*\(',sources['shared']),
 ('Shared Tasks requires active membership',r"status\s*=\s*'active'",sources['shared']),
 ('Shared Tasks scopes SELECT to workspace',r'FROM\s+shared_tasks\s+WHERE\s+workspace_id\s*=\s*\?',sources['shared']),
 ('Shared Tasks filters visible tasks server-side',r'\.filter\s*\(\s*\(?\s*t\s*\)?\s*=>\s*canRead\s*\(',sources['shared']),
 ('Shared Tasks checks edit permissions',r'canEdit\s*\(',sources['shared']),
 ('Shared Tasks limits approval to leadership',r'leaders\.has\s*\(\s*m\.role\s*\)',sources['shared']),
 ('Shared Tasks checks version for concurrent edits',r'task\.version\s*!==\s*old\.version',sources['shared']),
 ('Shared Tasks verifies recipient active membership',r'member\s*\(\s*db\s*,\s*workspaceId\s*,\s*assignedTo\s*\)',sources['shared']),
 ('Membership API checks access to manage members',r"requireWorkspacePermission\s*\([^;]*'members\.manage'",sources['members']),
 ('My Tasks authenticates user',r'getChatGPTUser\s*\(',sources['mine']),
]
failed=[]
for name,pattern,source in checks:
 passed=bool(re.search(pattern,source,re.I|re.S));print(('OK   ' if passed else 'FAIL ')+name)
 if not passed:failed.append(name)
print('\nDISCLAIMER: All checks above are code-pattern preflight only. They do NOT prove access control is secure.')
print('Still needed: separate authenticated identities, cross-organization GET/POST, viewer writes, staff review, stale version, audit check.')
if failed:sys.exit(1)
print('Preflight source checks passed. NOT an API security test.')
