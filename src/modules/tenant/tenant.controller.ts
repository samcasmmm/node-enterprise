import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import type { Tenant, NewTenant } from '@/database/schemas/index.js';
import type { TenantService } from './tenant.service.js';

@injectable()
export class TenantController extends BaseController<Tenant, NewTenant> {
  constructor(@inject(TOKENS.TenantService) tenantService: TenantService) {
    super(tenantService, 'tenant');
  }
}
