import React, { useState, useMemo } from 'react';
import { AppSettings, Account, AccountType, Category, TransactionType } from '../types';
import { User, Bell, Shield, Cloud, CreditCard, ChevronRight, Wallet, Plus, ArrowLeft, PiggyBank, Briefcase, ListFilter, Globe, Coins } from 'lucide-react';

interface SettingsTabProps {
    settings: AppSettings;
    accounts: Account[];
    categories: Category[];
    onUpdateCategory: (cat: Category) => void;
    onUpdateSettings: (s: Partial<AppSettings>) => void;
    onAddAccount: (a: Omit<Account, 'id'>) => void;
}

type ViewMode = 'menu' | 'manage_accounts' | 'add_account';

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, accounts, categories, onUpdateCategory, onUpdateSettings, onAddAccount }) => {
    const [view, setView] = useState<ViewMode>('menu');

    // New Account Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<AccountType>(AccountType.CASH);
    const [newBalance, setNewBalance] = useState('');

    const personas = [
        { id: 'friendly', name: 'Thân thiện', desc: 'Luôn động viên, nhẹ nhàng', emoji: '😊' },
        { id: 'strict', name: 'Nghiêm khắc', desc: 'Cảnh báo khi tiêu hoang', emoji: '😠' },
        { id: 'professional', name: 'Chuyên nghiệp', desc: 'Ngắn gọn, chính xác', emoji: '👔' },
        { id: 'sarcastic', name: 'Hài hước', desc: 'Châm biếm thói quen của bạn', emoji: '😜' },
    ];

    const expenseCategories = useMemo(() =>
        categories.filter(c => c.type === TransactionType.EXPENSE),
        [categories]
    );

    const totalCategoryBudget = useMemo(() =>
        expenseCategories.reduce((sum, c) => sum + (c.budgetLimit || 0), 0),
        [expenseCategories]
    );

    const handleUpdateCategoryLimit = (cat: Category, limitStr: string) => {
        const limit = parseInt(limitStr.replace(/,/g, '')) || 0;
        const updatedCat = { ...cat, budgetLimit: limit > 0 ? limit : undefined };

        // Calculate what the new total would be if we apply this change
        const otherCatsBudget = expenseCategories
            .filter(c => c.id !== cat.id)
            .reduce((sum, c) => sum + (c.budgetLimit || 0), 0);

        const newSum = otherCatsBudget + limit;

        // If new sum of detailed categories > current general monthly limit, update general limit
        if (newSum > settings.monthlyLimit) {
            onUpdateSettings({ monthlyLimit: newSum });
        }

        onUpdateCategory(updatedCat);
    };

    const handleUpdateMonthlyLimit = (value: string) => {
        const limit = parseInt(value.replace(/,/g, '')) || 0;
        // Monthly limit cannot be smaller than the sum of its parts
        const finalLimit = Math.max(limit, totalCategoryBudget);
        onUpdateSettings({ monthlyLimit: finalLimit });
    };

    const handleCreateAccount = () => {
        if (!newName) return;

        let icon = '💵';
        let color = '#10b981';

        switch (newType) {
            case AccountType.BANK: icon = '🏦'; color = '#3b82f6'; break;
            case AccountType.CREDIT: icon = '💳'; color = '#8b5cf6'; break;
            case AccountType.E_WALLET: icon = '📱'; color = '#06b6d4'; break;
            case AccountType.FUND: icon = '🐷'; color = '#ec4899'; break;
            case AccountType.CASH: default: icon = '💵'; color = '#10b981'; break;
        }

        onAddAccount({
            name: newName,
            type: newType,
            balance: parseInt(newBalance.replace(/,/g, '') || '0'),
            icon,
            color
        });

        setNewName('');
        setNewBalance('');
        setView('manage_accounts');
    };

    // --- SUB-VIEW: ADD ACCOUNT ---
    if (view === 'add_account') {
        return (
            <div className="flex flex-col h-full bg-white p-6 animate-fade-in">
                <button onClick={() => setView('manage_accounts')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-emerald-600">
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Thêm mới</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Tên gọi</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="VD: Quỹ du lịch, Vietinbank..."
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Loại</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { type: AccountType.CASH, label: 'Tiền mặt', icon: '💵' },
                                { type: AccountType.BANK, label: 'Ngân hàng', icon: '🏦' },
                                { type: AccountType.CREDIT, label: 'Thẻ tín dụng', icon: '💳' },
                                { type: AccountType.E_WALLET, label: 'Ví điện tử', icon: '📱' },
                                { type: AccountType.FUND, label: 'Quỹ tiết kiệm', icon: '🐷' },
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => setNewType(item.type)}
                                    className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${newType === item.type
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <span>{item.icon}</span> {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Số dư ban đầu</label>
                        <input
                            type="number"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        onClick={handleCreateAccount}
                        disabled={!newName}
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-4 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Tạo Mới
                    </button>
                </div>
            </div>
        );
    }

    // --- SUB-VIEW: MANAGE ACCOUNTS ---
    if (view === 'manage_accounts') {
        const funds = accounts.filter(a => a.type === AccountType.FUND);
        const regular = accounts.filter(a => a.type !== AccountType.FUND);

        return (
            <div className="flex flex-col h-full bg-slate-50 p-4 pb-4 animate-fade-in overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setView('menu')} className="p-2 -ml-2 text-slate-500 hover:text-emerald-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800">Quản lý Tài chính</h2>
                    <button onClick={() => setView('add_account')} className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1 flex items-center gap-1">
                        <Wallet size={12} /> Tài khoản thanh toán
                    </h3>
                    <div className="space-y-3">
                        {regular.map(acc => (
                            <div key={acc.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{acc.icon}</div>
                                    <div>
                                        <div className="font-bold text-slate-700">{acc.name}</div>
                                        <div className="text-xs text-slate-400">{acc.type}</div>
                                    </div>
                                </div>
                                <div className={`font-bold ${acc.balance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                    {acc.balance.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1 flex items-center gap-1">
                        <PiggyBank size={12} /> Quỹ tích luỹ
                    </h3>
                    <div className="space-y-3">
                        {funds.map(acc => (
                            <div key={acc.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: acc.color }}></div>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{acc.icon}</div>
                                    <div>
                                        <div className="font-bold text-slate-700">{acc.name}</div>
                                        <div className="text-xs text-slate-400">{acc.type}</div>
                                    </div>
                                </div>
                                <div className="font-bold text-slate-800">
                                    {acc.balance.toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {funds.length === 0 && <div className="text-center text-slate-400 text-sm py-4 italic">Chưa có quỹ nào</div>}
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN VIEW: MENU ---
    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 pb-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Cài đặt</h2>

            <section className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Tài chính</h3>
                <div
                    onClick={() => setView('manage_accounts')}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-700">Quản lý Tài khoản & Quỹ</div>
                            <div className="text-xs text-slate-500">{accounts.length} nguồn tiền đang theo dõi</div>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                </div>
            </section>

            <section className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Tính cách AI</h3>
                <div className="space-y-3">
                    {personas.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onUpdateSettings({ persona: p.id as any })}
                            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${settings.persona === p.id
                                ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                                : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{p.emoji}</div>
                                <div>
                                    <div className="font-bold text-slate-800">{p.name}</div>
                                    <div className="text-xs text-slate-500">{p.desc}</div>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.persona === p.id ? 'border-emerald-500' : 'border-slate-300'}`}>
                                {settings.persona === p.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Budget Limit Section */}
            <section className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Ngân sách</h3>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    {/* General Limit */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <CreditCard size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-700">Hạn mức tháng</div>
                                <div className="text-xs text-slate-500">Giới hạn tổng chi tiêu</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={settings.monthlyLimit}
                                onChange={(e) => handleUpdateMonthlyLimit(e.target.value)}
                                className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <span className="font-bold text-slate-500">{settings.currency}</span>
                        </div>
                        {totalCategoryBudget > 0 && totalCategoryBudget === settings.monthlyLimit && (
                            <p className="text-[10px] text-amber-600 font-medium mt-1">
                                Hạn mức đang bằng tổng chi tiết các danh mục.
                            </p>
                        )}
                    </div>

                    {/* Detailed Category Budgets */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3 text-slate-600">
                            <ListFilter size={16} />
                            <span className="text-xs font-bold uppercase tracking-tight">Chi tiết theo danh mục</span>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {expenseCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-[100px]">
                                        <span className="text-lg">{cat.icon}</span>
                                        <span className="text-xs font-medium text-slate-700 truncate">{cat.name}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={cat.budgetLimit || ''}
                                            onChange={(e) => handleUpdateCategoryLimit(cat, e.target.value)}
                                            placeholder="Không giới hạn"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">{settings.currency}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Chung</h3>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">

                    {/* Currency Setting */}
                    <div className="p-4 flex items-center justify-between active:bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                <Coins size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-700">Đơn vị tiền tệ</div>
                                <div className="text-xs text-slate-400">Hiển thị toàn ứng dụng</div>
                            </div>
                        </div>
                        <select
                            value={settings.currency}
                            onChange={(e) => onUpdateSettings({ currency: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-right"
                        >
                            <option value="VNĐ">VNĐ</option>
                            <option value="$">USD ($)</option>
                            <option value="€">EUR (€)</option>
                            <option value="¥">JPY (¥)</option>
                            <option value="₩">KRW (₩)</option>
                        </select>
                    </div>

                    {[
                        { icon: Bell, label: 'Cảnh báo chi tiêu', sub: 'Khi đạt 80% ngân sách' },
                        { icon: Shield, label: 'Quyền riêng tư', sub: 'Dữ liệu chỉ lưu trên thiết bị' },
                        { icon: Cloud, label: 'Sao lưu', sub: 'Chưa kích hoạt' },
                    ].map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between active:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700">{item.label}</div>
                                    <div className="text-xs text-slate-400">{item.sub}</div>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                        </div>
                    ))}
                </div>
            </section>

            <div className="mt-8 text-center text-xs text-slate-400">
                MoneyMate AI v1.0.1
            </div>
        </div>
    );
};

export default SettingsTab;
