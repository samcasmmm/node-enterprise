import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import type { Permission } from '@/database/schemas/index.js';
import type { PermissionRepository } from './permission.repository.js';

@injectable()
export class PermissionService extends BaseService<Permission, any> {
  constructor(@inject(TOKENS.PermissionRepository) permissionRepository: PermissionRepository) {
    super(permissionRepository, 'Permission');
  }
}
