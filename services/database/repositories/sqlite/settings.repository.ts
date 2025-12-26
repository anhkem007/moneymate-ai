import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { ISettingsRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * SQLite Settings Repository
 */
export class SQLiteSettingsRepository implements ISettingsRepository {
    constructor(private db: SQLiteDBConnection) { }

    async get(key: string): Promise<string | null> {
        const result = await this.db.query('SELECT value FROM settings WHERE key = ?', [key]);
        const rows = result.values || [];
        return rows.length > 0 ? rows[0].value : null;
    }

    async set(key: string, value: string): Promise<void> {
        await this.db.run(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
            [key, value, now()]
        );
    }

    async getAll(): Promise<Record<string, string>> {
        const result = await this.db.query('SELECT key, value FROM settings');
        const settings: Record<string, string> = {};
        for (const row of result.values || []) {
            settings[row.key] = row.value;
        }
        return settings;
    }

    async delete(key: string): Promise<void> {
        await this.db.run('DELETE FROM settings WHERE key = ?', [key]);
    }
}
