import { and, asc, desc, eq, isNull, type SQL } from 'drizzle-orm';
import { type PgTableWithColumns, type PgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/config/db.config.js';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantScope {
  tenantId?: number;
  organizationId?: number;
  branchId?: number;
}

/**
 * BaseRepository<TTable, TSelect, TInsert>
 *
 * Every module repository (Tenant, User, Role, Employee, ... and every future
 * HRMS/CRM entity) extends this instead of hand-rolling CRUD. Soft-delete,
 * pagination and tenant scoping are handled once, here.
 *
 * Convention: every table MUST define an `id` (uuid/serial) primary key column
 * and, unless it is a genuinely global table, a `deletedAt` timestamp column
 * for soft deletes and a `tenantId` column for scoping.
 */
export abstract class BaseRepository<
  TTable extends PgTableWithColumns<any>,
  TSelect extends Record<string, any> = TTable['$inferSelect'],
  TInsert extends Record<string, any> = TTable['$inferInsert'],
> {
  protected constructor(protected readonly table: TTable) {}

  protected get idColumn(): PgColumn {
    return (this.table as any).id;
  }

  protected get deletedAtColumn(): PgColumn | undefined {
    return (this.table as any).deletedAt;
  }

  protected notDeletedClause(): SQL | undefined {
    return this.deletedAtColumn ? isNull(this.deletedAtColumn) : undefined;
  }

  protected scopeClause(scope?: TenantScope): SQL | undefined {
    if (!scope) return undefined;
    const clauses: SQL[] = [];
    const cols = this.table as any;
    if (scope.tenantId && cols.tenantId) clauses.push(eq(cols.tenantId, scope.tenantId));
    if (scope.organizationId && cols.organizationId) clauses.push(eq(cols.organizationId, scope.organizationId));
    if (scope.branchId && cols.branchId) clauses.push(eq(cols.branchId, scope.branchId));
    return clauses.length ? and(...clauses) : undefined;
  }

  private combine(...clauses: (SQL | undefined)[]): SQL | undefined {
    const filtered = clauses.filter(Boolean) as SQL[];
    if (!filtered.length) return undefined;
    return filtered.length === 1 ? filtered[0] : and(...filtered);
  }

  async findAll(scope?: TenantScope): Promise<TSelect[]> {
    const where = this.combine(this.notDeletedClause(), this.scopeClause(scope));
    const query = db.select().from(this.table as any);
    return (where ? query.where(where) : query) as unknown as Promise<TSelect[]>;
  }

  async paginate(params: PaginationParams = {}, scope?: TenantScope): Promise<PaginatedResult<TSelect>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;
    const where = this.combine(this.notDeletedClause(), this.scopeClause(scope));

    const sortCol: PgColumn = params.sortBy ? (this.table as any)[params.sortBy] : this.idColumn;
    const orderBy = params.sortDir === 'asc' ? asc(sortCol) : desc(sortCol);

    let query = db.select().from(this.table as any).$dynamic();
    if (where) query = query.where(where);
    query = query.orderBy(orderBy).limit(limit).offset(offset);

    const countQuery = db.select({ id: this.idColumn }).from(this.table as any).$dynamic();
    const rows = (await query) as unknown as TSelect[];
    const countRows = (where ? await countQuery.where(where) : await countQuery) as unknown as any[];

    const total = countRows.length;
    return {
      data: rows as unknown as TSelect[],
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findById(id: string | number, scope?: TenantScope): Promise<TSelect | null> {
    const where = this.combine(eq(this.idColumn, id as any), this.notDeletedClause(), this.scopeClause(scope));
    const [row] = await db.select().from(this.table as any).where(where!).limit(1);
    return (row as TSelect) ?? null;
  }

  async findOne(clause: SQL, scope?: TenantScope): Promise<TSelect | null> {
    const where = this.combine(clause, this.notDeletedClause(), this.scopeClause(scope));
    const [row] = await db.select().from(this.table as any).where(where!).limit(1);
    return (row as TSelect) ?? null;
  }

  async findMany(clause: SQL, scope?: TenantScope): Promise<TSelect[]> {
    const where = this.combine(clause, this.notDeletedClause(), this.scopeClause(scope));
    return db.select().from(this.table as any).where(where!) as unknown as Promise<TSelect[]>;
  }

  async create(data: TInsert): Promise<TSelect> {
    const [row] = (await db.insert(this.table as any).values(data as any).returning()) as unknown as any[];
    return row as TSelect;
  }

  async updateById(id: string | number, data: Partial<TInsert>, scope?: TenantScope): Promise<TSelect | null> {
    const where = this.combine(eq(this.idColumn, id as any), this.scopeClause(scope));
    const [row] = await db
      .update(this.table as any)
      .set(data as any)
      .where(where!)
      .returning();
    return (row as TSelect) ?? null;
  }

  async deleteById(id: string | number, scope?: TenantScope): Promise<boolean> {
    const where = this.combine(eq(this.idColumn, id as any), this.scopeClause(scope));
    if (this.deletedAtColumn) {
      const [row] = await db
        .update(this.table as any)
        .set({ deletedAt: new Date() } as any)
        .where(where!)
        .returning();
      return !!row;
    }
    const deleted = (await db.delete(this.table as any).where(where!).returning()) as unknown as any[];
    return deleted.length > 0;
  }

  async hardDeleteById(id: string | number, scope?: TenantScope): Promise<boolean> {
    const where = this.combine(eq(this.idColumn, id as any), this.scopeClause(scope));
    const deleted = (await db.delete(this.table as any).where(where!).returning()) as unknown as any[];
    return deleted.length > 0;
  }
}
