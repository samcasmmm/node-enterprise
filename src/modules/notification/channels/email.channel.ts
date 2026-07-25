import { injectable } from 'tsyringe';
import type { NotificationChannel, NotificationPayload } from './notification-channel.interface.js';
import { logger } from '@/shared/logger/index.js';

/** Delegates to the existing src/integrations/email transport already in this project. */
@injectable()
export class EmailChannel implements NotificationChannel {
  readonly key = 'email';

  async send(payload: NotificationPayload) {
    try {
      const transporter = (await import('@/integrations/email/email.config.js')).default;
      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: payload.to,
        subject: payload.title ?? '',
        html: payload.body,
      });
      return { success: true };
    } catch (error: any) {
      logger.warn('Email send failed.', { to: payload.to, error: error.message });
      return { success: false, error: error.message };
    }
  }
}
