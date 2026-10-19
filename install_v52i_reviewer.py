from pathlib import Path
from datetime import datetime
import shutil

root = Path.cwd()
base = root / 'app' / 'organization-command-center.tsx'
if not base.exists(): raise SystemExit('STOP: not in TEAM360 root')
src = base.read_text(encoding='utf-8-sig')
marker = 'TEAM360_REVIEWER_PROVISION_V52I'
if marker in src: raise SystemExit('STOP: already installed')
anchor = "import { useEffect, useState } from 'react';"
if src.count(anchor) != 1: raise SystemExit('STOP: unexpected component import')
mount = "          <div style={{\n            border: '1px solid #a5b4fc'"
if src.count(mount) != 1: raise SystemExit('STOP: unexpected V5.1 approval placement')

api = root / 'app/api/workspaces/[id]/provision-reviewer/route.ts'
ui = root / 'app/reviewer-provision-panel.tsx'
if api.exists() or ui.exists(): raise SystemExit('STOP: output files already exist')

api_text = '''import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../../chatgpt-auth';
import { validWriteOrigin, isJsonRequest } from '../../../../../lib/auth-api';
import { hashPassword } from '../../../../../lib/password-core';

type Context = { params: Promise<{ id: string }> };
const reply = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});
async function allowed(workspaceId: string, userId: string): Promise<boolean> {
  const db = env.DB as D1Database;
  const member = await db.prepare(
    "SELECT 1 AS ok FROM memberships m JOIN auth_users u ON u.id=m.user_id " +
    "WHERE m.workspace_id=? AND m.user_id=? AND m.role='admin' " +
    "AND m.status='active' AND u.status='active' LIMIT 1"
  ).bind(workspaceId, userId).first<{ ok: number }>();
  return Boolean(member?.ok);
}
export async function GET(_req: Request, ctx: Context): Promise<Response> {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui lòng đăng nhập.' }, 401);
  const { id } = await ctx.params;
  if (!id || id.length > 200) return reply({ error: 'Workspace ID không hợp lệ.' }, 400);
  return reply({ canProvision: await allowed(id, user.userId) });
}
export async function POST(req: Request, ctx: Context): Promise<Response> {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui lòng đăng nhập.' }, 401);
  if (!validWriteOrigin(req)) return reply({ error: 'Nguồn không hợp lệ.' }, 403);
  if (!isJsonRequest(req)) return reply({ error: 'Yêu cầu JSON.' }, 415);
  const { id: workspaceId } = await ctx.params;
  if (!workspaceId || workspaceId.length > 200) return reply({ error: 'Workspace ID không hợp lệ.' }, 400);
  if (!await allowed(workspaceId, user.userId)) return reply({ error: 'Chỉ admin workspace được tạo người duyệt.' }, 403);
  let b: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply({ error: 'Yêu cầu quá lớn.' }, 413);
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return reply({ error: 'Dữ liệu không hợp lệ.' }, 400);
    b = v as Record<string, unknown>;
  } catch { return reply({ error: 'JSON không hợp lệ.' }, 400); }
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const name = typeof b.displayName === 'string' ? b.displayName.trim() : '';
  const password = b.password;
  if (email.length > 254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
      name.length < 2 || name.length > 100 || typeof password !== 'string' ||
      password.length < 12 || password.length > 256) {
    return reply({ error: 'Email, tên hoặc mật khẩu (12-256 ký tự) không hợp lệ.' }, 400);
  }
  const db = env.DB as D1Database;
  const now = new Date().toISOString();
  const newId = 'usr_' + crypto.randomUUID().replace(/-/g, '');
  try {
    const passwordHash = await hashPassword(password);
    // The second statement must fail when the first insert failed or admin role
    // was revoked; D1 batch ensures both rows are committed or rolled back.
    const results = await db.batch([
      db.prepare(
        "INSERT INTO auth_users (id,email,password_hash,display_name,status,password_changed_at,created_at,updated_at) " +
        "SELECT ?,?,?,?,'active',?,?,? WHERE NOT EXISTS (SELECT 1 FROM auth_users WHERE email=?) " +
        "AND EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND role='admin' AND status='active')"
      ).bind(newId, email, passwordHash, name, now, now, now, email, workspaceId, user.userId),
      db.prepare(
        "INSERT INTO memberships (workspace_id,user_id,role,status,joined_at) " +
        "VALUES (?,(SELECT id FROM auth_users WHERE id=?),'leader','active',?)"
      ).bind(workspaceId, newId, now),
    ]);
    if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1)
      return reply({ error: 'Không thể tạo tài khoản. Email có thể đã tồn tại hoặc quyền admin thay đổi.' }, 409);
    return reply({ user: { userId: newId, email, displayName: name, role: 'leader' } }, 201);
  } catch {
    return reply({ error: 'Không thể tạo tài khoản. Kiểm tra email trùng hoặc quyền quản trị.' }, 409);
  }
}
'''
ui_text = ''''use client';
// TEAM360_REVIEWER_PROVISION_V52I
import { useEffect, useState } from 'react';
type Created = { userId: string; email: string; displayName: string; role: string };
export default function ReviewerProvisionPanel({ workspaceId }: { workspaceId: string }) {
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  useEffect(() => {
    let alive = true;
    setAllowed(false);
    void fetch('/api/workspaces/' + encodeURIComponent(workspaceId) + '/provision-reviewer',
      { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => r.ok ? r.json() as Promise<{ canProvision: boolean }> : { canProvision: false })
      .then(v => { if (alive) setAllowed(v.canProvision === true); })
      .catch(() => { if (alive) setAllowed(false); });
    return () => { alive = false; };
  }, [workspaceId]);
  if (!allowed) return null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !window.confirm('Tạo tài khoản leader mới trong workspace hiện tại?')) return;
    setBusy(true); setMessage(''); setCreated(null);
    try {
      const response = await fetch('/api/workspaces/' + encodeURIComponent(workspaceId) + '/provision-reviewer', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName: name, password }),
      });
      const data = await response.json() as { error?: string; user?: Created };
      if (!response.ok || !data.user) throw Error(data.error || 'HTTP ' + response.status);
      setCreated(data.user); setPassword('');
      setMessage('Đã tạo leader. Hãy đăng nhập tài khoản này ở trình duyệt riêng để duyệt.');
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return <details style={{ border: '1px solid #94a3b8', borderRadius: 10, padding: 12 }}>
    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Quản trị: tạo người duyệt độc lập V5.2I</summary>
    <p style={{ fontSize: 12 }}>Chỉ admin workspace. Tạo tài khoản leader với mật khẩu riêng; không cấp quyền admin.</p>
    <form onSubmit={e => void submit(e)} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <label>Tên hiển thị <input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} style={{ display:'block', width:'100%' }} /></label>
      <label>Email đăng nhập <input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} style={{ display:'block', width:'100%' }} /></label>
      <label>Mật khẩu riêng (tối thiểu 12 ký tự) <input type="password" required minLength={12} maxLength={256} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display:'block', width:'100%' }} /></label>
      <button type="submit" className="btn primary" disabled={busy || password.length < 12}>{busy ? 'Đang tạo...' : 'Tạo tài khoản leader'}</button>
    </form>
    {message && <p role="status" style={{ fontSize: 12 }}>{message}</p>}
    {created && <p style={{ fontSize: 12 }}>Tài khoản: {created.email} | ID: {created.userId}. Làm mới trang để cập nhật danh sách người duyệt.</p>}
  </details>;
}
'''

backups = root / 'backups' / 'v52i'
backups.mkdir(parents=True, exist_ok=True)
backup = backups / ('organization-command-center-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f') + '.tsx.bak')
shutil.copy2(base, backup)
api.parent.mkdir(parents=True, exist_ok=True)
api.write_text(api_text, encoding='utf-8')
ui.write_text(ui_text, encoding='utf-8')
updated = src.replace(anchor, anchor + "\nimport ReviewerProvisionPanel from './reviewer-provision-panel'; // " + marker, 1)
updated = updated.replace(mount, '           <ReviewerProvisionPanel workspaceId={workspaceId} />\n\n' + mount, 1)
base.write_text(updated, encoding='utf-8')
print('BACKUP:', backup)
print('ADMIN-ONLY PROVISION API:', api.relative_to(root))
print('REVIEWER SETUP UI:', ui.relative_to(root))
print('V5.1/V5.2 COMPONENT: PRESERVED')
print('DATABASE: UNCHANGED')
print('V5.2I PATCH APPLIED')
