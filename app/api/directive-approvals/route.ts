import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validWriteOrigin, isJsonRequest } from '../../../lib/auth-api';

type Role = 'admin' | 'leader' | 'manager' | 'member' | 'viewer';
type Action = 'submit' | 'approve' | 'reject' | 'resubmit';

type Membership = {
  role: Role;
  status: string;
};

type Task = {
  id: string;
  assigned_to: string | null;
  created_by: string;
};

type Draft = {
  id: string;
  workspace_id: string;
  task_id: string;
  status: string;
  version: number;
  created_by: string;
};

type Approval = {
  draft_id: string;
  status: string;
  submitted_version: number;
  submitted_by: string;
  submitted_at: string;
  reviewer_id: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  workflow_version: number;
  updated_at: string;
};

type EventRow = {
  id: string;
  draft_id: string;
  workflow_version: number;
  action: string;
  actor_id: string;
  reviewer_id: string;
  draft_version: number;
  reason: string | null;
  created_at: string;
};

const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

const validId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[A-Za-z0-9_-]{1,100}$/.test(value);

const leaders = new Set<Role>(['admin', 'leader']);

async function activeMember(
  db: D1Database,
  workspaceId: string,
  userId: string,
): Promise<Membership | null> {
  const row = await db.prepare(
    "SELECT role,status FROM memberships " +
    "WHERE workspace_id=? AND user_id=? AND status='active'"
  ).bind(workspaceId, userId).first<Membership>();

  if (!row || ![
    'admin', 'leader', 'manager', 'member', 'viewer',
  ].includes(row.role)) return null;

  return row;
}

function canRead(role: Role, userId: string, task: Task) {
  return leaders.has(role) ||
    task.assigned_to === userId ||
    (role === 'manager' && task.created_by === userId);
}

function canEdit(role: Role, userId: string, task: Task) {
  return leaders.has(role) ||
    (role === 'manager' && task.created_by === userId) ||
    (role === 'member' && task.assigned_to === userId);
}

async function accessContext(
  db: D1Database,
  workspaceId: string,
  taskId: string,
  draftId: string,
  userId: string,
) {
  const member = await activeMember(db, workspaceId, userId);
  if (!member) return null;

  const task = await db.prepare(
    "SELECT id,assigned_to,created_by FROM shared_tasks " +
    "WHERE id=? AND workspace_id=? AND archived=0"
  ).bind(taskId, workspaceId).first<Task>();

  if (!task || !canRead(member.role, userId, task)) return null;

  const draft = await db.prepare(
    "SELECT id,workspace_id,task_id,status,version,created_by " +
    "FROM directive_drafts " +
    "WHERE id=? AND workspace_id=? AND task_id=?"
  ).bind(draftId, workspaceId, taskId).first<Draft>();

  if (!draft) return null;

  const approval = await db.prepare(
    "SELECT * FROM directive_approvals WHERE draft_id=?"
  ).bind(draftId).first<Approval>();

  return { member, task, draft, approval };
}

async function parseBody(req: Request) {
  if (!isJsonRequest(req)) return null;

  const text = await req.text();
  if (text.length > 4096) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' ||
      Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

const integerVersion = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) && value >= 1;

// TEAM360_DIRECTIVE_APPROVALS_V51C
// TEAM360_APPROVAL_ATOMIC_V51D
// TEAM360_APPROVAL_READ_GUARD_V51F
export async function GET(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui l?ng ??ng nh?p.' }, 401);

  const params = new URL(req.url).searchParams;
  const workspaceId = params.get('workspaceId');
  const taskId = params.get('taskId');
  const draftId = params.get('draftId');

  if (!validId(workspaceId) ||
    !validId(taskId) || !validId(draftId)) {
    return reply({ error: 'ID kh?ng h?p l?.' }, 400);
  }

  try {
    const db = env.DB as D1Database;
    const ctx = await accessContext(
      db, workspaceId, taskId, draftId, user.userId,
    );

    if (!ctx) return reply({ error: 'Kh?ng c? quy?n.' }, 403);

    // Draft creator and workspace leaders may inspect the workflow.
    if (!leaders.has(ctx.member.role) &&
      ctx.draft.created_by !== user.userId) {
      return reply({ error: 'Kh?ng c? quy?n xem quy tr?nh.' }, 403);
    }

    const events = await db.prepare(
      "SELECT id,draft_id,workflow_version,action,actor_id," +
      "reviewer_id,draft_version,reason,created_at " +
      "FROM directive_approval_events " +
      "WHERE draft_id=? ORDER BY workflow_version DESC LIMIT 100"
    ).bind(draftId).all<EventRow>();

    return reply({
      approval: ctx.approval,
      events: events.results || [],
      permissions: {
        canSubmit: canEdit(ctx.member.role, user.userId, ctx.task) &&
          (leaders.has(ctx.member.role) ||
            ctx.draft.created_by === user.userId),
        canDecide: leaders.has(ctx.member.role) &&
          ctx.approval?.status === 'submitted' &&
          ctx.approval.reviewer_id === user.userId &&
          ctx.draft.created_by !== user.userId,
      },
    });
  } catch {
    return reply({ error: 'Kh?ng t?i ???c quy tr?nh.' }, 500);
  }
}

export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Vui l?ng ??ng nh?p.' }, 401);

  if (!validWriteOrigin(req)) {
    return reply({ error: 'Ngu?n y?u c?u kh?ng h?p l?.' }, 403);
  }

  const body = await parseBody(req);

  if (!body ||
    !validId(body.workspaceId) ||
    !validId(body.taskId) ||
    !validId(body.draftId) ||
    !['submit', 'approve', 'reject', 'resubmit'].includes(
      String(body.action)
    ) ||
    !integerVersion(body.draftVersion)) {
    return reply({ error: 'Y?u c?u kh?ng h?p l?.' }, 400);
  }

  const workspaceId = body.workspaceId as string;
  const taskId = body.taskId as string;
  const draftId = body.draftId as string;
  const action = body.action as Action;
  const draftVersion = body.draftVersion as number;

  const workflowVersion = body.workflowVersion;
  const reviewerId = body.reviewerId;
  const reason = body.reason;

  if ((action === 'submit' || action === 'resubmit') &&
    !validId(reviewerId)) {
    return reply({ error: 'Ng??i duy?t kh?ng h?p l?.' }, 400);
  }

  if (action !== 'submit' &&
    !integerVersion(workflowVersion)) {
    return reply({ error: 'Phi?n b?n quy tr?nh kh?ng h?p l?.' }, 400);
  }

  if (reason !== undefined &&
    (typeof reason !== 'string' || reason.length > 2000)) {
    return reply({ error: 'L? do kh?ng h?p l?.' }, 400);
  }

  if (action === 'reject' &&
    (typeof reason !== 'string' || !reason.trim())) {
    return reply({ error: 'T? ch?i ph?i c? l? do.' }, 400);
  }

  try {
    const db = env.DB as D1Database;
    const ctx = await accessContext(
      db, workspaceId, taskId, draftId, user.userId,
    );

    if (!ctx) return reply({ error: 'Kh?ng c? quy?n.' }, 403);

    const { member, task, draft, approval } = ctx;

    if (draft.version !== draftVersion) {
      return reply({
        error: 'N?i dung d? th?o ?? thay ??i. H?y t?i l?i.',
      }, 409);
    }

    const submitting = action === 'submit' || action === 'resubmit';

    if (submitting) {
      if (!canEdit(member.role, user.userId, task) ||
        (!leaders.has(member.role) &&
          draft.created_by !== user.userId)) {
        return reply({ error: 'Kh?ng c? quy?n tr?nh duy?t.' }, 403);
      }

      const reviewer = await activeMember(
        db, workspaceId, reviewerId as string,
      );

      if (!reviewer || !leaders.has(reviewer.role) ||
        reviewerId === draft.created_by ||
        reviewerId === user.userId) {
        return reply({
          error: 'Ng??i duy?t ph?i l? l?nh ??o h?p l? v? ??c l?p.',
        }, 400);
      }
    } else {
      if (!approval || approval.status !== 'submitted') {
        return reply({ error: 'D? th?o kh?ng ? tr?ng th?i ch? duy?t.' }, 409);
      }

      if (!leaders.has(member.role) ||
        approval.reviewer_id !== user.userId ||
        draft.created_by === user.userId) {
        return reply({ error: 'Kh?ng c? quy?n quy?t ??nh.' }, 403);
      }

      if (approval.submitted_version !== draft.version) {
        return reply({ error: 'Phi?n b?n tr?nh duy?t ?? thay ??i.' }, 409);
      }
    }

    const now = new Date().toISOString();
    const eventId = 'drev_' +
      crypto.randomUUID().replace(/-/g, '');

    if (action === 'submit') {
      if (approval) {
        return reply({ error: 'Quy tr?nh ?? t?n t?i.' }, 409);
      }

      await db.batch([
        db.prepare(
          "INSERT INTO directive_approvals " +
          "(draft_id,status,submitted_version,submitted_by," +
          "submitted_at,reviewer_id,workflow_version,updated_at) " +
          "SELECT id,'submitted',version,?,?,?,?,? " +
          "FROM directive_drafts " +
          "WHERE id=? AND version=? AND status='draft' " +
          "AND NOT EXISTS (" +
          "SELECT 1 FROM directive_approvals WHERE draft_id=?)"
        ).bind(
          user.userId, now, reviewerId, 1, now,
          draftId, draftVersion, draftId,
        ),
        db.prepare(
          "INSERT INTO directive_approval_events " +
          "(id,draft_id,workflow_version,action,actor_id," +
          "reviewer_id,draft_version,created_at) " +
          "VALUES (?,(" +
          "SELECT draft_id FROM directive_approvals " +
          "WHERE draft_id=? AND status='submitted' " +
          "AND workflow_version=1 AND submitted_by=? " +
          "AND submitted_version=?" +
          "),1,'submit',?,?,?,?)"
        ).bind(
          eventId, draftId, user.userId, draftVersion,
          user.userId, reviewerId, draftVersion, now,
        ),
      ]);

    } else {
      if (!approval || approval.workflow_version !== workflowVersion) {
        return reply({ error: 'Quy tr?nh ?? thay ??i.' }, 409);
      }

      if (action === 'resubmit') {
        if (approval.status !== 'rejected') {
          return reply({ error: 'Ch? tr?nh l?i b?n b? t? ch?i.' }, 409);
        }

        if (draft.version <= approval.submitted_version) {
          return reply({
            error: 'H?y ch?nh s?a v? l?u phi?n b?n m?i tr??c khi tr?nh l?i.',
          }, 409);
        }
      }

      const nextVersion = approval.workflow_version + 1;
      const nextStatus = action === 'resubmit'
        ? 'submitted'
        : action === 'approve' ? 'approved' : 'rejected';

      const assignedReviewer = action === 'resubmit'
        ? reviewerId as string : approval.reviewer_id;

      const decisionActor = action === 'resubmit'
        ? null : user.userId;

      const decisionTime = action === 'resubmit'
        ? null : now;

      const decisionReason = action === 'reject'
        ? (reason as string).trim() : null;

      const results = await db.batch([
        db.prepare(
          "UPDATE directive_approvals SET " +
          "status=?,submitted_version=?,submitted_by=?," +
          "submitted_at=?,reviewer_id=?,decided_by=?," +
          "decided_at=?,decision_reason=?,workflow_version=?," +
          "updated_at=? " +
          "WHERE draft_id=? AND workflow_version=? AND status=? " +
          "AND submitted_version=? " +
          "AND EXISTS (SELECT 1 FROM directive_drafts " +
          "WHERE id=? AND version=? AND status='draft')"
        ).bind(
          nextStatus,
          action === 'resubmit' ? draftVersion : approval.submitted_version,
          action === 'resubmit' ? user.userId : approval.submitted_by,
          action === 'resubmit' ? now : approval.submitted_at,
          assignedReviewer,
          decisionActor,
          decisionTime,
          decisionReason,
          nextVersion,
          now,
          draftId,
          approval.workflow_version,
          action === 'resubmit' ? 'rejected' : 'submitted',
          approval.submitted_version,
          draftId,
          draftVersion,
        ),
        db.prepare(
          "INSERT INTO directive_approval_events " +
          "(id,draft_id,workflow_version,action,actor_id," +
          "reviewer_id,draft_version,reason,created_at) " +
          "VALUES (?,(" +
          "SELECT draft_id FROM directive_approvals " +
          "WHERE draft_id=? AND workflow_version=? " +
          "AND updated_at=? AND status=?" +
          "),?,?,?,?,?,?,?)"
        ).bind(
          eventId,
          draftId,
          nextVersion,
          now,
          nextStatus,
          nextVersion,
          action,
          user.userId,
          assignedReviewer,
          draftVersion,
          decisionReason,
          now,
        ),
      ]);

      if (results[0]?.meta?.changes !== 1 ||
        results[1]?.meta?.changes !== 1) {
        return reply({
          error: 'Quy tr?nh c? th? ?? thay ??i. H?y t?i l?i tr??c khi thao t?c.',
        }, 409);
      }
    }

    const saved = await db.prepare(
      "SELECT * FROM directive_approvals WHERE draft_id=?"
    ).bind(draftId).first<Approval>();

    if (!saved) {
      return reply({ error: 'Kh?ng x?c minh ???c k?t qu?.' }, 500);
    }

    return reply({
      approval: saved,
      message: '?? ghi nh?n thao t?c quy tr?nh.',
    });

  } catch {
    return reply({
      error: 'Kh?ng th?c hi?n ???c thao t?c. H?y t?i l?i tr?ng th?i.',
    }, 500);
  }
}
