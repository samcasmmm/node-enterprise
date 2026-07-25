import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import type { AuditLog } from '@/database/schemas/index.js';
import type { AuditLogService } from './audit-log.service.js';

/** Audit logs are read-only from the API — create/update/remove are intentionally not exposed. */
@injectable()
export class AuditLogController extends BaseController<AuditLog, any> {
  constructor(@inject(TOKENS.AuditLogService) auditLogService: AuditLogService) {
    super(auditLogService, 'audit');
  }
}
