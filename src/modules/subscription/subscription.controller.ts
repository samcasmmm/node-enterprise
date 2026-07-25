import { inject, injectable } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import { HTTP_STATUS_CODES } from '@/shared/constants/index.js';
import type { Subscription } from '@/database/schemas/index.js';
import type { SubscriptionService } from './subscription.service.js';

@injectable()
export class SubscriptionController extends BaseController<Subscription, any> {
  constructor(
    @inject(TOKENS.SubscriptionService) private readonly subscriptionService: SubscriptionService,
  ) {
    super(subscriptionService, 'subscription');
  }

  purchase = asyncHandler(async (req: Request, res: Response) => {
    const subscription = await this.subscriptionService.purchase(
      req.tenant!.tenantId!,
      req.body.planId,
    );
    res.build
      .withModule('subscription')
      .withStatus(HTTP_STATUS_CODES.CREATED)
      .withMessage('Plan purchased.')
      .withData(subscription)
      .send();
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    await this.subscriptionService.cancel(req.tenant!.tenantId!);
    res.build
      .withModule('subscription')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('Subscription cancelled.')
      .send();
  });
}
