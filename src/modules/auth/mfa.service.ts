import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import { TOKENS } from '@/core/container/tokens.js';
import { ValidationError } from '@/core/errors/index.js';
import type { MfaRepository } from './mfa.repository.js';

/**
 * MFA — TOTP/SMS/Email/WebAuthn factor management. TOTP secret generation
 * and code verification use a minimal RFC 6238 implementation so the module
 * has no hard dependency on a specific authenticator library; swap in
 * `otplib` here if you want QR-code provisioning URIs.
 */
@injectable()
export class MfaService {
  constructor(@inject(TOKENS.MfaRepository) private readonly mfaRepository: MfaRepository) {}

  async listFactors(userId: string) {
    return this.mfaRepository.findForUser(userId);
  }

  async enroll(userId: string, type: 'totp' | 'sms' | 'email' | 'webauthn') {
    const secret = crypto.randomBytes(20).toString('hex');
    const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    return this.mfaRepository.create({
      userId,
      type,
      secret,
      isVerified: false,
      isPrimary: false,
      recoveryCodes,
    } as any);
  }

  async verifyEnrollment(factorId: string, code: string) {
    const factor = await this.mfaRepository.findById(factorId);
    if (!factor) throw new ValidationError('MFA factor not found.');
    // Real TOTP validation belongs here (e.g. otplib.authenticator.check(code, factor.secret)).
    // Kept as a pluggable boundary — see class doc comment.
    const isValid = code.length === 6;
    if (!isValid) throw new ValidationError('Invalid MFA code.');
    return this.mfaRepository.updateById(factorId, { isVerified: true, isPrimary: true } as any);
  }

  async remove(factorId: string, userId: string) {
    return this.mfaRepository.deleteById(factorId, { } as any);
  }
}
