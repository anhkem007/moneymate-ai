import {
    Account, CreateAccountDTO, UpdateAccountDTO,
    Category, CreateCategoryDTO, UpdateCategoryDTO,
    Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilter,
    Budget, CreateBudgetDTO, UpdateBudgetDTO,
    ChatMessage, CreateChatMessageDTO,
    Setting, TransactionStats, CategoryStats
} from './types';

/**
 * Repository interface cho Account
 */
export interface IAccountRepository {
    findAll(): Promise<Account[]>;
    findById(id: string): Promise<Account | null>;
    findByType(type: string): Promise<Account[]>;
    findActive(): Promise<Account[]>;
    create(data: CreateAccountDTO): Promise<Account>;
    update(id: string, data: UpdateAccountDTO): Promise<Account>;
    updateBalance(id: string, amount: number): Promise<void>;
    softDelete(id: string): Promise<void>;
    restore(id: string): Promise<void>;
}

/**
 * Repository interface cho Category
 */
export interface ICategoryRepository {
    findAll(): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    findByType(type: string): Promise<Category[]>;
    findByParentId(parentId: string | null): Promise<Category[]>;
    findActive(): Promise<Category[]>;
    create(data: CreateCategoryDTO): Promise<Category>;
    update(id: string, data: UpdateCategoryDTO): Promise<Category>;
    softDelete(id: string): Promise<void>;
    restore(id: string): Promise<void>;
}

/**
 * Repository interface cho Transaction
 */
export interface ITransactionRepository {
    findAll(filter?: TransactionFilter): Promise<Transaction[]>;
    findById(id: string): Promise<Transaction | null>;
    findByAccountId(accountId: string): Promise<Transaction[]>;
    findByCategoryId(categoryId: string): Promise<Transaction[]>;
    findByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
    create(data: CreateTransactionDTO): Promise<Transaction>;
    update(id: string, data: UpdateTransactionDTO): Promise<Transaction>;
    delete(id: string): Promise<void>;
    getStats(startDate?: string, endDate?: string): Promise<TransactionStats>;
    getStatsByCategory(startDate?: string, endDate?: string): Promise<CategoryStats[]>;
}

/**
 * Repository interface cho Budget
 */
export interface IBudgetRepository {
    findAll(): Promise<Budget[]>;
    findById(id: string): Promise<Budget | null>;
    findByCategoryId(categoryId: string): Promise<Budget[]>;
    findByPeriod(period: string, year: number, month?: number): Promise<Budget[]>;
    create(data: CreateBudgetDTO): Promise<Budget>;
    update(id: string, data: UpdateBudgetDTO): Promise<Budget>;
    delete(id: string): Promise<void>;
}

/**
 * Repository interface cho ChatMessage
 */
export interface IChatMessageRepository {
    findAll(limit?: number): Promise<ChatMessage[]>;
    findRecent(limit: number): Promise<ChatMessage[]>;
    create(data: CreateChatMessageDTO): Promise<ChatMessage>;
    deleteAll(): Promise<void>;
    deleteOlderThan(date: string): Promise<void>;
}

/**
 * Repository interface cho Settings
 */
export interface ISettingsRepository {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    getAll(): Promise<Record<string, string>>;
    delete(key: string): Promise<void>;
}

/**
 * Database interface tổng hợp
 */
export interface IDatabase {
    accounts: IAccountRepository;
    categories: ICategoryRepository;
    transactions: ITransactionRepository;
    budgets: IBudgetRepository;
    chatMessages: IChatMessageRepository;
    settings: ISettingsRepository;

    // Database lifecycle
    initialize(): Promise<void>;
    close(): Promise<void>;
    clear(): Promise<void>;

    // Migrations
    migrate(): Promise<void>;
    seed(): Promise<void>;
}

/**
 * Service interfaces
 */
export interface IAccountService {
    getAllAccounts(): Promise<Account[]>;
    getAccountById(id: string): Promise<Account | null>;
    getAccountsByType(type: string): Promise<Account[]>;
    getTotalBalance(): Promise<number>;
    createAccount(data: CreateAccountDTO): Promise<Account>;
    updateAccount(id: string, data: UpdateAccountDTO): Promise<Account>;
    deleteAccount(id: string): Promise<void>;
}

export interface ICategoryService {
    getAllCategories(): Promise<Category[]>;
    getCategoriesByType(type: string): Promise<Category[]>;
    getCategoryTree(): Promise<Category[]>;
    getCategoryById(id: string): Promise<Category | null>;
    createCategory(data: CreateCategoryDTO): Promise<Category>;
    updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category>;
    deleteCategory(id: string): Promise<void>;
}

export interface ITransactionService {
    getTransactions(filter?: TransactionFilter): Promise<Transaction[]>;
    getTransactionById(id: string): Promise<Transaction | null>;
    getRecentTransactions(limit: number): Promise<Transaction[]>;
    getTransactionStats(startDate?: string, endDate?: string): Promise<TransactionStats>;
    getCategoryStats(startDate?: string, endDate?: string): Promise<CategoryStats[]>;
    createTransaction(data: CreateTransactionDTO): Promise<Transaction>;
    updateTransaction(id: string, data: UpdateTransactionDTO): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
}

export interface IBudgetService {
    getAllBudgets(): Promise<Budget[]>;
    getBudgetById(id: string): Promise<Budget | null>;
    getBudgetProgress(budgetId: string): Promise<{ spent: number; remaining: number; percentage: number }>;
    createBudget(data: CreateBudgetDTO): Promise<Budget>;
    updateBudget(id: string, data: UpdateBudgetDTO): Promise<Budget>;
    deleteBudget(id: string): Promise<void>;
}

export interface IChatService {
    getMessages(limit?: number): Promise<ChatMessage[]>;
    addMessage(data: CreateChatMessageDTO): Promise<ChatMessage>;
    clearHistory(): Promise<void>;
}

export interface ISettingsService {
    getSettings(): Promise<Record<string, any>>;
    getSetting(key: string): Promise<any>;
    updateSetting(key: string, value: any): Promise<void>;
    updateSettings(settings: Record<string, any>): Promise<void>;
    resetToDefaults(): Promise<void>;
}
