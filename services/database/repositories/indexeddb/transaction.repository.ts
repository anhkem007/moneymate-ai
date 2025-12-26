import { nanoid } from 'nanoid';
import { Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilter, TransactionStats, CategoryStats } from '../../types';
import { ITransactionRepository, IAccountRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * IndexedDB Transaction Repository
 */
export class IndexedDBTransactionRepository implements ITransactionRepository {
    constructor(private db: any, private accountRepo: IAccountRepository) { }

    async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
        let query = this.db.transactions.orderBy('transactionDate').reverse();

        if (filter) {
            let results = await query.toArray();

            if (filter.startDate) {
                results = results.filter((t: Transaction) => t.transactionDate >= filter.startDate!);
            }
            if (filter.endDate) {
                results = results.filter((t: Transaction) => t.transactionDate <= filter.endDate!);
            }
            if (filter.type) {
                results = results.filter((t: Transaction) => t.type === filter.type);
            }
            if (filter.accountId) {
                results = results.filter((t: Transaction) => t.accountId === filter.accountId);
            }
            if (filter.categoryId) {
                results = results.filter((t: Transaction) => t.categoryId === filter.categoryId);
            }
            if (filter.minAmount !== undefined) {
                results = results.filter((t: Transaction) => t.amount >= filter.minAmount!);
            }
            if (filter.maxAmount !== undefined) {
                results = results.filter((t: Transaction) => t.amount <= filter.maxAmount!);
            }
            if (filter.offset) {
                results = results.slice(filter.offset);
            }
            if (filter.limit) {
                results = results.slice(0, filter.limit);
            }

            return results;
        }

        return query.toArray();
    }

    async findById(id: string): Promise<Transaction | null> {
        return (await this.db.transactions.get(id)) || null;
    }

    async findByAccountId(accountId: string): Promise<Transaction[]> {
        return this.db.transactions.where('accountId').equals(accountId).toArray();
    }

    async findByCategoryId(categoryId: string): Promise<Transaction[]> {
        return this.db.transactions.where('categoryId').equals(categoryId).toArray();
    }

    async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
        return this.db.transactions
            .where('transactionDate')
            .between(startDate, endDate, true, true)
            .toArray();
    }

    async create(data: CreateTransactionDTO): Promise<Transaction> {
        const transaction: Transaction = {
            id: nanoid(),
            amount: data.amount,
            type: data.type,
            note: data.note,
            transactionDate: data.transactionDate || now().split('T')[0],
            accountId: data.accountId,
            categoryId: data.categoryId,
            toAccountId: data.toAccountId,
            location: data.location,
            attachment: data.attachment,
            isRecurring: false,
            createdAt: now(),
            updatedAt: now()
        };

        // Update account balance
        if (data.type === 'INCOME') {
            await this.accountRepo.updateBalance(data.accountId, data.amount);
        } else if (data.type === 'EXPENSE') {
            await this.accountRepo.updateBalance(data.accountId, -data.amount);
        } else if (data.type === 'TRANSFER' && data.toAccountId) {
            await this.accountRepo.updateBalance(data.accountId, -data.amount);
            await this.accountRepo.updateBalance(data.toAccountId, data.amount);
        }

        await this.db.transactions.add(transaction);
        return transaction;
    }

    async update(id: string, data: UpdateTransactionDTO): Promise<Transaction> {
        await this.db.transactions.update(id, { ...data, updatedAt: now() });
        const transaction = await this.findById(id);
        if (!transaction) throw new Error('Transaction not found');
        return transaction;
    }

    async delete(id: string): Promise<void> {
        const transaction = await this.findById(id);
        if (!transaction) throw new Error('Transaction not found');

        // Reverse account balance
        if (transaction.type === 'INCOME') {
            await this.accountRepo.updateBalance(transaction.accountId, -transaction.amount);
        } else if (transaction.type === 'EXPENSE') {
            await this.accountRepo.updateBalance(transaction.accountId, transaction.amount);
        } else if (transaction.type === 'TRANSFER' && transaction.toAccountId) {
            await this.accountRepo.updateBalance(transaction.accountId, transaction.amount);
            await this.accountRepo.updateBalance(transaction.toAccountId, -transaction.amount);
        }

        await this.db.transactions.delete(id);
    }

    async getStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
        let transactions = await this.findAll({ startDate, endDate });

        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: transactions.length
        };
    }

    async getStatsByCategory(startDate?: string, endDate?: string): Promise<CategoryStats[]> {
        const transactions = await this.findAll({ startDate, endDate, type: 'EXPENSE' });
        const categories = await this.db.categories.toArray();
        const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));

        const totals = new Map<string, number>();
        const counts = new Map<string, number>();
        let grandTotal = 0;

        for (const t of transactions) {
            if (t.categoryId) {
                totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount);
                counts.set(t.categoryId, (counts.get(t.categoryId) || 0) + 1);
                grandTotal += t.amount;
            }
        }

        const stats: CategoryStats[] = [];
        for (const [categoryId, total] of totals) {
            stats.push({
                categoryId,
                categoryName: categoryMap.get(categoryId) || 'Unknown',
                total,
                percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
                transactionCount: counts.get(categoryId) || 0
            });
        }

        return stats.sort((a, b) => b.total - a.total);
    }
}
