'use client';
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
