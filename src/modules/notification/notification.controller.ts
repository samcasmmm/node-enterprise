import { inject, injectable } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import { HTTP_STATUS_CODES } from '@/shared/constants/index.js';
import type { NotificationLog, NewNotificationLog } from '@/database/schemas/index.js';
import type { NotificationService } from './notification.service.js';

@injectable()
export class NotificationController extends BaseController<NotificationLog, NewNotificationLog> {
  constructor(@inject(TOKENS.NotificationService) private readonly notificationService: NotificationService) {
    super(notificationService, 'notification');
  }

  send = asyncHandler(async (req: Request, res: Response) => {
    const log = await this.notificationService.dispatch({ ...req.body, tenantId: req.tenant?.tenantId });
    res.build.withModule('notification').withStatus(HTTP_STATUS_CODES.CREATED).withMessage('Notification dispatched.').withData(log).send();
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    await this.notificationService.markRead(req.params.id);
    res.build.withModule('notification').withStatus(HTTP_STATUS_CODES.OK).withMessage('Marked as read.').send();
  });
}
