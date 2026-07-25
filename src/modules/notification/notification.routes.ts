import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { requirePermission } from '@/core/middlewares/rbac.middleware.js';
import { validate } from '@/core/middlewares/validate.middleware.js';
import { buildCrudRouter } from '@/core/base/base.route.js';
import { dispatchNotificationSchema } from './notification.validation.js';
import type { NotificationController } from './notification.controller.js';

const router: Router = Router();
const controller = container.resolve<NotificationController>(TOKENS.NotificationController as any);

router.use(
  '/',
  buildCrudRouter(controller, {
    permissionKey: 'notification',
    extend: (r) => {
      r.post('/send', isAuth, requirePermission('notification:create'), validate(dispatchNotificationSchema as any), controller.send);
      r.patch('/:id/read', isAuth, requirePermission('notification:update'), controller.markRead);
    },
  }),
);

export default router;
