import { type Request, type Response } from 'express';
import { type TenantsService } from './tenants.service.js';

export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  /**
   * Action handler to fetch registered databases.
   */
  public list = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenants = await this.service.listTenants();
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
  };

  /**
   * Action handler to list dynamic user records in the dynamic database connection.
   */
  public listUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const usersList = await this.service.listTenantUsers(req.db);
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
  };
}
