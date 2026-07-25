import { Router, type RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { isAuth } from '@/core/middlewares/auth.middleware.js';
import { requirePermission } from '@/core/middlewares/rbac.middleware.js';
import { validate } from '@/core/middlewares/validate.middleware.js';
import type { BaseController } from './base.controller.js';

export interface CrudRouteOptions {
  /** RBAC key, e.g. 'user' -> user:read, user:create, user:update, user:delete */
  permissionKey: string;
  createSchema?: ZodType;
  updateSchema?: ZodType;
  /** Extra routes registered before the generic /:id routes */
  extend?: (router: Router) => void;
  /** Skip auth (e.g. public signup-style endpoints) — rare, default false */
  public?: boolean;
}

/**
 * buildCrudRouter — every module (Tenant, User, Role, ... HRMS/CRM entities)
 * gets a consistent REST surface (list/paginate, get, create, update, remove)
 * with auth + RBAC + validation wired in one call.
 */
export function buildCrudRouter(controller: BaseController<any, any>, options: CrudRouteOptions): Router {
  const router = Router();
  const guard: RequestHandler[] = options.public ? [] : [isAuth];

  options.extend?.(router);

  router.get('/', ...guard, requirePermission(`${options.permissionKey}:read`), controller.list);
  router.get('/:id', ...guard, requirePermission(`${options.permissionKey}:read`), controller.getById);
  router.post(
    '/',
    ...guard,
    requirePermission(`${options.permissionKey}:create`),
    ...(options.createSchema ? [validate(options.createSchema)] : []),
    controller.create,
  );
  router.patch(
    '/:id',
    ...guard,
    requirePermission(`${options.permissionKey}:update`),
    ...(options.updateSchema ? [validate(options.updateSchema)] : []),
    controller.update,
  );
  router.delete('/:id', ...guard, requirePermission(`${options.permissionKey}:delete`), controller.remove);

  return router;
}
