import { pgTable, varchar, uuid, boolean, text, jsonb, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './_shared.columns.js';
import { tenantsTable } from './multi-tenancy.schema.js';
import { usersTable } from './users.schema.js';

/**
 * Settings — one flexible key/value store per tenant+category, instead of a
 * dozen near-identical tables. Category maps directly to the sub-modules
 * listed in the brief: general, localization, tax, email, sms, whatsapp,
 * storage, themes, branding, custom_domain. SettingsService exposes typed
 * getters/setters per category on top of this.
 */
export const settingsTable = pgTable(
  'settings',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 60 }).notNull(), // general | localization | tax | email | sms | whatsapp | storage | theme | branding | custom_domain
    key: varchar('key', { length: 150 }).notNull(),
    value: jsonb('value').default({}),
    isSecret: boolean('is_secret').default(false).notNull(), // e.g. SMTP password, API secret — should be encrypted at rest
    ...timestamps,
  },
  (t) => ({
    tenantCategoryKeyIdx: uniqueIndex('settings_tenant_category_key_idx').on(t.tenantId, t.category, t.key),
    tenantIdx: index('settings_tenant_idx').on(t.tenantId),
  }),
);

/** API Keys — programmatic access credentials issued per tenant. */
export const apiKeysTable = pgTable(
  'api_keys',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    createdByUserId: uuid('created_by_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 150 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
    keyHash: text('key_hash').notNull(),
    scopes: jsonb('scopes').default([]),
    lastUsedAt: text('last_used_at'),
    revokedAt: text('revoked_at'),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('api_keys_tenant_idx').on(t.tenantId) }),
);

/** Custom Domains — vanity domain mapped to a tenant, with verification state. */
export const customDomainsTable = pgTable(
  'custom_domains',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    domain: varchar('domain', { length: 255 }).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    verificationToken: varchar('verification_token', { length: 150 }),
    ...timestamps,
  },
  (t) => ({ domainIdx: uniqueIndex('custom_domains_domain_idx').on(t.domain) }),
);

export type Setting = typeof settingsTable.$inferSelect;
export type NewSetting = typeof settingsTable.$inferInsert;
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type CustomDomain = typeof customDomainsTable.$inferSelect;
