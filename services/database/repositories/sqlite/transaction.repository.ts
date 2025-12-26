import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { nanoid } from 'nanoid';
import { Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilter, TransactionStats, CategoryStats } from '../../types';
import { ITransactionRepository, IAccountRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * SQLite Transaction Repository
 */
export class SQLiteTransactionRepository implements ITransactionRepository {
    constructor(private db: SQLiteDBConnection, private accountRepo: IAccountRepository) { }

    async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
        let sql = 'SELECT * FROM transactions WHERE 1=1';
        const params: any[] = [];

        if (filter) {
            if (filter.startDate) { sql += ' AND transaction_date >= ?'; params.push(filter.startDate); }
            if (filter.endDate) { sql += ' AND transaction_date <= ?'; params.push(filter.endDate); }
            if (filter.type) { sql += ' AND type = ?'; params.push(filter.type); }
            if (filter.accountId) { sql += ' AND account_id = ?'; params.push(filter.accountId); }
            if (filter.categoryId) { sql += ' AND category_id = ?'; params.push(filter.categoryId); }
            if (filter.minAmount !== undefined) { sql += ' AND amount >= ?'; params.push(filter.minAmount); }
            if (filter.maxAmount !== undefined) { sql += ' AND amount <= ?'; params.push(filter.maxAmount); }
        }

        sql += ' ORDER BY transaction_date DESC';

        if (filter?.limit) {
            sql += ' LIMIT ?';
            params.push(filter.limit);
        }
        if (filter?.offset) {
            sql += ' OFFSET ?';
            params.push(filter.offset);
        }

        const result = await this.db.query(sql, params);
        return (result.values || []).map(this.mapRow);
    }

    async findById(id: string): Promise<Transaction | null> {
        const result = await this.db.query('SELECT * FROM transactions WHERE id = ?', [id]);
        const rows = result.values || [];
        return rows.length > 0 ? this.mapRow(rows[0]) : null;
    }

    async findByAccountId(accountId: string): Promise<Transaction[]> {
        const result = await this.db.query('SELECT * FROM transactions WHERE account_id = ?', [accountId]);
        return (result.values || []).map(this.mapRow);
    }

    async findByCategoryId(categoryId: string): Promise<Transaction[]> {
        const result = await this.db.query('SELECT * FROM transactions WHERE category_id = ?', [categoryId]);
        return (result.values || []).map(this.mapRow);
    }

    async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
        const result = await this.db.query(
            'SELECT * FROM transactions WHERE transaction_date BETWEEN ? AND ? ORDER BY transaction_date DESC',
            [startDate, endDate]
        );
        return (result.values || []).map(this.mapRow);
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

        await this.db.run(
            `INSERT INTO transactions (id, amount, type, note, transaction_date, account_id, category_id, to_account_id, location, attachment, is_recurring, recurring_rule, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [transaction.id, transaction.amount, transaction.type, transaction.note, transaction.transactionDate, transaction.accountId, transaction.categoryId, transaction.toAccountId, transaction.location, transaction.attachment, 0, null, transaction.createdAt, transaction.updatedAt]
        );

        return transaction;
    }

    async update(id: string, data: UpdateTransactionDTO): Promise<Transaction> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.amount !== undefined) { updates.push('amount = ?'); values.push(data.amount); }
        if (data.note !== undefined) { updates.push('note = ?'); values.push(data.note); }
        if (data.transactionDate !== undefined) { updates.push('transaction_date = ?'); values.push(data.transactionDate); }
        if (data.categoryId !== undefined) { updates.push('category_id = ?'); values.push(data.categoryId); }
        if (data.location !== undefined) { updates.push('location = ?'); values.push(data.location); }

        updates.push('updated_at = ?');
        values.push(now());
        values.push(id);

        await this.db.run(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, values);

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

        await this.db.run('DELETE FROM transactions WHERE id = ?', [id]);
    }

    async getStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
        let sql = 'SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE 1=1';
        const params: any[] = [];

        if (startDate) { sql += ' AND transaction_date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND transaction_date <= ?'; params.push(endDate); }
        sql += ' GROUP BY type';

        const result = await this.db.query(sql, params);
        const rows = result.values || [];

        let totalIncome = 0, totalExpense = 0, transactionCount = 0;
        for (const row of rows) {
            if (row.type === 'INCOME') totalIncome = row.total;
            else if (row.type === 'EXPENSE') totalExpense = row.total;
            transactionCount += row.count;
        }

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount
        };
    }

    async getStatsByCategory(startDate?: string, endDate?: string): Promise<CategoryStats[]> {
        let sql = `
      SELECT t.category_id, c.name as category_name, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'EXPENSE'
    `;
        const params: any[] = [];

        if (startDate) { sql += ' AND t.transaction_date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND t.transaction_date <= ?'; params.push(endDate); }
        sql += ' GROUP BY t.category_id ORDER BY total DESC';

        const result = await this.db.query(sql, params);
        const rows = result.values || [];

        const grandTotal = rows.reduce((sum: number, r: any) => sum + r.total, 0);

        return rows.map((row: any) => ({
            categoryId: row.category_id,
            categoryName: row.category_name || 'Unknown',
            total: row.total,
            percentage: grandTotal > 0 ? (row.total / grandTotal) * 100 : 0,
            transactionCount: row.count
        }));
    }

    private mapRow(row: any): Transaction {
        return {
            id: row.id,
            amount: row.amount,
            type: row.type,
            note: row.note,
            transactionDate: row.transaction_date,
            accountId: row.account_id,
            categoryId: row.category_id,
            toAccountId: row.to_account_id,
            location: row.location,
            attachment: row.attachment,
            isRecurring: row.is_recurring === 1,
            recurringRule: row.recurring_rule,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
