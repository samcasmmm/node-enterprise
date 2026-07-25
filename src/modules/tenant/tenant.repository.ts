import { injectable } from 'tsyringe';
import { tenantsTable, type Tenant, type NewTenant } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class TenantRepository extends BaseRepository<typeof tenantsTable, Tenant, NewTenant> {
  constructor() {
    super(tenantsTable);
  }
}
