/**
 * Central registry of DI tokens (tsyringe).
 *
 * Every repository / service in the system is registered against a token here.
 * New modules (HRMS, CRM, ...) should add their tokens in this same pattern —
 * grouped under a namespaced const object so container registration stays
 * predictable and collision-free across 100+ modules.
 */

export const TOKENS = {
  // Infra
  Database: Symbol.for('Database'),
  Logger: Symbol.for('Logger'),
  BetterAuth: Symbol.for('BetterAuth'),

  // Multi-Tenancy
  TenantRepository: Symbol.for('TenantRepository'),
  TenantService: Symbol.for('TenantService'),
  TenantController: Symbol.for('TenantController'),
  OrganizationRepository: Symbol.for('OrganizationRepository'),
  OrganizationService: Symbol.for('OrganizationService'),
  BranchRepository: Symbol.for('BranchRepository'),
  BranchService: Symbol.for('BranchService'),
  BusinessUnitRepository: Symbol.for('BusinessUnitRepository'),
  BusinessUnitService: Symbol.for('BusinessUnitService'),
  DepartmentRepository: Symbol.for('DepartmentRepository'),
  DepartmentService: Symbol.for('DepartmentService'),
  CostCenterRepository: Symbol.for('CostCenterRepository'),
  CostCenterService: Symbol.for('CostCenterService'),
  WorkspaceRepository: Symbol.for('WorkspaceRepository'),
  WorkspaceService: Symbol.for('WorkspaceService'),

  // Auth
  AuthController: Symbol.for('AuthController'),
  AuthService: Symbol.for('AuthService'),
  SessionRepository: Symbol.for('SessionRepository'),
  SessionService: Symbol.for('SessionService'),
  OAuthAccountRepository: Symbol.for('OAuthAccountRepository'),
  OtpRepository: Symbol.for('OtpRepository'),
  OtpService: Symbol.for('OtpService'),
  MfaRepository: Symbol.for('MfaRepository'),
  MfaService: Symbol.for('MfaService'),
  DeviceRepository: Symbol.for('DeviceRepository'),
  DeviceService: Symbol.for('DeviceService'),
  PasswordPolicyRepository: Symbol.for('PasswordPolicyRepository'),
  PasswordPolicyService: Symbol.for('PasswordPolicyService'),

  // User Management
  UserRepository: Symbol.for('UserRepository'),
  UserService: Symbol.for('UserService'),
  UserController: Symbol.for('UserController'),
  EmployeeRepository: Symbol.for('EmployeeRepository'),
  EmployeeService: Symbol.for('EmployeeService'),
  ContactRepository: Symbol.for('ContactRepository'),
  ContactService: Symbol.for('ContactService'),
  TeamRepository: Symbol.for('TeamRepository'),
  TeamService: Symbol.for('TeamService'),
  GroupRepository: Symbol.for('GroupRepository'),
  GroupService: Symbol.for('GroupService'),

  // RBAC
  RoleRepository: Symbol.for('RoleRepository'),
  RoleService: Symbol.for('RoleService'),
  RoleController: Symbol.for('RoleController'),
  PermissionRepository: Symbol.for('PermissionRepository'),
  PermissionService: Symbol.for('PermissionService'),
  PermissionController: Symbol.for('PermissionController'),
  PolicyRepository: Symbol.for('PolicyRepository'),
  PolicyService: Symbol.for('PolicyService'),
  PermissionGroupRepository: Symbol.for('PermissionGroupRepository'),
  ModuleAccessRepository: Symbol.for('ModuleAccessRepository'),
  ModuleAccessService: Symbol.for('ModuleAccessService'),
  FeatureAccessRepository: Symbol.for('FeatureAccessRepository'),
  DataScopeRepository: Symbol.for('DataScopeRepository'),
  ApprovalRightsRepository: Symbol.for('ApprovalRightsRepository'),
  DelegationRepository: Symbol.for('DelegationRepository'),
  DelegationService: Symbol.for('DelegationService'),
  TemporaryAccessRepository: Symbol.for('TemporaryAccessRepository'),
  TemporaryAccessService: Symbol.for('TemporaryAccessService'),
  AuthorizationService: Symbol.for('AuthorizationService'),

  // Settings
  SettingsRepository: Symbol.for('SettingsRepository'),
  SettingsService: Symbol.for('SettingsService'),
  SettingsController: Symbol.for('SettingsController'),
  ApiKeyRepository: Symbol.for('ApiKeyRepository'),
  ApiKeyService: Symbol.for('ApiKeyService'),

  // Subscription
  PlanRepository: Symbol.for('PlanRepository'),
  PlanService: Symbol.for('PlanService'),
  PlanController: Symbol.for('PlanController'),
  SubscriptionRepository: Symbol.for('SubscriptionRepository'),
  SubscriptionService: Symbol.for('SubscriptionService'),
  SubscriptionController: Symbol.for('SubscriptionController'),
  InvoiceRepository: Symbol.for('InvoiceRepository'),
  InvoiceService: Symbol.for('InvoiceService'),
  PaymentRepository: Symbol.for('PaymentRepository'),
  CouponRepository: Symbol.for('CouponRepository'),
  UsageMeterRepository: Symbol.for('UsageMeterRepository'),
  UsageMeterService: Symbol.for('UsageMeterService'),

  // Audit
  AuditLogRepository: Symbol.for('AuditLogRepository'),
  AuditLogService: Symbol.for('AuditLogService'),
  AuditLogController: Symbol.for('AuditLogController'),
  ActivityLogRepository: Symbol.for('ActivityLogRepository'),
  LoginLogRepository: Symbol.for('LoginLogRepository'),
  SecurityLogRepository: Symbol.for('SecurityLogRepository'),

  // Notification
  NotificationRepository: Symbol.for('NotificationRepository'),
  NotificationService: Symbol.for('NotificationService'),
  NotificationController: Symbol.for('NotificationController'),
  WebhookRepository: Symbol.for('WebhookRepository'),
  WebhookService: Symbol.for('WebhookService'),
} as const;

export type TokenKey = keyof typeof TOKENS;
