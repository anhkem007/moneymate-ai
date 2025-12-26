import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { nanoid } from 'nanoid';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../../types';
import { ICategoryRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * SQLite Category Repository
 */
export class SQLiteCategoryRepository implements ICategoryRepository {
    constructor(private db: SQLiteDBConnection) { }

    async findAll(): Promise<Category[]> {
        const result = await this.db.query('SELECT * FROM categories ORDER BY sort_order');
        return (result.values || []).map(this.mapRow);
    }

    async findById(id: string): Promise<Category | null> {
        const result = await this.db.query('SELECT * FROM categories WHERE id = ?', [id]);
        const rows = result.values || [];
        return rows.length > 0 ? this.mapRow(rows[0]) : null;
    }

    async findByType(type: string): Promise<Category[]> {
        const result = await this.db.query('SELECT * FROM categories WHERE type = ? ORDER BY sort_order', [type]);
        return (result.values || []).map(this.mapRow);
    }

    async findByParentId(parentId: string | null): Promise<Category[]> {
        const sql = parentId
            ? 'SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order'
            : 'SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order';
        const result = await this.db.query(sql, parentId ? [parentId] : []);
        return (result.values || []).map(this.mapRow);
    }

    async findActive(): Promise<Category[]> {
        const result = await this.db.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order');
        return (result.values || []).map(this.mapRow);
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

        await this.db.run(
            `INSERT INTO categories (id, name, icon, color, type, parent_id, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [category.id, category.name, category.icon, category.color, category.type, category.parentId, category.sortOrder, 1, category.createdAt, category.updatedAt]
        );

        return category;
    }

    async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
        if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
        if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
        if (data.parentId !== undefined) { updates.push('parent_id = ?'); values.push(data.parentId); }
        if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }

        updates.push('updated_at = ?');
        values.push(now());
        values.push(id);

        await this.db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);

        const category = await this.findById(id);
        if (!category) throw new Error('Category not found');
        return category;
    }

    async softDelete(id: string): Promise<void> {
        await this.db.run('UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?', [now(), id]);
    }

    async restore(id: string): Promise<void> {
        await this.db.run('UPDATE categories SET is_active = 1, updated_at = ? WHERE id = ?', [now(), id]);
    }

    private mapRow(row: any): Category {
        return {
            id: row.id,
            name: row.name,
            icon: row.icon,
            color: row.color,
            type: row.type,
            parentId: row.parent_id,
            sortOrder: row.sort_order,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
