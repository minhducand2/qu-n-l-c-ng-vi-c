from pathlib import Path
from datetime import datetime
import zipfile

root = Path.cwd()
issuance = root / 'app/api/directive-issuances/route.ts'
execution = root / 'app/api/directive-executions/route.ts'
schema = root / 'drizzle/0009_directive_issuance.sql'
approvals = root / 'app/api/directive-approvals/route.ts'
auth = root / 'lib/auth-api.ts'
for path in (schema, approvals, auth):
    if not path.exists():
        raise SystemExit('STOP: Missing required source: ' + str(path))
for path in (issuance, execution):
    if path.exists():
        raise SystemExit('STOP: Endpoint already exists: ' + str(path))
sql = schema.read_text(encoding='utf-8-sig')
for name in ('directive_issuances', 'directive_issuance_events', 'directive_execution_items', 'directive_execution_events', 'directive_issuance_requires_approval'):
    if name not in sql:
        raise SystemExit('STOP: Unexpected 0009 schema: ' + name)

common = r'''import { env } from 'cloudflare:workers';
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
'''

iss = common + r'''
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
'''

exe = common + r'''
// TEAM360_V52C_EXECUTIONS
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
    if (!member || !iss || !await taskAccess(db, workspaceId, iss.task_id, user.userId, member.role))
      return respond({ error: 'Không có quyền truy cập.' }, 403);
    const rows = await db.prepare(
      'SELECT * FROM directive_execution_items WHERE issuance_id=? ORDER BY created_at DESC LIMIT 100'
    ).bind(issuanceId).all<{assignee_id:string;id:string}>();
    const items = isLeader(member.role) ? (rows.results||[]) :
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
        'AND (? = assignee_id OR EXISTS (SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=? ' +
        "AND status='active' AND role IN ('admin','leader')))"
      ).bind(status,now,itemId,issuanceId,item.status,issuanceId,workspaceId,user.userId,workspaceId,user.userId),
      db.prepare(
        'INSERT INTO directive_execution_events (id,execution_item_id,action,actor_id,note,created_at) ' +
        'VALUES (?,(SELECT id FROM directive_execution_items WHERE id=? AND issuance_id=? AND status=? AND updated_at=?),?,?,?)'
      ).bind(eventId,itemId,issuanceId,status,now,action,user.userId,b.note||null,now),
    ]);
    if (result[0]?.meta?.changes!==1 || result[1]?.meta?.changes!==1)
      return respond({error:'Trạng thái đã thay đổi, vui lòng tải lại.'},409);
    return respond({itemId,status,updatedAt:now});
  } catch { return respond({error:'Không cập nhật được tiến độ. Vui lòng tải lại.'},409); }
}
'''

for content in (iss, exe):
    for marker in ('getChatGPTUser()', 'validWriteOrigin(req)', 'db.batch([', 'membership(', 'SOURCE_D1'):
        if marker == 'SOURCE_D1': continue
        if marker not in content: raise SystemExit('STOP: missing ' + marker)
# Backup manifest, not modifying other project files.
backup = root / 'backups/v52c'
backup.mkdir(parents=True,exist_ok=True)
stamp=datetime.now().strftime('%Y%m%d-%H%M%S-%f')
manifest=backup/f'v52c-source-verification-{stamp}.txt'
manifest.write_text('V5.2C: API creation only. Existing files untouched.\n'+ '\n'.join(str(p) for p in (schema,approvals,auth))+'\n',encoding='utf-8')
try:
    issuance.parent.mkdir(parents=True, exist_ok=True)
    execution.parent.mkdir(parents=True, exist_ok=True)
    issuance.write_text(iss, encoding='utf-8')
    execution.write_text(exe, encoding='utf-8')
except Exception:
    issuance.unlink(missing_ok=True)
    execution.unlink(missing_ok=True)
    raise
print('ISSUANCE API:', issuance)
print('EXECUTION API:', execution)
print('SOURCE VERIFICATION:',manifest)
print('EXISTING SOURCE: UNCHANGED')
print('LOCAL/REMOTE D1: NOT ACCESSED')
print('V5.2C API FILES CREATED')
