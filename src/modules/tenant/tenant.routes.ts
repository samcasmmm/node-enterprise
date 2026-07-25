import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { buildCrudRouter } from '@/core/base/base.route.js';
import { createTenantSchema, updateTenantSchema } from './tenant.validation.js';
import type { TenantController } from './tenant.controller.js';

const router: Router = Router();
const controller = container.resolve<TenantController>(TOKENS.TenantController as any);

router.use(
  '/',
  buildCrudRouter(controller, {
    permissionKey: 'tenant',
    createSchema: createTenantSchema as any,
    updateSchema: updateTenantSchema as any,
  }),
);

export default router;
