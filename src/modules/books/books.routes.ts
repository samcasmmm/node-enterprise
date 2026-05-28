import { Router } from 'express';
import * as controller from './books.controller.js';
import { attachTenantDb } from '@/core/middlewares/attach-tenant-db.js';

const router = Router();

/**
 * @openapi
 * /api/books:
 *   get:
 *     summary: Fetch tenant books catalog
 *     description: Retrieves the entire collection of book records stored in the dynamically resolved tenant database.
 *     tags:
 *       - Books
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The unique identifier of the tenant's workspace database.
 *         example: 1
 *     responses:
 *       200:
 *         description: Books catalog retrieved successfully.
 *       400:
 *         description: Tenant identification missing or invalid.
 *       404:
 *         description: Specified tenant does not exist.
 *       500:
 *         description: Database query operation failed.
 *   post:
 *     summary: Create a new book record
 *     description: Inserts a new book item inside the isolated tenant's database catalog.
 *     tags:
 *       - Books
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The unique identifier of the tenant's workspace database.
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the book.
 *                 example: "Clean Code"
 *               author:
 *                 type: string
 *                 description: Author of the book.
 *                 example: "Robert C. Martin"
 *               price:
 *                 type: number
 *                 description: Retail price of the book.
 *                 example: 39.99
 *     responses:
 *       201:
 *         description: Book record created successfully.
 *       400:
 *         description: Invalid payload configuration or tenant identification missing.
 *       404:
 *         description: Specified tenant does not exist.
 *       500:
 *         description: Database insert operation failed.
 */
router.get('/', attachTenantDb, controller.list);
router.post('/', attachTenantDb, controller.create);

export default router;
