# agent.md — Backend Coding Contract

**Scope:** `node-enterprise` starter — Express + TypeScript + Drizzle ORM + PostgreSQL + Redis/BullMQ, multi-tenant SaaS backend.

This file is a binding contract for any AI coding agent (or human) working in this repo. If a request conflicts with this file, follow this file and flag the conflict — don't silently deviate.

---

## 1. Architecture Overview

Strict layering, one direction only:

```
routes → controller → service → database/schema
```

- **Routes** — wiring only. No logic, no validation, no try/catch.
- **Controller** — orchestrates the entire request flow: parses input, runs validation, executes all business logic, calls service for DB queries, and formats responses via `response.builder`. Wrapped using `express-async-handler`.
- **Service** — strictly handles database queries, data persistence, transactions, and direct DB interactions. No business logic, validation, or HTTP concerns belong here.

A controller that writes raw Drizzle queries directly (bypassing the service), or a service that contains business/domain logic, is a contract violation.

---

## 2. Module Structure Contract

Every domain module under `modules/<name>/` follows this exact shape:

```
modules/users/
├── users.routes.ts       # Express Router — wiring only
├── users.controller.ts   # HTTP layer & Business Logic, wrapped in express-async-handler
├── users.service.ts      # Database queries only (Drizzle ORM interactions)
├── users.ts              # Extra business logic and helper functions for Users module (manually created only)
└── users.dto.ts          # Zod schemas, inferred types, and TypeScript interfaces
```

- To scaffold a new module: copy `modules/_template/`, rename files, don't build from scratch.
- A module's internals (service, types) are **private** to that module. Other modules import only from its `index.ts` barrel if one exists, or its `.routes.ts` for mounting. No `import { helper } from '../users/users.service'` from another module — that's a boundary violation. If two modules genuinely need to share logic, it belongs in `shared/`.

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case, dot-suffixed by role | `rate-limiter.middleware.ts` |
| Zod validation & Types | `.dto.ts` | `users.dto.ts` |
| Classes | PascalCase | `class UserService` |
| Functions/variables | camelCase | `getUserById` |
| Constants (module-level) | SCREAMING_SNAKE | `MAX_LOGIN_ATTEMPTS` |
| DB tables (Drizzle) | snake_case, plural | `user_sessions` |
| Interfaces/types | PascalCase, no `I` prefix | `UserPayload`, not `IUserPayload` |

Never PascalCase a filename (`Express.d.ts` → `express.d.ts`). Never mix singular/plural across sibling files in the same folder (`config.constant.ts` + `messages.constants.ts` — pick one, plural, everywhere).

---

## 4. TypeScript Rules

- `strict: true` in `tsconfig.json`, non-negotiable.
- `any` is forbidden. Use `unknown` and narrow, or define the type. If genuinely stuck, `// eslint-disable-next-line` with a comment explaining why, not a silent `any`.
- Prefer `type` for data shapes, `interface` only when you need declaration merging or a class contract.
- No `enum` — use `as const` string unions. Enums don't tree-shake well and complicate Drizzle schema typing.
- Every exported function has an explicit return type. Don't rely on inference across module boundaries.

---

## 5. API & Response Contract

Every response — success or error — goes through `core/response/response.builder.ts`. No controller returns `res.json({...})` raw.

```ts
// ✅ correct
res.build
  .withStatus(HTTP.CREATED.code)
  .success()
  .withMessage('User created successfully.')
  .withModule('users')
  .withData(user)
  .send();

// ❌ forbidden — bypasses the envelope
return res.status(201).json({ user });
```

Standard success envelope:
```json
{ 
  "success": true, 
  "message": "User created successfully.", 
  "module": "users", 
  "data": { "id": 1, "userName": "john_doe" }, 
  "timestamp": "22:56:42" 
}
```

Standard error envelope (e.g. validation failure):
```json
{
  "success": false,
  "message": "Validation failed",
  "module": "users",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email address"
        }
      ]
    }
  },
  "timestamp": "22:56:42"
}
```

HTTP status codes and default messages come from `shared/constants/http.constants.ts` via the unified `HTTP` object (e.g. `HTTP.OK.code`, `HTTP.NOT_FOUND.message`) — never hardcode status numbers or split messages.
- Every API endpoint returning a list of items must support pagination (using `page` and `limit` query parameters validated at the boundary, returning `meta` pagination details in the envelope).

---

## 6. Validation Contract

- Every mutating endpoint (`POST`/`PATCH`/`PUT`) validates its body against a zod schema in the module's `.dto.ts` **before** the controller touches it. Use a shared `validate(schema)` middleware — validation is never inline in the controller.
- Query params and route params get validated too if they're used in a DB query (tenant IDs, pagination limits) — unvalidated input never reaches Drizzle.
- DTOs infer types (`z.infer<typeof createUserSchema>`) rather than hand-writing a parallel `.types.ts` interface for the same shape. One source of truth.

---

## 7. Error Handling Contract

- All thrown errors extend `core/errors/http.error.ts` or `domain.error.ts`. Never `throw new Error('...')` — it has no status code and the error middleware can't classify it.
- Services throw domain errors (`throw new NotFoundError('User not found')`); the global `error.middleware.ts` is the **only** place that formats an error response. No `try/catch` swallowing errors silently in a service to return `null` instead — that hides bugs from the caller.
- Async route handlers are wrapped (`asyncHandler` or equivalent) so rejected promises reach the error middleware — no unhandled rejection can crash the process.

```ts
// ✅
if (!user) throw new NotFoundError('User not found');

// ❌ — swallows the failure, caller can't distinguish "not found" from "no data yet"
if (!user) return null;
```

---

## 8. Database & Drizzle Rules

- Schema files live under `database/schemas/`, one file per table/domain with relations, never one giant `schema.ts`. Re-export all schemas through `database/schemas/index.ts`.
- Every schema file exports its Drizzle table **and** its inferred types (`export type User = typeof users.$inferSelect`) — don't hand-maintain a parallel interface that can drift from the actual columns.
- Multi-step writes that touch more than one table use `db.transaction()`. No "fire three inserts and hope" — partial writes on failure are a data integrity bug, not an edge case.
- Migrations are generated via drizzle-kit, never hand-edited after generation. If a migration is wrong, generate a new one — don't patch history.
- No raw SQL string interpolation, ever, even for "trusted" internal values. Use Drizzle's query builder or parameterized `sql` template tag.

---

## 9. Multi-Tenancy Rules

- Every tenant-scoped table must include a `tenantId` column (referencing the platform tenants table).
- Every query targeting tenant-scoped data must explicitly filter by `tenantId` (usually derived from `req.user.tenantId` or validated request context).
- No service function or query should fetch or mutate tenant data without a strict `tenantId` check to prevent cross-tenant data leaks.
- Global/platform tables (e.g. tenants registry, platform admins) are exempted from the `tenantId` column requirement.

```ts
// ✅ tenant-scoped, isolated query
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.tenantId, tenantId));

// ❌ forbidden — bypasses tenant isolation entirely
const users = await db.select().from(usersTable);
```

---

## 10. Auth & Security

- Access tokens: short-lived JWT. Refresh tokens: rotated on every use, stored hashed, single-use (reuse of an old refresh token revokes the whole session family — treat it as a compromise signal).
- Route-level auth via `core/guards/`, not ad-hoc `if (req.user.role !== 'admin')` checks scattered in controllers.
- Every public-facing route sits behind `rate-limiter.middleware.ts` unless explicitly exempted with a comment explaining why.
- Secrets/keys never hardcoded — always through `config/env.config.ts`, which is zod-validated at boot so a missing var fails fast at startup, not at 2am on first use in prod.
- Passwords: hash with argon2/bcrypt, never store or log plaintext, never include password hash in any DTO response shape (strip it explicitly, don't rely on "the frontend won't render it").

---

## 11. Background Jobs (BullMQ)

- Queue definitions in `jobs/queues/`, processors in `jobs/processors/` — a queue file never contains processing logic, and vice versa.
- Every job handler is idempotent — assume at-least-once delivery. A job that sends an email or charges a card checks for prior completion before acting again.
- Jobs get a `tenantId` in their payload where relevant, and processors re-resolve the tenant DB connection inside the job — never pass a live DB connection object into a job payload (it won't survive serialization/redis round-trip anyway).
- Failed jobs log with enough context (`jobId`, `tenantId`, `payload` minus secrets) to debug without reproducing locally.

---

## 12. Logging

- Structured logger (`shared/logger/`) only — no `console.log` in committed code. If you used it while debugging, remove it before the PR.
- Log levels mean something: `error` = needs someone paged/checked, `warn` = degraded but recovered, `info` = notable business event (user created, payment processed), `debug` = dev-only detail.
- Never log secrets, tokens, passwords, or full request bodies containing PII. Log IDs, not payloads.

---

## 13. Environment & Config

- All `process.env` access goes through `config/env.config.ts` — nowhere else in the codebase reads `process.env` directly. This is the only file that knows raw env var names exist.
- Env schema is zod-validated at process boot. A missing/malformed required var throws immediately and stops the server from starting — never falls back silently to `undefined` and fails downstream in a confusing way.
- Integration-specific config (AWS, email, future Stripe/S3) lives colocated inside `integrations/<name>/`, not centralized in `config/`. `config/` holds only cross-cutting app config.

---

## 14. Testing Conventions

- Service layer is the primary unit-test target (pure logic, no HTTP). Controllers get light integration tests through supertest hitting real routes against a test DB.
- Tenant isolation gets explicit tests: a query made with tenant A's context must never return tenant B's rows. This is the one area where "we'll add tests later" is not acceptable.
- No test hits a real external integration (AWS, email) — mock at the `integrations/` boundary.

---

## 15. Forbidden Patterns — Quick Reference

- ❌ `any` type
- ❌ raw `res.json()` bypassing `response.builder`
- ❌ `throw new Error(...)` instead of a typed error class
- ❌ DB access from a controller
- ❌ tenant query against the global `db` connection without filtering by `tenantId`
- ❌ `process.env` accessed outside `config/env.config.ts`
- ❌ `console.log` in committed code
- ❌ cross-module deep imports (`modules/a/*` importing `modules/b/b.service.ts` directly)
- ❌ hand-maintained types that duplicate a Drizzle schema or zod DTO
- ❌ unvalidated request input reaching a Drizzle query
- ❌ hardcoded HTTP status numbers instead of `HTTP` constants

---

## 16. PR Checklist (agent self-check before finishing a task)

- [ ] All mutating routes have a zod DTO validated before the controller
- [ ] All thrown errors are typed (`http.error.ts`/`domain.error.ts` subclasses)
- [ ] Tenant-scoped queries use `tenantId` filtering, not global unfiltered queries
- [ ] No `any`, no raw `res.json()`
- [ ] New env vars added to `env.config.ts` schema, not just `.env.example`
- [ ] Migration generated via drizzle-kit, not hand-written