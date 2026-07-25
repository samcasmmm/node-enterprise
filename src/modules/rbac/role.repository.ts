import { injectable } from 'tsyringe';
import { rolesTable, type Role, type NewRole } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class RoleRepository extends BaseRepository<typeof rolesTable, Role, NewRole> {
  constructor() {
    super(rolesTable);
  }
}
