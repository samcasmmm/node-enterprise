import { injectable } from 'tsyringe';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface.js';
import { logger } from '@/shared/logger/index.js';

/**
 * WhatsappChannel — stub transport. Wire in the real provider SDK/HTTP call
 * (Twilio, FCM, WhatsApp Cloud API, Slack/Teams/Discord webhooks, ...) here;
 * the dispatcher and every other module only ever depend on the
 * NotificationChannel interface, so swapping providers never touches callers.
 */
@injectable()
export class WhatsappChannel implements NotificationChannel {
  readonly key = 'whatsapp';

  async send(payload: NotificationPayload) {
    logger.info(`[whatsapp] would send to ${payload.to}`, { title: payload.title });
    return { success: true };
  }
}
