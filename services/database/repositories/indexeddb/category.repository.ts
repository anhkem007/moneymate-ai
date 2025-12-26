import { nanoid } from 'nanoid';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../../types';
import { ICategoryRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * IndexedDB Category Repository
 */
export class IndexedDBCategoryRepository implements ICategoryRepository {
    constructor(private db: any) { }

    async findAll(): Promise<Category[]> {
        return this.db.categories.toArray();
    }

    async findById(id: string): Promise<Category | null> {
        return (await this.db.categories.get(id)) || null;
    }

    async findByType(type: string): Promise<Category[]> {
        return this.db.categories.where('type').equals(type).toArray();
    }

    async findByParentId(parentId: string | null): Promise<Category[]> {
        if (parentId === null) {
            return this.db.categories.filter((c: Category) => !c.parentId).toArray();
        }
        return this.db.categories.where('parentId').equals(parentId).toArray();
    }

    async findActive(): Promise<Category[]> {
        return this.db.categories.filter((c: Category) => c.isActive).toArray();
    }

    async create(data: CreateCategoryDTO): Promise<Category> {
        const category: Category = {
            id: nanoid(),
            name: data.name,
            icon: data.icon,
            color: data.color,
            type: data.type,
            parentId: data.parentId,
            sortOrder: data.sortOrder || 0,
            isActive: true,
            createdAt: now(),
            updatedAt: now()
        };
        await this.db.categories.add(category);
        return category;
    }

    async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
        await this.db.categories.update(id, { ...data, updatedAt: now() });
        const category = await this.findById(id);
        if (!category) throw new Error('Category not found');
        return category;
    }

    async softDelete(id: string): Promise<void> {
        await this.db.categories.update(id, { isActive: false, updatedAt: now() });
    }

    async restore(id: string): Promise<void> {
        await this.db.categories.update(id, { isActive: true, updatedAt: now() });
    }
}
