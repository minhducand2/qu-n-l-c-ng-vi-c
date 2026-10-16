import { currentSessionUser, json } from '../../../../lib/auth-api';

export async function GET(): Promise<Response> {
  try {
    const user = await currentSessionUser();
    if (!user) return json({ error: 'Chưa đăng nhập.' }, 401);
    return json({ user });
  } catch { return json({ error: 'Không thể kiểm tra phiên.' }, 500); }
}
