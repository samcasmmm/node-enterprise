import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8),
  organizationId: z.coerce.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const sendOtpSchema = z.object({
  destination: z.string().min(3),
  purpose: z.enum(['login', 'signup', 'reset_password', 'mfa', 'verify_phone', 'verify_email']),
  channel: z.enum(['email', 'sms']).default('email'),
});

export const verifyOtpSchema = z.object({
  destination: z.string().min(3),
  purpose: z.enum(['login', 'signup', 'reset_password', 'mfa', 'verify_phone', 'verify_email']),
  code: z.string().length(6),
});

export const mfaEnrollSchema = z.object({
  type: z.enum(['totp', 'sms', 'email', 'webauthn']),
});

export const mfaVerifySchema = z.object({
  factorId: z.coerce.number(),
  code: z.string().min(6).max(6),
});
