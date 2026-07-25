import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcrypt';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import { ValidationError } from '@/core/errors/index.js';
import type { User, NewUser } from '@/database/schemas/index.js';
import type { UserRepository } from './user.repository.js';

@injectable()
export class UserService extends BaseService<User, NewUser> {
  constructor(@inject(TOKENS.UserRepository) private readonly userRepository: UserRepository) {
    super(userRepository, 'User');
  }

  async create(data: NewUser & { password?: string }): Promise<User> {
    const { password, ...rest } = data as any;
    const existing = await this.userRepository.findByEmail(data.tenantId!, data.email);
    if (existing)
      throw new ValidationError('A user with this email already exists in this tenant.');

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
    return this.userRepository.create({ ...rest, passwordHash });
  }
}
