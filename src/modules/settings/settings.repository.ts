import { injectable } from 'tsyringe';
import { eq, and } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { settingsTable, type Setting, type NewSetting } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class SettingsRepository extends BaseRepository<typeof settingsTable, Setting, NewSetting> {
  constructor() {
    super(settingsTable);
  }

  async findByCategory(tenantId: string, category: string): Promise<Setting[]> {
    return db.select().from(settingsTable).where(and(eq(settingsTable.tenantId, tenantId), eq(settingsTable.category, category)));
  }

  async upsert(tenantId: string, category: string, key: string, value: unknown, isSecret = false): Promise<Setting> {
    const [existing] = await db
      .select()
      .from(settingsTable)
      .where(and(eq(settingsTable.tenantId, tenantId), eq(settingsTable.category, category), eq(settingsTable.key, key)))
      .limit(1);

    if (existing) {
      const [row] = await db.update(settingsTable).set({ value, isSecret }).where(eq(settingsTable.id, existing.id)).returning();
      return row;
    }
    const [row] = await db.insert(settingsTable).values({ tenantId, category, key, value, isSecret }).returning();
    return row;
  }
}
