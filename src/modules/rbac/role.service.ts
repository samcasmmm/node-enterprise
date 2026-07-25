import { inject, injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import {
  rolePermissionsTable,
  userRolesTable,
  type Role,
  type NewRole,
} from '@/database/schemas/index.js';
import type { RoleRepository } from './role.repository.js';

@injectable()
export class RoleService extends BaseService<Role, NewRole> {
  constructor(@inject(TOKENS.RoleRepository) private readonly roleRepository: RoleRepository) {
    super(roleRepository, 'Role');
  }

  async setPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await db.delete(rolePermissionsTable).where(eq(rolePermissionsTable.roleId, roleId));
    if (permissionIds.length) {
      await db
        .insert(rolePermissionsTable)
        .values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
    }
  }

  async assignToUser(
    userId: number,
    roleId: number,
    scope: { branchId?: number; departmentId?: number } = {},
  ): Promise<void> {
    await db.insert(userRolesTable).values({ userId, roleId, ...scope });
  }

  async unassignFromUser(userId: number, roleId: number): Promise<void> {
    await db.delete(userRolesTable).where(eq(userRolesTable.userId, userId));
  }
}
