import { Setting } from '../../types';
import { ISettingsRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * IndexedDB Settings Repository
 */
export class IndexedDBSettingsRepository implements ISettingsRepository {
    constructor(private db: any) { }

    async get(key: string): Promise<string | null> {
        const setting = await this.db.settings.get(key);
        return setting?.value || null;
    }

    async set(key: string, value: string): Promise<void> {
        await this.db.settings.put({
            key,
            value,
            updatedAt: now()
        });
    }

    async getAll(): Promise<Record<string, string>> {
        const settings = await this.db.settings.toArray();
        const result: Record<string, string> = {};
        for (const s of settings) {
            result[s.key] = s.value;
        }
        return result;
    }

    async delete(key: string): Promise<void> {
        await this.db.settings.delete(key);
    }
}
