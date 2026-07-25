import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '@/core/errors/index.js';

/**
 * Generic zod request validator. Validates body by default; pass a schema
 * shaped as z.object({ body, params, query }) to validate multiple parts.
 */
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const target = (schema as any).shape?.body
      ? { body: req.body, params: req.params, query: req.query }
      : req.body;

    const result = schema.safeParse(target);
    if (!result.success) {
      throw ValidationError.fromZod(result.error);
    }

    if ((schema as any).shape?.body) {
      req.body = (result.data as any).body ?? req.body;
    } else {
      req.body = result.data;
    }
    next();
  };
}
