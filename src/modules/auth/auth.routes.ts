import { Router } from 'express';
import * as controller from './auth.controller.js';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate tenant user
 *     description: Authenticates user credentials within the dynamic tenant space database.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - userName
 *               - password
 *             properties:
 *               tenantId:
 *                 type: integer
 *                 description: The unique identifier of the tenant's database/workspace.
 *                 example: 1
 *               userName:
 *                 type: string
 *                 description: Username credentials.
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 description: Password credentials.
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Successfully authenticated.
 *       401:
 *         description: Authentication failed.
 *       500:
 *         description: Server database error.
 */
router.post('/login', controller.login);

export default router;
