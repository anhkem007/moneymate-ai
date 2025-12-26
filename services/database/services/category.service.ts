import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../types';
import { IDatabase, ICategoryService } from '../interfaces';

/**
 * Category Service - Quản lý danh mục
 */
export class CategoryService implements ICategoryService {
    constructor(private db: IDatabase) { }

    async getAllCategories(): Promise<Category[]> {
        return this.db.categories.findActive();
    }

    async getCategoriesByType(type: string): Promise<Category[]> {
        const categories = await this.db.categories.findByType(type);
        return categories.filter(c => c.isActive);
    }

    async getCategoryTree(): Promise<Category[]> {
        const all = await this.getAllCategories();
        const roots = all.filter(c => !c.parentId);

        const buildChildren = (parentId: string): Category[] => {
            return all
                .filter(c => c.parentId === parentId)
                .sort((a, b) => a.sortOrder - b.sortOrder);
        };

        return roots
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(root => ({
                ...root,
                children: buildChildren(root.id)
            })) as Category[];
    }

    async getCategoryById(id: string): Promise<Category | null> {
        return this.db.categories.findById(id);
    }

    async createCategory(data: CreateCategoryDTO): Promise<Category> {
        return this.db.categories.create(data);
    }

    async updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category> {
        return this.db.categories.update(id, data);
    }

    async deleteCategory(id: string): Promise<void> {
        const transactions = await this.db.transactions.findByCategoryId(id);
        if (transactions.length > 0) {
            await this.db.categories.softDelete(id);
        } else {
            await this.db.categories.softDelete(id);
        }

        const children = await this.db.categories.findByParentId(id);
        for (const child of children) {
            await this.db.categories.softDelete(child.id);
        }
    }
}
