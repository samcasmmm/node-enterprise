import { db } from '@/config/db.config.js';
import { usersTable } from '@/database/index.js';
import { eq } from 'drizzle-orm';

export async function getUserById(id: number) {
  const result = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return result[0] || null;
}
