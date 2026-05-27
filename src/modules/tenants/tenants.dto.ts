import { z } from 'zod';

export const tenantQuerySchema = z.object({
  tenantId: z.string().optional(),
});

export type TenantQueryDto = z.infer<typeof tenantQuerySchema>;
