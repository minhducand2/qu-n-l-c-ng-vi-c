'use client';

import { FormEvent, useEffect, useState } from 'react';

type User = { userId: string; email: string; displayName: string };
type AuthReply = { user?: User; error?: string; ok?: boolean };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        });
        if (response.ok) {
          const body = (await response.json()) as AuthReply;
          if (!controller.signal.aborted && body.user) setUser(body.user);
        }
      } catch {
        if (!controller.signal.aborted) setMessage('Không thể kiểm tra phiên đăng nhập.');
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    })();
    return () => controller.abort();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        cache: 'no-store',
      });
      const body = (await response.json()) as AuthReply;
      if (!response.ok || !body.user) {
        setMessage(response.status === 429 ? 'Thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.' : (body.error || 'Đăng nhập thất bại.'));
        return;
      }
      setUser(body.user);
      setPassword('');
      setMessage('Đăng nhập thành công.');
    } catch {
      setMessage('Không kết nối được máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
      });
      if (!response.ok) {
        setMessage('Đăng xuất chưa thành công.');
        return;
      }
      setUser(null);
      setPassword('');
      setMessage('Đã đăng xuất.');
    } catch {
      setMessage('Không kết nối được máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9" aria-labelledby="login-title">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-xl font-bold text-white" aria-hidden="true">T</div>
          <h1 id="login-title" className="text-2xl font-bold tracking-tight">TEAM360</h1>
          <p className="mt-2 text-sm text-slate-500">Hệ thống quản lý công việc và điều hành</p>
        </div>
        {checking ? <p className="text-center text-sm text-slate-600" role="status">Đang kiểm tra phiên đăng nhập...</p> : user ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-green-800">Đã đăng nhập</p>
              <p className="mt-1 break-words text-sm text-green-900">{user.displayName} ({user.email})</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">Phiên đăng nhập độc lập đã hoạt động. Khu vực công việc chưa được kết nối với hệ thống xác thực mới; vui lòng chưa dùng trang cũ để kiểm tra quyền của tài khoản này.</p>
            <button type="button" disabled={loading} onClick={logout} className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60">{loading ? 'Đang đăng xuất...' : 'Đăng xuất'}</button>
          </div>
        ) : (
          <form onSubmit={login} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="tenban@congty.com" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">Mật khẩu</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          </form>
        )}
        {message && <p role="status" className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        <p className="mt-8 text-center text-xs text-slate-400">Phiên bản thử nghiệm nội bộ · Không chia sẻ thông tin đăng nhập</p>
      </section>
    </main>
  );
}
