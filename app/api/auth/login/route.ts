import { authDb, consumeLoginAttempt, isJsonRequest, json, validWriteOrigin } from '../../../../lib/auth-api';
import { verifyPassword } from '../../../../lib/password-core';
import { createSession, sessionCookie } from '../../../../lib/session-core';

export async function POST(req: Request): Promise<Response> {
  if (!validWriteOrigin(req)) return json({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  if (!isJsonRequest(req)) return json({ error: 'Yêu cầu JSON.' }, 415);
  const length = Number(req.headers.get('content-length'));
  if (Number.isFinite(length) && length > 4096) return json({ error: 'Yêu cầu quá lớn.' }, 413);

  let data: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: 'Yêu cầu quá lớn.' }, 413);
    data = JSON.parse(raw);
  } catch { return json({ error: 'JSON không hợp lệ.' }, 400); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Yêu cầu không hợp lệ.' }, 400);
  const payload = data as Record<string, unknown>;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = payload.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length > 256) {
    return json({ error: 'Email hoặc mật khẩu không đúng.' }, 401);
  }
  try {
    const db = authDb();
    // Account-based atomic throttling; keyed by a hash to avoid storing email in the throttle table.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
    const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const allowed = await consumeLoginAttempt(db, key, Date.now());
    if (!allowed) return json({ error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.' }, 429, { 'Retry-After': '900' });
    const user = await db.prepare('SELECT id,email,display_name,password_hash,status FROM auth_users WHERE email=? LIMIT 1')
      .bind(email).first<{ id: string; email: string; display_name: string; password_hash: string; status: string }>();
    // Deliberately generic response, including disabled accounts.
    if (!user || user.status !== 'active' || !(await verifyPassword(password, user.password_hash))) {
      return json({ error: 'Email hoặc mật khẩu không đúng.' }, 401);
    }
    const { token } = await createSession(db, user.id);
    const secure = new URL(req.url).protocol === 'https:';
    // Never depend on client-supplied x-forwarded-proto to set Secure.
    const response = json({ user: { userId: user.id, email: user.email, displayName: user.display_name } });
    response.headers.append('Set-Cookie', sessionCookie(token, secure));
    return response;
  } catch {
    return json({ error: 'Không thể đăng nhập lúc này.' }, 500);
  }
}
