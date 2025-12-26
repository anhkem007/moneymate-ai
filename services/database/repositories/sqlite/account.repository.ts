import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { nanoid } from 'nanoid';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../types';
import { IAccountRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * SQLite Account Repository
 */
export class SQLiteAccountRepository implements IAccountRepository {
    constructor(private db: SQLiteDBConnection) { }

    async findAll(): Promise<Account[]> {
        const result = await this.db.query('SELECT * FROM accounts ORDER BY created_at');
        return (result.values || []).map(this.mapRow);
    }

    async findById(id: string): Promise<Account | null> {
        const result = await this.db.query('SELECT * FROM accounts WHERE id = ?', [id]);
        const rows = result.values || [];
        return rows.length > 0 ? this.mapRow(rows[0]) : null;
    }

    async findByType(type: string): Promise<Account[]> {
        const result = await this.db.query('SELECT * FROM accounts WHERE type = ?', [type]);
        return (result.values || []).map(this.mapRow);
    }

    async findActive(): Promise<Account[]> {
        const result = await this.db.query('SELECT * FROM accounts WHERE is_active = 1');
        return (result.values || []).map(this.mapRow);
    }

    async create(data: CreateAccountDTO): Promise<Account> {
        const account: Account = {
            id: nanoid(),
            name: data.name,
            type: data.type,
            balance: data.balance || 0,
            icon: data.icon,
            color: data.color,
            isActive: true,
            createdAt: now(),
            updatedAt: now()
        };

        await this.db.run(
            `INSERT INTO accounts (id, name, type, balance, icon, color, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [account.id, account.name, account.type, account.balance, account.icon, account.color, 1, account.createdAt, account.updatedAt]
        );

        return account;
    }

    async update(id: string, data: UpdateAccountDTO): Promise<Account> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
        if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
        if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
        if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }

        updates.push('updated_at = ?');
        values.push(now());
        values.push(id);

        await this.db.run(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`, values);

        const account = await this.findById(id);
        if (!account) throw new Error('Account not found');
        return account;
    }

    async updateBalance(id: string, amount: number): Promise<void> {
        await this.db.run(
            'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
            [amount, now(), id]
        );
    }

    async softDelete(id: string): Promise<void> {
        await this.db.run('UPDATE accounts SET is_active = 0, updated_at = ? WHERE id = ?', [now(), id]);
    }

    async restore(id: string): Promise<void> {
        await this.db.run('UPDATE accounts SET is_active = 1, updated_at = ? WHERE id = ?', [now(), id]);
    }

    private mapRow(row: any): Account {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            balance: row.balance,
            icon: row.icon,
            color: row.color,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
