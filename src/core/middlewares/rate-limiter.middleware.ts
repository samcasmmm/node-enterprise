import type { Request, Response, NextFunction } from 'express';
import { HTTP_MESSAGE, HTTP_STATUS_CODES } from '@/shared/constants/index.js';

type RateLimitEntry = {
  count: number;
  lastRequest: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const store = new Map<string, RateLimitEntry>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = `register-rate-limit:${req.ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, lastRequest: now });
    next();
    return;
  }

  if (now - entry.lastRequest > WINDOW_MS) {
    store.set(key, { count: 1, lastRequest: now });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.build
      .withStatus(HTTP_STATUS_CODES.TOO_MANY_REQUESTS)
      .withMessage(HTTP_MESSAGE.RATE_LIMIT.EXCEEDED)
      .send();
  }

  entry.count += 1;
  entry.lastRequest = now;

  next();
}
