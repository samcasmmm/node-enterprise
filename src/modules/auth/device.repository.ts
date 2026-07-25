import { injectable } from 'tsyringe';
import { eq, and } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { devicesTable, type Device } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class DeviceRepository extends BaseRepository<typeof devicesTable, Device, any> {
  constructor() {
    super(devicesTable);
  }

  async findByFingerprint(userId: string, fingerprint: string): Promise<Device | null> {
    const [row] = await db
      .select()
      .from(devicesTable)
      .where(and(eq(devicesTable.userId, userId), eq(devicesTable.fingerprint, fingerprint)))
      .limit(1);
    return row ?? null;
  }

  async findForUser(userId: string): Promise<Device[]> {
    return db.select().from(devicesTable).where(eq(devicesTable.userId, userId));
  }
}
