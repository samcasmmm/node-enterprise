import { injectable } from 'tsyringe';
import { eq, and } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import {
  permissionsTable,
  rolePermissionsTable,
  userRolesTable,
  rolesTable,
  groupRolesTable,
  groupMembersTable,
  delegationsTable,
  temporaryAccessTable,
  type Permission,
} from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class PermissionRepository extends BaseRepository<typeof permissionsTable, Permission, any> {
  constructor() {
    super(permissionsTable);
  }

  /** All permission keys granted to a user directly via roles + group-inherited roles. */
  async getPermissionKeysForUser(userId: number): Promise<Set<string>> {
    const directRolePerms = await db
      .select({ key: permissionsTable.key })
      .from(userRolesTable)
      .innerJoin(rolePermissionsTable, eq(rolePermissionsTable.roleId, userRolesTable.roleId))
      .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
      .where(eq(userRolesTable.userId, userId));

    const groupRolePerms = await db
      .select({ key: permissionsTable.key })
      .from(groupMembersTable)
      .innerJoin(groupRolesTable, eq(groupRolesTable.groupId, groupMembersTable.groupId))
      .innerJoin(rolePermissionsTable, eq(rolePermissionsTable.roleId, groupRolesTable.roleId))
      .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
      .where(eq(groupMembersTable.userId, userId));

    const now = new Date();
    const temporaryGrants = await db
      .select({ key: temporaryAccessTable.permissionKey })
      .from(temporaryAccessTable)
      .where(eq(temporaryAccessTable.userId, userId));

    const active = new Set<string>();
    [...directRolePerms, ...groupRolePerms].forEach((r) => active.add(r.key));
    temporaryGrants.filter((g: any) => !g.revokedAt).forEach((g) => active.add(g.key));

    return active;
  }

  /** Permission keys the user has access to via an active delegation from another user. */
  async getDelegatedPermissionKeys(userId: number): Promise<Set<string>> {
    const now = new Date();
    const delegations = await db
      .select()
      .from(delegationsTable)
      .where(eq(delegationsTable.delegateUserId, userId));
    const active = delegations.filter((d) => d.isActive && d.startsAt <= now && d.endsAt >= now);

    const keys = new Set<string>();
    for (const d of active) {
      if (!d.roleId) continue;
      const perms = await db
        .select({ key: permissionsTable.key })
        .from(rolePermissionsTable)
        .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
        .where(eq(rolePermissionsTable.roleId, d.roleId));
      perms.forEach((p) => keys.add(p.key));
    }
    return keys;
  }
}
