// Database entity types
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// Account types
export type AccountType = 'CASH' | 'BANK' | 'CREDIT' | 'E_WALLET' | 'FUND';

export interface Account extends BaseEntity {
    name: string;
    type: AccountType;
    balance: number;
    icon?: string;
    color?: string;
    isActive: boolean;
}

export interface CreateAccountDTO {
    name: string;
    type: AccountType;
    balance?: number;
    icon?: string;
    color?: string;
}

export interface UpdateAccountDTO {
    name?: string;
    type?: AccountType;
    icon?: string;
    color?: string;
}

// Category types
export type CategoryType = 'EXPENSE' | 'INCOME';

export interface Category extends BaseEntity {
    name: string;
    icon?: string;
    color?: string;
    type: CategoryType;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
}

export interface CreateCategoryDTO {
    name: string;
    icon?: string;
    color?: string;
    type: CategoryType;
    parentId?: string;
    sortOrder?: number;
}

export interface UpdateCategoryDTO {
    name?: string;
    icon?: string;
    color?: string;
    parentId?: string;
    sortOrder?: number;
}

// Transaction types
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Transaction extends BaseEntity {
    amount: number;
    type: TransactionType;
    note?: string;
    transactionDate: string;
    accountId: string;
    categoryId?: string;
    toAccountId?: string;
    location?: string;
    attachment?: string;
    isRecurring: boolean;
    recurringRule?: string;
}

export interface CreateTransactionDTO {
    amount: number;
    type: TransactionType;
    note?: string;
    transactionDate?: string;
    accountId: string;
    categoryId?: string;
    toAccountId?: string;
    location?: string;
    attachment?: string;
}

export interface UpdateTransactionDTO {
    amount?: number;
    type?: TransactionType;
    note?: string;
    transactionDate?: string;
    accountId?: string;
    categoryId?: string;
    location?: string;
}

export interface TransactionFilter {
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
    accountId?: string;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
    offset?: number;
}

// Budget types
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Budget extends BaseEntity {
    categoryId?: string;
    limitAmount: number;
    period: BudgetPeriod;
    year: number;
    month?: number;
}

export interface CreateBudgetDTO {
    categoryId?: string;
    limitAmount: number;
    period: BudgetPeriod;
    year: number;
    month?: number;
}

export interface UpdateBudgetDTO {
    limitAmount?: number;
}

// Chat message types
export type MessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    metadata?: string;
    createdAt: string;
}

export interface CreateChatMessageDTO {
    role: MessageRole;
    content: string;
    metadata?: string;
}

// Settings types
export interface Setting {
    key: string;
    value: string;
    updatedAt: string;
}

export interface AppSettings {
    persona: 'friendly' | 'professional' | 'strict' | 'sarcastic';
    monthlyLimit: number;
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
    firstDayOfWeek: number;
    firstDayOfMonth: number;
}

// Statistics types
export interface TransactionStats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
}

export interface CategoryStats {
    categoryId: string;
    categoryName: string;
    total: number;
    percentage: number;
    transactionCount: number;
}
