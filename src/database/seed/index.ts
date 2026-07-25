import 'reflect-metadata';
import { db } from '@/config/db.config.js';
import { logger } from '@/shared/logger/index.js';
import {
  tenantsTable,
  organizationsTable,
  usersTable,
  permissionsTable,
  rolesTable,
  rolePermissionsTable,
  userRolesTable,
  passwordPoliciesTable,
  modulesCatalogTable,
  plansTable,
} from '@/database/schemas/index.js';
import bcrypt from 'bcrypt';

/**
 * Bootstrap seed — creates just enough data to log in and start exercising
 * the system: one tenant/org, the CRUD permission set for every core
 * module, a 'Super Admin' role with a wildcard grant, a default password
 * policy, and a super-admin user.
 *
 * Run with: npx tsx src/database/seed/index.ts
 */

const CORE_MODULES = [
  'tenant',
  'user',
  'auth',
  'rbac',
  'settings',
  'subscription',
  'audit',
  'notification',
];
const ACTIONS = ['read', 'create', 'update', 'delete'];

async function seed() {
  logger.info('Seeding: modules catalog...');
  for (const key of CORE_MODULES) {
    await db
      .insert(modulesCatalogTable)
      .values({ key, name: key, isCore: true })
      .onConflictDoNothing();
  }

  logger.info('Seeding: tenant + organization...');
  const [tenant] = await db
    .insert(tenantsTable)
    .values({ name: 'Default Tenant', slug: 'default', status: 'active' })
    .onConflictDoNothing()
    .returning();

  const activeTenant = tenant ?? (await db.select().from(tenantsTable).limit(1))[0];

  const [organization] = await db
    .insert(organizationsTable)
    .values({ tenantId: activeTenant.id, name: 'Default Organization' })
    .returning();

  logger.info('Seeding: password policy...');
  await db
    .insert(passwordPoliciesTable)
    .values({ tenantId: activeTenant.id })
    .onConflictDoNothing();

  logger.info('Seeding: permissions (module:action for every core module)...');
  const permissionRows = CORE_MODULES.flatMap((moduleKey) =>
    ACTIONS.map((action) => ({
      moduleKey,
      key: `${moduleKey}:${action}`,
      name: `${moduleKey} ${action}`,
    })),
  );
  const insertedPermissions = await db
    .insert(permissionsTable)
    .values(permissionRows)
    .onConflictDoNothing()
    .returning();

  logger.info('Seeding: Super Admin role (wildcard permission)...');
  const [wildcardPermission] = await db
    .insert(permissionsTable)
    .values({ moduleKey: '*', key: '*', name: 'Super Admin — all permissions' })
    .onConflictDoNothing()
    .returning();

  const [superAdminRole] = await db
    .insert(rolesTable)
    .values({ tenantId: activeTenant.id, name: 'Super Admin', isSystem: true })
    .returning();

  const wildcard = wildcardPermission ?? (await db.select().from(permissionsTable).limit(1))[0];
  await db
    .insert(rolePermissionsTable)
    .values({ roleId: superAdminRole.id, permissionId: wildcard.id })
    .onConflictDoNothing();

  logger.info('Seeding: default subscription plan...');
  await db
    .insert(plansTable)
    .values({
      name: 'Starter',
      code: 'starter',
      price: '0',
      billingCycle: 'monthly',
      moduleKeys: [],
      trialDays: 14,
    })
    .onConflictDoNothing();

  logger.info('Seeding: super admin user...');
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const [adminUser] = await db
    .insert(usersTable)
    .values({
      tenantId: activeTenant.id,
      organizationId: organization.id,
      name: 'Super Admin',
      email: 'admin@example.com',
      passwordHash,
      emailVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  if (adminUser) {
    await db.insert(userRolesTable).values({ userId: adminUser.id, roleId: superAdminRole.id });
  }

  logger.success('Seed complete.');
  logger.info(`Tenant: ${activeTenant.slug} (${activeTenant.id})`);
  logger.info('Login: admin@example.com / ChangeMe123!  — change this immediately.');
  logger.info(`Login request needs header: X-Tenant-Id: ${activeTenant.id}`);
}

seed()
  .catch((err) => {
    logger.error('Seed failed.', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (db.$client && typeof db.$client.end === 'function') await db.$client.end();
  });
