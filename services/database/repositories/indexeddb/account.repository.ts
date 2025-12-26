import { nanoid } from 'nanoid';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../types';
import { IAccountRepository } from '../../interfaces';

const now = () => new Date().toISOString();

/**
 * IndexedDB Account Repository
 */
export class IndexedDBAccountRepository implements IAccountRepository {
    constructor(private db: any) { }

    async findAll(): Promise<Account[]> {
        return this.db.accounts.toArray();
    }

    async findById(id: string): Promise<Account | null> {
        return (await this.db.accounts.get(id)) || null;
    }

    async findByType(type: string): Promise<Account[]> {
        return this.db.accounts.where('type').equals(type).toArray();
    }

    async findActive(): Promise<Account[]> {
        return this.db.accounts.filter((acc: Account) => acc.isActive === true).toArray();
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
        await this.db.accounts.add(account);
        return account;
    }

    async update(id: string, data: UpdateAccountDTO): Promise<Account> {
        await this.db.accounts.update(id, { ...data, updatedAt: now() });
        const account = await this.findById(id);
        if (!account) throw new Error('Account not found');
        return account;
    }

    async updateBalance(id: string, amount: number): Promise<void> {
        const account = await this.findById(id);
        if (!account) throw new Error('Account not found');
        await this.db.accounts.update(id, {
            balance: account.balance + amount,
            updatedAt: now()
        });
    }

    async softDelete(id: string): Promise<void> {
        await this.db.accounts.update(id, { isActive: false, updatedAt: now() });
    }

    async restore(id: string): Promise<void> {
        await this.db.accounts.update(id, { isActive: true, updatedAt: now() });
    }
}
