import { Budget, CreateBudgetDTO, UpdateBudgetDTO, Transaction } from '../types';
import { IDatabase, IBudgetService } from '../interfaces';

/**
 * Budget Service - Quản lý ngân sách
 */
export class BudgetService implements IBudgetService {
    constructor(private db: IDatabase) { }

    async getAllBudgets(): Promise<Budget[]> {
        return this.db.budgets.findAll();
    }

    async getBudgetById(id: string): Promise<Budget | null> {
        return this.db.budgets.findById(id);
    }

    async getBudgetProgress(budgetId: string): Promise<{ spent: number; remaining: number; percentage: number }> {
        const budget = await this.getBudgetById(budgetId);
        if (!budget) {
            throw new Error('Budget not found');
        }

        const now = new Date();
        let startDate: string;
        let endDate: string;

        if (budget.period === 'MONTHLY') {
            const year = budget.year;
            const month = budget.month || now.getMonth() + 1;
            startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        } else if (budget.period === 'YEARLY') {
            startDate = `${budget.year}-01-01`;
            endDate = `${budget.year}-12-31`;
        } else {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            startDate = weekStart.toISOString().split('T')[0];
            endDate = weekEnd.toISOString().split('T')[0];
        }

        let transactions: Transaction[];
        if (budget.categoryId) {
            transactions = await this.db.transactions.findAll({
                startDate,
                endDate,
                categoryId: budget.categoryId,
                type: 'EXPENSE'
            });
        } else {
            transactions = await this.db.transactions.findAll({
                startDate,
                endDate,
                type: 'EXPENSE'
            });
        }

        const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = Math.max(0, budget.limitAmount - spent);
        const percentage = (spent / budget.limitAmount) * 100;

        return { spent, remaining, percentage };
    }

    async createBudget(data: CreateBudgetDTO): Promise<Budget> {
        return this.db.budgets.create(data);
    }

    async updateBudget(id: string, data: UpdateBudgetDTO): Promise<Budget> {
        return this.db.budgets.update(id, data);
    }

    async deleteBudget(id: string): Promise<void> {
        return this.db.budgets.delete(id);
    }
}
