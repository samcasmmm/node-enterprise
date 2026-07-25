import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens.js';

// Tenant
import { TenantRepository } from '@/modules/tenant/tenant.repository.js';
import { TenantService } from '@/modules/tenant/tenant.service.js';
import { TenantController } from '@/modules/tenant/tenant.controller.js';

// User
import { UserRepository } from '@/modules/user/user.repository.js';
import { UserService } from '@/modules/user/user.service.js';
import { UserController } from '@/modules/user/user.controller.js';

// Auth
import { AuthService } from '@/modules/auth/auth.service.js';
import { AuthController } from '@/modules/auth/auth.controller.js';
import { SessionRepository } from '@/modules/auth/session.repository.js';
import { OtpRepository } from '@/modules/auth/otp.repository.js';
import { OtpService } from '@/modules/auth/otp.service.js';
import { MfaRepository } from '@/modules/auth/mfa.repository.js';
import { MfaService } from '@/modules/auth/mfa.service.js';
import { DeviceRepository } from '@/modules/auth/device.repository.js';
import { DeviceService } from '@/modules/auth/device.service.js';
import { PasswordPolicyRepository } from '@/modules/auth/password-policy.repository.js';

// RBAC
import { RoleRepository } from '@/modules/rbac/role.repository.js';
import { RoleService } from '@/modules/rbac/role.service.js';
import { RoleController } from '@/modules/rbac/role.controller.js';
import { PermissionRepository } from '@/modules/rbac/permission.repository.js';
import { PermissionService } from '@/modules/rbac/permission.service.js';
import { PermissionController } from '@/modules/rbac/permission.controller.js';
import { AuthorizationService } from '@/modules/rbac/authorization.service.js';

// Settings
import { SettingsRepository } from '@/modules/settings/settings.repository.js';
import { SettingsService } from '@/modules/settings/settings.service.js';
import { SettingsController } from '@/modules/settings/settings.controller.js';

// Subscription
import { PlanRepository } from '@/modules/subscription/plan.repository.js';
import { PlanService } from '@/modules/subscription/plan.service.js';
import { PlanController } from '@/modules/subscription/plan.controller.js';
import { SubscriptionRepository } from '@/modules/subscription/subscription.repository.js';
import { SubscriptionService } from '@/modules/subscription/subscription.service.js';
import { SubscriptionController } from '@/modules/subscription/subscription.controller.js';

// Audit
import { AuditLogRepository } from '@/modules/audit/audit-log.repository.js';
import { AuditLogService } from '@/modules/audit/audit-log.service.js';
import { AuditLogController } from '@/modules/audit/audit-log.controller.js';

// Notification
import { NotificationRepository } from '@/modules/notification/notification.repository.js';
import { NotificationService } from '@/modules/notification/notification.service.js';
import { NotificationController } from '@/modules/notification/notification.controller.js';

/**
 * registerContainer() — call once at process startup (server.ts), before any
 * route file resolves a controller from the container.
 *
 * Everything is registered as a singleton: one instance per process, shared
 * across requests, which is safe here because repositories/services hold no
 * per-request state (tenant scope is always passed as an argument, never
 * stored on `this`).
 *
 * New modules (HRMS, CRM, ...) add their own `registerXModule()` function in
 * this same file and call it from here — the pattern below is the template.
 */
export function registerContainer(): void {
  // Tenant
  container.registerSingleton(TOKENS.TenantRepository, TenantRepository);
  container.registerSingleton(TOKENS.TenantService, TenantService);
  container.registerSingleton(TOKENS.TenantController, TenantController);

  // User
  container.registerSingleton(TOKENS.UserRepository, UserRepository);
  container.registerSingleton(TOKENS.UserService, UserService);
  container.registerSingleton(TOKENS.UserController, UserController);

  // Auth
  container.registerSingleton(TOKENS.SessionRepository, SessionRepository);
  container.registerSingleton(TOKENS.OtpRepository, OtpRepository);
  container.registerSingleton(TOKENS.OtpService, OtpService);
  container.registerSingleton(TOKENS.MfaRepository, MfaRepository);
  container.registerSingleton(TOKENS.MfaService, MfaService);
  container.registerSingleton(TOKENS.DeviceRepository, DeviceRepository);
  container.registerSingleton(TOKENS.DeviceService, DeviceService);
  container.registerSingleton(TOKENS.PasswordPolicyRepository, PasswordPolicyRepository);
  container.registerSingleton(TOKENS.AuthService, AuthService);
  container.registerSingleton(TOKENS.AuthController, AuthController);

  // RBAC
  container.registerSingleton(TOKENS.RoleRepository, RoleRepository);
  container.registerSingleton(TOKENS.RoleService, RoleService);
  container.registerSingleton(TOKENS.RoleController, RoleController);
  container.registerSingleton(TOKENS.PermissionRepository, PermissionRepository);
  container.registerSingleton(TOKENS.PermissionService, PermissionService);
  container.registerSingleton(TOKENS.PermissionController, PermissionController);
  container.registerSingleton(TOKENS.AuthorizationService, AuthorizationService);

  // Settings
  container.registerSingleton(TOKENS.SettingsRepository, SettingsRepository);
  container.registerSingleton(TOKENS.SettingsService, SettingsService);
  container.registerSingleton(TOKENS.SettingsController, SettingsController);

  // Subscription
  container.registerSingleton(TOKENS.PlanRepository, PlanRepository);
  container.registerSingleton(TOKENS.PlanService, PlanService);
  container.registerSingleton(TOKENS.PlanController, PlanController);
  container.registerSingleton(TOKENS.SubscriptionRepository, SubscriptionRepository);
  container.registerSingleton(TOKENS.SubscriptionService, SubscriptionService);
  container.registerSingleton(TOKENS.SubscriptionController, SubscriptionController);

  // Audit
  container.registerSingleton(TOKENS.AuditLogRepository, AuditLogRepository);
  container.registerSingleton(TOKENS.AuditLogService, AuditLogService);
  container.registerSingleton(TOKENS.AuditLogController, AuditLogController);

  // Notification
  container.registerSingleton(TOKENS.NotificationRepository, NotificationRepository);
  container.registerSingleton(TOKENS.NotificationService, NotificationService);
  container.registerSingleton(TOKENS.NotificationController, NotificationController);
}

export { container };
export default registerContainer;

// Auto-register on import. This file must be imported first (for its side
// effect) in app.ts, before any module route file is imported — route files
// call container.resolve(...) at module top-level, and ESM executes each
// module's body the first time it's imported, so registration has to win
// the race by being imported earliest.
registerContainer();
