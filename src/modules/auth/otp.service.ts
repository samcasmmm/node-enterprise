import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { TOKENS } from '@/core/container/tokens.js';
import { ValidationError } from '@/core/errors/index.js';
import type { OtpRepository } from './otp.repository.js';
import type { NotificationService } from '@/modules/notification/notification.service.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** OTP — generation, delivery (via NotificationService) and verification. */
@injectable()
export class OtpService {
  constructor(
    @inject(TOKENS.OtpRepository) private readonly otpRepository: OtpRepository,
    @inject(TOKENS.NotificationService) private readonly notificationService: NotificationService,
  ) {}

  async send(destination: string, purpose: string, userId?: string, channel: 'email' | 'sms' = 'email'): Promise<void> {
    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, 10);

    await this.otpRepository.create({
      userId,
      destination,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    } as any);

    await this.notificationService.dispatch({
      userId,
      channel,
      to: destination,
      title: 'Your verification code',
      body: `Your code is ${code}. It expires in 5 minutes.`,
    });
  }

  async verify(destination: string, purpose: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findActive(destination, purpose);
    if (!otp) throw new ValidationError('OTP has expired or was not requested.');
    if (otp.attempts >= MAX_ATTEMPTS) throw new ValidationError('Too many attempts. Request a new OTP.');

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      await this.otpRepository.updateById(otp.id, { attempts: otp.attempts + 1 } as any);
      throw new ValidationError('Invalid OTP.');
    }

    await this.otpRepository.updateById(otp.id, { consumedAt: new Date() } as any);
    return true;
  }
}
