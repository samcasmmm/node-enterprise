import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { tenantSchema as schema } from '../database/schemas/index.js';
import { logger } from '../utils/devHelper.js';

interface TenantConnection {
  client: pg.Client;
  db: NodePgDatabase<typeof schema>;
}

class TenantCache {
  private pools = new Map<string, TenantConnection>();

  public async getTenantConnection(dbName: string): Promise<TenantConnection> {
    if (this.pools.has(dbName)) {
      return this.pools.get(dbName)!;
    }

    logger.info(`direct connection for db: "${dbName}"`);
    
    const baseDbUrl = process.env.DATABASE_URL ;
    if(!baseDbUrl){
      throw new Error("DATABASE_URL is not defined");
    }
    const tenantDbUrl = baseDbUrl.substring(0, baseDbUrl.lastIndexOf('/')) + `/${dbName}`;

    const client = new pg.Client({
      connectionString: tenantDbUrl,
    });

    await client.connect();

    const db = drizzle(client, { schema });

    const connection: TenantConnection = { client, db };
    this.pools.set(dbName, connection);
    return connection;
  }

  public async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    for (const [dbName, conn] of this.pools.entries()) {
      logger.info(`closing connection for db: "${dbName}"`);
      closePromises.push(conn.client.end().then(() => {
        logger.info(`db for "${dbName}" terminated.`);
      }));
    }

    await Promise.all(closePromises);
    this.pools.clear();
  }
}

export const tenantCache = new TenantCache();