import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { nanoid } from 'nanoid';
import { Budget, CreateBudgetDTO, UpdateBudgetDTO } from '../../types';
import { IBudgetRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * SQLite Budget Repository
 */
export class SQLiteBudgetRepository implements IBudgetRepository {
    constructor(private db: SQLiteDBConnection) { }

    async findAll(): Promise<Budget[]> {
        const result = await this.db.query('SELECT * FROM budgets');
        return (result.values || []).map(this.mapRow);
    }

    async findById(id: string): Promise<Budget | null> {
        const result = await this.db.query('SELECT * FROM budgets WHERE id = ?', [id]);
        const rows = result.values || [];
        return rows.length > 0 ? this.mapRow(rows[0]) : null;
    }

    async findByCategoryId(categoryId: string): Promise<Budget[]> {
        const result = await this.db.query('SELECT * FROM budgets WHERE category_id = ?', [categoryId]);
        return (result.values || []).map(this.mapRow);
    }

    async findByPeriod(period: string, year: number, month?: number): Promise<Budget[]> {
        let sql = 'SELECT * FROM budgets WHERE period = ? AND year = ?';
        const params: any[] = [period, year];
        if (month !== undefined) {
            sql += ' AND month = ?';
            params.push(month);
        }
        const result = await this.db.query(sql, params);
        return (result.values || []).map(this.mapRow);
    }

    async create(data: CreateBudgetDTO): Promise<Budget> {
        const budget: Budget = {
            id: nanoid(),
            categoryId: data.categoryId,
            limitAmount: data.limitAmount,
            period: data.period,
            year: data.year,
            month: data.month,
            createdAt: now(),
            updatedAt: now()
        };

        await this.db.run(
            'INSERT INTO budgets (id, category_id, limit_amount, period, year, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [budget.id, budget.categoryId, budget.limitAmount, budget.period, budget.year, budget.month, budget.createdAt, budget.updatedAt]
        );

        return budget;
    }

    async update(id: string, data: UpdateBudgetDTO): Promise<Budget> {
        if (data.limitAmount !== undefined) {
            await this.db.run('UPDATE budgets SET limit_amount = ?, updated_at = ? WHERE id = ?', [data.limitAmount, now(), id]);
        }
        const budget = await this.findById(id);
        if (!budget) throw new Error('Budget not found');
        return budget;
    }

    async delete(id: string): Promise<void> {
        await this.db.run('DELETE FROM budgets WHERE id = ?', [id]);
    }

    private mapRow(row: any): Budget {
        return {
            id: row.id,
            categoryId: row.category_id,
            limitAmount: row.limit_amount,
            period: row.period,
            year: row.year,
            month: row.month,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
