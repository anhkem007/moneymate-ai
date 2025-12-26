import Dexie, { Table } from 'dexie';
import { Account, Category, Transaction, Budget, ChatMessage, Setting } from '../../types';
import { IDatabase } from '../../interfaces';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../../seeds';
import { IndexedDBAccountRepository } from './account.repository';
import { IndexedDBCategoryRepository } from './category.repository';
import { IndexedDBTransactionRepository } from './transaction.repository';
import { IndexedDBBudgetRepository } from './budget.repository';
import { IndexedDBChatMessageRepository } from './chat.repository';
import { IndexedDBSettingsRepository } from './settings.repository';

// Dexie Database class
class MoneyMateDB extends Dexie {
    accounts!: Table<Account>;
    categories!: Table<Category>;
    transactions!: Table<Transaction>;
    budgets!: Table<Budget>;
    chatMessages!: Table<ChatMessage>;
    settings!: Table<Setting>;

    constructor() {
        super('MoneyMateDB');

        this.version(1).stores({
            accounts: 'id, type, isActive',
            categories: 'id, type, parentId, isActive',
            transactions: 'id, transactionDate, accountId, categoryId, type, [transactionDate+type]',
            budgets: 'id, categoryId, [categoryId+period+year+month]',
            chatMessages: 'id, createdAt',
            settings: 'key'
        });
    }
}

const now = () => new Date().toISOString();

/**
 * IndexedDB Database Implementation
 */
export class IndexedDBDatabase implements IDatabase {
    private db: MoneyMateDB;
    private _accounts: IndexedDBAccountRepository;
    private _categories: IndexedDBCategoryRepository;
    private _transactions: IndexedDBTransactionRepository;
    private _budgets: IndexedDBBudgetRepository;
    private _chatMessages: IndexedDBChatMessageRepository;
    private _settings: IndexedDBSettingsRepository;

    constructor() {
        this.db = new MoneyMateDB();
        this._accounts = new IndexedDBAccountRepository(this.db);
        this._categories = new IndexedDBCategoryRepository(this.db);
        this._transactions = new IndexedDBTransactionRepository(this.db, this._accounts);
        this._budgets = new IndexedDBBudgetRepository(this.db);
        this._chatMessages = new IndexedDBChatMessageRepository(this.db);
        this._settings = new IndexedDBSettingsRepository(this.db);
    }

    get accounts() { return this._accounts; }
    get categories() { return this._categories; }
    get transactions() { return this._transactions; }
    get budgets() { return this._budgets; }
    get chatMessages() { return this._chatMessages; }
    get settings() { return this._settings; }

    async initialize(): Promise<void> {
        await this.db.open();
    }

    async close(): Promise<void> {
        this.db.close();
    }

    async clear(): Promise<void> {
        await this.db.transaction('rw', this.db.tables, async () => {
            for (const table of this.db.tables) {
                await table.clear();
            }
        });
    }

    async migrate(): Promise<void> {
        // Dexie handles migrations automatically via version()
    }

    async seed(): Promise<void> {
        console.log('[MoneyMate] Seeding database...');

        const existingCategories = await this.db.categories.count();
        console.log('[MoneyMate] Existing categories:', existingCategories);
        if (existingCategories === 0) {
            const timestamp = now();
            const categories = DEFAULT_CATEGORIES.map(c => ({
                ...c,
                isActive: true,
                createdAt: timestamp,
                updatedAt: timestamp
            }));
            await this.db.categories.bulkAdd(categories as Category[]);
            console.log('[MoneyMate] Seeded categories:', categories.length);
        }

        const existingAccounts = await this.db.accounts.count();
        console.log('[MoneyMate] Existing accounts:', existingAccounts);
        if (existingAccounts === 0) {
            // Tạo các tài khoản mặc định
            const defaultAccounts = [
                { name: 'Tiền mặt', type: 'CASH' as const, balance: 0, icon: '💵', color: '#10b981' },
                { name: 'Ngân hàng', type: 'BANK' as const, balance: 0, icon: '🏦', color: '#3b82f6' },
            ];

            for (const acc of defaultAccounts) {
                await this._accounts.create(acc);
            }
            console.log('[MoneyMate] Seeded accounts:', defaultAccounts.length);
        }

        const existingSettings = await this.db.settings.count();
        console.log('[MoneyMate] Existing settings:', existingSettings);
        if (existingSettings === 0) {
            for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                await this._settings.set(key, JSON.stringify(value));
            }
            console.log('[MoneyMate] Seeded settings');
        }

        console.log('[MoneyMate] Seed complete!');
    }
}

// Re-export all repositories
export { IndexedDBAccountRepository } from './account.repository';
export { IndexedDBCategoryRepository } from './category.repository';
export { IndexedDBTransactionRepository } from './transaction.repository';
export { IndexedDBBudgetRepository } from './budget.repository';
export { IndexedDBChatMessageRepository } from './chat.repository';
export { IndexedDBSettingsRepository } from './settings.repository';
