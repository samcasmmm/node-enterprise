import { AppError } from './domain.error.js';

export class ForbiddenError extends AppError {
  constructor(permissionKey?: string) {
    super(
      permissionKey ? `You do not have the '${permissionKey}' permission.` : 'Permission denied.',
      403,
      'FORBIDDEN',
    );
  }
}
