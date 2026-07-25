import { z } from 'zod';

export const dispatchNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  channel: z.enum(['email', 'sms', 'push', 'whatsapp', 'slack', 'teams', 'discord', 'webhook']),
  to: z.string().min(1),
  templateKey: z.string().optional(),
  title: z.string().optional(),
  body: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
});
