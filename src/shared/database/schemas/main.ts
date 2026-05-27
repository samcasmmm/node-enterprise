import { pgTable, serial, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const tenantDatabases = pgTable('tenant_databases', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  databaseName: varchar('database_name', { length: 255 }).notNull(),
  host: varchar('host', { length: 255 }),
  port: integer('port'),
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export type TenantDatabase = typeof tenantDatabases.$inferSelect;
export type NewTenantDatabase = typeof tenantDatabases.$inferInsert;
