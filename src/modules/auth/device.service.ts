import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import type { DeviceRepository } from './device.repository.js';

/** Device Management — track, trust, and revoke devices a user has logged in from. */
@injectable()
export class DeviceService {
  constructor(@inject(TOKENS.DeviceRepository) private readonly deviceRepository: DeviceRepository) {}

  async registerOrTouch(userId: string, fingerprint: string, meta: { name?: string; platform?: string; ipAddress?: string }) {
    const existing = await this.deviceRepository.findByFingerprint(userId, fingerprint);
    if (existing) {
      return this.deviceRepository.updateById(existing.id, {
        lastSeenAt: new Date(),
        lastIpAddress: meta.ipAddress,
      } as any);
    }
    return this.deviceRepository.create({
      userId,
      fingerprint,
      name: meta.name,
      platform: meta.platform,
      lastIpAddress: meta.ipAddress,
      isTrusted: false,
    } as any);
  }

  async listForUser(userId: string) {
    return this.deviceRepository.findForUser(userId);
  }

  async trust(deviceId: string) {
    return this.deviceRepository.updateById(deviceId, { isTrusted: true } as any);
  }

  async revoke(deviceId: string) {
    return this.deviceRepository.updateById(deviceId, { revokedAt: new Date() } as any);
  }
}
