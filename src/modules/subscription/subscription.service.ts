import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import { moduleAccessTable } from '@/database/schemas/index.js';
import { db } from '@/config/db.config.js';
import { NotFoundError } from '@/core/errors/index.js';
import type { Subscription } from '@/database/schemas/index.js';
import type { SubscriptionRepository } from './subscription.repository.js';
import type { PlanRepository } from './plan.repository.js';

/**
 * SubscriptionService — purchasing a plan is what flips module_access rows
 * on for a tenant (the RBAC gate every requirePermission() check reads).
 * This is the literal implementation of "access given when each module is
 * purchased" from the brief.
 */
@injectable()
export class SubscriptionService extends BaseService<Subscription, any> {
  constructor(
    @inject(TOKENS.SubscriptionRepository) private readonly subscriptionRepository: SubscriptionRepository,
    @inject(TOKENS.PlanRepository) private readonly planRepository: PlanRepository,
  ) {
    super(subscriptionRepository, 'Subscription');
  }

  async purchase(tenantId: number, planId: number): Promise<Subscription> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) throw new NotFoundError('Plan');

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

    const subscription = await this.subscriptionRepository.create({
      tenantId,
      planId,
      status: plan.trialDays > 0 ? 'trialing' : 'active',
      currentPeriodEnd: periodEnd,
      trialEndsAt: plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 86400000) : undefined,
    } as any);

    const moduleKeys = (plan.moduleKeys as string[] | null) ?? [];
    for (const moduleKey of moduleKeys) {
      await db
        .insert(moduleAccessTable)
        .values({ tenantId, moduleKey, isEnabled: true, sourceSubscriptionId: subscription.id })
        .onConflictDoUpdate({
          target: [moduleAccessTable.tenantId, moduleAccessTable.moduleKey],
          set: { isEnabled: true, sourceSubscriptionId: subscription.id, expiresAt: null },
        });
    }

    return subscription;
  }

  async cancel(tenantId: number): Promise<void> {
    const subscription = await this.subscriptionRepository.findActiveForTenant(tenantId);
    if (!subscription) throw new NotFoundError('Subscription');
    await this.subscriptionRepository.updateById(subscription.id, { status: 'cancelled', cancelledAt: new Date() } as any);
  }
}
