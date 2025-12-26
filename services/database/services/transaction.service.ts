import { Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilter, TransactionStats, CategoryStats } from '../types';
import { IDatabase, ITransactionService } from '../interfaces';

/**
 * Transaction Service - Quản lý giao dịch
 */
export class TransactionService implements ITransactionService {
    constructor(private db: IDatabase) { }

    async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
        return this.db.transactions.findAll(filter);
    }

    async getTransactionById(id: string): Promise<Transaction | null> {
        return this.db.transactions.findById(id);
    }

    async getRecentTransactions(limit: number): Promise<Transaction[]> {
        return this.db.transactions.findAll({ limit });
    }

    async getTransactionStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
        return this.db.transactions.getStats(startDate, endDate);
    }

    async getCategoryStats(startDate?: string, endDate?: string): Promise<CategoryStats[]> {
        return this.db.transactions.getStatsByCategory(startDate, endDate);
    }

    async createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
        if (data.amount <= 0) {
            throw new Error('Amount must be positive');
        }

        if (data.type === 'TRANSFER' && !data.toAccountId) {
            throw new Error('Transfer requires destination account');
        }

        if (data.type !== 'TRANSFER' && !data.categoryId) {
            throw new Error('Transaction requires category');
        }

        return this.db.transactions.create(data);
    }

    async updateTransaction(id: string, data: UpdateTransactionDTO): Promise<Transaction> {
        return this.db.transactions.update(id, data);
    }

    async deleteTransaction(id: string): Promise<void> {
        return this.db.transactions.delete(id);
    }
}
