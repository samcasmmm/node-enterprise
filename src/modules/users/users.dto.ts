import { z } from 'zod';

export const userUpdateSchema = z.object({
  userName: z.string().optional(),
});

export interface UserResponse {
  id: number;
  userName: string;
  createdAt: Date;
}
