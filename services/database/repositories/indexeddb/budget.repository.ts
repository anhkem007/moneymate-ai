import { nanoid } from 'nanoid';
import { Budget, CreateBudgetDTO, UpdateBudgetDTO } from '../../types';
import { IBudgetRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * IndexedDB Budget Repository
 */
export class IndexedDBBudgetRepository implements IBudgetRepository {
    constructor(private db: any) { }

    async findAll(): Promise<Budget[]> {
        return this.db.budgets.toArray();
    }

    async findById(id: string): Promise<Budget | null> {
        return (await this.db.budgets.get(id)) || null;
    }

    async findByCategoryId(categoryId: string): Promise<Budget[]> {
        return this.db.budgets.where('categoryId').equals(categoryId).toArray();
    }

    async findByPeriod(period: string, year: number, month?: number): Promise<Budget[]> {
        return this.db.budgets
            .filter((b: Budget) => b.period === period && b.year === year && (month === undefined || b.month === month))
            .toArray();
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
        await this.db.budgets.add(budget);
        return budget;
    }

    async update(id: string, data: UpdateBudgetDTO): Promise<Budget> {
        await this.db.budgets.update(id, { ...data, updatedAt: now() });
        const budget = await this.findById(id);
        if (!budget) throw new Error('Budget not found');
        return budget;
    }

    async delete(id: string): Promise<void> {
        await this.db.budgets.delete(id);
    }
}
