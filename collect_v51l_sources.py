from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from datetime import datetime

root = Path.cwd()
manifest = [
    'app/api/directive-approvals/route.ts',
    'app/api/directive-drafts/route.ts',
    'app/chatgpt-auth.ts',
    'lib/auth-api.ts',
    'app/organization-command-center.tsx',
    'package.json',
    'drizzle/0007_directive_approvals.sql',
    'drizzle/0008_directive_edit_guard.sql',
]
if not (root / 'app/api/directive-approvals/route.ts').exists():
    raise SystemExit('STOP: Run inside TEAM360 project directory.')
for path in manifest:
    if not (root / path).is_file():
        raise SystemExit('STOP: Missing expected source: ' + path)
    if (root / path).stat().st_size > 500_000:
        raise SystemExit('STOP: Oversized source: ' + path)

out_dir = root / 'backups' / 'v51l'
out_dir.mkdir(parents=True, exist_ok=True)
out = out_dir / ('v51l-review-sources-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '.zip')
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for relative in manifest:
        archive.write(root / relative, arcname=relative)
with ZipFile(out) as archive:
    assert archive.namelist() == manifest
print('V5.1L SOURCE BUNDLE PASS')
print('FILE:', out.resolve())
print('FILES INCLUDED:', len(manifest))
print('ONLY SOURCE CODE, PACKAGE METADATA AND TWO SQL MIGRATIONS')
print('NO DATABASE, .env, SECRETS, COOKIES OR NODE_MODULES INCLUDED')
print('NO PROJECT FILES MODIFIED')
