import { env } from 'cloudflare:workers';
import { validWriteOrigin } from '../../../../../lib/auth-api';
import { getChatGPTUser } from '../../../../chatgpt-auth';
import { requireWorkspacePermission, AccessDeniedError } from '../../../../../lib/workspace-auth';

const ROLES = ['admin', 'leader', 'manager', 'member', 'viewer'] as const;
type Role = (typeof ROLES)[number];
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
const db = () => env.DB as D1Database;
const validId = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0 && id.length <= 200 && !/[\x00-\x1f\x7f]/.test(id);
const validRole = (role: unknown): role is Role =>
  typeof role === 'string' && ROLES.includes(role as Role);

async function getBody(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new Error('Yêu cầu phải sử dụng JSON.');
  const raw: unknown = await req.json();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Dữ liệu không hợp lệ.');
  return raw as Record<string, unknown>;
}
const failure = (e: unknown) =>
  e instanceof AccessDeniedError
    ? json({ error: e.message }, 403)
    : json({ error: 'Không thể xử lý yêu cầu.' }, 500);

type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, ctx: Context) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Vui lòng đăng nhập.' }, 401);
  try {
    const { id } = await ctx.params;
    await requireWorkspacePermission(db(), user.userId, id, 'members.manage');
    const result = await db()
      .prepare(
        'SELECT user_id AS userId, role, status, joined_at AS joinedAt FROM memberships WHERE workspace_id=? ORDER BY joined_at',
      )
      .bind(id)
      .all();
    return json({ members: result.results });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request, ctx: Context) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Vui lòng đăng nhập.' }, 401);
  if (!validWriteOrigin(req)) return json({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  try {
    const { id } = await ctx.params;
    await requireWorkspacePermission(db(), user.userId, id, 'members.manage');
    const body = await getBody(req);
    if (!validId(body.userId) || !validRole(body.role))
      return json({ error: 'ID tài khoản hoặc vai trò không hợp lệ.' }, 400);
    const now = new Date().toISOString();
    const result = await db()
      .prepare(
        "INSERT OR IGNORE INTO memberships (workspace_id,user_id,role,status,joined_at) VALUES (?,?,?,'active',?)",
      )
      .bind(id, body.userId, body.role, now)
      .run();
    if (result.meta.changes !== 1)
      return json({ error: 'Thành viên đã tồn tại. Sử dụng chức năng cập nhật.' }, 409);
    return json(
      {
        member: {
          userId: body.userId,
          role: body.role,
          status: 'active',
          joinedAt: now,
        },
      },
      201,
    );
  } catch (e) {
    return e instanceof SyntaxError || (e instanceof Error && e.message.includes('JSON'))
      ? json({ error: 'JSON không hợp lệ.' }, 400)
      : failure(e);
  }
}

export async function PATCH(req: Request, ctx: Context) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Vui lòng đăng nhập.' }, 401);
  if (!validWriteOrigin(req)) return json({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  try {
    const { id } = await ctx.params;
    await requireWorkspacePermission(db(), user.userId, id, 'members.manage');
    const body = await getBody(req);
    if (
      !validId(body.userId) ||
      !validRole(body.role) ||
      !['active', 'suspended'].includes(String(body.status))
    )
      return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
    const result = await db().batch([
      // Conditional update guarantees that the last active admin cannot lose admin status.
      db()
        .prepare(
          `UPDATE memberships SET role=?, status=? WHERE workspace_id=? AND user_id=? AND (
        NOT (role='admin' AND status='active' AND (? <> 'admin' OR ? <> 'active'))
        OR (SELECT COUNT(*) FROM memberships WHERE workspace_id=? AND role='admin' AND status='active') > 1
      )`,
        )
        .bind(body.role, body.status, id, body.userId, body.role, body.status, id),
    ]);
    if (result[0].meta.changes !== 1)
      return json(
        {
          error: 'Không tìm thấy thành viên hoặc không thể khóa/hạ quyền admin cuối cùng.',
        },
        409,
      );
    return json({ ok: true });
  } catch (e) {
    return e instanceof SyntaxError || (e instanceof Error && e.message.includes('JSON'))
      ? json({ error: 'JSON không hợp lệ.' }, 400)
      : failure(e);
  }
}
