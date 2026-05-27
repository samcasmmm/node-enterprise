import {type Request, type Response,type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { tenantManager } from '../../shared/database/tenant-manager.js';

export const attachTenantDb = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let tenantIdStr: string | undefined;

    // 1. Resolve tenant ID from Request Headers (e.g. x-tenant-id or tenant-id)
    const headerId = req.headers['x-tenant-id'] || req.headers['tenant-id'];
    if (typeof headerId === 'string') {
      tenantIdStr = headerId;
    }

    // 2. Resolve tenant ID from JWT Payload if authorization headers are present
    const authHeader = req.headers.authorization;
    if (!tenantIdStr && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { tenantId?: number | string };
        if (decoded.tenantId) {
          tenantIdStr = String(decoded.tenantId);
        }
      } catch (err) {
        // Log token parsing failure if required, but gracefully fallback to other checks
      }
    }

    // 3. Resolve tenant ID from Request Body
    if (!tenantIdStr && req.body && typeof req.body === 'object' && 'tenantId' in req.body) {
      tenantIdStr = String(req.body.tenantId);
    }

    // 4. Resolve tenant ID from Request Query Parameters
    if (!tenantIdStr && req.query && typeof req.query.tenantId === 'string') {
      tenantIdStr = req.query.tenantId;
    }

    // Return a 400 Bad Request error if the tenant ID is missing from the request flow
    if (!tenantIdStr) {
      res.status(400).json({
        success: false,
        error: 'Multi-tenant routing failed: Tenant identification missing',
      });
      return;
    }

    const tenantId = parseInt(tenantIdStr, 10);
    if (isNaN(tenantId)) {
      res.status(400).json({
        success: false,
        error: 'Multi-tenant routing failed: Invalid tenantId format. Must be a valid integer.',
      });
      return;
    }

    // Establish dynamic connection pool and retrieve strictly-typed Drizzle DB instance
    const connection = await tenantManager.getTenantConnection(tenantId);
    const tenantConfig = await tenantManager.getTenantConfig(tenantId);

    if (!tenantConfig) {
      res.status(404).json({
        success: false,
        error: `Multi-tenant routing failed: Tenant with ID ${tenantId} is either inactive or does not exist.`,
      });
      return;
    }

    // Map instances onto Express request mapping
    req.db = connection.db;
    req.tenant = tenantConfig;
    req.tenantId = tenantId;

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Multi-tenant routing failed: Unable to acquire a valid connection for the specified tenant.',
    });
  }
};
export default attachTenantDb;
