import { injectable } from 'tsyringe';
import { eq, and } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { usersTable, type User, type NewUser } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class UserRepository extends BaseRepository<typeof usersTable, User, NewUser> {
  constructor() {
    super(usersTable);
  }

  async findByEmail(tenantId: number, email: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.tenantId, tenantId), eq(usersTable.email, email)))
      .limit(1);
    return row ?? null;
  }

  async findFirstByEmail(email: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return row ?? null;
  }
}
