import { type Request, type Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as service from './users.service.js';

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.build.withStatus(401).fail().withMessage('Unauthorized').send();
    return;
  }
  const user = await service.getUserById(req.user.id);
  if (!user) {
    res.build.withStatus(404).fail().withMessage('User not found').send();
    return;
  }
  res.build.withStatus(200).success().withData(user).send();
});
