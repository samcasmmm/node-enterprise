# Phase 1: Implementation Blueprint

This document outlines the step-by-step feature breakdown for Phase 1. It catalogs each Module, its component Features, detailed functional explanations, and the specific database tables utilized (with no code).

---

## Module 1: Database Setup & Migration Management

### 1. Feature: Schema Deployment & Baseline Seeding

- **Detail:** Establish connection pools, execute database migrations via Drizzle, and seed static lookup data (timezones, ISO countries, currencies, and languages) required by the rest of the application.
- **Tables Used:**
  - `countries`
  - `currencies`
  - `timezones`
  - `localization`
  - `languages`
  - `country_subdivisions`

---

## Module 2: Identity Management (Authentication & Session)

### 1. Feature: User Registration & Credentials Authentication

- **Detail:** Enable signup and password authentication. Validate credentials, perform secure password hashing (Argon2id), store password change history, and track user profile details.
- **Tables Used:**
  - `users`
  - `user_profiles`
  - `user_credentials`
  - `password_history`

### 2. Feature: Session Tracking & Device Verification

- **Detail:** Track active session tokens (mapped through Better-Auth adapter), track client IP addresses and user agents, monitor trusted login devices, verify refresh token rotation families, and enforce idle timeouts.
- **Tables Used:**
  - `user_sessions`
  - `devices`
  - `refresh_tokens`
  - `trusted_devices`
  - `login_history`

### 3. Feature: OAuth Identity Binding

- **Detail:** Allow users to authenticate through third-party identities (Google, Microsoft, GitHub, SAML/OIDC) and link those identities to existing local user records.
- **Tables Used:**
  - `user_identities`

### 4. Feature: Multi-Factor Authentication (MFA)

- **Detail:** Support secondary checks (TOTP, backup codes, email/SMS OTP). Validate setup states and hash/verify backup codes during emergency logins.
- **Tables Used:**
  - `users`
  - `user_credentials`
  - `mfa_backup_codes`

---

## Module 3: Multi-Tenancy & Organization Units

### 1. Feature: Reseller & Tenant Setup

- **Detail:** Support reseller-tenant parent structures. Define tenant bounds (domain names, branding logos, primary currency, region) and handle partner-reseller mappings.
- **Tables Used:**
  - `partners`
  - `resellers`
  - `tenants`

### 2. Feature: Organization Hierarchy

- **Detail:** Map the legal structure of tenants (legal entities, subsidiaries, companies) and internal operations (business units, divisions, branches, departments, teams).
- **Tables Used:**
  - `organizations`
  - `legal_entities`
  - `companies`
  - `subsidiaries`
  - `branches`
  - `locations`
  - `business_units`
  - `divisions`
  - `departments`
  - `teams`

---

## Module 4: Licensing & Plan Subscriptions

### 1. Feature: Plan & Feature Templates

- **Detail:** Define subscription plans, package pricing, billing cycles, active module scopes, and feature listings mapped inside the application.
- **Tables Used:**
  - `module_categories`
  - `modules`
  - `module_dependencies`
  - `module_features`
  - `feature_dependencies`
  - `plans`
  - `plan_modules`
  - `plan_features`

### 2. Feature: Active Subscriptions & Licensing Limits

- **Detail:** Track tenant active subscriptions, trial boundaries, seat capacity limits (concurrent limits, storage limits), and module activations per company.
- **Tables Used:**
  - `subscriptions`
  - `licenses`

### 3. Feature: Feature Flags & Rollout Engine

- **Detail:** Support dynamic feature flag toggles and rules. Determine feature availability based on tenant, department, company, target user, environment, or rollout percentage.
- **Tables Used:**
  - `feature_flags`
  - `feature_flag_rules`

---

## Module 5: Authorization & Access Control (RBAC/ABAC)

### 1. Feature: Scope Definition & Custom Roles

- **Detail:** Create customizable system-level and tenant-level roles. Handle parent-child role inheritance hierarchies.
- **Tables Used:**
  - `scope_definitions`
  - `roles`
  - `role_hierarchy`
  - `role_groups`

### 2. Feature: Scope-Bound Permissions Mapping

- **Detail:** Map permissions (based on module, feature, action) to specific roles or users, defining access scope boundaries (e.g., global, tenant-wide, department-wide, or own-only).
- **Tables Used:**
  - `permission_actions`
  - `permission_groups`
  - `permissions`
  - `permission_scopes`
  - `role_permissions`
  - `memberships`
  - `user_roles`
  - `user_permissions`

### 3. Feature: Direct Access Grants

- **Detail:** Manage primary context assignments for users to specific company nodes, branches, departments, locations, teams, projects, or cost centers.
- **Tables Used:**
  - `company_access`
  - `branch_access`
  - `department_access`
  - `team_access`
  - `project_access`
  - `location_access`
  - `cost_center_access`

---

## Module 6: Auditing & Security Log Monitoring

### 1. Feature: Security Event Triggering

- **Detail:** Capture anomalous security events (brute force logins, credential stuffing, suspicious travel, token theft, etc.) and record resolution statuses.
- **Tables Used:**
  - `security_events`

### 2. Feature: Change Log Auditing

- **Detail:** Record entity changes (actions, actor details, before/after states, trace IDs, and correlation keys) across the tenant scope.
- **Tables Used:**
  - `audit_logs`

---

## Module 7: Platform Settings

### 1. Feature: Scoped Configurations Engine

- **Detail:** Manage global configuration records and custom scoped values (e.g. at platform level, tenant level, company level, or module level).
- **Tables Used:**
  - `settings`
  - `configuration`
