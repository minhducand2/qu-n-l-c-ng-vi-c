import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../../chatgpt-auth';

type Context = { params: Promise<{ id: string }> };
type Member = { role: string; status: string };
const send = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const validWorkspaceId = (s: unknown): s is string => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(s);
const textField = (s: unknown, max: number): s is string => typeof s === 'string' && s.trim().length > 0 && s.trim().length <= max;
async function activeMember(db: D1Database, workspaceId: string, userId: string) {
  return db.prepare("SELECT role,status FROM memberships WHERE workspace_id=? AND user_id=? AND status='active'")
    .bind(workspaceId,userId).first<Member>();
}
function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return (!origin || origin === new URL(req.url).origin) && req.headers.get('sec-fetch-site') !== 'cross-site';
}
async function parseBody(req: Request): Promise<Record<string, unknown> | null> {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  const raw = await req.text();
  if (raw.length > 4096) return null;
  const body: unknown = JSON.parse(raw);
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
}
// Any ACTIVE member can read directory entries of ACTIVE members in their own workspace.
export async function GET(_req: Request, ctx: Context) {
  const user = await getChatGPTUser(); if (!user) return send({error:'Vui lòng đăng nhập.'},401);
  const {id} = await ctx.params; if (!validWorkspaceId(id)) return send({error:'Tổ chức không hợp lệ.'},400);
  try {
    const db = env.DB as D1Database;
    if (!await activeMember(db,id,user.userId)) return send({error:'Không có quyền truy cập.'},403);
    const rows = await db.prepare(`SELECT m.user_id AS userId,m.role,m.status,
      p.display_name AS displayName,p.department_name AS departmentName,
      p.account_claimed_at AS accountClaimedAt
      FROM memberships m LEFT JOIN workspace_member_profiles p
        ON p.workspace_id=m.workspace_id AND p.user_id=m.user_id
      WHERE m.workspace_id=? AND m.status='active'
      ORDER BY COALESCE(p.display_name,m.user_id),m.user_id`).bind(id).all();
    return send({members:rows.results});
  } catch { return send({error:'Không thể tải danh bạ.'},500); }
}
// SELF claim: the authenticated user alone can confirm their own workspace profile.
// This does not verify job title, employer affiliation, or Excel person records.
export async function POST(req: Request,ctx:Context) {
  const user=await getChatGPTUser(); if(!user)return send({error:'Vui lòng đăng nhập.'},401);
  if(!sameOrigin(req))return send({error:'Nguồn yêu cầu không hợp lệ.'},403);
  const {id}=await ctx.params; if(!validWorkspaceId(id))return send({error:'Tổ chức không hợp lệ.'},400);
  try {
    const body=await parseBody(req);
    if(!body || !textField(body.displayName,120))return send({error:'Tên hiển thị phải có từ 1 đến 120 ký tự.'},400);
    const db=env.DB as D1Database;
    if(!await activeMember(db,id,user.userId))return send({error:'Không có quyền truy cập.'},403);
    const now=new Date().toISOString();
    // Preserve department assigned by admin. Never allow arbitrary userId in body.
    const result=await db.prepare(`INSERT INTO workspace_member_profiles
      (workspace_id,user_id,display_name,department_name,account_claimed_at,updated_at,updated_by)
      SELECT ?,?,?,'',?,?,? WHERE EXISTS
      (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND status='active')
      ON CONFLICT(workspace_id,user_id) DO UPDATE SET
        display_name=excluded.display_name,updated_at=excluded.updated_at,updated_by=excluded.updated_by`)
      .bind(id,user.userId,body.displayName.trim(),now,now,user.userId,id,user.userId).run();
    if(result.meta.changes!==1)return send({error:'Không thể lưu hồ sơ.'},409);
    return send({ok:true,userId:user.userId,displayName:body.displayName.trim()});
  } catch (e) {return e instanceof SyntaxError ? send({error:'JSON không hợp lệ.'},400):send({error:'Không thể lưu hồ sơ.'},500);}
}
// Admin may assign a department label only after the user has claimed their own profile.
// The department label does NOT grant task access or a new role.
export async function PATCH(req:Request,ctx:Context) {
  const user=await getChatGPTUser(); if(!user)return send({error:'Vui lòng đăng nhập.'},401);
  if(!sameOrigin(req))return send({error:'Nguồn yêu cầu không hợp lệ.'},403);
  const {id}=await ctx.params; if(!validWorkspaceId(id))return send({error:'Tổ chức không hợp lệ.'},400);
  try {
    const body=await parseBody(req);
    if(!body || typeof body.userId!=='string' || body.userId.length<1 || body.userId.length>200 || typeof body.departmentName!=='string' || body.departmentName.trim().length>120)
      return send({error:'ID hoặc tên phòng ban không hợp lệ.'},400);
    const db=env.DB as D1Database;
    const actor=await activeMember(db,id,user.userId);
    if(!actor || actor.role!=='admin')return send({error:'Chỉ admin được phân phòng ban.'},403);
    const now=new Date().toISOString();
    const result=await db.prepare(`UPDATE workspace_member_profiles SET department_name=?,updated_at=?,updated_by=?
      WHERE workspace_id=? AND user_id=? AND EXISTS
      (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND status='active')`)
      .bind(body.departmentName.trim(),now,user.userId,id,body.userId,id,body.userId).run();
    if(result.meta.changes!==1)return send({error:'Thành viên chưa tự xác nhận hồ sơ hoặc không hoạt động.'},409);
    return send({ok:true});
  } catch (e) {return e instanceof SyntaxError ? send({error:'JSON không hợp lệ.'},400):send({error:'Không thể cập nhật phòng ban.'},500);}
}
