import { Router } from 'express';

import tenantRoutes from './tenant/tenant.routes.js';
import userRoutes from './user/user.routes.js';
import authRoutes from './auth/auth.routes.js';
import rbacRoutes from './rbac/rbac.routes.js';
import settingsRoutes from './settings/settings.routes.js';
import subscriptionRoutes from './subscription/subscription.routes.js';
import auditRoutes from './audit/audit.routes.js';
import notificationRoutes from './notification/notification.routes.js';

/**
 * Every module mounts here under its own path segment. HRMS/CRM/... modules
 * add one line each, following this exact pattern — nothing else in the app
 * needs to change to bring a new module online.
 */
const router: Router = Router();

router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/rbac', rbacRoutes);
router.use('/settings', settingsRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/audit', auditRoutes);
router.use('/notifications', notificationRoutes);

// router.use('/hrms', hrmsRoutes);
// router.use('/crm', crmRoutes);

export default router;
