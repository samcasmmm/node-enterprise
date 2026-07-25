import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseController } from '@/core/base/base.controller.js';
import type { User, NewUser } from '@/database/schemas/index.js';
import type { UserService } from './user.service.js';

@injectable()
export class UserController extends BaseController<User, NewUser> {
  constructor(@inject(TOKENS.UserService) userService: UserService) {
    super(userService, 'user');
  }
}
