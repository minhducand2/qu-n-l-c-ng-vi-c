
import type {
  WorkspaceRole,
  WorkspaceAction,
} from './authorization';

import { hasPermission } from './authorization';

const VALID_ROLES: WorkspaceRole[] = [
  'admin',
  'leader',
  'manager',
  'member',
  'viewer',
];

export class AccessDeniedError extends Error {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export type WorkspaceMembership = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: 'active';
};

export async function getActiveMembership(
  db: D1Database,
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMembership | null> {
  if (!userId || !workspaceId) return null;

  const row = await db.prepare(`
    SELECT workspace_id, user_id, role, status
    FROM memberships
    WHERE workspace_id = ?
      AND user_id = ?
      AND status = 'active'
    LIMIT 1
  `).bind(workspaceId, userId).first<{
    workspace_id: string;
    user_id: string;
    role: string;
    status: string;
  }>();

  if (!row || !VALID_ROLES.includes(row.role as WorkspaceRole)) {
    return null;
  }

  return {
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role as WorkspaceRole,
    status: 'active',
  };
}

export async function requireWorkspacePermission(
  db: D1Database,
  userId: string,
  workspaceId: string,
  action: WorkspaceAction,
): Promise<WorkspaceMembership> {
  const membership = await getActiveMembership(
    db,
    userId,
    workspaceId,
  );

  if (!membership) {
    throw new AccessDeniedError(
      'Bạn không phải thành viên đang hoạt động của tổ chức.',
    );
  }

  if (!hasPermission(membership.role, action)) {
    throw new AccessDeniedError();
  }

  return membership;
}
