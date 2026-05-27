import { Router } from 'express';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { attachTenantDb } from '@/core/middlewares/attach-tenant-db.js';

const router = Router();

/* Dependency Injection Layer */
const service = new BooksService();
const controller = new BooksController(service);

router.get('/', attachTenantDb, controller.list);
router.post('/', attachTenantDb, controller.create);

export default router;
