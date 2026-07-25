import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import type { Permission } from '@/database/schemas/index.js';
import type { PermissionService } from './permission.service.js';

@injectable()
export class PermissionController extends BaseController<Permission, any> {
  constructor(@inject(TOKENS.PermissionService) permissionService: PermissionService) {
    super(permissionService, 'permission');
  }
}
