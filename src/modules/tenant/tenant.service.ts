import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import { ValidationError } from '@/core/errors/index.js';
import type { Tenant, NewTenant } from '@/database/schemas/index.js';
import type { TenantRepository } from './tenant.repository.js';

@injectable()
export class TenantService extends BaseService<Tenant, NewTenant> {
  constructor(
    @inject(TOKENS.TenantRepository) private readonly tenantRepository: TenantRepository,
  ) {
    super(tenantRepository, 'Tenant');
  }

  async create(data: NewTenant): Promise<Tenant> {
    // slug/domain uniqueness is enforced at the DB level (unique index); surface a friendly error on conflict
    try {
      return await this.tenantRepository.create(data);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ValidationError('A tenant with this slug or domain already exists.');
      }
      throw err;
    }
  }
}
