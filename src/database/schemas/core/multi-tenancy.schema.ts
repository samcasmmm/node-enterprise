import {
  pgTable,
  varchar,
  jsonb,
  pgEnum,
  text,
  uniqueIndex,
  index,
  bigint,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps, isActiveColumn } from './_shared.columns.js';

export const tenantStatusEnum = pgEnum('tenant_status', [
  'active',
  'suspended',
  'trial',
  'cancelled',
]);

/**
 * Tenant — top of the hierarchy. One tenant = one customer account of the
 * ERP (could be a single company or a whole group). Every other business
 * table ultimately scopes to a tenantId, directly or via its parent.
 */
export const tenantsTable = pgTable(
  'tenants',
  {
    id: idColumn(),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(),
    domain: varchar('domain', { length: 255 }),
    status: tenantStatusEnum('status').default('trial').notNull(),
    settings: jsonb('settings').default({}),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({
    slugIdx: uniqueIndex('tenants_slug_idx').on(t.slug),
    domainIdx: uniqueIndex('tenants_domain_idx').on(t.domain),
  }),
);

/**
 * Organization — a legal entity / company under a tenant. A tenant can hold
 * multiple organizations (group of companies scenario).
 */
export const organizationsTable = pgTable(
  'organizations',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    legalName: varchar('legal_name', { length: 200 }),
    registrationNumber: varchar('registration_number', { length: 100 }),
    taxId: varchar('tax_id', { length: 100 }),
    industry: varchar('industry', { length: 100 }),
    logoUrl: text('logo_url'),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('organizations_tenant_idx').on(t.tenantId) }),
);

/** Branch — a physical/operational location under an organization. */
export const branchesTable = pgTable(
  'branches',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: bigint('organization_id', { mode: 'number' })
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 30 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),
    timezone: varchar('timezone', { length: 60 }).default('UTC'),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ orgIdx: index('branches_org_idx').on(t.organizationId) }),
);

/** Business Unit — cuts across branches (e.g. "Retail", "Wholesale"). */
export const businessUnitsTable = pgTable(
  'business_units',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: bigint('organization_id', { mode: 'number' })
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 30 }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ orgIdx: index('business_units_org_idx').on(t.organizationId) }),
);

/** Department — organizational sub-division, usually within a branch. */
export const departmentsTable = pgTable(
  'departments',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: bigint('organization_id', { mode: 'number' })
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    branchId: bigint('branch_id', { mode: 'number' }).references(() => branchesTable.id, {
      onDelete: 'set null',
    }),
    parentDepartmentId: bigint('parent_department_id', { mode: 'number' }),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 30 }),
    headUserId: bigint('head_user_id', { mode: 'number' }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ orgIdx: index('departments_org_idx').on(t.organizationId) }),
);

/** Cost Center — financial allocation unit, may map 1:1 with a department. */
export const costCentersTable = pgTable(
  'cost_centers',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: bigint('organization_id', { mode: 'number' })
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    departmentId: bigint('department_id', { mode: 'number' }).references(
      () => departmentsTable.id,
      { onDelete: 'set null' },
    ),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 30 }).notNull(),
    budget: varchar('budget', { length: 30 }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ orgIdx: index('cost_centers_org_idx').on(t.organizationId) }),
);

/** Workspace — logical, user-facing grouping (a "space" a team works in). */
export const workspacesTable = pgTable(
  'workspaces',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    organizationId: bigint('organization_id', { mode: 'number' }).references(
      () => organizationsTable.id,
      { onDelete: 'cascade' },
    ),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(),
    ownerUserId: bigint('owner_user_id', { mode: 'number' }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ tenantSlugIdx: uniqueIndex('workspaces_tenant_slug_idx').on(t.tenantId, t.slug) }),
);

export type Tenant = typeof tenantsTable.$inferSelect;
export type NewTenant = typeof tenantsTable.$inferInsert;
export type Organization = typeof organizationsTable.$inferSelect;
export type NewOrganization = typeof organizationsTable.$inferInsert;
export type Branch = typeof branchesTable.$inferSelect;
export type BusinessUnit = typeof businessUnitsTable.$inferSelect;
export type Department = typeof departmentsTable.$inferSelect;
export type CostCenter = typeof costCentersTable.$inferSelect;
export type Workspace = typeof workspacesTable.$inferSelect;
