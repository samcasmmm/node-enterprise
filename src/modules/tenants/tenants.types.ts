import { type TenantConfig } from '@/shared/database/tenant-manager.js';
import { type tenantUsers } from '@/shared/database/index.js';

export type TenantProfile = TenantConfig;
export type DynamicUserRecord = typeof tenantUsers.$inferSelect;
