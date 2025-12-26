
export enum Tab {
  CHAT = 'CHAT',
  STATS = 'STATS',
  ADD = 'ADD',
  CATEGORIES = 'CATEGORIES',
  SETTINGS = 'SETTINGS',
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum AccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  CREDIT = 'CREDIT',
  E_WALLET = 'E_WALLET',
  FUND = 'FUND', 
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  parentId?: string; // ID của danh mục cha
  budgetLimit?: number; // Hạn mức chi tiêu
}

export interface Transaction {
  id: string;
  amount: number;
  category: string; // Tên hoặc ID danh mục
  categoryId?: string; 
  date: string; 
  note: string;
  type: TransactionType;
  accountId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface AppSettings {
  persona: 'friendly' | 'professional' | 'strict' | 'sarcastic';
  monthlyLimit: number;
  currency: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: '🍔', color: '#ef4444', type: TransactionType.EXPENSE },
  { id: 'food_market', name: 'Đi chợ', icon: '🛒', color: '#ef4444', type: TransactionType.EXPENSE, parentId: 'food' },
  { id: 'food_restaurant', name: 'Nhà hàng', icon: '🍽️', color: '#ef4444', type: TransactionType.EXPENSE, parentId: 'food' },
  
  { id: 'transport', name: 'Di chuyển', icon: '🚗', color: '#f59e0b', type: TransactionType.EXPENSE },
  { id: 'transport_gas', name: 'Xăng xe', icon: '⛽', color: '#f59e0b', type: TransactionType.EXPENSE, parentId: 'transport' },
  
  { id: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#3b82f6', type: TransactionType.EXPENSE },
  { id: 'bills', name: 'Hoá đơn', icon: '🧾', color: '#8b5cf6', type: TransactionType.EXPENSE },
  { id: 'salary', name: 'Lương', icon: '💰', color: '#10b981', type: TransactionType.INCOME },
  { id: 'bonus', name: 'Thưởng', icon: '🎁', color: '#f43f5e', type: TransactionType.INCOME },
];

export const CATEGORIES = INITIAL_CATEGORIES.filter(c => c.type === TransactionType.EXPENSE);
export const INCOME_CATEGORIES = INITIAL_CATEGORIES.filter(c => c.type === TransactionType.INCOME);
