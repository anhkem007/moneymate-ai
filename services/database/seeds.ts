import { Category } from './types';

// Default categories
export const DEFAULT_CATEGORIES = [
    // Chi tiêu (EXPENSE)
    { id: 'food', name: 'Ăn uống', icon: '🍔', color: '#ef4444', type: 'EXPENSE', sortOrder: 1 },
    { id: 'food_market', name: 'Đi chợ', icon: '🛒', color: '#ef4444', type: 'EXPENSE', parentId: 'food', sortOrder: 1 },
    { id: 'food_restaurant', name: 'Nhà hàng', icon: '🍽️', color: '#ef4444', type: 'EXPENSE', parentId: 'food', sortOrder: 2 },
    { id: 'food_coffee', name: 'Cà phê/Trà', icon: '☕', color: '#ef4444', type: 'EXPENSE', parentId: 'food', sortOrder: 3 },

    { id: 'transport', name: 'Di chuyển', icon: '🚗', color: '#f59e0b', type: 'EXPENSE', sortOrder: 2 },
    { id: 'transport_gas', name: 'Xăng xe', icon: '⛽', color: '#f59e0b', type: 'EXPENSE', parentId: 'transport', sortOrder: 1 },
    { id: 'transport_grab', name: 'Grab/Taxi', icon: '🚕', color: '#f59e0b', type: 'EXPENSE', parentId: 'transport', sortOrder: 2 },
    { id: 'transport_parking', name: 'Gửi xe', icon: '🅿️', color: '#f59e0b', type: 'EXPENSE', parentId: 'transport', sortOrder: 3 },

    { id: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#3b82f6', type: 'EXPENSE', sortOrder: 3 },
    { id: 'shopping_clothes', name: 'Quần áo', icon: '👕', color: '#3b82f6', type: 'EXPENSE', parentId: 'shopping', sortOrder: 1 },
    { id: 'shopping_electronics', name: 'Điện tử', icon: '📱', color: '#3b82f6', type: 'EXPENSE', parentId: 'shopping', sortOrder: 2 },

    { id: 'bills', name: 'Hoá đơn', icon: '🧾', color: '#8b5cf6', type: 'EXPENSE', sortOrder: 4 },
    { id: 'bills_electric', name: 'Tiền điện', icon: '⚡', color: '#8b5cf6', type: 'EXPENSE', parentId: 'bills', sortOrder: 1 },
    { id: 'bills_water', name: 'Tiền nước', icon: '💧', color: '#8b5cf6', type: 'EXPENSE', parentId: 'bills', sortOrder: 2 },
    { id: 'bills_internet', name: 'Internet', icon: '📶', color: '#8b5cf6', type: 'EXPENSE', parentId: 'bills', sortOrder: 3 },
    { id: 'bills_phone', name: 'Điện thoại', icon: '📞', color: '#8b5cf6', type: 'EXPENSE', parentId: 'bills', sortOrder: 4 },

    { id: 'entertainment', name: 'Giải trí', icon: '🎬', color: '#ec4899', type: 'EXPENSE', sortOrder: 5 },
    { id: 'health', name: 'Sức khoẻ', icon: '💊', color: '#14b8a6', type: 'EXPENSE', sortOrder: 6 },
    { id: 'education', name: 'Giáo dục', icon: '📚', color: '#6366f1', type: 'EXPENSE', sortOrder: 7 },
    { id: 'home', name: 'Nhà cửa', icon: '🏠', color: '#84cc16', type: 'EXPENSE', sortOrder: 8 },
    { id: 'personal', name: 'Cá nhân', icon: '👤', color: '#f97316', type: 'EXPENSE', sortOrder: 9 },
    { id: 'other_expense', name: 'Khác', icon: '📦', color: '#64748b', type: 'EXPENSE', sortOrder: 99 },

    // Thu nhập (INCOME)
    { id: 'salary', name: 'Lương', icon: '💰', color: '#10b981', type: 'INCOME', sortOrder: 1 },
    { id: 'bonus', name: 'Thưởng', icon: '🎁', color: '#10b981', type: 'INCOME', sortOrder: 2 },
    { id: 'investment', name: 'Đầu tư', icon: '📈', color: '#10b981', type: 'INCOME', sortOrder: 3 },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#10b981', type: 'INCOME', sortOrder: 4 },
    { id: 'gift', name: 'Quà tặng', icon: '🎀', color: '#10b981', type: 'INCOME', sortOrder: 5 },
    { id: 'refund', name: 'Hoàn tiền', icon: '↩️', color: '#10b981', type: 'INCOME', sortOrder: 6 },
    { id: 'other_income', name: 'Khác', icon: '💵', color: '#10b981', type: 'INCOME', sortOrder: 99 },
] as Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'EXPENSE' | 'INCOME';
    sortOrder: number;
    parentId?: string;
}>;

// Default settings
export const DEFAULT_SETTINGS = {
    persona: 'friendly',
    monthlyLimit: 15000000,
    currency: 'VND',
    language: 'vi',
    theme: 'system',
    firstDayOfWeek: 1,
    firstDayOfMonth: 1,
};

// Default account types with icons
export const ACCOUNT_TYPE_CONFIG = {
    CASH: { name: 'Tiền mặt', icon: '💵', color: '#10b981' },
    BANK: { name: 'Ngân hàng', icon: '🏦', color: '#3b82f6' },
    CREDIT: { name: 'Thẻ tín dụng', icon: '💳', color: '#8b5cf6' },
    E_WALLET: { name: 'Ví điện tử', icon: '📱', color: '#f59e0b' },
    FUND: { name: 'Quỹ tiết kiệm', icon: '🐷', color: '#ec4899' },
};
