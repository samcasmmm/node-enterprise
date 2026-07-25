import { injectable } from 'tsyringe';
import { plansTable, type Plan } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class PlanRepository extends BaseRepository<typeof plansTable, Plan, any> {
  constructor() {
    super(plansTable);
  }
}
