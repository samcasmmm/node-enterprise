import jwt from 'jsonwebtoken';
import { tenantManager } from '@/shared/database/tenant-manager.js';
import { type LoginDto } from './auth.dto.js';
import { type AuthSession } from './auth.types.js';

/**
 * Authenticates the user in the selected dynamic database and generates a JWT.
 */
export async function login(dto: LoginDto): Promise<AuthSession | null> {
  const matchedUser = await tenantManager.authenticateTenantUser(
    dto.tenantId,
    dto.userName,
    dto.password
  );

  if (!matchedUser) {
    return null;
  }

  const token = jwt.sign(
    {
      tenantId: dto.tenantId,
      userId: matchedUser.id,
      userName: matchedUser.userName,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );

  return {
    token,
    user: {
      id: matchedUser.id,
      userName: matchedUser.userName,
    },
  };
}
