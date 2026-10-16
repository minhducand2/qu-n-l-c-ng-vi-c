import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';

type Workspace = { id: string; name: string; role: string };
type Row = { id: string; workspace_id: string; data: string; assigned_to: string | null; created_by: string; version: number; updated_at: string };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });

// The user ID is always resolved by trusted authentication, never accepted from a URL.
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Vui lòng đăng nhập.' }, 401);
  try {
    const db = env.DB as D1Database;
    const memberships = await db.prepare(`
      SELECT w.id, w.name, m.role
      FROM workspaces w JOIN memberships m ON m.workspace_id = w.id
      WHERE m.user_id = ? AND m.status = 'active'
      ORDER BY w.name
    `).bind(user.userId).all<Workspace>();
    const workspaces = memberships.results ?? [];
    const items: Array<Record<string, unknown>> = [];
    for (const w of workspaces) {
      const reviewer = w.role === 'admin' || w.role === 'leader';
      // The query scopes all records to an active membership and to tasks
      // assigned to/created by this user or awaiting their authorized review.
      const rows = await db.prepare(`
        SELECT id, workspace_id, data, assigned_to, created_by, version, updated_at
        FROM shared_tasks
        WHERE workspace_id = ? AND archived = 0
          AND (assigned_to = ? OR created_by = ?
            OR (? = 1 AND json_extract(data, '$.status') = 'Chờ duyệt'))
        ORDER BY updated_at DESC LIMIT 1000
      `).bind(w.id, user.userId, user.userId, reviewer ? 1 : 0).all<Row>();
      for (const t of rows.results ?? []) {
        const task = JSON.parse(t.data) as Record<string, unknown>;
        const assigned = t.assigned_to === user.userId;
        const created = t.created_by === user.userId;
        const awaitingReview = reviewer && task.status === 'Chờ duyệt';
        if (!assigned && !created && !awaitingReview) continue;
        items.push({ ...task, id: t.id, workspaceId: t.workspace_id, workspaceName: w.name,
          workspaceRole: w.role, assignedTo: t.assigned_to, createdBy: t.created_by,
          version: t.version, updatedAt: t.updated_at, assigned, created, awaitingReview });
      }
    }
    return json({ tasks: items, workspaceCount: workspaces.length });
  } catch {
    return json({ error: 'Không thể tải công việc của tôi.' }, 500);
  }
}
