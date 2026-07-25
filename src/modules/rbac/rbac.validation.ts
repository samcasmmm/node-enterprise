import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const setPermissionsSchema = z.object({
  permissionIds: z.array(z.coerce.number()),
});

export const assignRoleSchema = z.object({
  userId: z.coerce.number(),
  branchId: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
});
