import { NotFoundError } from '@/core/errors/index.js';
import type { BaseRepository, PaginatedResult, PaginationParams, TenantScope } from './base.repository.js';

/**
 * BaseService<TSelect, TInsert>
 *
 * Thin orchestration layer over a BaseRepository. Module-specific services
 * extend this and override/add business rules; CRUD plumbing is free.
 */
export abstract class BaseService<TSelect extends Record<string, any>, TInsert extends Record<string, any>> {
  protected constructor(
    protected readonly repository: BaseRepository<any, TSelect, TInsert>,
    protected readonly resourceName: string = 'Resource',
  ) {}

  async list(scope?: TenantScope): Promise<TSelect[]> {
    return this.repository.findAll(scope);
  }

  async paginate(params: PaginationParams, scope?: TenantScope): Promise<PaginatedResult<TSelect>> {
    return this.repository.paginate(params, scope);
  }

  async getById(id: string | number, scope?: TenantScope): Promise<TSelect> {
    const record = await this.repository.findById(id, scope);
    if (!record) throw new NotFoundError(this.resourceName);
    return record;
  }

  async create(data: TInsert): Promise<TSelect> {
    return this.repository.create(data);
  }

  async update(id: string | number, data: Partial<TInsert>, scope?: TenantScope): Promise<TSelect> {
    await this.getById(id, scope);
    const updated = await this.repository.updateById(id, data, scope);
    if (!updated) throw new NotFoundError(this.resourceName);
    return updated;
  }

  async remove(id: string | number, scope?: TenantScope): Promise<void> {
    await this.getById(id, scope);
    const ok = await this.repository.deleteById(id, scope);
    if (!ok) throw new NotFoundError(this.resourceName);
  }
}
