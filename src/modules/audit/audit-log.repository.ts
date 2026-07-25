import { injectable } from 'tsyringe';
import { auditLogsTable, type AuditLog, type NewAuditLog } from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class AuditLogRepository extends BaseRepository<
  typeof auditLogsTable,
  AuditLog,
  NewAuditLog
> {
  constructor() {
    super(auditLogsTable);
  }
}
