import { usersTable } from '@/shared/database/schemas/users.schema.js';

export type Users = typeof usersTable.$inferSelect;
