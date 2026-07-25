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

// Pre-auth: tenant resolved from X-Tenant-Id header since there's no session yet.
router.post('/register', tenantResolver(), validate(registerSchema as any), controller.register);
router.post('/login', tenantResolver(), validate(loginSchema as any), controller.login);
router.post('/refresh', validate(refreshSchema as any), controller.refresh);
router.post('/otp/send', validate(sendOtpSchema as any), controller.sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema as any), controller.verifyOtp);

// Requires an active session.
router.post('/logout', isAuth, controller.logout);
router.get('/me', isAuth, controller.me);
router.post('/mfa/enroll', isAuth, validate(mfaEnrollSchema as any), controller.enrollMfa);
router.post('/mfa/verify', isAuth, validate(mfaVerifySchema as any), controller.verifyMfa);
router.get('/devices', isAuth, controller.listDevices);
router.delete('/devices/:id', isAuth, controller.revokeDevice);

// OAuth (Google/Microsoft/Apple) is handled by better-auth directly — mounted in app.ts at /api/auth/*.

export default router;
