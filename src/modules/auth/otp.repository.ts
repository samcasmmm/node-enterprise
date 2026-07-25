import { injectable } from 'tsyringe';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { otpsTable, type Otp } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class OtpRepository extends BaseRepository<typeof otpsTable, Otp, any> {
  constructor() {
    super(otpsTable);
  }

  async findActive(destination: string, purpose: string): Promise<Otp | null> {
    const [row] = await db
      .select()
      .from(otpsTable)
      .where(and(
        eq(otpsTable.destination, destination),
        eq(otpsTable.purpose, purpose as any),
        isNull(otpsTable.consumedAt),
        gt(otpsTable.expiresAt, new Date()),
      ))
      .limit(1);
    return row ?? null;
  }
}
