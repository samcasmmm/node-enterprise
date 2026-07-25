import { pgTable, varchar, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { idColumn } from './_shared.columns.js';
import { tenantsTable } from './multi-tenancy.schema.js';
import { usersTable } from './users.schema.js';

/**
 * Audit Logs — immutable, append-only record of who did what to which
 * entity. Written by AuditLogService, called from BaseService hooks so every
 * module (including future HRMS/CRM ones) gets this for free.
 */
export const auditLogsTable = pgTable('audit_logs', {
  id: idColumn(),
  tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'set null' }),
  actorUserId: uuid('actor_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 60 }).notNull(), // create | update | delete | login | ...
  entityType: varchar('entity_type', { length: 100 }).notNull(), // e.g. 'user', 'hrms.employee'
  entityId: varchar('entity_id', { length: 100 }),
  before: jsonb('before'),
  after: jsonb('after'),
  ipAddress: varchar('ip_address', { length: 60 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  tenantIdx: index('audit_logs_tenant_idx').on(t.tenantId),
  entityIdx: index('audit_logs_entity_idx').on(t.entityType, t.entityId),
}));

/** Activity Logs — human-readable feed ("Jane created Invoice #123"), lighter than audit logs. */
export const activityLogsTable = pgTable('activity_logs', {
  id: idColumn(),
  tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'set null' }),
  actorUserId: uuid('actor_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  moduleKey: varchar('module_key', { length: 80 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ tenantIdx: index('activity_logs_tenant_idx').on(t.tenantId) }));

/** Login Logs — every authentication attempt, success or failure. */
export const loginLogsTable = pgTable('login_logs', {
  id: idColumn(),
  tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }),
  success: varchar('success', { length: 10 }).notNull(), // 'true' | 'false' (kept text for easy filtering export)
  reason: varchar('reason', { length: 150 }), // e.g. 'invalid_password', 'mfa_required'
  ipAddress: varchar('ip_address', { length: 60 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ userIdx: index('login_logs_user_idx').on(t.userId) }));

/** Change History — field-level before/after diff, useful for entities needing granular rollback/compliance trails. */
export const changeHistoryTable = pgTable('change_history', {
  id: idColumn(),
  tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'set null' }),
  actorUserId: uuid('actor_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ entityIdx: index('change_history_entity_idx').on(t.entityType, t.entityId) }));

/** Error Logs — application errors captured for support/debugging (separate from infra logs/Sentry). */
export const errorLogsTable = pgTable('error_logs', {
  id: idColumn(),
  tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  stack: text('stack'),
  path: varchar('path', { length: 255 }),
  statusCode: varchar('status_code', { length: 10 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ tenantIdx: index('error_logs_tenant_idx').on(t.tenantId) }));

/** Security Logs — sensitive security events (MFA changes, permission escalation, API key creation, ...). */
export const securityLogsTable = pgTable('security_logs', {
  id: idColumn(),
  tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'set null' }),
  actorUserId: uuid('actor_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  event: varchar('event', { length: 100 }).notNull(), // e.g. 'mfa_enabled', 'role_escalated', 'api_key_created'
  severity: varchar('severity', { length: 20 }).default('info').notNull(), // info | warning | critical
  metadata: jsonb('metadata').default({}),
  ipAddress: varchar('ip_address', { length: 60 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ tenantIdx: index('security_logs_tenant_idx').on(t.tenantId) }));

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type NewAuditLog = typeof auditLogsTable.$inferInsert;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type LoginLog = typeof loginLogsTable.$inferSelect;
export type ChangeHistory = typeof changeHistoryTable.$inferSelect;
export type ErrorLog = typeof errorLogsTable.$inferSelect;
export type SecurityLog = typeof securityLogsTable.$inferSelect;
