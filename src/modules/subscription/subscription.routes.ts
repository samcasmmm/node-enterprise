import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { requirePermission } from '@/core/middlewares/rbac.middleware.js';
import { validate } from '@/core/middlewares/validate.middleware.js';
import { buildCrudRouter } from '@/core/base/base.route.js';
import { purchaseSchema, createPlanSchema } from './subscription.validation.js';
import type { SubscriptionController } from './subscription.controller.js';
import type { PlanController } from './plan.controller.js';

const router: Router = Router();
const subscriptionController = container.resolve<SubscriptionController>(TOKENS.SubscriptionController as any);
const planController = container.resolve<PlanController>(TOKENS.PlanController as any);

router.use('/plans', buildCrudRouter(planController, { permissionKey: 'subscription', createSchema: createPlanSchema as any }));

router.use(
  '/',
  buildCrudRouter(subscriptionController, {
    permissionKey: 'subscription',
    extend: (r) => {
      r.post('/purchase', isAuth, requirePermission('subscription:create'), validate(purchaseSchema as any), subscriptionController.purchase);
      r.post('/cancel', isAuth, requirePermission('subscription:update'), subscriptionController.cancel);
    },
  }),
);

export default router;
