import type { Request, Response } from 'express';
import * as service from './users.service.js';

export async function health(req: Request, res: Response): Promise<void> {
  try {
    const data = await service.health();
    res.json({
      module: 'users',
      status: 'ok',
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
