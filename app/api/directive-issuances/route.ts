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

// TEAM360_V52C_ISSUANCES
// Read issuance status; only users who may see the underlying task can read it.
export async function GET(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return respond({ error: 'Vui lòng đăng nhập.' }, 401);
  const q = new URL(req.url).searchParams;
  const workspaceId = q.get('workspaceId');
  const taskId = q.get('taskId');
  const draftId = q.get('draftId');
  if (!validId(workspaceId) || !validId(taskId) || !validId(draftId))
    return respond({ error: 'ID không hợp lệ.' }, 400);
  try {
    const db = env.DB as D1Database;
    const member = await membership(db, workspaceId, user.userId);
    if (!member || !await taskAccess(db, workspaceId, taskId, user.userId, member.role))
      return respond({ error: 'Không có quyền truy cập.' }, 403);
    const draft = await db.prepare('SELECT created_by FROM directive_drafts WHERE id=? AND workspace_id=? AND task_id=?')
      .bind(draftId, workspaceId, taskId).first<{created_by:string}>();
    if (!draft || (!isLeader(member.role) && draft.created_by !== user.userId))
      return respond({ error: 'Không có quyền xem dự thảo.' }, 403);
    const issuance = await db.prepare('SELECT * FROM directive_issuances WHERE workspace_id=? AND draft_id=?')
      .bind(workspaceId, draftId).first();
    const events = issuance ? await db.prepare(
      'SELECT * FROM directive_issuance_events WHERE issuance_id=? ORDER BY created_at DESC LIMIT 100'
    ).bind((issuance as {id:string}).id).all() : null;
    return respond({ issuance: issuance ?? null, events: events?.results || [] });
  } catch {
    return respond({ error: 'Không tải được sổ ban hành.' }, 500);
  }
}

// Record issuance locally; this is NOT external dispatch or digital signing.
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return respond({ error: 'Vui lòng đăng nhập.' }, 401);
  if (!validWriteOrigin(req)) return respond({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
  const body = await bodyJson(req);
  if (!body || !validId(body.workspaceId) || !validId(body.taskId) ||
    !validId(body.draftId) || !numberVersion(body.approvedWorkflowVersion) ||
    !numberVersion(body.approvedDraftVersion) || typeof body.documentNumber !== 'string' ||
    !body.documentNumber.trim() || body.documentNumber.trim().length > 100)
    return respond({ error: 'Thông tin ban hành không hợp lệ.' }, 400);
  const workspaceId = body.workspaceId as string;
  const taskId = body.taskId as string;
  const draftId = body.draftId as string;
  const doc = (body.documentNumber as string).trim();
  try {
    const db = env.DB as D1Database;
    const member = await membership(db, workspaceId, user.userId);
    if (!member || !isLeader(member.role))
      return respond({ error: 'Chỉ lãnh đạo được ghi nhận ban hành.' }, 403);
    const draft = await db.prepare(
      'SELECT d.version,a.workflow_version FROM directive_drafts d ' +
      'JOIN directive_approvals a ON a.draft_id=d.id ' +
      'WHERE d.id=? AND d.workspace_id=? AND d.task_id=? ' +
      "AND a.status='approved' AND a.submitted_version=d.version"
    ).bind(draftId, workspaceId, taskId).first<{version:number;workflow_version:number}>();
    if (!draft || draft.version !== body.approvedDraftVersion ||
      draft.workflow_version !== body.approvedWorkflowVersion)
      return respond({ error: 'Bản dự thảo chưa được phê duyệt hoặc phiên bản đã thay đổi.' }, 409);
    if (!await taskAccess(db, workspaceId, taskId, user.userId, member.role))
      return respond({ error: 'Không có quyền.' }, 403);
    const id = 'iss_' + crypto.randomUUID().replace(/-/g, '');
    const eventId = 'ise_' + crypto.randomUUID().replace(/-/g, '');
    const now = new Date().toISOString();
    // The scalar subquery produces NULL on a failed insert. NOT NULL/FK then rolls back batch.
    const result = await db.batch([
      db.prepare(
        'INSERT INTO directive_issuances ' +
        '(id,workspace_id,draft_id,approved_workflow_version,approved_draft_version,' +
        'document_number,issued_by,issued_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
      ).bind(id,workspaceId,draftId,body.approvedWorkflowVersion,body.approvedDraftVersion,
        doc,user.userId,now,now),
      db.prepare(
        'INSERT INTO directive_issuance_events ' +
        '(id,issuance_id,action,actor_id,created_at) ' +
        "VALUES ( ?, (SELECT id FROM directive_issuances WHERE id=? AND workspace_id=? AND draft_id=?), 'issued', ?, ? )"
      ).bind(eventId,id,workspaceId,draftId,user.userId,now),
    ]);
    if (result[0]?.meta?.changes !== 1 || result[1]?.meta?.changes !== 1)
      return respond({ error: 'Không xác minh được giao dịch ban hành.' }, 500);
    return respond({ id, documentNumber: doc, status:'issued', issuedAt:now }, 201);
  } catch {
    return respond({ error: 'Không ghi nhận được ban hành (có thể đã tồn tại hoặc phiên bản không hợp lệ).' }, 409);
  }
}
