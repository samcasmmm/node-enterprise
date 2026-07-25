import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/core/errors/index.js';

/**
 * Resolves the multi-tenancy scope for the current request and attaches it
 * as req.tenant. Every module's BaseController reads from req.tenant so
 * queries are automatically scoped — modules never trust client-supplied
 * tenant IDs in the body.
 *
 * Resolution order:
 *  1. Authenticated session (req.user.tenantId / organizationId / branchId) — trusted
 *  2. X-Tenant-Id header — only for pre-auth / public tenant-resolution flows (e.g. login)
 */
export function tenantResolver(options: { required?: boolean } = { required: true }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const headerTenantId = req.header('x-tenant-id')
      ? Number(req.header('x-tenant-id'))
      : undefined;
    const headerOrgId = req.header('x-organization-id')
      ? Number(req.header('x-organization-id'))
      : undefined;
    const headerBranchId = req.header('x-branch-id')
      ? Number(req.header('x-branch-id'))
      : undefined;

    const tenantId = req.user?.tenantId ?? headerTenantId;
    const organizationId = req.user?.organizationId ?? headerOrgId;
    const branchId = req.user?.branchId ?? headerBranchId;

    if (options.required && !tenantId) {
      throw new UnauthorizedError('Tenant context is required for this request.');
    }

    req.tenant = { tenantId, organizationId, branchId };
    next();
  };
}

export default tenantResolver;
