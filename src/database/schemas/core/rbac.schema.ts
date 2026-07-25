import { pgTable, varchar,  boolean, text, timestamp, integer, jsonb, index, uniqueIndex, primaryKey, pgEnum, bigint } from 'drizzle-orm/pg-core';
import { idColumn, timestamps, isActiveColumn } from './_shared.columns.js';
import { tenantsTable, organizationsTable, branchesTable, departmentsTable } from './multi-tenancy.schema.js';
import { usersTable, groupsTable } from './users.schema.js';

/**
 * Modules catalog — every purchasable module in the ERP (hrms, crm, inventory,
 * accounting, ...) registers itself here once. Access to a module for a given
 * tenant is granted through `moduleAccessTable` when it's purchased via the
 * Subscription module — this is the single gate that turns a module "on".
 */
export const modulesCatalogTable = pgTable('modules_catalog', {
  id: idColumn(),
  key: varchar('key', { length: 80 }).notNull(), // e.g. 'hrms', 'crm', 'inventory'
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  isCore: boolean('is_core').default(false).notNull(), // core modules (this build) are always on
  ...timestamps,
}, (t) => ({ keyIdx: uniqueIndex('modules_catalog_key_idx').on(t.key) }));

/** Permissions — atomic grants, keyed 'module:action' or 'module.sub:action'. */
export const permissionsTable = pgTable('permissions', {
  id: idColumn(),
  moduleKey: varchar('module_key', { length: 80 }).notNull(),
  key: varchar('key', { length: 150 }).notNull(), // e.g. 'user:read', 'hrms.payroll:approve'
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  ...timestamps,
}, (t) => ({ keyIdx: uniqueIndex('permissions_key_idx').on(t.key) }));

/** Permission Groups — bundle permissions for easy assignment (e.g. "HR Manager Bundle"). */
export const permissionGroupsTable = pgTable('permission_groups', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenantsTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  ...timestamps,
});

export const permissionGroupItemsTable = pgTable('permission_group_items', {
  permissionGroupId: bigint('permission_group_id', { mode: 'number' }).notNull().references(() => permissionGroupsTable.id, { onDelete: 'cascade' }),
  permissionId: bigint('permission_id', { mode: 'number' }).notNull().references(() => permissionsTable.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.permissionGroupId, t.permissionId] }) }));

/** Roles — tenant-scoped (or system/global when tenantId is null). */
export const rolesTable = pgTable('roles', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenantsTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(), // built-in roles, not deletable
  isActive: isActiveColumn(),
  ...timestamps,
}, (t) => ({ tenantIdx: index('roles_tenant_idx').on(t.tenantId) }));

export const rolePermissionsTable = pgTable('role_permissions', {
  roleId: bigint('role_id', { mode: 'number' }).notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
  permissionId: bigint('permission_id', { mode: 'number' }).notNull().references(() => permissionsTable.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) }));

/** User <-> Role assignment, optionally narrowed to a branch/department (Branch/Department Scope). */
export const userRolesTable = pgTable('user_roles', {
  id: idColumn(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  roleId: bigint('role_id', { mode: 'number' }).notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
  branchId: bigint('branch_id', { mode: 'number' }).references(() => branchesTable.id, { onDelete: 'cascade' }),
  departmentId: bigint('department_id', { mode: 'number' }).references(() => departmentsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ userIdx: index('user_roles_user_idx').on(t.userId) }));

export const groupRolesTable = pgTable('group_roles', {
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => groupsTable.id, { onDelete: 'cascade' }),
  roleId: bigint('role_id', { mode: 'number' }).notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.groupId, t.roleId] }) }));

/** Policies — ABAC-style conditional rules layered on top of RBAC (jsonb condition, evaluated by AuthorizationService). */
export const policiesTable = pgTable('policies', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenantsTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  permissionKey: varchar('permission_key', { length: 150 }).notNull(),
  effect: varchar('effect', { length: 10 }).default('allow').notNull(), // allow | deny
  condition: jsonb('condition').default({}), // e.g. { "field": "amount", "op": "<=", "value": 5000 }
  priority: integer('priority').default(0).notNull(),
  isActive: isActiveColumn(),
  ...timestamps,
});

/** Module Access — per-tenant entitlement, flipped on by a Subscription purchase. */
export const moduleAccessTable = pgTable('module_access', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
  moduleKey: varchar('module_key', { length: 80 }).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  sourceSubscriptionId: bigint('source_subscription_id', { mode: 'number' }),
}, (t) => ({ tenantModuleIdx: uniqueIndex('module_access_tenant_module_idx').on(t.tenantId, t.moduleKey) }));

/** Feature Access — finer-grained flag within an already-enabled module (per tenant, or per user for betas). */
export const featureAccessTable = pgTable('feature_access', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => usersTable.id, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key', { length: 150 }).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  ...timestamps,
});

export const dataScopeTypeEnum = pgEnum('data_scope_type', ['own', 'team', 'department', 'branch', 'organization', 'all']);

/** Data Scope — how much data a role can see for a given module (row-level visibility). */
export const dataScopeTable = pgTable('data_scopes', {
  id: idColumn(),
  roleId: bigint('role_id', { mode: 'number' }).notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
  moduleKey: varchar('module_key', { length: 80 }).notNull(),
  scope: dataScopeTypeEnum('scope').default('own').notNull(),
  ...timestamps,
}, (t) => ({ roleModuleIdx: uniqueIndex('data_scopes_role_module_idx').on(t.roleId, t.moduleKey) }));

/** Approval Rights — spend/approval limits per role or user for a given process (e.g. PO approval up to 10k). */
export const approvalRightsTable = pgTable('approval_rights', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
  roleId: bigint('role_id', { mode: 'number' }).references(() => rolesTable.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => usersTable.id, { onDelete: 'cascade' }),
  processKey: varchar('process_key', { length: 100 }).notNull(), // e.g. 'purchase_order', 'expense_claim'
  maxAmount: varchar('max_amount', { length: 30 }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  ...timestamps,
});

/** Delegation — user A delegates their permission set/role to user B for a date range (e.g. while on leave). */
export const delegationsTable = pgTable('delegations', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
  delegatorUserId: bigint('delegator_user_id', { mode: 'number' }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  delegateUserId: bigint('delegate_user_id', { mode: 'number' }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  roleId: bigint('role_id', { mode: 'number' }).references(() => rolesTable.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
  isActive: isActiveColumn(),
  ...timestamps,
});

/** Temporary Access — a one-off, time-boxed permission grant outside the normal role structure. */
export const temporaryAccessTable = pgTable('temporary_access', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  permissionKey: varchar('permission_key', { length: 150 }).notNull(),
  grantedByUserId: bigint('granted_by_user_id', { mode: 'number' }).references(() => usersTable.id, { onDelete: 'set null' }),
  reason: text('reason'),
  startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Role = typeof rolesTable.$inferSelect;
export type NewRole = typeof rolesTable.$inferInsert;
export type Permission = typeof permissionsTable.$inferSelect;
export type Policy = typeof policiesTable.$inferSelect;
export type ModuleAccess = typeof moduleAccessTable.$inferSelect;
export type FeatureAccess = typeof featureAccessTable.$inferSelect;
export type DataScope = typeof dataScopeTable.$inferSelect;
export type ApprovalRight = typeof approvalRightsTable.$inferSelect;
export type Delegation = typeof delegationsTable.$inferSelect;
export type TemporaryAccess = typeof temporaryAccessTable.$inferSelect;
