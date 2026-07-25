import { z } from 'zod';

export const purchaseSchema = z.object({
  planId: z.coerce.number(),
});

export const createPlanSchema = z.object({
  name: z.string().min(2).max(150),
  code: z.string().min(2).max(60),
  price: z.string(),
  currency: z.string().default('USD'),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  moduleKeys: z.array(z.string()).default([]),
  trialDays: z.number().int().min(0).default(0),
});
