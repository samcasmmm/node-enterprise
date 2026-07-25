import { injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { subscriptionsTable, type Subscription } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class SubscriptionRepository extends BaseRepository<typeof subscriptionsTable, Subscription, any> {
  constructor() {
    super(subscriptionsTable);
  }

  async findActiveForTenant(tenantId: number): Promise<Subscription | null> {
    const [row] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.tenantId, tenantId)).limit(1);
    return row ?? null;
  }
}
