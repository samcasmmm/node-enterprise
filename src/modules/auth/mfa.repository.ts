import { injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { mfaFactorsTable, type MfaFactor } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class MfaRepository extends BaseRepository<typeof mfaFactorsTable, MfaFactor, any> {
  constructor() {
    super(mfaFactorsTable);
  }

  async findForUser(userId: number): Promise<MfaFactor[]> {
    return db.select().from(mfaFactorsTable).where(eq(mfaFactorsTable.userId, userId));
  }
}
