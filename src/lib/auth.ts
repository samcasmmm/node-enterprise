import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/config/db.config.js';
import env from '@/config/env.config.js';
import { usersTable, sessionsTable, oauthAccountsTable } from '@/database/schemas/index.js';

/**
 * Central better-auth instance. All password hashing, session issuance and
 * OAuth handshakes for Google/Microsoft/Apple flow through here; our own
 * `otps`, `mfa_factors`, `devices` and `password_policies` tables layer
 * OTP/MFA/device-management on top (see modules/auth/*.service.ts).
 *
 * The Drizzle adapter is pointed at our multi-tenant `users` table directly
 * — better-auth's field names (name/email/emailVerified/image) already match
 * database/schemas/core/users.schema.ts by design.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: oauthAccountsTable,
    },
  }),
  secret: env.JWT_ACCESS_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID ?? '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID ?? '',
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days, mirrors JWT_REFRESH_EXPIRATION
    updateAge: 60 * 60 * 24,
  },
});

export type Auth = typeof auth;
export default auth;
