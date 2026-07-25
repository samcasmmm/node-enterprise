import { injectable } from 'tsyringe';
import {
  notificationsTable,
  type NotificationLog,
  type NewNotificationLog,
} from '@/database/schemas/index.js';
import { BaseRepository } from '@/core/base/base.repository.js';

@injectable()
export class NotificationRepository extends BaseRepository<
  typeof notificationsTable,
  NotificationLog,
  NewNotificationLog
> {
  constructor() {
    super(notificationsTable);
  }
}
