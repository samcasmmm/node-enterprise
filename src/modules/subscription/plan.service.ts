import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import type { Plan } from '@/database/schemas/index.js';
import type { PlanRepository } from './plan.repository.js';

@injectable()
export class PlanService extends BaseService<Plan, any> {
  constructor(@inject(TOKENS.PlanRepository) planRepository: PlanRepository) {
    super(planRepository, 'Plan');
  }
}
