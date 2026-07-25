import { injectable } from 'tsyringe';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import {
  sessionsTable,
  otpsTable,
  mfaFactorsTable,
  devicesTable,
  passwordPoliciesTable,
  type Session,
  type Otp,
  type MfaFactor,
  type Device,
  type PasswordPolicy,
} from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class SessionRepository extends BaseRepository<typeof sessionsTable, Session, any> {
  constructor() {
    super(sessionsTable);
  }

  async findByToken(token: string): Promise<Session | null> {
    const [row] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1);
    return row ?? null;
  }
}

@injectable()
export class OtpRepository extends BaseRepository<typeof otpsTable, Otp, any> {
  constructor() {
    super(otpsTable);
  }

  async findActive(destination: string, purpose: string): Promise<Otp | null> {
    const [row] = await db
      .select()
      .from(otpsTable)
      .where(
        and(
          eq(otpsTable.destination, destination),
          eq(otpsTable.purpose, purpose as any),
          isNull(otpsTable.consumedAt),
          gt(otpsTable.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ?? null;
  }
}

@injectable()
export class MfaRepository extends BaseRepository<typeof mfaFactorsTable, MfaFactor, any> {
  constructor() {
    super(mfaFactorsTable);
  }

  async findForUser(userId: number): Promise<MfaFactor[]> {
    return db.select().from(mfaFactorsTable).where(eq(mfaFactorsTable.userId, userId));
  }
}

@injectable()
export class DeviceRepository extends BaseRepository<typeof devicesTable, Device, any> {
  constructor() {
    super(devicesTable);
  }

  async findByFingerprint(userId: number, fingerprint: string): Promise<Device | null> {
    const [row] = await db
      .select()
      .from(devicesTable)
      .where(and(eq(devicesTable.userId, userId), eq(devicesTable.fingerprint, fingerprint)))
      .limit(1);
    return row ?? null;
  }

  async findForUser(userId: number): Promise<Device[]> {
    return db.select().from(devicesTable).where(eq(devicesTable.userId, userId));
  }
}

@injectable()
export class PasswordPolicyRepository extends BaseRepository<
  typeof passwordPoliciesTable,
  PasswordPolicy,
  any
> {
  constructor() {
    super(passwordPoliciesTable);
  }

  async findForTenant(tenantId: number): Promise<PasswordPolicy | null> {
    const [row] = await db
      .select()
      .from(passwordPoliciesTable)
      .where(eq(passwordPoliciesTable.tenantId, tenantId))
      .limit(1);
    return row ?? null;
  }
}
