import { Router } from 'express';
import * as controller from './tenants.controller.js';
import { attachTenantDb } from '@/core/middlewares/attach-tenant-db.js';

const router = Router();

// Maps to GET /api/tenants
router.get('/', controller.list);

// Maps to GET /api/tenant/users
router.get('/users', attachTenantDb, controller.listUsers);

export default router;
