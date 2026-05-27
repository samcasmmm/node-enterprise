import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

// --- MAIN DATABASE SCHEMA ---
export const mainDbBooks = pgTable('main_db_books', {
  id: serial('id').primaryKey(),
  bookName: varchar('book_name', { length: 255 }).notNull(),
  bookDb: varchar('book_db', { length: 255 }).notNull(),
});

// --- TENANT DATABASE SCHEMA ---
export const tenantUsers = pgTable('users', {
  id: serial('id').primaryKey(),
  userName: varchar('user_name', { length: 50 }).notNull(),
  password: varchar('password', { length: 50 }).notNull(),
});