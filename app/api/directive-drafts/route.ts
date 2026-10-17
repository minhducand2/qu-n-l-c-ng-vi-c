import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validWriteOrigin, isJsonRequest } from '../../../lib/auth-api';

type Role = 'admin' | 'leader' | 'manager' | 'member' | 'viewer';
type Member = { role: Role; status: string };

type TaskRow = {
  id: string;
  workspace_id: string;
  assigned_to: string | null;
  created_by: string;
  archived: number;
};

type DraftRow = {
  id: string;
  workspace_id: string;
  task_id: string;
  title: string;
  body: string;
  status: string;
  version: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type VersionRow = {
  draft_id: string;
  version: number;
  title: string;
  body: string;
  edited_by: string;
  edited_at: string;
};

const validId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-zA-Z0-9_-]{1,100}$/.test(value);

const leaders = new Set<Role>(['admin', 'leader']);

const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

function canRead(role: Role, userId: string, task: TaskRow) {
  return leaders.has(role) ||
    task.assigned_to === userId ||
    (role === 'manager' && task.created_by === userId);
}

function canEdit(role: Role, userId: string, task: TaskRow) {
  return leaders.has(role) ||
    (role === 'manager' && task.created_by === userId) ||
    (role === 'member' && task.assigned_to === userId);
}

function canAccessDraft(
  role: Role,
  userId: string,
  draft: DraftRow,
) {
  return leaders.has(role) || draft.created_by === userId;
}

async function context(
  db: D1Database,
  workspaceId: string,
  taskId: string,
  userId: string,
) {
  const member = await db.prepare(
    "SELECT role,status FROM memberships " +
    "WHERE workspace_id=? AND user_id=? AND status='active'"
  ).bind(workspaceId, userId).first<Member>();

  if (!member || ![
    'admin', 'leader', 'manager', 'member', 'viewer'
  ].includes(member.role)) {
    return null;
  }

  const task = await db.prepare(
    'SELECT id,workspace_id,assigned_to,created_by,archived ' +
    'FROM shared_tasks WHERE id=? AND workspace_id=? AND archived=0'
  ).bind(taskId, workspaceId).first<TaskRow>();

  if (!task || !canRead(member.role, userId, task)) {
    return null;
  }

  return { role: member.role, task };
}

async function readBody(req: Request) {
  if (!isJsonRequest(req)) return null;

  const raw = await req.text();
  if (raw.length > 50000) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
}

function validText(body: Record<string, unknown>) {
  return typeof body.title === 'string' &&
    body.title.trim().length > 0 &&
    body.title.trim().length <= 200 &&
    typeof body.body === 'string' &&
    body.body.trim().length > 0 &&
    body.body.length <= 30000;
}

// TEAM360_DIRECTIVE_API_V50B
// GET: Read drafts belonging to a task, optionally with version history.
export async function GET(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui l?ng ??ng nh?p.' }, 401);

  const params = new URL(req.url).searchParams;
  const workspaceId = params.get('workspaceId');
  const taskId = params.get('taskId');
  const draftId = params.get('draftId');

  if (!validId(workspaceId) || !validId(taskId) ||
    (draftId !== null && !validId(draftId))) {
    return reply({ error: 'ID kh?ng h?p l?.' }, 400);
  }

  try {
    const db = env.DB as D1Database;
    const access = await context(
      db, workspaceId, taskId, user.userId,
    );

    if (!access) {
      return reply({ error: 'Kh?ng c? quy?n truy c?p.' }, 403);
    }

    if (draftId) {
      const draft = await db.prepare(
        'SELECT * FROM directive_drafts ' +
        'WHERE id=? AND workspace_id=? AND task_id=?'
      ).bind(draftId, workspaceId, taskId).first<DraftRow>();

      if (!draft || !canAccessDraft(
        access.role, user.userId, draft,
      )) {
        return reply({ error: 'Kh?ng t?m th?y d? th?o.' }, 404);
      }

      const versions = await db.prepare(
        'SELECT draft_id,version,title,body,edited_by,edited_at ' +
        'FROM directive_draft_versions ' +
        'WHERE draft_id=? ORDER BY version DESC LIMIT 100'
      ).bind(draft.id).all<VersionRow>();

      return reply({
        draft,
        versions: versions.results || [],
      });
    }

    const results = await db.prepare(
      'SELECT * FROM directive_drafts ' +
      'WHERE workspace_id=? AND task_id=? ' +
      'ORDER BY updated_at DESC LIMIT 100'
    ).bind(workspaceId, taskId).all<DraftRow>();

    const drafts = (results.results || []).filter(
      draft => canAccessDraft(
        access.role, user.userId, draft,
      ),
    );

    return reply({ drafts });
  } catch {
    return reply({
      error: 'Kh?ng th? t?i d? th?o. Ki?m tra migration 0006.',
    }, 500);
  }
}

// POST: Create a draft and its initial immutable revision.
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui l?ng ??ng nh?p.' }, 401);
  if (!validWriteOrigin(req)) {
    return reply({ error: 'Ngu?n y?u c?u kh?ng h?p l?.' }, 403);
  }

  const body = await readBody(req);

  if (!body || !validId(body.workspaceId) ||
    !validId(body.taskId) || !validText(body)) {
    return reply({ error: 'D? li?u d? th?o kh?ng h?p l?.' }, 400);
  }

  const workspaceId = body.workspaceId as string;
  const taskId = body.taskId as string;
  const title = (body.title as string).trim();
  const content = body.body as string;

  try {
    const db = env.DB as D1Database;
    const access = await context(
      db, workspaceId, taskId, user.userId,
    );

    if (!access || !canEdit(
      access.role, user.userId, access.task,
    )) {
      return reply({ error: 'Kh?ng c? quy?n t?o d? th?o.' }, 403);
    }

    const id = 'dir_' + crypto.randomUUID().replace(/-/g, '');
    const now = new Date().toISOString();

    await db.batch([
      db.prepare(
        'INSERT INTO directive_drafts ' +
        '(id,workspace_id,task_id,title,body,status,version,' +
        'created_by,updated_by,created_at,updated_at) ' +
        "VALUES (?,?,?,?,?,'draft',1,?,?,?,?)"
      ).bind(
        id, workspaceId, taskId, title, content,
        user.userId, user.userId, now, now,
      ),
      db.prepare(
        'INSERT INTO directive_draft_versions ' +
        '(draft_id,version,title,body,edited_by,edited_at) ' +
        'VALUES (?,1,?,?,?,?)'
      ).bind(id, title, content, user.userId, now),
    ]);

    return reply({
      id,
      workspaceId,
      taskId,
      version: 1,
      status: 'draft',
      updatedAt: now,
    }, 201);
  } catch {
    return reply({ error: 'Kh?ng th? t?o d? th?o.' }, 500);
  }
}

// PATCH: Compare-and-swap revision update with atomic history insertion.
export async function PATCH(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui l?ng ??ng nh?p.' }, 401);
  if (!validWriteOrigin(req)) {
    return reply({ error: 'Ngu?n y?u c?u kh?ng h?p l?.' }, 403);
  }

  const body = await readBody(req);

  if (!body || !validId(body.workspaceId) ||
    !validId(body.taskId) || !validId(body.draftId) ||
    !validText(body) ||
    !Number.isSafeInteger(body.version) ||
    (body.version as number) < 1) {
    return reply({ error: 'D? li?u c?p nh?t kh?ng h?p l?.' }, 400);
  }

  const workspaceId = body.workspaceId as string;
  const taskId = body.taskId as string;
  const draftId = body.draftId as string;
  const expectedVersion = body.version as number;
  const title = (body.title as string).trim();
  const content = body.body as string;

  try {
    const db = env.DB as D1Database;
    const access = await context(
      db, workspaceId, taskId, user.userId,
    );

    if (!access || !canEdit(
      access.role, user.userId, access.task,
    )) {
      return reply({ error: 'Kh?ng c? quy?n s?a d? th?o.' }, 403);
    }

    const draft = await db.prepare(
      'SELECT * FROM directive_drafts ' +
      'WHERE id=? AND workspace_id=? AND task_id=?'
    ).bind(draftId, workspaceId, taskId).first<DraftRow>();

    if (!draft || !canAccessDraft(
      access.role, user.userId, draft,
    )) {
      return reply({ error: 'Kh?ng t?m th?y d? th?o.' }, 404);
    }

    if (draft.status !== 'draft') {
      return reply({
        error: 'Ch? ???c s?a d? th?o ch?a tr?nh duy?t.',
      }, 409);
    }

    if (draft.version !== expectedVersion) {
      return reply({
        error: 'D? th?o ?? c? phi?n b?n m?i. H?y t?i l?i tr??c khi s?a.',
        currentVersion: draft.version,
      }, 409);
    }

    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;

    // D1 batch runs transactionally. The history INSERT is gated by
    // the exact version and unique update token written by the UPDATE.
    const results = await db.batch([
      db.prepare(
        'UPDATE directive_drafts ' +
        'SET title=?,body=?,version=?,updated_by=?,updated_at=? ' +
        "WHERE id=? AND workspace_id=? AND task_id=? " +
        "AND status='draft' AND version=?"
      ).bind(
        title, content, nextVersion, user.userId, now,
        draftId, workspaceId, taskId, expectedVersion,
      ),
      db.prepare(
        'INSERT INTO directive_draft_versions ' +
        '(draft_id,version,title,body,edited_by,edited_at) ' +
        'SELECT id,version,title,body,updated_by,updated_at ' +
        'FROM directive_drafts ' +
        'WHERE id=? AND workspace_id=? AND task_id=? ' +
        'AND version=? AND updated_by=? AND updated_at=?'
      ).bind(
        draftId, workspaceId, taskId,
        nextVersion, user.userId, now,
      ),
    ]);

    const updatedCount = results[0]?.meta?.changes ?? 0;
    const historyCount = results[1]?.meta?.changes ?? 0;

    if (updatedCount === 0 && historyCount === 0) {
      return reply({
        error: 'D? th?o ?? thay ??i. H?y t?i l?i phi?n b?n m?i nh?t.',
        conflict: true,
      }, 409);
    }

    if (updatedCount !== 1 || historyCount !== 1) {
      return reply({
        error: 'K?t qu? ghi d? li?u kh?ng nh?t qu?n. Vui l?ng t?i l?i d? th?o v? ki?m tra l?ch s? tr??c khi th? ti?p.',
      }, 500);
    }

    return reply({
      id: draftId,
      version: nextVersion,
      status: 'draft',
      updatedAt: now,
    });
  } catch {
    return reply({
      error: 'Kh?ng th? c?p nh?t d? th?o.',
    }, 500);
  }
}
