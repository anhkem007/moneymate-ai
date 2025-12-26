import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { IDatabase } from '../../interfaces';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../../seeds';
import { Category } from '../../types';
import { SQLiteAccountRepository } from './account.repository';
import { SQLiteCategoryRepository } from './category.repository';
import { SQLiteTransactionRepository } from './transaction.repository';
import { SQLiteBudgetRepository } from './budget.repository';
import { SQLiteChatMessageRepository } from './chat.repository';
import { SQLiteSettingsRepository } from './settings.repository';

const DB_NAME = 'moneymate';

// SQL Schema
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  note TEXT,
  transaction_date TEXT NOT NULL,
  account_id TEXT NOT NULL,
  category_id TEXT,
  to_account_id TEXT,
  location TEXT,
  attachment TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurring_rule TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  limit_amount REAL NOT NULL,
  period TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);
`;

const now = () => new Date().toISOString();

/**
 * SQLite Database Implementation
 */
export class SQLiteDatabase implements IDatabase {
    private sqlite: SQLiteConnection;
    private db: SQLiteDBConnection | null = null;
    private _accounts!: SQLiteAccountRepository;
    private _categories!: SQLiteCategoryRepository;
    private _transactions!: SQLiteTransactionRepository;
    private _budgets!: SQLiteBudgetRepository;
    private _chatMessages!: SQLiteChatMessageRepository;
    private _settings!: SQLiteSettingsRepository;

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    get accounts() { return this._accounts; }
    get categories() { return this._categories; }
    get transactions() { return this._transactions; }
    get budgets() { return this._budgets; }
    get chatMessages() { return this._chatMessages; }
    get settings() { return this._settings; }

    async initialize(): Promise<void> {
        const platform = Capacitor.getPlatform();

        if (platform === 'web') {
            await customElements.whenDefined('jeep-sqlite');
            await this.sqlite.initWebStore();
        }

        const ret = await this.sqlite.checkConnectionsConsistency();
        const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

        if (ret.result && isConn) {
            this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
        } else {
            this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
        }

        await this.db.open();

        // Initialize repositories
        this._accounts = new SQLiteAccountRepository(this.db);
        this._categories = new SQLiteCategoryRepository(this.db);
        this._transactions = new SQLiteTransactionRepository(this.db, this._accounts);
        this._budgets = new SQLiteBudgetRepository(this.db);
        this._chatMessages = new SQLiteChatMessageRepository(this.db);
        this._settings = new SQLiteSettingsRepository(this.db);
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            await this.sqlite.closeConnection(DB_NAME, false);
        }
    }

    async clear(): Promise<void> {
        if (!this.db) return;
        await this.db.execute('DELETE FROM transactions');
        await this.db.execute('DELETE FROM budgets');
        await this.db.execute('DELETE FROM chat_messages');
        await this.db.execute('DELETE FROM categories');
        await this.db.execute('DELETE FROM accounts');
        await this.db.execute('DELETE FROM settings');
    }

    async migrate(): Promise<void> {
        if (!this.db) return;
        await this.db.execute(CREATE_TABLES_SQL);
    }

    async seed(): Promise<void> {
        if (!this.db) return;
        console.log('[SQLite] Starting seed check...');

        try {
            // Seed categories
            const catResult = await this.db.query('SELECT COUNT(*) as count FROM categories');
            const count = catResult.values?.[0]?.count || 0;
            console.log('[SQLite] Categories count:', count);

            if (count === 0) {
                console.log('[SQLite] Seeding categories...');
                const timestamp = now();
                for (const cat of DEFAULT_CATEGORIES) {
                    await this.db.run(
                        'INSERT INTO categories (id, name, icon, color, type, parent_id, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
                        [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.parentId || null, cat.sortOrder, timestamp, timestamp]
                    );
                }
                console.log('[SQLite] Categories seeded.');
            }
        } catch (e) {
            console.error('[SQLite] Error seeding categories:', e);
        }

        // Seed default account
        try {
            const accResult = await this.db.query('SELECT COUNT(*) as count FROM accounts');
            if ((accResult.values?.[0]?.count || 0) === 0) {
                await this._accounts.create({
                    name: 'Tiền mặt',
                    type: 'CASH' as any,
                    balance: 0,
                    icon: '💵',
                    color: '#10b981'
                });
            }
        } catch (e) {
            console.error('[SQLite] Error seeding accounts:', e);
        }

        // Seed settings
        try {
            const settingsResult = await this.db.query('SELECT COUNT(*) as count FROM settings');
            if ((settingsResult.values?.[0]?.count || 0) === 0) {
                for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                    await this._settings.set(key, JSON.stringify(value));
                }
            }
        } catch (e) {
            console.error('[SQLite] Error seeding settings:', e);
        }
    }
}

// Re-export all repositories
export { SQLiteAccountRepository } from './account.repository';
export { SQLiteCategoryRepository } from './category.repository';
export { SQLiteTransactionRepository } from './transaction.repository';
export { SQLiteBudgetRepository } from './budget.repository';
export { SQLiteChatMessageRepository } from './chat.repository';
export { SQLiteSettingsRepository } from './settings.repository';
