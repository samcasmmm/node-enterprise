import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { requirePermission } from '@/core/middlewares/rbac.middleware.js';
import { validate } from '@/core/middlewares/validate.middleware.js';
import { buildCrudRouter } from '@/core/base/base.route.js';
import {
  createRoleSchema,
  updateRoleSchema,
  setPermissionsSchema,
  assignRoleSchema,
} from './rbac.validation.js';
import type { RoleController } from './role.controller.js';
import type { PermissionController } from './permission.controller.js';

const router: Router = Router();
const roleController = container.resolve<RoleController>(TOKENS.RoleController as any);
const permissionController = container.resolve<PermissionController>(
  TOKENS.PermissionController as any,
);

router.use(
  '/roles',
  buildCrudRouter(roleController, {
    permissionKey: 'rbac',
    createSchema: createRoleSchema as any,
    updateSchema: updateRoleSchema as any,
    extend: (r) => {
      r.put(
        '/:id/permissions',
        isAuth,
        requirePermission('rbac:update'),
        validate(setPermissionsSchema as any),
        roleController.setPermissions,
      );
      r.post(
        '/:id/assign',
        isAuth,
        requirePermission('rbac:update'),
        validate(assignRoleSchema as any),
        roleController.assignToUser,
      );
    },
  }),
);

router.use('/permissions', buildCrudRouter(permissionController, { permissionKey: 'rbac' }));

export default router;
