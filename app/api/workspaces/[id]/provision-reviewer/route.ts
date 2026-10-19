import { env } from 'cloudflare:workers';
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
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
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
