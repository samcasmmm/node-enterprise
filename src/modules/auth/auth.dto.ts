import { z } from 'zod';

export const loginSchema = z.object({
  tenantId: z.number(),
  userName: z.string(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof loginSchema>;
