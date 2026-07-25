/**
 * System-wide Platform Roles (Global System Level — tenantId: null)
 */
export const PLATFORM_ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full platform administrative control and system management access',
    isSystem: true,
  },
  {
    name: 'PLATFORM_ADMIN',
    description: 'Manage tenants, subscriptions, module entitlements, and pricing plans',
    isSystem: true,
  },
  {
    name: 'SUPPORT',
    description: 'Customer support operations and tenant session impersonation access',
    isSystem: true,
  },
  {
    name: 'BILLING_ADMIN',
    description: 'Manage platform billing, invoices, payments, and subscription accounting',
    isSystem: true,
  },
  {
    name: 'DEVELOPER',
    description: 'Internal platform development, API testing, and integration maintenance',
    isSystem: true,
  },
  {
    name: 'AUDITOR',
    description: 'Read-only platform-wide audit log and compliance review access',
    isSystem: true,
  },
] as const;

/**
 * Tenant Roles (Organization / Company Level — seeded per tenantId)
 */
export const TENANT_ROLES = [
  {
    name: 'OWNER',
    description: 'Organization owner (created during registration with full tenant rights)',
    isSystem: true,
  },
  {
    name: 'SUPER_ADMIN',
    description: 'Full access to all tenant modules, settings, and business data',
    isSystem: true,
  },
  {
    name: 'ADMIN',
    description: 'Manage users, roles, permissions, modules, and workspace settings',
    isSystem: true,
  },
  {
    name: 'MANAGER',
    description: 'Department or team manager with approval and team management rights',
    isSystem: false,
  },
  {
    name: 'SUPERVISOR',
    description: 'Team lead with limited management and operational supervision permissions',
    isSystem: false,
  },
  {
    name: 'EMPLOYEE',
    description: 'Standard employee access for daily operational tasks',
    isSystem: false,
  },
  {
    name: 'HR_MANAGER',
    description: 'Human Resources, employee directory, and payroll management',
    isSystem: false,
  },
  {
    name: 'ACCOUNTANT',
    description: 'Finance, general ledger, tax, invoicing, and accounting operations',
    isSystem: false,
  },
  {
    name: 'SALES_MANAGER',
    description: 'CRM, lead management, pipelines, and sales operations',
    isSystem: false,
  },
  {
    name: 'PURCHASE_MANAGER',
    description: 'Procurement, vendor management, and purchase order approvals',
    isSystem: false,
  },
  {
    name: 'INVENTORY_MANAGER',
    description: 'Warehouse, stock levels, product catalog, and inventory operations',
    isSystem: false,
  },
  {
    name: 'PROJECT_MANAGER',
    description: 'Project management, task assignments, and milestone tracking',
    isSystem: false,
  },
  {
    name: 'CUSTOMER_SUPPORT',
    description: 'Customer support ticketing and helpdesk operations',
    isSystem: false,
  },
  {
    name: 'VIEWER',
    description: 'Read-only access across enabled tenant modules',
    isSystem: false,
  },
  {
    name: 'CUSTOM',
    description: 'Tenant-defined custom role with customizable permission scope',
    isSystem: false,
  },
] as const;

export type PlatformRoleName = (typeof PLATFORM_ROLES)[number]['name'];
export type TenantRoleName = (typeof TENANT_ROLES)[number]['name'];
