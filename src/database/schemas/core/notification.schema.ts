import {
  pgTable,
  varchar,
  boolean,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  bigint,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps, isActiveColumn } from './_shared.columns.js';
import { tenantsTable } from './multi-tenancy.schema.js';
import { usersTable } from './users.schema.js';

export const notificationChannelEnum = pgEnum('notification_channel', [
  'email',
  'sms',
  'push',
  'whatsapp',
  'slack',
  'teams',
  'discord',
  'webhook',
]);

/** Templates — one content template per (tenant, channel, key), e.g. ('t1','email','invoice.paid'). */
export const notificationTemplatesTable = pgTable(
  'notification_templates',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenantsTable.id, {
      onDelete: 'cascade',
    }),
    key: varchar('key', { length: 150 }).notNull(), // e.g. 'invoice.paid', 'user.welcome'
    channel: notificationChannelEnum('channel').notNull(),
    subject: varchar('subject', { length: 255 }),
    body: text('body').notNull(), // supports {{placeholders}}
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({
    tenantKeyChannelIdx: uniqueIndex('notification_templates_tenant_key_channel_idx').on(
      t.tenantId,
      t.key,
      t.channel,
    ),
  }),
);

export const notificationStatusEnum = pgEnum('notification_status', [
  'queued',
  'sent',
  'delivered',
  'failed',
  'read',
]);

/** Notification Log — every dispatched notification, across every channel. */
export const notificationsTable = pgTable(
  'notifications',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenantsTable.id, {
      onDelete: 'cascade',
    }),
    userId: bigint('user_id', { mode: 'number' }).references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    channel: notificationChannelEnum('channel').notNull(),
    templateKey: varchar('template_key', { length: 150 }),
    title: varchar('title', { length: 255 }),
    body: text('body').notNull(),
    data: jsonb('data').default({}),
    status: notificationStatusEnum('status').default('queued').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failReason: text('fail_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('notifications_user_idx').on(t.userId),
    tenantIdx: index('notifications_tenant_idx').on(t.tenantId),
  }),
);

/** Webhooks — outbound event subscriptions a tenant configures (e.g. push CRM events to their own systems). */
export const webhooksTable = pgTable('webhooks', {
  id: idColumn(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenantsTable.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: jsonb('events').default([]), // e.g. ['invoice.paid', 'employee.created']
  secret: text('secret').notNull(), // HMAC signing secret for payload verification
  isActive: isActiveColumn(),
  ...timestamps,
});

/** Webhook Deliveries — attempt log per event fired to a webhook (for retries / debugging). */
export const webhookDeliveriesTable = pgTable(
  'webhook_deliveries',
  {
    id: idColumn(),
    webhookId: bigint('webhook_id', { mode: 'number' })
      .notNull()
      .references(() => webhooksTable.id, { onDelete: 'cascade' }),
    event: varchar('event', { length: 150 }).notNull(),
    payload: jsonb('payload').default({}),
    responseStatus: varchar('response_status', { length: 10 }),
    attempt: varchar('attempt', { length: 10 }).default('1'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ webhookIdx: index('webhook_deliveries_webhook_idx').on(t.webhookId) }),
);

export type NotificationTemplate = typeof notificationTemplatesTable.$inferSelect;
export type NotificationLog = typeof notificationsTable.$inferSelect;
export type NewNotificationLog = typeof notificationsTable.$inferInsert;
export type Webhook = typeof webhooksTable.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveriesTable.$inferSelect;
