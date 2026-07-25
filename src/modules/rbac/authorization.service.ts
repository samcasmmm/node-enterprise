import { inject, injectable } from 'tsyringe';
import { eq, and } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { moduleAccessTable } from '@/database/schemas/index.js';
import { TOKENS } from '@/core/container/tokens.js';
import type { PermissionRepository } from './permission.repository.js';

export interface AuthzScope {
  tenantId?: string;
  organizationId?: string;
  branchId?: string;
}

/**
 * AuthorizationService — the single source of truth for "can user X do Y".
 * Consumed by the requirePermission() middleware on every protected route,
 * across every module (core and future HRMS/CRM/...).
 *
 * Resolution:
 *  1. Module gate — if the permission belongs to a purchasable module, the
 *     tenant must have an active moduleAccessTable entry for it.
 *  2. Grant check — permission must be present via role, group-inherited
 *     role, temporary access, or an active delegation.
 *  3. Wildcards — 'module:*' grants every action in that module, '*' grants everything (super admin).
 */
@injectable()
export class AuthorizationService {
  constructor(@inject(TOKENS.PermissionRepository) private readonly permissionRepository: PermissionRepository) {}

  async can(userId: string, permissionKey: string, scope: AuthzScope = {}): Promise<boolean> {
    const [moduleKey] = permissionKey.split(':');

    if (scope.tenantId) {
      const moduleEnabled = await this.isModuleEnabled(scope.tenantId, moduleKey);
      if (!moduleEnabled) return false;
    }

    const granted = await this.permissionRepository.getPermissionKeysForUser(userId);
    const delegated = await this.permissionRepository.getDelegatedPermissionKeys(userId);
    const all = new Set([...granted, ...delegated]);

    if (all.has('*')) return true;
    if (all.has(`${moduleKey}:*`)) return true;
    return all.has(permissionKey);
  }

  private async isModuleEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
    // Core modules (auth, user, rbac, settings, subscription, audit, notification, tenant)
    // are always available — they're the foundation, not purchasable add-ons.
    const CORE_MODULES = new Set(['tenant', 'auth', 'user', 'rbac', 'settings', 'subscription', 'audit', 'notification']);
    if (CORE_MODULES.has(moduleKey)) return true;

    const [access] = await db
      .select()
      .from(moduleAccessTable)
      .where(and(eq(moduleAccessTable.tenantId, tenantId), eq(moduleAccessTable.moduleKey, moduleKey)))
      .limit(1);

    if (!access || !access.isEnabled) return false;
    if (access.expiresAt && access.expiresAt < new Date()) return false;
    return true;
  }
}
