import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  phone: z.string().max(30).optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });
