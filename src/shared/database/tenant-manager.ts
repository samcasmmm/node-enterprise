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

/**
 * Fetches all active tenant databases registered inside the main_db catalog.
 */
export async function getActiveTenants(): Promise<TenantConfig[]> {
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
    console.error(`[getActiveTenants] - ${err.message}`);
    throw new Error(`Registry retrieval error: ${err.message}`);
  }
}

/**
 * Resolves connection configuration details for a specific tenant ID.
 */
export async function getTenantConfig(tenantId: number): Promise<TenantConfig | null> {
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
    console.error(`[getTenantConfig] - ${err.message}`);
    return null;
  }
}

/**
 * Resolves a cached connection pool and returns a Drizzle database client targeting the dynamic tenant DB.
 */
export async function getTenantConnection(tenantId: number) {
  const config = await getTenantConfig(tenantId);
  if (!config) {
    throw new Error(`Tenant DB mapping failed: No registered database matches tenant ID "${tenantId}"`);
  }

  return tenantCache.getTenantConnection(config.databaseName);
}

/**
 * Connects dynamically to the tenant's database space and authenticates the user credentials.
 */
export async function authenticateTenantUser(
  tenantId: number,
  userName: string,
  password: string
) {
  const { db } = await getTenantConnection(tenantId);

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

// Group export for backward compatibility
export const tenantManager = {
  getActiveTenants,
  getTenantConfig,
  getTenantConnection,
  authenticateTenantUser,
};
