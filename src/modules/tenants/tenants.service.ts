import { tenantManager } from '@/shared/database/tenant-manager.js';
import { tenantUsers } from '@/shared/database/index.js';
import { type TenantProfile, type DynamicUserRecord } from './tenants.types.js';

/**
 * Fetches the registered tenant configurations from 'main_db'.
 */
export async function listTenants(): Promise<TenantProfile[]> {
  return tenantManager.getActiveTenants();
}

/**
 * Fetches isolated user accounts from the active dynamic database space.
 */
export async function listTenantUsers(db: any): Promise<DynamicUserRecord[]> {
  return db.select().from(tenantUsers);
}
