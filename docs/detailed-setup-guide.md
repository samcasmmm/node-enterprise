# Detailed Setup Guide: Express + Better-Auth + Drizzle + PostgreSQL (Mapping Existing Tables)

This guide shows you how to integrate **Better-Auth** by extending your **existing** schemas (such as `users` and `user_sessions`) and configuring custom mappings, rather than creating new tables.

---

## 1. Directory Structure

Your files will reside in the following structure:

```text
src/
├── config/
│   ├── db.config.ts          # Database pool connection & Drizzle instance
│   └── auth.config.ts        # Better-Auth initialization with custom adapter mappings
├── database/
│   └── schemas/
│       └── core/
│           ├── users.ts             # Extend existing users table
│           ├── user-sessions.ts     # Extend existing userSessions table
│           ├── user-credentials.ts  # Extend existing userCredentials table
│           └── user-identities.ts   # Extend existing userIdentities table
├── middlewares/
│   └── auth.middleware.ts    # Session and Tenant validation middlewares
├── routes/
│   └── auth.routes.ts        # Express routing for auth endpoints
└── index.ts                  # Server entry point
```

---

## 2. Extending Existing Schemas

Better-Auth needs specific fields to function. We can add them to our existing tables.

### 1. `users` Table Extension

Add `emailVerified` and `image` to `src/database/schemas/core/users.ts`:

```typescript
// Add these fields to your existing users definition in users.ts:
export const users = pgTable(
  'users',
  {
    ...idPk(),
    email: varchar('email', { length: 255 }),
    emailVerified: boolean('email_verified').notNull().default(false), // <-- ADD THIS for Better-Auth
    image: text('image'), // <-- ADD THIS for Better-Auth
    phone: varchar('phone', { length: 32 }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    status: userStatusEnum('status').notNull().default('pending_verification'),
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...auditColumns(),
  },
  // ... existing indexes
);
```

### 2. `user_sessions` Table Extension

Better-Auth uses a single `token` string for sessions. Add `token` (or map it) to `src/database/schemas/core/user-sessions.ts`:

```typescript
// Add these fields to your existing userSessions definition in user-sessions.ts:
export const userSessions = pgTable(
  'user_sessions',
  {
    ...idPk(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    token: text('token').notNull().unique(), // <-- ADD THIS for Better-Auth session token tracking
    // ... your existing columns:
    tenantId: bigint('tenant_id', { mode: 'bigint' }).references((): AnyPgColumn => tenants.id),
    membershipId: bigint('membership_id', { mode: 'bigint' }).references((): AnyPgColumn => memberships.id),
    deviceId: bigint('device_id', { mode: 'bigint' }).references(() => devices.id),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    accessTokenJti: varchar('access_token_jti', { length: 64 }),
    permissionVersion: integer('permission_version').notNull().default(1),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    isTrusted: boolean('is_trusted').notNull().default(false),
    idleTimeoutSeconds: integer('idle_timeout_seconds').notNull().default(1800),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 128 }),
    ...auditColumns(),
  },
  // ... existing indexes
);
```

### 3. `verifications` Table (Placeholder)

If you do not have a verification tokens table yet, add a simple one to `src/database/schemas/core/verification.ts` (or reuse an existing codes table):

```typescript
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

---

## 3. Configuration Setup & Custom Schema Mapping

To prevent Better-Auth from creating new tables, tell it exactly which tables and column names to use in `src/config/auth.config.ts`:

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db.config.js';
import { users, userSessions, verifications } from '../database/schemas/core/index.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: userSessions,
      account: accounts, // Map accounts table for OAuth if needed
      verification: verifications,
    },
    modelUser: {
      modelName: 'user',
      table: 'users',
      fields: {
        name: 'displayName', // Maps name internally to your existing displayName column
        email: 'email',
        emailVerified: 'emailVerified',
        image: 'image',
      },
    },
    modelSession: {
      modelName: 'session',
      table: 'user_sessions',
      fields: {
        token: 'token', // Map Better-Auth session token to the new 'token' column
        userId: 'userId',
        expiresAt: 'expiresAt',
        ipAddress: 'ip', // Map Better-Auth's ipAddress to your existing 'ip' column
        userAgent: 'userAgent',
      },
    },
    // Map verifications table if needed
    modelVerification: {
      modelName: 'verification',
      table: 'verifications',
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
});
```

---

## 4. Routing & Middleware

The middlewares and routers will operate exactly the same way, but now they read from your unified database schemas seamlessly!

### Express Routing

File: `src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { auth } from '../config/auth.config.js';
import { toNodeHandler } from 'better-auth/node';

const authRouter = Router();

authRouter.all('/api/auth/*', toNodeHandler(auth));

export default authRouter;
```

### Security & Multi-Tenancy Middleware

File: `src/middlewares/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth.config.js';
import { db } from '../config/db.config.js';
import { memberships } from '../database/schemas/core/memberships.js';
import { eq, and } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: bigint;
      membership?: any;
    }
  }
}

export async function requireTenantAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }

    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    if (!tenantIdHeader) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }
    const tenantId = BigInt(tenantIdHeader);

    const member = await db.query.memberships.findFirst({
      where: and(eq(memberships.userId, BigInt(session.user.id)), eq(memberships.tenantId, tenantId)),
    });

    if (!member) {
      return res.status(403).json({ error: 'Access Denied: You are not a member of this tenant' });
    }

    req.user = session.user;
    req.tenantId = tenantId;
    req.membership = member;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal Server Error during Authentication' });
  }
}
```
