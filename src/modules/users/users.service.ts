import { mainDb as db } from '@/shared/database/main-db.js';
import { tenantUsers as usersTable } from '@/shared/database/index.js';

export class UsersService {
  constructor() {}

  async health(): Promise<any[]> {
    return db.select().from(usersTable);
  }
}
