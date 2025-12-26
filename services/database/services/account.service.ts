import { Account, CreateAccountDTO, UpdateAccountDTO } from '../types';
import { IDatabase, IAccountService } from '../interfaces';

/**
 * Account Service - Quản lý tài khoản
 */
export class AccountService implements IAccountService {
    constructor(private db: IDatabase) { }

    async getAllAccounts(): Promise<Account[]> {
        return this.db.accounts.findActive();
    }

    async getAccountById(id: string): Promise<Account | null> {
        return this.db.accounts.findById(id);
    }

    async getAccountsByType(type: string): Promise<Account[]> {
        const accounts = await this.db.accounts.findByType(type);
        return accounts.filter(a => a.isActive);
    }

    async getTotalBalance(): Promise<number> {
        const accounts = await this.getAllAccounts();
        return accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }

    async createAccount(data: CreateAccountDTO): Promise<Account> {
        return this.db.accounts.create(data);
    }

    async updateAccount(id: string, data: UpdateAccountDTO): Promise<Account> {
        return this.db.accounts.update(id, data);
    }

    async deleteAccount(id: string): Promise<void> {
        const transactions = await this.db.transactions.findByAccountId(id);
        if (transactions.length > 0) {
            await this.db.accounts.softDelete(id);
        } else {
            await this.db.accounts.softDelete(id);
        }
    }
}
