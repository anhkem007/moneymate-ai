import React, { useState, useMemo } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { Plus, ChevronRight, ChevronDown, Target, Edit2, X, Check } from 'lucide-react';

interface CategoriesTabProps {
    categories: Category[];
    transactions: Transaction[];
    onUpdateCategory: (cat: Category) => void;
    onAddCategory: (cat: Omit<Category, 'id'>) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, transactions, onUpdateCategory, onAddCategory }) => {
    const [activeType, setActiveType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(categories.filter(c => !c.parentId).map(c => c.id)));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLimit, setEditLimit] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Add category state
    const [newName, setNewName] = useState('');
    const [newParentId, setNewParentId] = useState<string>('');
    const [newIcon, setNewIcon] = useState('📦');

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const filteredCategories = useMemo(() =>
        categories.filter(c => c.type === activeType),
        [categories, activeType]);

    const treeData = useMemo(() => {
        const parents = filteredCategories.filter(c => !c.parentId);
        return parents.map(p => ({
            ...p,
            children: filteredCategories.filter(c => c.parentId === p.id)
        }));
    }, [filteredCategories]);

    const getSpentForCategory = (catId: string) => {
        // Bao gồm cả chi tiêu của các con
        const subCatIds = categories.filter(c => c.parentId === catId).map(c => c.id);
        const allIds = [catId, ...subCatIds];
        return transactions
            .filter(t => t.categoryId === catId || subCatIds.includes(t.categoryId || ''))
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const handleSaveLimit = (cat: Category) => {
        onUpdateCategory({ ...cat, budgetLimit: parseInt(editLimit) || undefined });
        setEditingId(null);
    };

    const handleAddNew = () => {
        if (!newName) return;
        onAddCategory({
            name: newName,
            icon: newIcon,
            color: activeType === TransactionType.EXPENSE ? '#ef4444' : '#10b981',
            type: activeType,
            parentId: newParentId || undefined
        });
        setNewName('');
        setShowAddModal(false);
    };

    // Fix: Explicitly type CategoryItem as React.FC to properly handle the 'key' prop in JSX
    const CategoryItem: React.FC<{ cat: Category & { children?: Category[] }, isChild?: boolean }> = ({ cat, isChild = false }) => {
        const spent = getSpentForCategory(cat.id);
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedIds.has(cat.id);
        const progress = cat.budgetLimit ? Math.min((spent / cat.budgetLimit) * 100, 100) : 0;

        return (
            <div className="mb-2">
                <div className={`flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100 ${isChild ? 'ml-6' : ''}`}>
                    <div className="flex items-center gap-3">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(cat.id)} className="text-slate-400">
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                        ) : isChild ? (
                            <div className="w-4" />
                        ) : null}
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                            <div className="text-sm font-bold text-slate-800">{cat.name}</div>
                            {cat.budgetLimit && (
                                <div className="text-[10px] text-slate-500 font-medium">
                                    Đã dùng {spent.toLocaleString()} / {cat.budgetLimit.toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {editingId === cat.id ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={editLimit}
                                    onChange={e => setEditLimit(e.target.value)}
                                    className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Hạn mức"
                                    autoFocus
                                />
                                <button onClick={() => handleSaveLimit(cat)} className="text-emerald-600 p-1"><Check size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="text-rose-500 p-1"><X size={16} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setEditingId(cat.id); setEditLimit(cat.budgetLimit?.toString() || ''); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-emerald-600 border border-slate-100 rounded-full px-2 py-1"
                            >
                                <Target size={12} /> {cat.budgetLimit ? 'Sửa HM' : 'Đặt HM'}
                            </button>
                        )}
                    </div>
                </div>

                {cat.budgetLimit && (
                    <div className={`mt-1 h-1 bg-slate-100 rounded-full overflow-hidden ${isChild ? 'ml-6' : ''}`}>
                        <div
                            className={`h-full transition-all duration-500 ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {isExpanded && cat.children?.map(child => (
                    <CategoryItem key={child.id} cat={child} isChild={true} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Cây Danh mục</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-emerald-600 text-white p-2 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Type Toggle */}
            <div className="flex bg-slate-200 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveType(TransactionType.EXPENSE)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeType === TransactionType.EXPENSE ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'}`}
                >
                    CHI TIÊU
                </button>
                <button
                    onClick={() => setActiveType(TransactionType.INCOME)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeType === TransactionType.INCOME ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                >
                    THU NHẬP
                </button>
            </div>

            <div className="space-y-1">
                {treeData.map(parent => (
                    <CategoryItem key={parent.id} cat={parent} />
                ))}
            </div>

            {showAddModal && (
                <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end">
                    <div className="w-full bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom-20">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Thêm danh mục {activeType === TransactionType.EXPENSE ? 'chi' : 'thu'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Biểu tượng & Tên</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newIcon}
                                        onChange={e => setNewIcon(e.target.value)}
                                        className="w-12 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center"
                                    />
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="Tên danh mục..."
                                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Danh mục cha (Tùy chọn)</label>
                                <select
                                    value={newParentId}
                                    onChange={e => setNewParentId(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                    <option value="">Không có (Danh mục chính)</option>
                                    {filteredCategories.filter(c => !c.parentId).map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleAddNew}
                                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-2 active:scale-95 transition-transform"
                            >
                                Tạo Danh Mục
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesTab;
