import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9-]+$/),
  domain: z.string().max(255).optional(),
});

export const updateTenantSchema = createTenantSchema.partial();
