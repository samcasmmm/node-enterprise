import { inject, injectable } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import { TOKENS } from '@/core/container/tokens.js';
import { HTTP_STATUS_CODES } from '@/shared/constants/index.js';
import type { SettingsService } from './settings.service.js';

@injectable()
export class SettingsController {
  constructor(@inject(TOKENS.SettingsService) private readonly settingsService: SettingsService) {}

  getCategory = asyncHandler(async (req: Request, res: Response) => {
    const values = await this.settingsService.getCategory(req.tenant!.tenantId!, req.params.category);
    res.build.withModule('settings').withStatus(HTTP_STATUS_CODES.OK).withMessage('Settings fetched.').withData(values).send();
  });

  setCategory = asyncHandler(async (req: Request, res: Response) => {
    await this.settingsService.setCategory(req.tenant!.tenantId!, req.params.category, req.body.values, req.body.secretKeys ?? []);
    res.build.withModule('settings').withStatus(HTTP_STATUS_CODES.OK).withMessage('Settings updated.').send();
  });
}
