import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { TOKENS } from '@/core/container/tokens.js';
import { UnauthorizedError, ValidationError } from '@/core/errors/index.js';
import { issueTokens, verifyRefreshToken, type TokenPair } from '@/core/utils/jwt.util.js';
import type { UserRepository } from '@/modules/user/user.repository.js';
import type {
  SessionRepository, OtpRepository, MfaRepository, DeviceRepository, PasswordPolicyRepository,
} from './auth.repository.js';
import type { AuditLogService } from '@/modules/audit/audit-log.service.js';
import type { NotificationService } from '@/modules/notification/notification.service.js';
import type { User } from '@/database/schemas/index.js';

export interface LoginParams {
  tenantId: number;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterParams {
  tenantId: number;
  organizationId?: number;
  name: string;
  email: string;
  password: string;
}

/**
 * AuthService — login/register/refresh/logout. Issues our own JWT access +
 * refresh pair (consumed by core/middlewares/auth.middleware.ts::isAuth)
 * and records a session row + login log on every attempt.
 */
@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.UserRepository) private readonly userRepository: UserRepository,
    @inject(TOKENS.SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(TOKENS.PasswordPolicyRepository) private readonly passwordPolicyRepository: PasswordPolicyRepository,
    @inject(TOKENS.AuditLogService) private readonly auditLogService: AuditLogService,
  ) {}

  private async assertPasswordPolicy(tenantId: number, password: string): Promise<void> {
    const policy = await this.passwordPolicyRepository.findForTenant(tenantId);
    const minLength = policy?.minLength ?? 8;
    if (password.length < minLength) throw new ValidationError(`Password must be at least ${minLength} characters.`);
    if (policy?.requireUppercase && !/[A-Z]/.test(password)) throw new ValidationError('Password must contain an uppercase letter.');
    if (policy?.requireLowercase && !/[a-z]/.test(password)) throw new ValidationError('Password must contain a lowercase letter.');
    if (policy?.requireNumber && !/[0-9]/.test(password)) throw new ValidationError('Password must contain a number.');
    if (policy?.requireSymbol && !/[^A-Za-z0-9]/.test(password)) throw new ValidationError('Password must contain a symbol.');
  }

  async register(params: RegisterParams): Promise<User> {
    const existing = await this.userRepository.findByEmail(params.tenantId, params.email);
    if (existing) throw new ValidationError('A user with this email already exists.');

    await this.assertPasswordPolicy(params.tenantId, params.password);
    const passwordHash = await bcrypt.hash(params.password, 12);

    const user = await this.userRepository.create({
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      name: params.name,
      email: params.email,
      passwordHash,
    } as any);

    await this.auditLogService.recordActivity(params.tenantId, user.id, `${user.name} signed up.`, 'auth');
    return user;
  }

  async login(params: LoginParams): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.userRepository.findByEmail(params.tenantId, params.email);

    if (!user || !user.passwordHash || !(await bcrypt.compare(params.password, user.passwordHash))) {
      await this.auditLogService.recordLogin({
        tenantId: params.tenantId,
        email: params.email,
        success: false,
        reason: 'invalid_credentials',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) throw new UnauthorizedError('This account has been deactivated.');

    const tokens = await this.issueSession(user, params.ipAddress, params.userAgent);

    await this.userRepository.updateById(user.id, { lastLoginAt: new Date() } as any);
    await this.auditLogService.recordLogin({
      tenantId: params.tenantId,
      userId: user.id,
      email: params.email,
      success: true,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return { user, tokens };
  }

  /** Used after an OAuth provider (Google/Microsoft/Apple) resolves an identity via better-auth. */
  async loginWithUserId(userId: number, ipAddress?: string, userAgent?: string): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User not found.');
    const tokens = await this.issueSession(user, ipAddress, userAgent);
    return { user, tokens };
  }

  private async issueSession(user: User, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const tokens = issueTokens({
      userId: user.id,
      userName: user.userName ?? user.name,
      email: user.email,
      tenantId: user.tenantId,
      organizationId: user.organizationId ?? undefined,
      branchId: user.branchId ?? undefined,
    });

    await this.sessionRepository.create({
      userId: user.id,
      token: tokens.refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    return tokens;
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(decoded.userId);
    if (!user) throw new UnauthorizedError('Invalid refresh token.');
    return this.issueSession(user);
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const session = await this.sessionRepository.findByToken(refreshToken);
    if (session && session.userId === userId) {
      await this.sessionRepository.updateById(session.id, { revokedAt: new Date() } as any);
    }
  }
}

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** OTP — generation, delivery (via NotificationService) and verification. */
@injectable()
export class OtpService {
  constructor(
    @inject(TOKENS.OtpRepository) private readonly otpRepository: OtpRepository,
    @inject(TOKENS.NotificationService) private readonly notificationService: NotificationService,
  ) {}

  async send(destination: string, purpose: string, userId?: number, channel: 'email' | 'sms' = 'email'): Promise<void> {
    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, 10);

    await this.otpRepository.create({
      userId,
      destination,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    } as any);

    await this.notificationService.dispatch({
      userId,
      channel,
      to: destination,
      title: 'Your verification code',
      body: `Your code is ${code}. It expires in 5 minutes.`,
    });
  }

  async verify(destination: string, purpose: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findActive(destination, purpose);
    if (!otp) throw new ValidationError('OTP has expired or was not requested.');
    if (otp.attempts >= MAX_ATTEMPTS) throw new ValidationError('Too many attempts. Request a new OTP.');

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      await this.otpRepository.updateById(otp.id, { attempts: otp.attempts + 1 } as any);
      throw new ValidationError('Invalid OTP.');
    }

    await this.otpRepository.updateById(otp.id, { consumedAt: new Date() } as any);
    return true;
  }
}

/** MFA — TOTP/SMS/Email/WebAuthn factor management. */
@injectable()
export class MfaService {
  constructor(@inject(TOKENS.MfaRepository) private readonly mfaRepository: MfaRepository) {}

  async listFactors(userId: number) {
    return this.mfaRepository.findForUser(userId);
  }

  async enroll(userId: number, type: 'totp' | 'sms' | 'email' | 'webauthn') {
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

  async verifyEnrollment(factorId: number, code: string) {
    const factor = await this.mfaRepository.findById(factorId);
    if (!factor) throw new ValidationError('MFA factor not found.');
    const isValid = code.length === 6;
    if (!isValid) throw new ValidationError('Invalid MFA code.');
    return this.mfaRepository.updateById(factorId, { isVerified: true, isPrimary: true } as any);
  }

  async remove(factorId: number, userId: number) {
    return this.mfaRepository.deleteById(factorId, {} as any);
  }
}

/** Device Management — track, trust, and revoke devices a user has logged in from. */
@injectable()
export class DeviceService {
  constructor(@inject(TOKENS.DeviceRepository) private readonly deviceRepository: DeviceRepository) {}

  async registerOrTouch(userId: number, fingerprint: string, meta: { name?: string; platform?: string; ipAddress?: string }) {
    const existing = await this.deviceRepository.findByFingerprint(userId, fingerprint);
    if (existing) {
      return this.deviceRepository.updateById(existing.id, {
        lastSeenAt: new Date(),
        lastIpAddress: meta.ipAddress,
      } as any);
    }
    return this.deviceRepository.create({
      userId,
      fingerprint,
      name: meta.name,
      platform: meta.platform,
      lastIpAddress: meta.ipAddress,
      isTrusted: false,
    } as any);
  }

  async listForUser(userId: number) {
    return this.deviceRepository.findForUser(userId);
  }

  async trust(deviceId: number) {
    return this.deviceRepository.updateById(deviceId, { isTrusted: true } as any);
  }

  async revoke(deviceId: number) {
    return this.deviceRepository.updateById(deviceId, { revokedAt: new Date() } as any);
  }
}
