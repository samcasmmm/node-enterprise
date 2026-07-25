import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const setPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});
