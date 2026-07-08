import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import appConfig from '@/config/app.config.js';

export interface DecodedToken {
  userId: number;
  userName: string;
}

export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication token is missing or invalid.',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, appConfig.jwt.accessSecret) as DecodedToken;

    req.user = {
      id: decoded.userId,
      userName: decoded.userName,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token.',
    });
  }
};

export default isAuth;
