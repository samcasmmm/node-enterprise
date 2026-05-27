import { type Request, type Response } from 'express';
import { type AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Action handler to perform multi-tenant authentication.
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.login(req.body);

      if (!result) {
        res.build
          .withStatus(401)
          .fail()
          .withMessage('Authentication failed: Credentials do not match inside dynamic tenant space database.')
          .withError('UNAUTHORIZED', 'Invalid login credentials.')
          .send();
        return;
      }

      res.build
        .withStatus(200)
        .success()
        .withMessage('Authenticated successfully')
        .withData(result)
        .send();
    } catch (error: any) {
      console.error('❌ AuthController Exception:', error);
      res.build
        .withStatus(500)
        .fail()
        .withMessage(error.message || 'Dynamic connection or verification failed.')
        .withError('AUTH_ERROR', error.message)
        .send();
    }
  };
}
