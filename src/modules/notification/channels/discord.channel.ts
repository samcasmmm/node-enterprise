import { injectable } from 'tsyringe';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface.js';
import { logger } from '@/shared/logger/index.js';

/**
 * DiscordChannel — stub transport. Wire in the real provider SDK/HTTP call
 * (Twilio, FCM, WhatsApp Cloud API, Slack/Teams/Discord webhooks, ...) here;
 * the dispatcher and every other module only ever depend on the
 * NotificationChannel interface, so swapping providers never touches callers.
 */
@injectable()
export class DiscordChannel implements NotificationChannel {
  readonly key = 'discord';

  async send(payload: NotificationPayload) {
    logger.info(`[discord] would send to ${payload.to}`, { title: payload.title });
    return { success: true };
  }
}
