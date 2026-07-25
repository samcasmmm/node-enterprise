import { inject, injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db.config.js';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import {
  notificationTemplatesTable,
  type NotificationLog,
  type NewNotificationLog,
} from '@/database/schemas/index.js';
import type { NotificationRepository } from './notification.repository.js';
import type {
  NotificationChannel,
  NotificationPayload,
} from './channels/notification-channel.interface.js';
import { EmailChannel } from './channels/email.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
import { PushChannel } from './channels/push.channel.js';
import { WhatsappChannel } from './channels/whatsapp.channel.js';
import { SlackChannel } from './channels/slack.channel.js';
import { TeamsChannel } from './channels/teams.channel.js';
import { DiscordChannel } from './channels/discord.channel.js';
import { WebhookChannel } from './channels/webhook.channel.js';

export interface DispatchParams {
  tenantId?: number;
  userId?: number;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'slack' | 'teams' | 'discord' | 'webhook';
  to: string;
  templateKey?: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * NotificationService — the one place every module calls to notify a user,
 * regardless of channel. Channels are registered via the strategy pattern so
 * adding a new provider never means touching call sites in HRMS/CRM/etc.
 */
@injectable()
export class NotificationService extends BaseService<NotificationLog, NewNotificationLog> {
  private readonly channels: Map<string, NotificationChannel>;

  constructor(
    @inject(TOKENS.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {
    super(notificationRepository, 'Notification');
    this.channels = new Map(
      [
        new EmailChannel(),
        new SmsChannel(),
        new PushChannel(),
        new WhatsappChannel(),
        new SlackChannel(),
        new TeamsChannel(),
        new DiscordChannel(),
        new WebhookChannel(),
      ].map((c) => [c.key, c]),
    );
  }

  async resolveTemplate(tenantId: number | undefined, key: string, channel: string) {
    const [template] = await db
      .select()
      .from(notificationTemplatesTable)
      .where(eq(notificationTemplatesTable.key, key))
      .limit(1);
    return template;
  }

  private renderTemplate(body: string, data: Record<string, unknown> = {}): string {
    return body.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(data[key] ?? ''));
  }

  async dispatch(params: DispatchParams): Promise<NotificationLog> {
    const channel = this.channels.get(params.channel);
    if (!channel) throw new Error(`Unknown notification channel: ${params.channel}`);

    let body = params.body;
    let title = params.title;
    if (params.templateKey) {
      const template = await this.resolveTemplate(
        params.tenantId,
        params.templateKey,
        params.channel,
      );
      if (template) {
        body = this.renderTemplate(template.body, params.data);
        title = template.subject ?? title;
      }
    }

    const log = await this.notificationRepository.create({
      tenantId: params.tenantId,
      userId: params.userId,
      channel: params.channel,
      templateKey: params.templateKey,
      title,
      body,
      data: params.data ?? {},
      status: 'queued',
    } as NewNotificationLog);

    const result = await channel.send({ to: params.to, title, body, data: params.data });

    await this.notificationRepository.updateById(log.id, {
      status: result.success ? 'sent' : 'failed',
      sentAt: result.success ? new Date() : undefined,
      failReason: result.error,
    } as any);

    return log;
  }

  async markRead(id: number): Promise<void> {
    await this.notificationRepository.updateById(id, { status: 'read', readAt: new Date() } as any);
  }
}
