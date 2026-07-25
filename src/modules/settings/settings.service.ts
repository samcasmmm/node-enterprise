import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/container/tokens.js';
import { BaseService } from '@/core/base/base.service.js';
import type { Setting, NewSetting } from '@/database/schemas/index.js';
import type { SettingsRepository } from './settings.repository.js';

/**
 * SettingsService — categories map 1:1 to the sub-modules in the brief:
 * general, localization, tax, email, sms, whatsapp, storage, theme,
 * branding, custom_domain. Consumers fetch a whole category at once
 * (e.g. `getCategory(tenantId, 'email')` for SMTP config) rather than
 * looking up individual keys everywhere.
 */
@injectable()
export class SettingsService extends BaseService<Setting, NewSetting> {
  constructor(@inject(TOKENS.SettingsRepository) private readonly settingsRepository: SettingsRepository) {
    super(settingsRepository, 'Setting');
  }

  async getCategory(tenantId: string, category: string): Promise<Record<string, unknown>> {
    const rows = await this.settingsRepository.findByCategory(tenantId, category);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async setCategory(tenantId: string, category: string, values: Record<string, unknown>, secretKeys: string[] = []): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      await this.settingsRepository.upsert(tenantId, category, key, value, secretKeys.includes(key));
    }
  }
}
