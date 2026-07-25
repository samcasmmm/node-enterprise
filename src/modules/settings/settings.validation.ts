import { z } from 'zod';

export const setCategorySchema = z.object({
  values: z.record(z.string(), z.any()),
  secretKeys: z.array(z.string()).optional(),
});
