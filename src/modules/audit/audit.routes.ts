import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { requirePermission } from '@/core/middlewares/rbac.middleware.js';
import type { AuditLogController } from './audit-log.controller.js';

const router: Router = Router();
const controller = container.resolve<AuditLogController>(TOKENS.AuditLogController as any);

router.get('/', isAuth, requirePermission('audit:read'), controller.list);
router.get('/:id', isAuth, requirePermission('audit:read'), controller.getById);

export default router;
