import { injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { passwordPoliciesTable, type PasswordPolicy } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class PasswordPolicyRepository extends BaseRepository<typeof passwordPoliciesTable, PasswordPolicy, any> {
  constructor() {
    super(passwordPoliciesTable);
  }

  async findForTenant(tenantId: string): Promise<PasswordPolicy | null> {
    const [row] = await db.select().from(passwordPoliciesTable).where(eq(passwordPoliciesTable.tenantId, tenantId)).limit(1);
    return row ?? null;
  }
}
