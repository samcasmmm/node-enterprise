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
 * Onboarding: Auto-provisions a new Tenant and Super Admin / Owner User
 * in a single atomic database transaction.
 */
router.post('/register-tenant', tenantResolver({ required: false }), validate(registerSchema as any), controller.registerTenant);

/** Register an additional user under an existing tenant */
router.post('/register', tenantResolver({ required: false }), validate(registerSchema as any), controller.register);

/** Login with Email & Password (no Tenant ID required) */
router.post('/login', tenantResolver({ required: false }), validate(loginSchema as any), controller.login);

router.post('/refresh', validate(refreshSchema as any), controller.refresh);
router.post('/otp/send', validate(sendOtpSchema as any), controller.sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema as any), controller.verifyOtp);

// ─── AUTHENTICATED ROUTES ───────────────────────────────────────────
router.post('/logout', isAuth, controller.logout);
router.get('/me', isAuth, controller.me);
router.post('/mfa/enroll', isAuth, validate(mfaEnrollSchema as any), controller.enrollMfa);
router.post('/mfa/verify', isAuth, validate(mfaVerifySchema as any), controller.verifyMfa);
router.get('/devices', isAuth, controller.listDevices);
router.delete('/devices/:id', isAuth, controller.revokeDevice);

export default router;
