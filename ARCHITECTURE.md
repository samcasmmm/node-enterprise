# ERP Backend — Architecture

ES6-class, dependency-injected (tsyringe), Drizzle/Postgres backend. Eight
foundational modules ship in this build; every future module (HRMS, CRM,
Inventory, Accounting, ... 100+) plugs into the same pattern.

## Layers

```
Request
  → Router          (src/modules/<module>/<entity>.routes.ts)
  → Middleware       auth (isAuth) → tenant (tenantResolver) → RBAC (requirePermission) → validate (zod)
  → Controller       (extends BaseController) — HTTP concerns only
  → Service          (extends BaseService) — business rules
  → Repository       (extends BaseRepository) — Drizzle queries, tenant-scoped
  → Postgres
```

`BaseRepository` / `BaseService` / `BaseController` (`src/core/base/*`) give
every entity list/paginate/getById/create/update/remove for free, with
soft-delete and tenant/org/branch scoping built in. A module only needs to
add what's actually different about it.

## Multi-tenancy

`Tenant → Organization → Branch → Business Unit / Department → Cost Center`,
plus `Workspace`. Every business table carries a `tenantId` (and usually
`organizationId`/`branchId`). Scoping is never trusted from the request body —
`req.tenant` is populated by `tenantResolver()` from the authenticated JWT
(`req.user.tenantId`, set at login), and every repository call takes that
scope as an explicit argument.

## Identity

One `users` table is the single source of truth for "who can log in."
Every module-specific profile (Employee, Contact, a future CRM Rep, a
future POS Cashier, ...) is a separate table with a `userId` foreign key
back to `users`, plus its own `tenantId`/`organizationId` — exactly the
pattern in the brief:

```
users(id)
  → employees(userId, tenantId, organizationId, departmentId, ...)
  → contacts(userId?, tenantId, ...)          — CRM-style external contact
```

## RBAC

`Role ⇄ Permission` (many-to-many via `role_permissions`), assigned to a
user (`user_roles`, optionally narrowed to a branch/department) or a group
(`group_roles` → `group_members`). `AuthorizationService.can(userId, 'module:action', scope)`
is the single check every protected route runs, and it also:

- Gates on **module purchase** — non-core permissions require an active
  `module_access` row for that tenant (see Subscription below).
- Resolves **wildcards** — `'*'` (super admin) and `'module:*'`.
- Resolves **delegation** — a user acting on another's behalf for a date range.
- Resolves **temporary access** — a one-off, time-boxed grant outside the role structure.

`Policy` (ABAC) and `DataScope` (own/team/department/branch/org/all) tables
are modeled for row-level rules layered on top of RBAC; wire their
evaluation into `AuthorizationService.can()` as modules need it.

## Subscription → Module Access

`Plan.moduleKeys` lists what a plan unlocks. `SubscriptionService.purchase()`
is the literal implementation of "access given when each module is
purchased": it creates the subscription and flips the corresponding
`module_access` rows on for that tenant. `AuthorizationService` reads those
rows on every permission check for non-core modules.

## Cross-cutting services

- **AuditLogService** — call `record()` / `recordActivity()` /
  `recordSecurityEvent()` / `recordFieldChange()` from any module's service
  layer. Not auto-wired into `BaseService` because what counts as
  audit-worthy varies too much across 100+ modules — call it explicitly in
  overridden `create`/`update`/`remove`.
- **NotificationService** — `dispatch({ channel, to, body, ... })`. Channels
  (Email/SMS/Push/WhatsApp/Slack/Teams/Discord/Webhook) implement one
  `NotificationChannel` interface (`src/modules/notification/channels/`);
  swap a provider without touching any call site.
- **SettingsService** — `getCategory(tenantId, 'email')` /
  `setCategory(...)`. One flexible table instead of a dozen near-identical
  ones; categories map to General/Localization/Tax/Email/SMS/WhatsApp/Storage/Theme/Branding/CustomDomain.

## Auth

`better-auth` (`src/lib/auth.ts`) handles OAuth handshakes (Google/Microsoft/Apple)
against the Drizzle adapter, mounted at `/api/auth/*`. Our own `AuthService`
issues the JWT access/refresh pair that `isAuth` middleware verifies on every
other route, so downstream code never needs to know whether a session
started via password or OAuth. OTP, MFA, Device Management, and Password
Policy are custom tables/services layered alongside.

## Adding a new module (HRMS, CRM, ...)

```
npm run make
```

This runs `scripts/create-module.js`, which scaffolds schema + repository +
service + controller + validation + routes for a new entity, following the
exact pattern used by `src/modules/tenant/*`. It prints the handful of
manual wiring steps left (DI token, container registration, route mount —
deliberately manual since decorator-based DI can't be safely code-modded).

Read `src/modules/tenant/*` first if you're writing a module by hand — it's
the reference implementation every generated module and every core module
follows.

## Getting started

```bash
cp env/.env.dev.example env/.env.dev   # fill in DATABASE_URL at minimum
npm install
npm run db:generate && npm run db:migrate
npm run db:seed        # creates a tenant, Super Admin role/user, core permissions
npm run dev
```

Seed output prints the tenant id and admin credentials. Login requests need
an `X-Tenant-Id` header before a session exists (subsequent requests read
tenant scope from the JWT instead).
