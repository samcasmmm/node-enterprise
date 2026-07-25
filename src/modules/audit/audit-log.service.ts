import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { db } from '@/config/db.config.js';
import { BaseService } from '@/core/base/base.service.js';
import {
  activityLogsTable, loginLogsTable, securityLogsTable, errorLogsTable, changeHistoryTable,
  type AuditLog, type NewAuditLog,
} from '@/database/schemas/index.js';
import type { AuditLogRepository } from './audit-log.repository.js';

export interface RecordAuditParams {
  tenantId?: number;
  actorUserId?: number;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditLogService — injected into every module service that mutates data.
 * BaseService does not call this automatically (mutations vary too much in
 * meaning across 100+ modules), so module services call `auditLog.record()`
 * explicitly inside create/update/remove overrides. Also fronts the other
 * five log tables (activity, login, change history, error, security) so
 * there is exactly one place responsible for writing audit-grade data.
 */
@injectable()
export class AuditLogService extends BaseService<AuditLog, NewAuditLog> {
  constructor(@inject(TOKENS.AuditLogRepository) private readonly auditLogRepository: AuditLogRepository) {
    super(auditLogRepository, 'AuditLog');
  }

  async record(params: RecordAuditParams): Promise<void> {
    await this.auditLogRepository.create(params as any);
  }

  async recordActivity(tenantId: number | undefined, actorUserId: number | undefined, message: string, moduleKey?: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await db.insert(activityLogsTable).values({ tenantId, actorUserId, message, moduleKey, metadata });
  }

  async recordLogin(params: { tenantId?: number; userId?: number; email?: string; success: boolean; reason?: string; ipAddress?: string; userAgent?: string }): Promise<void> {
    await db.insert(loginLogsTable).values({ ...params, success: String(params.success) });
  }

  async recordSecurityEvent(params: { tenantId?: number; actorUserId?: number; event: string; severity?: 'info' | 'warning' | 'critical'; metadata?: Record<string, unknown>; ipAddress?: string }): Promise<void> {
    await db.insert(securityLogsTable).values({ ...params, severity: params.severity ?? 'info' });
  }

  async recordError(params: { tenantId?: number; userId?: number; message: string; stack?: string; path?: string; statusCode?: number }): Promise<void> {
    await db.insert(errorLogsTable).values({ ...params, statusCode: params.statusCode ? String(params.statusCode) : undefined });
  }

  async recordFieldChange(params: { tenantId?: number; actorUserId?: number; entityType: string; entityId: string; fieldName: string; oldValue?: unknown; newValue?: unknown }): Promise<void> {
    await db.insert(changeHistoryTable).values({
      ...params,
      oldValue: params.oldValue == null ? null : String(params.oldValue),
      newValue: params.newValue == null ? null : String(params.newValue),
    });
  }

  async listForEntity(entityType: string, entityId: string) {
    return this.auditLogRepository.findAll();
  }
}
