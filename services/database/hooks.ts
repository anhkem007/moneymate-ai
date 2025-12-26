import { useState, useEffect, useCallback } from 'react';
import {
    getDatabase,
    getAccountService,
    getCategoryService,
    getTransactionService,
    getBudgetService,
    getChatService,
    getSettingsService
} from './index';
import {
    Account, CreateAccountDTO, UpdateAccountDTO,
    Category, CreateCategoryDTO, UpdateCategoryDTO,
    Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilter,
    Budget, CreateBudgetDTO, UpdateBudgetDTO,
    ChatMessage, CreateChatMessageDTO,
    TransactionStats, CategoryStats
} from './types';

/**
 * Hook để khởi tạo database
 */
export function useDatabase() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        getDatabase()
            .then(() => setIsReady(true))
            .catch(setError);
    }, []);

    return { isReady, error };
}

/**
 * Hook quản lý Accounts
 */
export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const service = await getAccountService();
            const data = await service.getAllAccounts();
            setAccounts(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const createAccount = useCallback(async (data: CreateAccountDTO) => {
        const service = await getAccountService();
        const account = await service.createAccount(data);
        await refresh();
        return account;
    }, [refresh]);

    const updateAccount = useCallback(async (id: string, data: UpdateAccountDTO) => {
        const service = await getAccountService();
        const account = await service.updateAccount(id, data);
        await refresh();
        return account;
    }, [refresh]);

    const deleteAccount = useCallback(async (id: string) => {
        const service = await getAccountService();
        await service.deleteAccount(id);
        await refresh();
    }, [refresh]);

    const getTotalBalance = useCallback(async () => {
        const service = await getAccountService();
        return service.getTotalBalance();
    }, []);

    return {
        accounts,
        loading,
        error,
        refresh,
        createAccount,
        updateAccount,
        deleteAccount,
        getTotalBalance
    };
}

/**
 * Hook quản lý Categories
 */
export function useCategories(type?: 'EXPENSE' | 'INCOME') {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const service = await getCategoryService();
            const data = type
                ? await service.getCategoriesByType(type)
                : await service.getAllCategories();
            setCategories(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const getCategoryTree = useCallback(async () => {
        const service = await getCategoryService();
        return service.getCategoryTree();
    }, []);

    const createCategory = useCallback(async (data: CreateCategoryDTO) => {
        const service = await getCategoryService();
        const category = await service.createCategory(data);
        await refresh();
        return category;
    }, [refresh]);

    const updateCategory = useCallback(async (id: string, data: UpdateCategoryDTO) => {
        const service = await getCategoryService();
        const category = await service.updateCategory(id, data);
        await refresh();
        return category;
    }, [refresh]);

    const deleteCategory = useCallback(async (id: string) => {
        const service = await getCategoryService();
        await service.deleteCategory(id);
        await refresh();
    }, [refresh]);

    return {
        categories,
        loading,
        error,
        refresh,
        getCategoryTree,
        createCategory,
        updateCategory,
        deleteCategory
    };
}

/**
 * Hook quản lý Transactions
 */
export function useTransactions(filter?: TransactionFilter) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<TransactionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const service = await getTransactionService();
            const data = await service.getTransactions(filter);
            setTransactions(data);

            // Cũng lấy stats
            const statsData = await service.getTransactionStats(filter?.startDate, filter?.endDate);
            setStats(statsData);

            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [filter?.startDate, filter?.endDate, filter?.type, filter?.accountId, filter?.categoryId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const createTransaction = useCallback(async (data: CreateTransactionDTO) => {
        const service = await getTransactionService();
        const transaction = await service.createTransaction(data);
        await refresh();
        return transaction;
    }, [refresh]);

    const updateTransaction = useCallback(async (id: string, data: UpdateTransactionDTO) => {
        const service = await getTransactionService();
        const transaction = await service.updateTransaction(id, data);
        await refresh();
        return transaction;
    }, [refresh]);

    const deleteTransaction = useCallback(async (id: string) => {
        const service = await getTransactionService();
        await service.deleteTransaction(id);
        await refresh();
    }, [refresh]);

    const getCategoryStats = useCallback(async (startDate?: string, endDate?: string) => {
        const service = await getTransactionService();
        return service.getCategoryStats(startDate, endDate);
    }, []);

    return {
        transactions,
        stats,
        loading,
        error,
        refresh,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        getCategoryStats
    };
}

/**
 * Hook quản lý Budgets
 */
export function useBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const service = await getBudgetService();
            const data = await service.getAllBudgets();
            setBudgets(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const createBudget = useCallback(async (data: CreateBudgetDTO) => {
        const service = await getBudgetService();
        const budget = await service.createBudget(data);
        await refresh();
        return budget;
    }, [refresh]);

    const updateBudget = useCallback(async (id: string, data: UpdateBudgetDTO) => {
        const service = await getBudgetService();
        const budget = await service.updateBudget(id, data);
        await refresh();
        return budget;
    }, [refresh]);

    const deleteBudget = useCallback(async (id: string) => {
        const service = await getBudgetService();
        await service.deleteBudget(id);
        await refresh();
    }, [refresh]);

    const getBudgetProgress = useCallback(async (budgetId: string) => {
        const service = await getBudgetService();
        return service.getBudgetProgress(budgetId);
    }, []);

    return {
        budgets,
        loading,
        error,
        refresh,
        createBudget,
        updateBudget,
        deleteBudget,
        getBudgetProgress
    };
}

/**
 * Hook quản lý Chat Messages
 */
export function useChatMessages(limit?: number) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const service = await getChatService();
            const data = await service.getMessages(limit);
            setMessages(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addMessage = useCallback(async (data: CreateChatMessageDTO) => {
        const service = await getChatService();
        const message = await service.addMessage(data);
        await refresh();
        return message;
    }, [refresh]);

    const clearHistory = useCallback(async () => {
        const service = await getChatService();
        await service.clearHistory();
        await refresh();
    }, [refresh]);

    return {
        messages,
        loading,
        error,
        refresh,
        addMessage,
        clearHistory
    };
}

/**
 * Hook quản lý Settings
 */
export function useSettings() {
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const service = await getSettingsService();
            const data = await service.getSettings();
            setSettings(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const updateSetting = useCallback(async (key: string, value: any) => {
        const service = await getSettingsService();
        await service.updateSetting(key, value);
        await refresh();
    }, [refresh]);

    const updateSettings = useCallback(async (newSettings: Record<string, any>) => {
        const service = await getSettingsService();
        await service.updateSettings(newSettings);
        await refresh();
    }, [refresh]);

    const resetToDefaults = useCallback(async () => {
        const service = await getSettingsService();
        await service.resetToDefaults();
        await refresh();
    }, [refresh]);

    return {
        settings,
        loading,
        error,
        refresh,
        updateSetting,
        updateSettings,
        resetToDefaults
    };
}
