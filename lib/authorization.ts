export type WorkspaceRole =
  | 'admin'
  | 'leader'
  | 'manager'
  | 'member'
  | 'viewer';

export type WorkspaceAction =
  | 'workspace.manage'
  | 'members.manage'
  | 'tasks.create'
  | 'tasks.read'
  | 'tasks.update'
  | 'tasks.approve'
  | 'tasks.delete';

const permissions: Record<
  WorkspaceRole,
  readonly WorkspaceAction[]
> = {
  admin: [
    'workspace.manage',
    'members.manage',
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.approve',
    'tasks.delete',
  ],
  leader: [
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.approve',
  ],
  manager: [
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.approve',
  ],
  member: [
    'tasks.read',
    'tasks.update',
  ],
  viewer: [
    'tasks.read',
  ],
};

export function hasPermission(
  role: WorkspaceRole,
  action: WorkspaceAction,
): boolean {
  return permissions[role]?.includes(action) ?? false;
}
