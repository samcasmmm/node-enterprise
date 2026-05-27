import { eq, and } from 'drizzle-orm';
import { mainDbBooks, tenantUsers } from './index.js';
import { tenantCache } from '../cache/db-cache.js';
import { db } from '@/config/db.config.js';

export interface TenantConfig {
  id: number;
  name: string;
  databaseName: string;
  host: string;
  port: number;
}

export class TenantManager {
  /**
   * Fetches all active tenant databases registered inside the main_db catalog.
   */
  public async getActiveTenants(): Promise<TenantConfig[]> {
    try {
      const records = await db.select().from(mainDbBooks);
      return records.map(r => ({
        id: r.id,
        name: r.bookName,
        databaseName: r.bookDb,
        host: 'localhost',
        port: 5432,
      }));
    } catch (err: any) {
      console.error('❌ Failed to retrieve tenants from central registry:', err.message);
      throw new Error(`Registry retrieval error: ${err.message}`);
    }
  }

  /**
   * Resolves connection configuration details for a specific tenant ID.
   */
  public async getTenantConfig(tenantId: number): Promise<TenantConfig | null> {
    try {
      const records = await db
        .select()
        .from(mainDbBooks)
        .where(eq(mainDbBooks.id, tenantId));

      if (records.length === 0) {
        return null;
      }

      const r = records[0];
      if (!r) {
        return null;
      }
      return {
        id: r.id,
        name: r.bookName,
        databaseName: r.bookDb,
        host: 'localhost',
        port: 5432,
      };
    } catch (err: any) {
      console.error(`❌ Failed to resolve tenant config for ID ${tenantId}:`, err.message);
      return null;
    }
  }

  /**
   * Resolves a cached connection pool and returns a Drizzle database client targeting the dynamic tenant DB.
   */
  public async getTenantConnection(tenantId: number) {
    const config = await this.getTenantConfig(tenantId);
    if (!config) {
      throw new Error(`Tenant DB mapping failed: No registered database matches tenant ID "${tenantId}"`);
    }

    return tenantCache.getTenantConnection(config.databaseName);
  }

  /**
   * Connects dynamically to the tenant's database space and authenticates the user credentials.
   */
  public async authenticateTenantUser(
    tenantId: number,
    userName: string,
    password: string
  ) {
    const { db } = await this.getTenantConnection(tenantId);

    const matches = await db
      .select()
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userName, userName),
          eq(tenantUsers.password, password)
        )
      );

    if (matches.length === 0) {
      return null;
    }

    return matches[0];
  }
}

export const tenantManager = new TenantManager();

