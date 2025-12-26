import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, ChevronDown, Calendar, Filter, Loader2 } from 'lucide-react';
import { Transaction, Category, TransactionType, INITIAL_CATEGORIES, Account } from '../types';
import DateRangePickerModal from './DateRangePickerModal';
import SwipeableTransactionItem from './SwipeableTransactionItem';
import EditTransactionModal from './EditTransactionModal';

interface TransactionListModalProps {
    type: 'EXPENSE' | 'INCOME';
    transactions: Transaction[];
    accounts: Account[];
    onClose: () => void;
    onUpdateTransaction?: (id: string, data: Omit<Transaction, 'id'>) => void;
    onDeleteTransaction?: (tx: Transaction) => void;
}

type TimeFilter = 'today' | '7days' | '30days' | 'thisMonth' | 'custom' | 'all';

interface DateRange {
    start: string;
    end: string;
}

const TIME_FILTER_OPTIONS = [
    { value: 'today', label: 'Hôm nay' },
    { value: '7days', label: '7 ngày qua' },
    { value: '30days', label: '30 ngày qua' },
    { value: 'thisMonth', label: 'Tháng này' },
    { value: 'custom', label: 'Tùy chọn...' },
    { value: 'all', label: 'Tất cả' },
];

const PAGE_SIZE = 20;

const TransactionListModal: React.FC<TransactionListModalProps> = ({
    type,
    transactions,
    accounts,
    onClose,
    onUpdateTransaction,
    onDeleteTransaction
}) => {
    // Filter states
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [customRange, setCustomRange] = useState<DateRange>({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Pagination
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Get categories for this type
    const categories = useMemo(() => {
        return INITIAL_CATEGORIES.filter(c =>
            (type === 'EXPENSE' ? c.type === TransactionType.EXPENSE : c.type === TransactionType.INCOME) && !c.parentId
        );
    }, [type]);

    // Helper to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate date range based on filter
    const getDateRange = useCallback((): DateRange | null => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (timeFilter) {
            case 'today':
                return {
                    start: formatLocalDate(today),
                    end: formatLocalDate(today)
                };
            case '7days':
                const week = new Date(today);
                week.setDate(week.getDate() - 6);
                return {
                    start: formatLocalDate(week),
                    end: formatLocalDate(today)
                };
            case '30days':
                const month = new Date(today);
                month.setDate(month.getDate() - 29);
                return {
                    start: formatLocalDate(month),
                    end: formatLocalDate(today)
                };
            case 'thisMonth':
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    start: formatLocalDate(firstDay),
                    end: formatLocalDate(today)
                };
            case 'custom':
                return customRange;
            case 'all':
            default:
                return null;
        }
    }, [timeFilter, customRange]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(t =>
            type === 'EXPENSE' ? t.type === TransactionType.EXPENSE : t.type === TransactionType.INCOME
        );

        // Apply date filter
        const dateRange = getDateRange();
        if (dateRange) {
            result = result.filter(t => {
                const txDate = t.date.split('T')[0];
                return txDate >= dateRange.start && txDate <= dateRange.end;
            });
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            result = result.filter(t => t.category === categoryFilter || t.categoryId === categoryFilter);
        }

        // Sort by date descending
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, type, getDateRange, categoryFilter]);

    // Group by date
    const groupedTransactions = useMemo(() => {
        const displayed = filteredTransactions.slice(0, displayCount);
        const groups: { [date: string]: Transaction[] } = {};

        displayed.forEach(t => {
            const dateKey = t.date.split('T')[0];
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(t);
        });

        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filteredTransactions, displayCount]);

    const hasMore = displayCount < filteredTransactions.length;

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setDisplayCount(prev => prev + PAGE_SIZE);
                        setIsLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore]);

    // Reset display count when filters change
    useEffect(() => {
        setDisplayCount(PAGE_SIZE);
    }, [timeFilter, categoryFilter, customRange]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateOnly = new Date(dateStr);
        dateOnly.setHours(0, 0, 0, 0);

        if (dateOnly.getTime() === today.getTime()) {
            return 'Hôm nay';
        } else if (dateOnly.getTime() === yesterday.getTime()) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
        }
    };

    const getCategoryInfo = (categoryName: string) => {
        const cat = INITIAL_CATEGORIES.find(c => c.name === categoryName || c.id === categoryName);
        return cat || { icon: '📦', color: '#64748b', name: categoryName };
    };

    const getTimeFilterLabel = () => {
        if (timeFilter === 'custom') {
            return `${customRange.start.split('-').reverse().slice(0, 2).join('/')} - ${customRange.end.split('-').reverse().slice(0, 2).join('/')}`;
        }
        return TIME_FILTER_OPTIONS.find(o => o.value === timeFilter)?.label || 'Tất cả';
    };

    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${type === 'EXPENSE' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <X size={20} className={type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'} />
                    </button>
                    <div>
                        <h2 className={`font-bold ${type === 'EXPENSE' ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {filteredTransactions.length} giao dịch • {totalAmount.toLocaleString()} đ
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex gap-2">
                {/* Time Filter */}
                <div className="relative flex-1">
                    <button
                        onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowCategoryDropdown(false); }}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{getTimeFilterLabel()}</span>
                        </span>
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                    </button>

                    {showTimeDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10 overflow-hidden">
                            {TIME_FILTER_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        if (option.value === 'custom') {
                                            setShowDatePicker(true);
                                        }
                                        setTimeFilter(option.value as TimeFilter);
                                        setShowTimeDropdown(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${timeFilter === option.value ? 'bg-slate-100 font-medium' : ''
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Filter */}
                <div className="relative flex-1">
                    <button
                        onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowTimeDropdown(false); }}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Filter size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                                {categoryFilter === 'all' ? 'Tất cả' : getCategoryInfo(categoryFilter).name}
                            </span>
                        </span>
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                    </button>

                    {showCategoryDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10 max-h-60 overflow-y-auto">
                            <button
                                onClick={() => { setCategoryFilter('all'); setShowCategoryDropdown(false); }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${categoryFilter === 'all' ? 'bg-slate-100 font-medium' : ''
                                    }`}
                            >
                                Tất cả danh mục
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setCategoryFilter(cat.name); setShowCategoryDropdown(false); }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${categoryFilter === cat.name ? 'bg-slate-100 font-medium' : ''
                                        }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Date Range Picker Modal */}
            {showDatePicker && (
                <DateRangePickerModal
                    startDate={customRange.start}
                    endDate={customRange.end}
                    onApply={(start, end) => {
                        setCustomRange({ start, end });
                        setTimeFilter('custom');
                        setShowDatePicker(false);
                    }}
                    onClose={() => setShowDatePicker(false)}
                    accentColor={type === 'EXPENSE' ? '#f43f5e' : '#10b981'}
                />
            )}

            {/* Transaction List */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 py-2"
            >
                {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm">Không có giao dịch nào</p>
                    </div>
                ) : (
                    <>
                        {groupedTransactions.map(([date, txList]) => (
                            <div key={date} className="mb-4">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2 sticky top-0 bg-white py-1">
                                    {formatDate(date)}
                                </div>
                                <div className="space-y-2">
                                    {txList.map(tx => {
                                        const catInfo = getCategoryInfo(tx.category);
                                        return (
                                            <SwipeableTransactionItem
                                                key={tx.id}
                                                onEdit={() => setEditingTransaction(tx)}
                                                onDelete={() => onDeleteTransaction?.(tx)}
                                                accentColor={type === 'EXPENSE' ? '#f43f5e' : '#10b981'}
                                            >
                                                <div className="border border-slate-100 p-3 flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                                        style={{ backgroundColor: `${catInfo.color}20` }}
                                                    >
                                                        {catInfo.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-800 text-sm">{catInfo.name}</div>
                                                        {tx.note && (
                                                            <div className="text-xs text-slate-400 truncate">{tx.note}</div>
                                                        )}
                                                    </div>
                                                    <div className={`font-bold text-sm ${type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {type === 'EXPENSE' ? '-' : '+'}{tx.amount.toLocaleString()} đ
                                                    </div>
                                                </div>
                                            </SwipeableTransactionItem>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Load more trigger */}
                        <div ref={loadMoreRef} className="py-4 flex justify-center">
                            {isLoadingMore && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Đang tải...</span>
                                </div>
                            )}
                            {!hasMore && filteredTransactions.length > 0 && (
                                <p className="text-xs text-slate-400">Đã hiển thị tất cả {filteredTransactions.length} giao dịch</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Edit Transaction Modal */}
            {editingTransaction && (
                <EditTransactionModal
                    transaction={editingTransaction}
                    accounts={accounts}
                    onUpdate={(id, data) => {
                        onUpdateTransaction?.(id, data);
                        setEditingTransaction(null);
                    }}
                    onClose={() => setEditingTransaction(null)}
                />
            )}
        </div>
    );
};

export default TransactionListModal;
