import jwt from 'jsonwebtoken';
import appConfig from '@/config/app.config.js';
import type { DecodedToken } from '@/core/middlewares/auth.middleware.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function issueTokens(payload: DecodedToken): TokenPair {
  const accessToken = jwt.sign(payload, appConfig.jwt.accessSecret, {
    expiresIn: appConfig.jwt.accessExpiration,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId: payload.userId }, appConfig.jwt.refreshSecret, {
    expiresIn: appConfig.jwt.refreshExpiration,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, appConfig.jwt.refreshSecret) as { userId: string };
}
