import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  price: z.number().min(0, 'Price must be non-negative'),
});

export type CreateBookDto = z.infer<typeof createBookSchema>;
