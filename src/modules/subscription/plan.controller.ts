import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import type { Plan } from '@/database/schemas/index.js';
import type { PlanService } from './plan.service.js';

@injectable()
export class PlanController extends BaseController<Plan, any> {
  constructor(@inject(TOKENS.PlanService) planService: PlanService) {
    super(planService, 'plan');
  }
}
