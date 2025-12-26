import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ChevronDown, Clock, ArrowLeft } from 'lucide-react';
import { Transaction, TransactionType, Account, INITIAL_CATEGORIES } from '../types';

interface EditTransactionModalProps {
    transaction: Transaction;
    accounts: Account[];
    onUpdate: (id: string, data: Omit<Transaction, 'id'>) => void;
    onClose: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    transaction,
    accounts,
    onUpdate,
    onClose
}) => {
    const toLocalDateTimeString = (isoString: string) => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [type, setType] = useState<TransactionType>(transaction.type);
    const [amount, setAmount] = useState(String(transaction.amount));
    const [category, setCategory] = useState(transaction.category);
    const [note, setNote] = useState(transaction.note || '');
    const [selectedAccountId, setSelectedAccountId] = useState(transaction.accountId);
    const [dateTime, setDateTime] = useState(toLocalDateTimeString(transaction.date));

    const categories = INITIAL_CATEGORIES.filter(c => c.type === type && !c.parentId);

    const handleSubmit = () => {
        if (!amount || !category || !selectedAccountId) return;

        const selectedDate = new Date(dateTime);
        onUpdate(transaction.id, {
            amount: parseFloat(amount),
            category,
            categoryId: INITIAL_CATEGORIES.find(c => c.name === category)?.id,
            date: selectedDate.toISOString(),
            note,
            type,
            accountId: selectedAccountId,
        });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
            <div className="bg-blue-50 p-4 shadow-sm flex items-center justify-between border-b border-blue-100">
                <button onClick={onClose} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Quay lại</span>
                </button>
                <h1 className="font-bold text-blue-700">Sửa giao dịch</h1>
                <div className="w-20" />
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-4">
                    <div className="flex bg-slate-200 rounded-full p-1">
                        <button
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white shadow-sm' : 'text-slate-600'}`}
                        >
                            <Minus size={16} />
                            Chi tiêu
                        </button>
                        <button
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600'}`}
                        >
                            <Plus size={16} />
                            Thu nhập
                        </button>
                    </div>
                </div>

                <div className="px-4 pb-4">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className={`w-full text-4xl font-bold text-center outline-none ${type === TransactionType.EXPENSE ? 'text-red-500' : 'text-emerald-500'}`}
                        />
                        <p className="text-center text-slate-400 text-sm mt-2">VNĐ</p>
                    </div>
                </div>

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

                <div className="px-4 pb-4">
                    <label className="text-xs text-slate-500 mb-2 block">Danh mục</label>
                    <div className="grid grid-cols-4 gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.name)}
                                className={`flex flex-col items-center p-3 rounded-xl transition-all ${category === cat.name ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border border-slate-100'}`}
                            >
                                <span className="text-2xl mb-1">{cat.icon}</span>
                                <span className="text-xs text-slate-600 text-center">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 pb-4">
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ghi chú (tùy chọn)"
                        className="w-full bg-white rounded-xl p-3 text-slate-700 outline-none shadow-sm border border-slate-100"
                    />
                </div>

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
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
                <button
                    onClick={handleSubmit}
                    disabled={!amount || !category}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${amount && category ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98]' : 'bg-slate-300'}`}
                >
                    Cập nhật
                </button>
            </div>
        </div>
    );
};

export default EditTransactionModal;
