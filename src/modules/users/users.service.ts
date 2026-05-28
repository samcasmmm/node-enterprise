import { db } from '@/config/db.config.js';
import { tenantUsers as usersTable } from '@/shared/database/index.js';

export async function health(): Promise<any[]> {
  return db.select().from(usersTable);
}
