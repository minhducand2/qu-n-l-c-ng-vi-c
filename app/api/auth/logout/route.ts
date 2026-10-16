import { authDb, json, validWriteOrigin } from '../../../../lib/auth-api';
import { clearSessionCookie, readSessionCookie, revokeSession } from '../../../../lib/session-core';

export async function POST(req: Request): Promise<Response> {
  if (!validWriteOrigin(req)) return json({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  const token = readSessionCookie(req.headers.get('cookie'));
  if (token) {
    try { await revokeSession(authDb(), token); } catch { return json({ error: 'Không thể đăng xuất lúc này.' }, 500); }
  }
  const response = json({ ok: true });
  response.headers.append('Set-Cookie', clearSessionCookie(new URL(req.url).protocol === 'https:'));
  return response;
}
