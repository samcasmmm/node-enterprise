import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  userName: varchar('user_name', { length: 50 }).notNull(),
  password: varchar('password', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
