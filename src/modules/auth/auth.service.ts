import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcrypt';
import { TOKENS } from '@/core/container/tokens.js';
import { UnauthorizedError, ValidationError } from '@/core/errors/index.js';
import { issueTokens, verifyRefreshToken, type TokenPair } from '@/core/utils/jwt.util.js';
import type { UserRepository } from '@/modules/user/user.repository.js';
import type { SessionRepository } from './session.repository.js';
import type { PasswordPolicyRepository } from './password-policy.repository.js';
import type { AuditLogService } from '@/modules/audit/audit-log.service.js';
import type { User } from '@/database/schemas/index.js';

export interface LoginParams {
  tenantId: string;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterParams {
  tenantId: string;
  organizationId?: string;
  name: string;
  email: string;
  password: string;
}

/**
 * AuthService — login/register/refresh/logout. Issues our own JWT access +
 * refresh pair (consumed by core/middlewares/auth.middleware.ts::isAuth)
 * and records a session row + login log on every attempt. OAuth handshakes
 * (Google/Microsoft/Apple) are delegated to better-auth (see lib/auth.ts);
 * once better-auth resolves the external identity, `loginWithUserId` below
 * mints the same JWT pair so downstream middleware doesn't need to know
 * which path the user came in through.
 */
@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.UserRepository) private readonly userRepository: UserRepository,
    @inject(TOKENS.SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(TOKENS.PasswordPolicyRepository) private readonly passwordPolicyRepository: PasswordPolicyRepository,
    @inject(TOKENS.AuditLogService) private readonly auditLogService: AuditLogService,
  ) {}

  private async assertPasswordPolicy(tenantId: string, password: string): Promise<void> {
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
  async loginWithUserId(userId: string, ipAddress?: string, userAgent?: string): Promise<{ user: User; tokens: TokenPair }> {
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

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const session = await this.sessionRepository.findByToken(refreshToken);
    if (session && session.userId === userId) {
      await this.sessionRepository.updateById(session.id, { revokedAt: new Date() } as any);
    }
  }
}
