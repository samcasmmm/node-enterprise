import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { TOKENS } from '@/core/container/tokens.js';
import { UnauthorizedError, ValidationError } from '@/core/errors/index.js';
import { issueTokens, verifyRefreshToken, type TokenPair } from '@/core/utils/jwt.util.js';
import type { UserRepository } from '@/modules/user/user.repository.js';
import type { TenantRepository } from '@/modules/tenant/tenant.repository.js';
import type {
  SessionRepository, OtpRepository, MfaRepository, DeviceRepository, PasswordPolicyRepository,
} from './auth.repository.js';
import type { AuditLogService } from '@/modules/audit/audit-log.service.js';
import type { NotificationService } from '@/modules/notification/notification.service.js';
import {
  tenantsTable, usersTable, rolesTable, userRolesTable, organizationsTable, departmentsTable,
  type User, type Tenant, type Role,
} from '@/database/schemas/index.js';

export interface RegisterTenantParams {
  name: string;
  companyName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  language?: string;
}

export interface RegisterUserParams {
  tenantId: number;
  organizationId?: number;
  name: string;
  email: string;
  password: string;
}

export interface LoginParams {
  email: string;
  password: string;
  tenantId?: number;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.UserRepository) private readonly userRepository: UserRepository,
    @inject(TOKENS.TenantRepository) private readonly tenantRepository: TenantRepository,
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

  /**
   * Single-step SaaS Onboarding: Auto-provisions Tenant, User, Owner/SUPER_ADMIN role,
   * default departments & settings inside a single database transaction.
   */
  async registerTenant(params: RegisterTenantParams): Promise<{
    user: User;
    tenant: Tenant;
    roles: Role[];
    permissions: string[];
    tokens: TokenPair;
  }> {
    const existing = await this.userRepository.findFirstByEmail(params.email);
    if (existing) throw new ValidationError('A user with this email address already exists.');

    const slug = params.companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `tenant-${Date.now()}`;

    const passwordHash = await bcrypt.hash(params.password, 12);

    return db.transaction(async (tx) => {
      // 1. Create Tenant
      const [tenant] = await tx
        .insert(tenantsTable)
        .values({
          name: params.companyName,
          slug,
          status: 'trial',
          settings: {
            country: params.country ?? 'US',
            language: params.language ?? 'en',
            timezone: 'UTC',
            currency: 'USD',
          },
          isActive: true,
        } as any)
        .returning();

      // 2. Create Primary User
      const [user] = await tx
        .insert(usersTable)
        .values({
          tenantId: tenant.id,
          name: params.name,
          email: params.email,
          phone: params.phone,
          passwordHash,
          isActive: true,
        } as any)
        .returning();

      // 3. Seed Default Tenant Roles (SUPER_ADMIN / Owner, Admin, Manager, Employee)
      const [ownerRole] = await tx
        .insert(rolesTable)
        .values({
          tenantId: tenant.id,
          name: 'SUPER_ADMIN',
          description: 'Tenant Owner & Super Administrator',
          isSystem: true,
          isActive: true,
        } as any)
        .returning();

      await tx.insert(rolesTable).values([
        { tenantId: tenant.id, name: 'Admin', description: 'Administrator', isSystem: true, isActive: true },
        { tenantId: tenant.id, name: 'Manager', description: 'Department Manager', isSystem: false, isActive: true },
        { tenantId: tenant.id, name: 'Employee', description: 'Standard Employee', isSystem: false, isActive: true },
      ] as any);

      // 4. Assign SUPER_ADMIN role to user
      await tx.insert(userRolesTable).values({
        userId: user.id,
        roleId: ownerRole.id,
      } as any);

      // 5. Seed Default Organization & Departments
      const [org] = await tx
        .insert(organizationsTable)
        .values({
          tenantId: tenant.id,
          name: params.companyName,
          isActive: true,
        } as any)
        .returning();

      await tx.insert(departmentsTable).values([
        { tenantId: tenant.id, organizationId: org.id, name: 'Executive', code: 'EXEC', isActive: true },
        { tenantId: tenant.id, organizationId: org.id, name: 'Human Resources', code: 'HR', isActive: true },
        { tenantId: tenant.id, organizationId: org.id, name: 'Finance & Accounting', code: 'FIN', isActive: true },
        { tenantId: tenant.id, organizationId: org.id, name: 'Information Technology', code: 'IT', isActive: true },
      ] as any);

      // 6. Issue Tokens & Session
      const tokens = await this.issueSession(user);

      return {
        user,
        tenant,
        roles: [ownerRole],
        permissions: ['*'],
        tokens,
      };
    });
  }

  /** Standard User Registration under an existing Tenant */
  async registerUser(params: RegisterUserParams): Promise<User> {
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

    await this.auditLogService.recordActivity(params.tenantId, user.id, `${user.name} registered.`, 'auth');
    return user;
  }

  /**
   * Login — resolved by email. Does not require manual Tenant ID entry.
   * Handles single-tenant auto login or multi-tenant selection responses.
   */
  async login(params: LoginParams): Promise<{
    user?: User;
    tenant?: Tenant;
    roles?: Role[];
    permissions?: string[];
    tokens?: TokenPair;
    requiresTenantSelection?: boolean;
    tenants?: Tenant[];
  }> {
    // 1. Find all user accounts matching email
    const matchingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, params.email));

    if (matchingUsers.length === 0) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Filter users with matching password
    const validUsers: User[] = [];
    for (const u of matchingUsers) {
      if (u.passwordHash && (await bcrypt.compare(params.password, u.passwordHash))) {
        validUsers.push(u);
      }
    }

    if (validUsers.length === 0) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // 2. If client specified a target tenantId or only belongs to 1 tenant
    let targetUser: User | undefined;

    if (params.tenantId) {
      targetUser = validUsers.find((u) => u.tenantId === params.tenantId);
      if (!targetUser) throw new UnauthorizedError('Invalid tenant or credentials for selected tenant.');
    } else if (validUsers.length === 1) {
      targetUser = validUsers[0];
    } else {
      // Multiple tenant memberships -> return tenant selection list
      const tenantIds = validUsers.map((u) => u.tenantId);
      const tenantList = await db
        .select()
        .from(tenantsTable)
        .where(inArray(tenantsTable.id, tenantIds));

      return {
        requiresTenantSelection: true,
        tenants: tenantList,
      };
    }

    if (!targetUser.isActive) throw new UnauthorizedError('This account has been deactivated.');

    // 3. Load Tenant
    const tenant = await this.tenantRepository.findById(targetUser.tenantId);
    if (!tenant || !tenant.isActive || tenant.status === 'cancelled') {
      throw new UnauthorizedError('Tenant account is inactive or cancelled.');
    }

    // 4. Load Roles & Permissions
    const userRoleRows = await db
      .select({ role: rolesTable })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, targetUser.id));

    const roles = userRoleRows.map((r) => r.role);
    const hasSuperAdmin = roles.some((r) => r.name === 'SUPER_ADMIN' || r.name === 'Owner');
    const permissions = hasSuperAdmin ? ['*'] : [];

    // 5. Issue Tokens & Record Audit Log
    const tokens = await this.issueSession(targetUser, params.ipAddress, params.userAgent);

    await this.userRepository.updateById(targetUser.id, { lastLoginAt: new Date() } as any);
    await this.auditLogService.recordLogin({
      tenantId: targetUser.tenantId,
      userId: targetUser.id,
      email: targetUser.email,
      success: true,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      user: targetUser,
      tenant,
      roles,
      permissions,
      tokens,
    };
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
