import { pgTable, varchar, uuid, boolean, text, timestamp, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';
import { idColumn, timestamps, isActiveColumn } from './_shared.columns.js';
import { tenantsTable, organizationsTable, branchesTable, departmentsTable } from './multi-tenancy.schema.js';

/**
 * Users — one identity row per human who can log in. Every module-specific
 * "user" (employee, CRM rep, portal customer, ...) is a *profile* table that
 * foreign-keys back to this table's id, exactly as sketched in the brief:
 *
 *   users(id=1)
 *     -> employees(userId=1, tenantId, organizationId, ...)
 *     -> crm profile (userId=1, tenantId, ...)
 *
 * This keeps auth/identity single-sourced while letting each module attach
 * its own domain-specific columns without bloating the users table.
 */
export const usersTable = pgTable(
  'users',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    branchId: uuid('branch_id').references(() => branchesTable.id, { onDelete: 'set null' }),

    // better-auth compatible core identity fields
    name: varchar('name', { length: 150 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    passwordHash: text('password_hash'),

    userName: varchar('user_name', { length: 60 }),
    phone: varchar('phone', { length: 30 }),
    phoneVerified: boolean('phone_verified').default(false).notNull(),

    isActive: isActiveColumn(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    tenantEmailIdx: uniqueIndex('users_tenant_email_idx').on(t.tenantId, t.email),
    tenantIdx: index('users_tenant_idx').on(t.tenantId),
  }),
);

/** Employees — HR profile attached to a user, scoped to org/branch/department. */
export const employeesTable = pgTable(
  'employees',
  {
    id: idColumn(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branchesTable.id, { onDelete: 'set null' }),
    departmentId: uuid('department_id').references(() => departmentsTable.id, { onDelete: 'set null' }),
    employeeCode: varchar('employee_code', { length: 30 }),
    designation: varchar('designation', { length: 100 }),
    reportingManagerId: uuid('reporting_manager_id'),
    dateOfJoining: timestamp('date_of_joining', { withTimezone: true }),
    employmentType: varchar('employment_type', { length: 30 }).default('full_time'),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({
    userIdx: uniqueIndex('employees_user_idx').on(t.userId),
    tenantIdx: index('employees_tenant_idx').on(t.tenantId),
  }),
);

/** Contacts — external people (CRM leads/customers/vendors), optionally linked to a portal user. */
export const contactsTable = pgTable(
  'contacts',
  {
    id: idColumn(),
    userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    contactType: varchar('contact_type', { length: 30 }).default('lead'), // lead | customer | vendor | partner
    ownerUserId: uuid('owner_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('contacts_tenant_idx').on(t.tenantId) }),
);

/** Teams — arbitrary groupings of users for collaboration / assignment. */
export const teamsTable = pgTable(
  'teams',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    leadUserId: uuid('lead_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('teams_tenant_idx').on(t.tenantId) }),
);

export const teamMembersTable = pgTable(
  'team_members',
  {
    teamId: uuid('team_id').notNull().references(() => teamsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.teamId, t.userId] }) }),
);

/** Groups — used primarily for RBAC role assignment at scale (assign a role to a group, not per-user). */
export const groupsTable = pgTable(
  'groups',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('groups_tenant_idx').on(t.tenantId) }),
);

export const groupMembersTable = pgTable(
  'group_members',
  {
    groupId: uuid('group_id').notNull().references(() => groupsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.groupId, t.userId] }) }),
);

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Employee = typeof employeesTable.$inferSelect;
export type NewEmployee = typeof employeesTable.$inferInsert;
export type Contact = typeof contactsTable.$inferSelect;
export type Team = typeof teamsTable.$inferSelect;
export type Group = typeof groupsTable.$inferSelect;
