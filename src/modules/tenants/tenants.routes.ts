import { Router } from 'express';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';
import { attachTenantDb } from '@/core/middlewares/attach-tenant-db.js';

const router = Router();

/* Dependency Injection Layer */
const service = new TenantsService();
const controller = new TenantsController(service);

// Maps to GET /api/tenants
router.get('/', controller.list);

// Maps to GET /api/tenant/users
router.get('/users', attachTenantDb, controller.listUsers);

export default router;
