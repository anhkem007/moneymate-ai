// AI Action Types and Executor
// AI chỉ quyết định - App thực thi

import { Transaction, Account, Category, TransactionType } from '../types';

// Whitelist actions - AI chỉ được phép dùng các action này
export const ALLOWED_ACTIONS = [
    'add_expense',        // Thêm chi tiêu
    'add_income',         // Thêm thu nhập
    'get_total_expense',  // Tổng chi tiêu
    'get_total_income',   // Tổng thu nhập
    'get_balance',        // Số dư hiện tại
    'list_transactions',  // Danh sách giao dịch
    'get_category_expense', // Chi tiêu theo danh mục
    'chat'                // Trả lời chat thông thường
] as const;

export type ActionType = typeof ALLOWED_ACTIONS[number];

// Action params interfaces
export interface AddTransactionParams {
    amount: number;
    category: string;
    note?: string;
}

export interface GetTotalParams {
    category?: string;
    period?: 'today' | 'this_week' | 'this_month' | 'this_year' | 'all';
}

export interface ListTransactionsParams {
    category?: string;
    type?: 'expense' | 'income';
    limit?: number;
    period?: 'today' | 'this_week' | 'this_month' | 'this_year' | 'all';
}

export interface ChatParams {
    message: string;
}

// Main AI Action interface
export interface AIAction {
    action: ActionType;
    params: AddTransactionParams | GetTotalParams | ListTransactionsParams | ChatParams | Record<string, unknown>;
}

// Action result
export interface ActionResult {
    success: boolean;
    data?: unknown;
    message: string;
}

// Helper: Parse amount from various formats (40k, 1tr, 50000, etc)
const parseAmount = (input: unknown): number => {
    if (typeof input === 'number') return input;
    if (typeof input !== 'string') return 0;

    const str = input.toLowerCase().trim();
    const match = str.match(/^(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|m)?$/i);
    if (!match) {
        // Try to parse as plain number
        const num = parseFloat(str.replace(/[^\d.]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    let amount = parseFloat(match[1].replace(',', '.'));
    const unit = match[2] || '';

    if (unit === 'k') amount *= 1000;
    else if (unit === 'tr' || unit === 'triệu' || unit === 'm') amount *= 1000000;
    else if (amount > 0 && amount < 1000) amount *= 1000; // Assume "40" means "40k"

    return Math.round(amount);
};

// Helper: Get date range for period
const getPeriodRange = (period: string = 'this_month'): { from: Date; to: Date } => {
    const now = new Date();
    const to = now;
    let from: Date;

    switch (period) {
        case 'today':
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'this_week':
            const dayOfWeek = now.getDay();
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
            break;
        case 'this_month':
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'this_year':
            from = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            from = new Date(0); // Beginning of time
            break;
    }

    return { from, to };
};

// Main Action Executor
export const executeAction = (
    action: AIAction,
    transactions: Transaction[],
    accounts: Account[],
    categories: Category[],
    onAddTransaction?: (t: Omit<Transaction, 'id'>) => void
): ActionResult => {

    // Validate action is in whitelist
    if (!ALLOWED_ACTIONS.includes(action.action)) {
        return { success: false, message: 'Action không hợp lệ' };
    }

    const params = action.params;

    switch (action.action) {
        case 'add_expense': {
            const p = params as AddTransactionParams;
            const amount = parseAmount(p.amount);
            console.log('[add_expense] Raw amount:', p.amount, '→ Parsed:', amount, 'Category:', p.category);

            if (!amount || amount <= 0) {
                return { success: false, message: 'Số tiền không hợp lệ' };
            }
            if (!p.category) {
                return { success: false, message: 'Thiếu danh mục' };
            }

            // Find matching category from database
            const matchedCategory = categories.find(c =>
                c.name.toLowerCase() === p.category.toLowerCase() ||
                c.name.toLowerCase().includes(p.category.toLowerCase()) ||
                p.category.toLowerCase().includes(c.name.toLowerCase())
            );

            const categoryId = matchedCategory?.id || 'other_expense';
            const categoryName = matchedCategory?.name || p.category;

            console.log('[add_expense] Matched category:', matchedCategory?.name, 'ID:', categoryId);

            if (onAddTransaction) {
                console.log('[add_expense] Calling onAddTransaction with categoryId:', categoryId);
                onAddTransaction({
                    amount: amount,
                    category: categoryName,
                    categoryId: categoryId,
                    date: new Date().toISOString(),
                    note: p.note || '',
                    type: TransactionType.EXPENSE,
                    accountId: accounts[0]?.id || 'default'
                });
                console.log('[add_expense] Transaction added successfully');
            } else {
                console.log('[add_expense] WARNING: onAddTransaction is undefined!');
            }
            return {
                success: true,
                data: { amount: amount, category: categoryName, categoryId: categoryId },
                message: `Đã ghi chi ${amount.toLocaleString()}đ vào ${categoryName} 💸`
            };
        }

        case 'add_income': {
            const p = params as AddTransactionParams;
            const amount = parseAmount(p.amount);
            console.log('[add_income] Raw amount:', p.amount, '→ Parsed:', amount, 'Category:', p.category);

            if (!amount || amount <= 0) {
                return { success: false, message: 'Số tiền không hợp lệ' };
            }

            // Find matching income category from database
            const matchedCategory = categories.find(c =>
                c.type === TransactionType.INCOME && (
                    c.name.toLowerCase() === (p.category || '').toLowerCase() ||
                    c.name.toLowerCase().includes((p.category || '').toLowerCase())
                )
            );

            const categoryId = matchedCategory?.id || 'salary';
            const categoryName = matchedCategory?.name || p.category || 'Thu nhập';

            console.log('[add_income] Matched category:', matchedCategory?.name, 'ID:', categoryId);

            if (onAddTransaction) {
                onAddTransaction({
                    amount: amount,
                    category: categoryName,
                    categoryId: categoryId,
                    date: new Date().toISOString(),
                    note: p.note || '',
                    type: TransactionType.INCOME,
                    accountId: accounts[0]?.id || 'default'
                });
            }
            return {
                success: true,
                data: { amount: amount, category: categoryName, categoryId: categoryId },
                message: `Đã ghi thu ${amount.toLocaleString()}đ 💰`
            };
        }

        case 'get_total_expense': {
            const p = params as GetTotalParams;
            const { from, to } = getPeriodRange(p.period);

            let filtered = transactions.filter(t =>
                t.type === TransactionType.EXPENSE &&
                new Date(t.date) >= from &&
                new Date(t.date) <= to
            );

            if (p.category) {
                filtered = filtered.filter(t =>
                    t.category.toLowerCase().includes(p.category!.toLowerCase())
                );
            }

            const total = filtered.reduce((sum, t) => sum + t.amount, 0);
            const periodText = p.period === 'this_month' ? 'tháng này' :
                p.period === 'today' ? 'hôm nay' :
                    p.period === 'this_week' ? 'tuần này' : '';
            const categoryText = p.category ? ` cho ${p.category}` : '';

            return {
                success: true,
                data: { total, count: filtered.length },
                message: `Bạn đã chi ${total.toLocaleString()}đ${categoryText} ${periodText} 📊`
            };
        }

        case 'get_total_income': {
            const p = params as GetTotalParams;
            const { from, to } = getPeriodRange(p.period);

            const filtered = transactions.filter(t =>
                t.type === TransactionType.INCOME &&
                new Date(t.date) >= from &&
                new Date(t.date) <= to
            );

            const total = filtered.reduce((sum, t) => sum + t.amount, 0);
            const periodText = p.period === 'this_month' ? 'tháng này' :
                p.period === 'today' ? 'hôm nay' : '';

            return {
                success: true,
                data: { total, count: filtered.length },
                message: `Bạn đã thu ${total.toLocaleString()}đ ${periodText} 💵`
            };
        }

        case 'get_balance': {
            const balance = accounts.reduce((sum, a) => sum + a.balance, 0);
            return {
                success: true,
                data: { balance },
                message: `Số dư hiện tại: ${balance.toLocaleString()}đ 💳`
            };
        }

        case 'get_category_expense': {
            const p = params as GetTotalParams;
            const { from, to } = getPeriodRange(p.period);

            if (!p.category) {
                return { success: false, message: 'Thiếu tên danh mục' };
            }

            const filtered = transactions.filter(t =>
                t.type === TransactionType.EXPENSE &&
                t.category.toLowerCase().includes(p.category!.toLowerCase()) &&
                new Date(t.date) >= from &&
                new Date(t.date) <= to
            );

            const total = filtered.reduce((sum, t) => sum + t.amount, 0);

            return {
                success: true,
                data: { total, count: filtered.length, category: p.category },
                message: `Chi tiêu ${p.category}: ${total.toLocaleString()}đ (${filtered.length} giao dịch) 📈`
            };
        }

        case 'list_transactions': {
            const p = params as ListTransactionsParams;
            const { from, to } = getPeriodRange(p.period);
            const limit = p.limit || 5;

            let filtered = transactions.filter(t =>
                new Date(t.date) >= from &&
                new Date(t.date) <= to
            );

            if (p.type === 'expense') {
                filtered = filtered.filter(t => t.type === TransactionType.EXPENSE);
            } else if (p.type === 'income') {
                filtered = filtered.filter(t => t.type === TransactionType.INCOME);
            }

            if (p.category) {
                filtered = filtered.filter(t =>
                    t.category.toLowerCase().includes(p.category!.toLowerCase())
                );
            }

            // Sort by date desc and limit
            filtered = filtered
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit);

            const listText = filtered.map(t =>
                `• ${t.type === TransactionType.EXPENSE ? '-' : '+'}${t.amount.toLocaleString()}đ (${t.category})`
            ).join('\n');

            return {
                success: true,
                data: { transactions: filtered, count: filtered.length },
                message: filtered.length > 0
                    ? `📋 ${filtered.length} giao dịch gần nhất:\n${listText}`
                    : 'Không có giao dịch nào 📭'
            };
        }

        case 'chat': {
            const p = params as ChatParams;
            return {
                success: true,
                data: null,
                message: p.message || 'Xin chào! Tôi có thể giúp gì cho bạn? 😊'
            };
        }

        default:
            return { success: false, message: 'Action không được hỗ trợ' };
    }
};

// Parse AI response to extract action
export const parseAIResponse = (response: string): AIAction | null => {
    try {
        // Try to find JSON in response
        const jsonMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.action && ALLOWED_ACTIONS.includes(parsed.action)) {
                return parsed as AIAction;
            }
        }
        return null;
    } catch (e) {
        console.error('Failed to parse AI action:', e);
        return null;
    }
};
