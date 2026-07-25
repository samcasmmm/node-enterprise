import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { buildCrudRouter } from '@/core/base/base.route.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';
import type { UserController } from './user.controller.js';

const router: Router = Router();
const controller = container.resolve<UserController>(TOKENS.UserController as any);

router.use(
  '/',
  buildCrudRouter(controller, {
    permissionKey: 'user',
    createSchema: createUserSchema as any,
    updateSchema: updateUserSchema as any,
  }),
);

export default router;
