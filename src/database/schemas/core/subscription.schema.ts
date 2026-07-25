import {
  pgTable,
  varchar,
  boolean,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  bigint,
} from 'drizzle-orm/pg-core';
import { idColumn, timestamps, isActiveColumn } from './_shared.columns.js';
import { tenantsTable } from './multi-tenancy.schema.js';

/** Plans — sellable packages; `moduleKeys` is what actually drives Module Access on purchase. */
export const plansTable = pgTable(
  'plans',
  {
    id: idColumn(),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 60 }).notNull(),
    description: text('description'),
    moduleKeys: jsonb('module_keys').default([]), // modules unlocked by this plan, e.g. ['hrms', 'crm']
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('USD').notNull(),
    billingCycle: varchar('billing_cycle', { length: 20 }).default('monthly').notNull(), // monthly | yearly
    trialDays: integer('trial_days').default(0).notNull(),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ codeIdx: uniqueIndex('plans_code_idx').on(t.code) }),
);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
]);

/** Subscriptions — a tenant's active/historical subscription to a plan. */
export const subscriptionsTable = pgTable(
  'subscriptions',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    planId: bigint('plan_id', { mode: 'number' })
      .notNull()
      .references(() => plansTable.id, { onDelete: 'restrict' }),
    status: subscriptionStatusEnum('status').default('trialing').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({ tenantIdx: index('subscriptions_tenant_idx').on(t.tenantId) }),
);

/** Coupons — discount codes applicable at checkout/renewal. */
export const couponsTable = pgTable(
  'coupons',
  {
    id: idColumn(),
    code: varchar('code', { length: 60 }).notNull(),
    percentOff: integer('percent_off'),
    amountOff: numeric('amount_off', { precision: 12, scale: 2 }),
    maxRedemptions: integer('max_redemptions'),
    redemptionCount: integer('redemption_count').default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: isActiveColumn(),
    ...timestamps,
  },
  (t) => ({ codeIdx: uniqueIndex('coupons_code_idx').on(t.code) }),
);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible',
]);

/** Invoices — one per billing period per subscription. */
export const invoicesTable = pgTable(
  'invoices',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    subscriptionId: bigint('subscription_id', { mode: 'number' }).references(
      () => subscriptionsTable.id,
      { onDelete: 'set null' },
    ),
    invoiceNumber: varchar('invoice_number', { length: 60 }).notNull(),
    status: invoiceStatusEnum('status').default('open').notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    tax: numeric('tax', { precision: 12, scale: 2 }).default('0').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('USD').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    tenantIdx: index('invoices_tenant_idx').on(t.tenantId),
    numberIdx: uniqueIndex('invoices_number_idx').on(t.invoiceNumber),
  }),
);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);

/** Payments — settlement attempts against an invoice. */
export const paymentsTable = pgTable(
  'payments',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    invoiceId: bigint('invoice_id', { mode: 'number' })
      .notNull()
      .references(() => invoicesTable.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('USD').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    method: varchar('method', { length: 40 }), // card | bank_transfer | wallet
    gatewayReference: varchar('gateway_reference', { length: 150 }),
    ...timestamps,
  },
  (t) => ({ invoiceIdx: index('payments_invoice_idx').on(t.invoiceId) }),
);

/** Usage Meter — metered consumption per tenant (seats, API calls, storage GB, ...) for usage-based billing. */
export const usageMetersTable = pgTable(
  'usage_meters',
  {
    id: idColumn(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),
    subscriptionId: bigint('subscription_id', { mode: 'number' }).references(
      () => subscriptionsTable.id,
      { onDelete: 'cascade' },
    ),
    metricKey: varchar('metric_key', { length: 80 }).notNull(), // e.g. 'seats', 'api_calls', 'storage_gb'
    quantity: numeric('quantity', { precision: 14, scale: 2 }).default('0').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ tenantMetricIdx: index('usage_meters_tenant_metric_idx').on(t.tenantId, t.metricKey) }),
);

export type Plan = typeof plansTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type Coupon = typeof couponsTable.$inferSelect;
export type UsageMeter = typeof usageMetersTable.$inferSelect;
