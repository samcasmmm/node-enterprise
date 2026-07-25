// Multi-Tenancy
export * from './core/multi-tenancy.schema.js';
// Identity (Users, Employees, Contacts, Teams, Groups)
export * from './core/users.schema.js';
// Authentication (Sessions, OAuth, OTP, MFA, Devices, Password Policy)
export * from './core/auth.schema.js';
// RBAC (Roles, Permissions, Policies, Module/Feature Access, Scopes, Delegation)
export * from './core/rbac.schema.js';
// Settings (General, Localization, Tax, Email/SMS/WhatsApp, Storage, API Keys, Branding)
export * from './core/settings.schema.js';
// Subscription & Billing (Plans, Subscriptions, Invoices, Payments, Coupons, Usage)
export * from './core/subscription.schema.js';
// Audit (Audit/Activity/Login/Security logs, Change History)
export * from './core/audit.schema.js';
// Notification (Templates, Logs, Webhooks)
export * from './core/notification.schema.js';

// Module namespaces (HRMS, CRM, ...) register themselves here as they're built.
// export * from './modules/hrms/index.js';
// export * from './modules/crm/index.js';
