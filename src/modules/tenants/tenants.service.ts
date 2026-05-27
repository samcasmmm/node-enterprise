import { tenantManager } from '@/shared/database/tenant-manager.js';
import { tenantUsers } from '@/shared/database/index.js';
import { type TenantProfile, type DynamicUserRecord } from './tenants.types.js';

export class TenantsService {
  constructor() {}

  /**
   * Fetches the registered tenant configurations from 'main_db'.
   */
  public async listTenants(): Promise<TenantProfile[]> {
    return tenantManager.getActiveTenants();
  }

  /**
   * Fetches isolated user accounts from the active dynamic database space.
   */
  public async listTenantUsers(db: any): Promise<DynamicUserRecord[]> {
    return db.select().from(tenantUsers);
  }
}
