import { injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { sessionsTable, type Session } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class SessionRepository extends BaseRepository<typeof sessionsTable, Session, any> {
  constructor() {
    super(sessionsTable);
  }

  async findByToken(token: string): Promise<Session | null> {
    const [row] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token)).limit(1);
    return row ?? null;
  }
}
