import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validWriteOrigin, isJsonRequest } from '../../../lib/auth-api';

type Role = 'admin' | 'leader' | 'manager' | 'member' | 'viewer';
type Member = { role: Role; status: string };
type Task = { assigned_to: string | null; created_by: string };
const respond = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});
const validId = (v: unknown): v is string => typeof v === 'string' &&
  /^[A-Za-z0-9_-]{1,100}$/.test(v);
const isLeader = (role: Role) => role === 'admin' || role === 'leader';
const numberVersion = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 1;
async function bodyJson(req: Request): Promise<Record<string, unknown> | null> {
  if (!isJsonRequest(req)) return null;
  const raw = await req.text();
  if (raw.length > 15000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown> : null;
  } catch { return null; }
}
async function membership(db: D1Database, workspaceId: string, userId: string) {
  return db.prepare("SELECT role,status FROM memberships " +
    "WHERE workspace_id=? AND user_id=? AND status='active'")
    .bind(workspaceId, userId).first<Member>();
}
async function taskAccess(db: D1Database, workspaceId: string, taskId: string, userId: string, role: Role) {
  const task = await db.prepare(
    'SELECT assigned_to,created_by FROM shared_tasks WHERE id=? AND workspace_id=? AND archived=0'
  ).bind(taskId, workspaceId).first<Task>();
  if (!task) return false;
  return isLeader(role) || task.assigned_to === userId ||
    (role === 'manager' && task.created_by === userId);
}

// TEAM360_V52C_EXECUTIONS
// TEAM360_V52E_ASSIGNEE_ACCESS
async function issuanceAccess(db: D1Database, workspaceId: string, issuanceId: string) {
  return db.prepare(
    'SELECT i.id,i.status,d.task_id FROM directive_issuances i ' +
    'JOIN directive_drafts d ON d.id=i.draft_id WHERE i.id=? AND i.workspace_id=?'
  ).bind(issuanceId, workspaceId).first<{id:string;status:string;task_id:string}>();
}
export async function GET(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return respond({ error: 'Vui lòng đăng nhập.' }, 401);
  const q = new URL(req.url).searchParams;
  const workspaceId = q.get('workspaceId');
  const issuanceId = q.get('issuanceId');
  if (!validId(workspaceId) || !validId(issuanceId))
    return respond({ error: 'ID không hợp lệ.' }, 400);
  try {
    const db = env.DB as D1Database;
    const member = await membership(db, workspaceId, user.userId);
    const iss = await issuanceAccess(db, workspaceId, issuanceId);
    if (!member || !iss)
      return respond({ error: 'Không có quyền truy cập.' }, 403);
    // Assignees may read only their own execution items, not the source task.
    const canSeeTask = await taskAccess(db, workspaceId, iss.task_id, user.userId, member.role);
    const rows = await db.prepare(
      'SELECT * FROM directive_execution_items WHERE issuance_id=? ORDER BY created_at DESC LIMIT 100'
    ).bind(issuanceId).all<{assignee_id:string;id:string}>();
    const items = isLeader(member.role) && canSeeTask ? (rows.results||[]) :
      (rows.results||[]).filter(row => row.assignee_id === user.userId);
    return respond({ items });
  } catch { return respond({ error: 'Không tải được danh sách thực hiện.' }, 500); }
}
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return respond({ error: 'Vui lòng đăng nhập.' }, 401);
  if (!validWriteOrigin(req)) return respond({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  const b = await bodyJson(req);
  if (!b || !validId(b.workspaceId) || !validId(b.issuanceId) || !validId(b.assigneeId) ||
    typeof b.description !== 'string' || !b.description.trim() || b.description.trim().length > 5000 ||
    (b.dueDate != null && (typeof b.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.dueDate))))
    return respond({ error: 'Thông tin giao việc không hợp lệ.' }, 400);
  const workspaceId=b.workspaceId as string, issuanceId=b.issuanceId as string;
  const assigneeId=b.assigneeId as string;
  try {
    const db=env.DB as D1Database;
    const member=await membership(db,workspaceId,user.userId);
    const iss=await issuanceAccess(db,workspaceId,issuanceId);
    if (!member || !isLeader(member.role) || !iss)
      return respond({ error: 'Không có quyền giao việc.' }, 403);
    if (iss.status !== 'issued') return respond({error:'Chỉ được giao việc cho chỉ đạo đang có hiệu lực.'},409);
    const assignee=await membership(db,workspaceId,assigneeId);
    if (!assignee) return respond({error:'Người nhận không còn là thành viên hoạt động.'},400);
    const id='exe_'+crypto.randomUUID().replace(/-/g,'');
    const eventId='exev_'+crypto.randomUUID().replace(/-/g,'');
    const now=new Date().toISOString();
    const result=await db.batch([
      db.prepare(
        'INSERT INTO directive_execution_items ' +
        '(id,issuance_id,assignee_id,description,due_date,created_by,created_at,updated_at) ' +
        'SELECT ?,id,?,?,?,?,?,? FROM directive_issuances WHERE id=? AND workspace_id=? ' +
        "AND status='issued' AND EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND status='active')"
      ).bind(id,assigneeId,(b.description as string).trim(),b.dueDate||null,user.userId,now,now,
        issuanceId,workspaceId,workspaceId,assigneeId),
      db.prepare(
        "INSERT INTO directive_execution_events (id,execution_item_id,action,actor_id,created_at) " +
        "VALUES (?, (SELECT id FROM directive_execution_items WHERE id=? AND issuance_id=?), 'created', ?, ?)"
      ).bind(eventId,id,issuanceId,user.userId,now),
    ]);
    if (result[0]?.meta?.changes !== 1 || result[1]?.meta?.changes !== 1)
      return respond({error:'Không xác minh được giao dịch giao việc.'},409);
    return respond({id,status:'pending'},201);
  } catch { return respond({error:'Không giao được việc. Kiểm tra trạng thái hoặc quyền.'},409); }
}
export async function PATCH(req: Request) {
  const user=await getChatGPTUser();
  if (!user) return respond({error:'Vui lòng đăng nhập.'},401);
  if (!validWriteOrigin(req)) return respond({error:'Nguồn yêu cầu không hợp lệ.'},403);
  const b=await bodyJson(req);
  if (!b || !validId(b.workspaceId) || !validId(b.issuanceId) || !validId(b.itemId) ||
    !['in_progress','completed','cancelled'].includes(String(b.status)) ||
    (b.note !== undefined && (typeof b.note !== 'string' || b.note.length>2000)))
    return respond({error:'Trạng thái cập nhật không hợp lệ.'},400);
  const workspaceId=b.workspaceId as string, issuanceId=b.issuanceId as string;
  const itemId=b.itemId as string, status=b.status as string;
  try {
    const db=env.DB as D1Database;
    const member=await membership(db,workspaceId,user.userId);
    const iss=await issuanceAccess(db,workspaceId,issuanceId);
    const item=await db.prepare(
      'SELECT assignee_id,status FROM directive_execution_items WHERE id=? AND issuance_id=?'
    ).bind(itemId,issuanceId).first<{assignee_id:string;status:string}>();
    if (!member || !iss || !item || (!isLeader(member.role) && item.assignee_id!==user.userId))
      return respond({error:'Không có quyền cập nhật.'},403);
    if (iss.status!=='issued') return respond({error:'Chỉ đạo đã đóng.'},409);
    const allowed = (item.status==='pending' && (status==='in_progress'||status==='cancelled')) ||
      (item.status==='in_progress' && (status==='completed'||status==='cancelled'));
    if (!allowed || (status==='cancelled' && !isLeader(member.role)))
      return respond({error:'Chuyển trạng thái không được phép.'},409);
    const now=new Date().toISOString();
    const eventId='exev_'+crypto.randomUUID().replace(/-/g,'');
    const action=status==='in_progress'?'started':status;
    const result=await db.batch([
      db.prepare(
        'UPDATE directive_execution_items SET status=?,updated_at=? WHERE id=? AND issuance_id=? AND status=? ' +
        'AND EXISTS (SELECT 1 FROM directive_issuances WHERE id=? AND workspace_id=? AND status=\'issued\') ' +
        "AND EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? AND status='active') " +
        "AND ((assignee_id=? AND ? <> 'cancelled') OR EXISTS " +
        "(SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? " +
        "AND status='active' AND role IN ('admin','leader')))"
      ).bind(status,now,itemId,issuanceId,item.status,issuanceId,workspaceId,
        workspaceId,user.userId,user.userId,status,workspaceId,user.userId),
      db.prepare(
        'INSERT INTO directive_execution_events (id,execution_item_id,action,actor_id,note,created_at) ' +
        'VALUES (?,(SELECT id FROM directive_execution_items WHERE id=? AND issuance_id=? AND status=? AND updated_at=?),?,?,?,?)'
      ).bind(eventId,itemId,issuanceId,status,now,action,user.userId,b.note||null,now),
    ]);
    if (result[0]?.meta?.changes!==1 || result[1]?.meta?.changes!==1)
      return respond({error:'Trạng thái đã thay đổi, vui lòng tải lại.'},409);
    return respond({itemId,status,updatedAt:now});
  } catch { return respond({error:'Không cập nhật được tiến độ. Vui lòng tải lại.'},409); }
}
