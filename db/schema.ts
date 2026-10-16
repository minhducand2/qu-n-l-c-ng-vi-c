import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

// Existing personal records: intentionally unchanged.
export const records = sqliteTable('records', {
 key: text('key').primaryKey(), owner: text('owner').notNull(), kind: text('kind').notNull(),
 data: text('data').notNull(), version: integer('version').notNull().default(1), updated: text('updated').notNull()
}, t => [index('owner_kind_idx').on(t.owner,t.kind)]);

export const workspaces = sqliteTable('workspaces', {
 id: text('id').primaryKey(), name: text('name').notNull(), createdBy: text('created_by').notNull(),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull()
});
export const memberships = sqliteTable('memberships', {
 workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
 userId: text('user_id').notNull(),
 role: text('role', {enum:['admin','leader','manager','member','viewer']}).notNull(),
 status: text('status', {enum:['active','suspended']}).notNull().default('active'),
 joinedAt: text('joined_at').notNull()
}, t => [
 primaryKey({columns:[t.workspaceId,t.userId]}),
 index('memberships_user_idx').on(t.userId),
 index('memberships_role_idx').on(t.workspaceId,t.role)
]);
export const sharedTasks = sqliteTable('shared_tasks', {
 id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
 title: text('title').notNull(), data: text('data').notNull(), assignedTo: text('assigned_to'),
 createdBy: text('created_by').notNull(), version: integer('version').notNull().default(1),
 archived: integer('archived').notNull().default(0), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull()
}, t => [index('shared_tasks_workspace_idx').on(t.workspaceId,t.archived,t.updatedAt),index('shared_tasks_assignee_idx').on(t.workspaceId,t.assignedTo)]);
export const sharedTaskAudit = sqliteTable('shared_task_audit', {
 id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
 taskId: text('task_id').notNull().references(() => sharedTasks.id), actorId: text('actor_id').notNull(),
 action: text('action').notNull(), beforeData: text('before_data'), afterData: text('after_data').notNull(), createdAt: text('created_at').notNull()
}, t => [index('shared_task_audit_task_idx').on(t.workspaceId,t.taskId,t.createdAt)]);
