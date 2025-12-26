import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ChevronDown, Clock } from 'lucide-react';
import { Transaction, TransactionType, Account, INITIAL_CATEGORIES } from '../types';

interface AddTabProps {
    accounts: Account[];
    onAdd: (t: Omit<Transaction, 'id'>) => void;
    onUpdate?: (id: string, t: Omit<Transaction, 'id'>) => void;
    onClose: () => void;
    onAddAccount: (acc: Omit<Account, 'id'>) => void;
    // Edit mode: pass existing transaction to edit
    editTransaction?: Transaction | null;
    categories: any[]; // Using any to avoid strict type mismatch if needed, but Category[] is better
}

const AddTab: React.FC<AddTabProps> = ({ accounts, onAdd, onUpdate, onClose, editTransaction, categories: propCategories }) => {
    const isEditMode = !!editTransaction;

    // Helper to convert ISO date to datetime-local format
    const toLocalDateTimeString = (isoString?: string) => {
        const date = isoString ? new Date(isoString) : new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialize state - use editTransaction values if editing
    const [type, setType] = useState<TransactionType>(
        editTransaction?.type || TransactionType.EXPENSE
    );
    const [amount, setAmount] = useState(
        editTransaction ? String(editTransaction.amount) : ''
    );
    const [category, setCategory] = useState(
        editTransaction?.category || ''
    );
    const [note, setNote] = useState(
        editTransaction?.note || ''
    );
    const [selectedAccountId, setSelectedAccountId] = useState(
        editTransaction?.accountId || accounts[0]?.id || ''
    );
    const [dateTime, setDateTime] = useState(
        toLocalDateTimeString(editTransaction?.date)
    );

    // Update form when editTransaction changes
    useEffect(() => {
        if (editTransaction) {
            setType(editTransaction.type);
            setAmount(String(editTransaction.amount));
            setCategory(editTransaction.category);
            setNote(editTransaction.note || '');
            setSelectedAccountId(editTransaction.accountId);
            setDateTime(toLocalDateTimeString(editTransaction.date));
        }
    }, [editTransaction]);

    const categories = propCategories.filter(c => c.type === type && !c.parentId);

    const handleSubmit = () => {
        if (!amount || !category || !selectedAccountId) return;

        const selectedDate = new Date(dateTime);
        const transactionData = {
            amount: parseFloat(amount),
            category,
            categoryId: propCategories.find(c => c.name === category)?.id,
            date: selectedDate.toISOString(),
            note,
            type,
            accountId: selectedAccountId,
        };

        if (isEditMode && editTransaction && onUpdate) {
            onUpdate(editTransaction.id, transactionData);
        } else {
            onAdd(transactionData);
        }

        // Reset form if adding new
        if (!isEditMode) {
            setAmount('');
            setCategory('');
            setNote('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
            {/* Header */}
            <div className={`p-4 shadow-sm flex items-center justify-between ${isEditMode ? 'bg-blue-50' : 'bg-white'
                }`}>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                    <X size={24} />
                </button>
                <h1 className={`font-bold ${isEditMode ? 'text-blue-700' : 'text-slate-800'}`}>
                    {isEditMode ? 'Sửa giao dịch' : 'Thêm giao dịch'}
                </h1>
                <div className="w-6" />
            </div>

            {/* Type Toggle */}
            <div className="p-4">
                <div className="flex bg-slate-200 rounded-full p-1">
                    <button
                        onClick={() => setType(TransactionType.EXPENSE)}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === TransactionType.EXPENSE
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-slate-600'
                            }`}
                    >
                        <Minus size={16} />
                        Chi tiêu
                    </button>
                    <button
                        onClick={() => setType(TransactionType.INCOME)}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === TransactionType.INCOME
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-600'
                            }`}
                    >
                        <Plus size={16} />
                        Thu nhập
                    </button>
                </div>
            </div>

            {/* Amount Input */}
            <div className="px-4 pb-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className={`w-full text-4xl font-bold text-center outline-none ${type === TransactionType.EXPENSE ? 'text-red-500' : 'text-emerald-500'
                            }`}
                    />
                    <p className="text-center text-slate-400 text-sm mt-2">VNĐ</p>
                </div>
            </div>

            {/* Account Selector */}
            <div className="px-4 pb-4">
                <label className="text-xs text-slate-500 mb-2 block">Tài khoản</label>
                <div className="relative">
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full bg-white rounded-xl p-3 text-slate-700 appearance-none outline-none shadow-sm border border-slate-100"
                    >
                        {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.icon} {acc.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
            </div>

            {/* Category Grid */}
            <div className="px-4 pb-4">
                <label className="text-xs text-slate-500 mb-2 block">Danh mục</label>
                <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.name)}
                            className={`flex flex-col items-center p-3 rounded-xl transition-all ${category === cat.name
                                ? 'bg-emerald-100 border-2 border-emerald-500'
                                : 'bg-white border border-slate-100'
                                }`}
                        >
                            <span className="text-2xl mb-1">{cat.icon}</span>
                            <span className="text-xs text-slate-600 text-center">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Note Input */}
            <div className="px-4 pb-4">
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú (tùy chọn)"
                    className="w-full bg-white rounded-xl p-3 text-slate-700 outline-none shadow-sm border border-slate-100"
                />
            </div>

            {/* DateTime Input */}
            <div className="px-4 pb-4">
                <label className="text-xs text-slate-500 mb-2 block">Thời gian</label>
                <div className="relative">
                    <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        className="w-full bg-white rounded-xl p-3 text-slate-700 outline-none shadow-sm border border-slate-100 pl-10"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
            </div>

            {/* Submit Button */}
            <div className="p-4 bg-white border-t border-slate-100">
                <button
                    onClick={handleSubmit}
                    disabled={!amount || !category}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${amount && category
                        ? isEditMode
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : type === TransactionType.EXPENSE
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-slate-300'
                        }`}
                >
                    {isEditMode ? 'Cập nhật' : 'Thêm giao dịch'}
                </button>
            </div>
        </div>
    );
};

export default AddTab;
