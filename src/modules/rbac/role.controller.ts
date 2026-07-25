import { inject, injectable } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import { HTTP_STATUS_CODES } from '@/shared/constants/index.js';
import type { Role, NewRole } from '@/database/schemas/index.js';
import type { RoleService } from './role.service.js';

@injectable()
export class RoleController extends BaseController<Role, NewRole> {
  constructor(@inject(TOKENS.RoleService) private readonly roleService: RoleService) {
    super(roleService, 'role');
  }

  setPermissions = asyncHandler(async (req: Request, res: Response) => {
    await this.roleService.setPermissions(Number(req.params.id), req.body.permissionIds ?? []);
    res.build.withModule('role').withStatus(HTTP_STATUS_CODES.OK).withMessage('Permissions updated.').send();
  });

  assignToUser = asyncHandler(async (req: Request, res: Response) => {
    await this.roleService.assignToUser(req.body.userId, Number(req.params.id), {
      branchId: req.body.branchId,
      departmentId: req.body.departmentId,
    });
    res.build.withModule('role').withStatus(HTTP_STATUS_CODES.CREATED).withMessage('Role assigned.').send();
  });
}
