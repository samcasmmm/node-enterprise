import { Router } from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { validate } from '@/core/middlewares/validate.middleware.js';
import { tenantResolver } from '@/core/middlewares/tenant.middleware.js';
import {
  registerSchema, loginSchema, refreshSchema, sendOtpSchema, verifyOtpSchema,
  mfaEnrollSchema, mfaVerifySchema,
} from './auth.validation.js';
import type { AuthController } from './auth.controller.js';

const router: Router = Router();
const controller = container.resolve<AuthController>(TOKENS.AuthController as any);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     description: Creates a user under the tenant resolved from the X-Tenant-Id header.
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully.
 */
router.post('/register', tenantResolver(), validate(registerSchema as any), controller.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user and issue tokens
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 */
router.post('/login', tenantResolver(), validate(loginSchema as any), controller.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 */
router.post('/refresh', validate(refreshSchema as any), controller.refresh);

/**
 * @openapi
 * /auth/otp/send:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destination, purpose]
 *             properties:
 *               destination:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [login, signup, reset_password, mfa, verify_phone, verify_email]
 *               channel:
 *                 type: string
 *                 enum: [email, sms]
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 */
router.post('/otp/send', validate(sendOtpSchema as any), controller.sendOtp);

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destination, purpose, code]
 *             properties:
 *               destination:
 *                 type: string
 *               purpose:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully.
 */
router.post('/otp/verify', validate(verifyOtpSchema as any), controller.verifyOtp);

// ─── AUTHENTICATED ROUTES ───────────────────────────────────────────

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
router.post('/logout', isAuth, controller.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get profile of current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved.
 */
router.get('/me', isAuth, controller.me);

/**
 * @openapi
 * /auth/mfa/enroll:
 *   post:
 *     tags: [Auth]
 *     summary: Enroll new MFA factor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [totp, sms, email, webauthn]
 *     responses:
 *       201:
 *         description: MFA factor enrolled.
 */
router.post('/mfa/enroll', isAuth, validate(mfaEnrollSchema as any), controller.enrollMfa);

/**
 * @openapi
 * /auth/mfa/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify MFA factor enrollment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [factorId, code]
 *             properties:
 *               factorId:
 *                 type: integer
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA factor verified.
 */
router.post('/mfa/verify', isAuth, validate(mfaVerifySchema as any), controller.verifyMfa);

/**
 * @openapi
 * /auth/devices:
 *   get:
 *     tags: [Auth]
 *     summary: List active devices for user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devices listed successfully.
 */
router.get('/devices', isAuth, controller.listDevices);

/**
 * @openapi
 * /auth/devices/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke a specific device
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Device revoked.
 */
router.delete('/devices/:id', isAuth, controller.revokeDevice);

export default router;
