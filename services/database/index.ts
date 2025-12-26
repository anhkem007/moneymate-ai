import { Capacitor } from '@capacitor/core';
import { IDatabase } from './interfaces';
import { IndexedDBDatabase } from './repositories/indexeddb';
import { SQLiteDatabase } from './repositories/sqlite';

import {
    AccountService,
    CategoryService,
    TransactionService,
    BudgetService,
    ChatService,
    SettingsService
} from './services';

import {
    IAccountService,
    ICategoryService,
    ITransactionService,
    IBudgetService,
    IChatService,
    ISettingsService
} from './interfaces';

// Singleton database instance
let databaseInstance: IDatabase | null = null;
let initPromise: Promise<IDatabase> | null = null;

// Services singletons
let accountService: IAccountService | null = null;
let categoryService: ICategoryService | null = null;
let transactionService: ITransactionService | null = null;
let budgetService: IBudgetService | null = null;
let chatService: IChatService | null = null;
let settingsService: ISettingsService | null = null;

/**
 * Get the database instance based on platform
 */
export async function getDatabase(): Promise<IDatabase> {
    if (databaseInstance) {
        return databaseInstance;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            let db: IDatabase;
            const platform = Capacitor.getPlatform();

            if (platform === 'web') {
                // Web: Use IndexedDB via Dexie
                db = new IndexedDBDatabase();
            } else {
                // Mobile (iOS/Android): Use SQLite
                db = new SQLiteDatabase();
            }

            // Initialize database
            await db.initialize();
            await db.migrate();
            await db.seed();

            databaseInstance = db;
            return db;
        } catch (error) {
            initPromise = null; // Allow retry on failure
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Get Account Service
 */
export async function getAccountService(): Promise<IAccountService> {
    if (!accountService) {
        const db = await getDatabase();
        accountService = new AccountService(db);
    }
    return accountService;
}

/**
 * Get Category Service
 */
export async function getCategoryService(): Promise<ICategoryService> {
    if (!categoryService) {
        const db = await getDatabase();
        categoryService = new CategoryService(db);
    }
    return categoryService;
}

/**
 * Get Transaction Service
 */
export async function getTransactionService(): Promise<ITransactionService> {
    if (!transactionService) {
        const db = await getDatabase();
        transactionService = new TransactionService(db);
    }
    return transactionService;
}

/**
 * Get Budget Service
 */
export async function getBudgetService(): Promise<IBudgetService> {
    if (!budgetService) {
        const db = await getDatabase();
        budgetService = new BudgetService(db);
    }
    return budgetService;
}

/**
 * Get Chat Service
 */
export async function getChatService(): Promise<IChatService> {
    if (!chatService) {
        const db = await getDatabase();
        chatService = new ChatService(db);
    }
    return chatService;
}

/**
 * Get Settings Service
 */
export async function getSettingsService(): Promise<ISettingsService> {
    if (!settingsService) {
        const db = await getDatabase();
        settingsService = new SettingsService(db);
    }
    return settingsService;
}

/**
 * Reset all services (useful for testing)
 */
export async function resetServices(): Promise<void> {
    if (databaseInstance) {
        await databaseInstance.close();
    }
    databaseInstance = null;
    initPromise = null;
    accountService = null;
    categoryService = null;
    transactionService = null;
    budgetService = null;
    chatService = null;
    settingsService = null;
}

/**
 * Clear all data (useful for testing or logout)
 */
export async function clearAllData(): Promise<void> {
    const db = await getDatabase();
    await db.clear();
    await db.seed();
}

// Export types
export * from './types';
export * from './interfaces';
export { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, ACCOUNT_TYPE_CONFIG } from './seeds';

// Export hooks
export * from './hooks';
