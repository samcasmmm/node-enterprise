import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { requirePermission } from '@/core/middlewares/rbac.middleware.js';
import { validate } from '@/core/middlewares/validate.middleware.js';
import { setCategorySchema } from './settings.validation.js';
import type { SettingsController } from './settings.controller.js';

const router: Router = Router();
const controller = container.resolve<SettingsController>(TOKENS.SettingsController as any);

router.get('/:category', isAuth, requirePermission('settings:read'), controller.getCategory);
router.put(
  '/:category',
  isAuth,
  requirePermission('settings:update'),
  validate(setCategorySchema as any),
  controller.setCategory,
);

export default router;
