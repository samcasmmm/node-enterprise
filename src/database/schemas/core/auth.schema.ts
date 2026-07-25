import { pgTable, varchar, uuid, boolean, text, timestamp, integer, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './_shared.columns.js';
import { tenantsTable } from './multi-tenancy.schema.js';
import { usersTable } from './users.schema.js';

/**
 * Sessions — mirrors the shape better-auth expects from its Drizzle adapter
 * (id, userId, token, expiresAt, ipAddress, userAgent) plus our own device
 * link for the Device Management requirement.
 */
export const sessionsTable = pgTable(
  'sessions',
  {
    id: idColumn(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    ipAddress: varchar('ip_address', { length: 60 }),
    userAgent: text('user_agent'),
    deviceId: uuid('device_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userIdx: index('sessions_user_idx').on(t.userId) }),
);

export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'microsoft', 'apple']);

/** OAuth Accounts — one row per linked external identity (Google/Microsoft/Apple). */
export const oauthAccountsTable = pgTable(
  'oauth_accounts',
  {
    id: idColumn(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    provider: oauthProviderEnum('provider').notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({ userIdx: index('oauth_accounts_user_idx').on(t.userId) }),
);

export const otpPurposeEnum = pgEnum('otp_purpose', ['login', 'signup', 'reset_password', 'mfa', 'verify_phone', 'verify_email']);

/** OTPs — one-time passcodes for login/verification, channel-agnostic. */
export const otpsTable = pgTable(
  'otps',
  {
    id: idColumn(),
    userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
    destination: varchar('destination', { length: 255 }).notNull(), // email or phone
    codeHash: text('code_hash').notNull(),
    purpose: otpPurposeEnum('purpose').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ destinationIdx: index('otps_destination_idx').on(t.destination) }),
);

export const mfaTypeEnum = pgEnum('mfa_type', ['totp', 'sms', 'email', 'webauthn']);

/** MFA factors enrolled per user. */
export const mfaFactorsTable = pgTable(
  'mfa_factors',
  {
    id: idColumn(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    type: mfaTypeEnum('type').notNull(),
    secret: text('secret'),
    isVerified: boolean('is_verified').default(false).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    recoveryCodes: jsonb('recovery_codes').default([]),
    ...timestamps,
  },
  (t) => ({ userIdx: index('mfa_factors_user_idx').on(t.userId) }),
);

/** Devices — Device Management: known devices a user has logged in from. */
export const devicesTable = pgTable(
  'devices',
  {
    id: idColumn(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }),
    fingerprint: varchar('fingerprint', { length: 255 }).notNull(),
    platform: varchar('platform', { length: 60 }),
    lastIpAddress: varchar('last_ip_address', { length: 60 }),
    isTrusted: boolean('is_trusted').default(false).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userIdx: index('devices_user_idx').on(t.userId) }),
);

/** Password Policy — one active policy per tenant, enforced at signup/reset/change. */
export const passwordPoliciesTable = pgTable(
  'password_policies',
  {
    id: idColumn(),
    tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id, { onDelete: 'cascade' }),
    minLength: integer('min_length').default(8).notNull(),
    requireUppercase: boolean('require_uppercase').default(true).notNull(),
    requireLowercase: boolean('require_lowercase').default(true).notNull(),
    requireNumber: boolean('require_number').default(true).notNull(),
    requireSymbol: boolean('require_symbol').default(false).notNull(),
    maxAgeDays: integer('max_age_days'),
    preventReuseCount: integer('prevent_reuse_count').default(3).notNull(),
    maxFailedAttempts: integer('max_failed_attempts').default(5).notNull(),
    lockoutMinutes: integer('lockout_minutes').default(15).notNull(),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('password_policies_tenant_idx').on(t.tenantId) }),
);

export type Session = typeof sessionsTable.$inferSelect;
export type OAuthAccount = typeof oauthAccountsTable.$inferSelect;
export type Otp = typeof otpsTable.$inferSelect;
export type MfaFactor = typeof mfaFactorsTable.$inferSelect;
export type Device = typeof devicesTable.$inferSelect;
export type PasswordPolicy = typeof passwordPoliciesTable.$inferSelect;
