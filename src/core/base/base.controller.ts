import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { HTTP_STATUS_CODES, HTTP_MESSAGE } from '@/shared/constants/index.js';
import type { BaseService } from './base.service.js';
import type { TenantScope } from './base.repository.js';

/**
 * BaseController<TSelect, TInsert>
 *
 * Wires a BaseService to Express request handlers. Module controllers extend
 * this to get list/paginate/getById/create/update/remove for free, then add
 * module-specific endpoints on top.
 */
export abstract class BaseController<TSelect extends Record<string, any>, TInsert extends Record<string, any>> {
  protected constructor(
    protected readonly service: BaseService<TSelect, TInsert>,
    protected readonly moduleName: string,
  ) {}

  protected scopeFrom(req: Request): TenantScope {
    return {
      tenantId: req.tenant?.tenantId,
      organizationId: req.tenant?.organizationId,
      branchId: req.tenant?.branchId,
    };
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sortBy, sortDir } = req.query as Record<string, string>;
    const result = await this.service.paginate(
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, sortBy, sortDir: sortDir as 'asc' | 'desc' },
      this.scopeFrom(req),
    );
    res.build
      .withModule(this.moduleName)
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage(HTTP_MESSAGE.SUCCESS.FETCHED)
      .withData(result.data)
      .withMeta(result.meta)
      .send();
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.getById(req.params.id, this.scopeFrom(req));
    res.build
      .withModule(this.moduleName)
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage(HTTP_MESSAGE.SUCCESS.FETCHED)
      .withData(record)
      .send();
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.create({ ...req.body, ...this.scopeFrom(req) });
    res.build
      .withModule(this.moduleName)
      .withStatus(HTTP_STATUS_CODES.CREATED)
      .withMessage(HTTP_MESSAGE.SUCCESS.CREATED)
      .withData(record)
      .send();
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.update(req.params.id, req.body, this.scopeFrom(req));
    res.build
      .withModule(this.moduleName)
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage(HTTP_MESSAGE.SUCCESS.UPDATED)
      .withData(record)
      .send();
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.service.remove(req.params.id, this.scopeFrom(req));
    res.build
      .withModule(this.moduleName)
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage(HTTP_MESSAGE.SUCCESS.DELETED)
      .send();
  });
}
