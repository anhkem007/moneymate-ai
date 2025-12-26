import { IDatabase, ISettingsService } from '../interfaces';
import { DEFAULT_SETTINGS } from '../seeds';

/**
 * Settings Service - Quản lý cài đặt
 */
export class SettingsService implements ISettingsService {
    constructor(private db: IDatabase) { }

    async getSettings(): Promise<Record<string, any>> {
        const raw = await this.db.settings.getAll();
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(raw)) {
            try {
                result[key] = JSON.parse(value);
            } catch {
                result[key] = value;
            }
        }

        return { ...DEFAULT_SETTINGS, ...result };
    }

    async getSetting(key: string): Promise<any> {
        const value = await this.db.settings.get(key);
        if (value === null) {
            return (DEFAULT_SETTINGS as any)[key] ?? null;
        }
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    async updateSetting(key: string, value: any): Promise<void> {
        await this.db.settings.set(key, JSON.stringify(value));
    }

    async updateSettings(settings: Record<string, any>): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.updateSetting(key, value);
        }
    }

    async resetToDefaults(): Promise<void> {
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
            await this.db.settings.set(key, JSON.stringify(value));
        }
    }
}
