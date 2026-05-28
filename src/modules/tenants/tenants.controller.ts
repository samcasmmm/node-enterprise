import { type Request, type Response } from 'express';
import * as service from './tenants.service.js';

/**
 * Action handler to fetch registered databases.
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const tenants = await service.listTenants();
    res.build
      .withStatus(200)
      .success()
      .withMessage('Tenants fetched successfully')
      .withData({ tenants })
      .send();
  } catch (error: any) {
    console.error('TenantsController list Exception:', error);
    res.build
      .withStatus(500)
      .fail()
      .withMessage(error.message || 'Failed to fetch directory tenants.')
      .withError('DATABASE_ERROR', error.message)
      .send();
  }
}

/**
 * Action handler to list dynamic user records in the dynamic database connection.
 */
export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const usersList = await service.listTenantUsers(req.db);
    res.build
      .withStatus(200)
      .success()
      .withMessage('Tenant users fetched successfully')
      .withData({ users: usersList })
      .send();
  } catch (error: any) {
    console.error('TenantsController listUsers Exception:', error);
    res.build
      .withStatus(500)
      .fail()
      .withMessage(error.message || 'Querying dynamic tenant users failed.')
      .withError('DATABASE_ERROR', error.message)
      .send();
  }
}
