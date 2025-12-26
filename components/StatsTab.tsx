import React, { useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { Transaction, AppSettings, CATEGORIES, Account, TransactionType, AccountType } from '../types';
import { getSpendingInsights } from '../services/geminiService';
import { Sparkles, Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, X, ChevronRight } from 'lucide-react';
import TransactionListModal from './TransactionListModal';

interface StatsTabProps {
  transactions: Transaction[];
  settings: AppSettings;
  accounts: Account[];
  onAddAccount: (a: Omit<Account, 'id'>) => void;
  onUpdateTransaction?: (id: string, data: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
}

const StatsTab: React.FC<StatsTabProps> = ({ transactions, settings, accounts, onAddAccount, onUpdateTransaction, onDeleteTransaction }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Transaction List Modal State
  const [showTransactionList, setShowTransactionList] = useState(false);
  const [transactionListType, setTransactionListType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const openTransactionList = (type: 'EXPENSE' | 'INCOME') => {
    setTransactionListType(type);
    setShowTransactionList(true);
  };

  // Add Account Modal State
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>(AccountType.CASH);
  const [newAccBalance, setNewAccBalance] = useState('');

  const openAddModal = (type: AccountType) => {
    setNewAccType(type);
    setNewAccName('');
    setNewAccBalance('');
    setShowAddAccModal(true);
  }

  const handleCreateAccount = () => {
    if (!newAccName) return;

    let icon = '💵';
    let color = '#10b981';

    switch (newAccType) {
      case AccountType.BANK: icon = '🏦'; color = '#3b82f6'; break;
      case AccountType.CREDIT: icon = '💳'; color = '#8b5cf6'; break;
      case AccountType.E_WALLET: icon = '📱'; color = '#06b6d4'; break;
      case AccountType.FUND: icon = '🐷'; color = '#ec4899'; break;
      case AccountType.CASH: default: icon = '💵'; color = '#10b981'; break;
    }

    onAddAccount({
      name: newAccName,
      type: newAccType,
      balance: parseInt(newAccBalance.replace(/,/g, '') || '0'),
      icon,
      color
    });

    setShowAddAccModal(false);
  };

  // Split Accounts and Funds
  const paymentAccounts = useMemo(() => accounts.filter(a => a.type !== AccountType.FUND), [accounts]);
  const fundAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.FUND), [accounts]);

  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === TransactionType.EXPENSE), [transactions]);
  const incomeTransactions = useMemo(() => transactions.filter(t => t.type === TransactionType.INCOME), [transactions]);

  const totalSpent = useMemo(() => expenseTransactions.reduce((sum, t) => sum + t.amount, 0), [expenseTransactions]);
  const totalIncome = useMemo(() => incomeTransactions.reduce((sum, t) => sum + t.amount, 0), [incomeTransactions]);
  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);

  const percentageUsed = Math.min(Math.round((totalSpent / settings.monthlyLimit) * 100), 100);

  // Group by Category (Expenses)
  const categoryData = useMemo(() => {
    const map = new Map();
    expenseTransactions.forEach(t => {
      const current = map.get(t.category) || 0;
      map.set(t.category, current + t.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => {
      const catInfo = CATEGORIES.find(c => c.name === name) || { color: '#94a3b8' };
      return { name, value, color: catInfo.color };
    }).sort((a, b) => b.value - a.value);
  }, [expenseTransactions]);

  // Group by Date
  const dailyData = useMemo(() => {
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().split('T')[0], 0);
    }
    expenseTransactions.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (map.has(dateKey)) {
        map.set(dateKey, map.get(dateKey) + t.amount);
      }
    });
    return Array.from(map.entries()).map(([date, amount]) => ({
      date: date.split('-')[2] + '/' + date.split('-')[1],
      amount
    }));
  }, [expenseTransactions]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingInsight(true);
      const text = await getSpendingInsights(transactions, settings);
      setInsight(text);
      setLoadingInsight(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [transactions]);

  const renderAccountList = (list: Account[], title: string, icon: React.ReactNode, defaultType: AccountType) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1">
          {icon} {title}
        </h3>
        <button
          onClick={() => openAddModal(defaultType)}
          className="text-slate-400 hover:text-emerald-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
          title="Thêm mới"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {list.length > 0 ? list.map(acc => (
          <div key={acc.id} className="min-w-[140px] bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-24 relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">{acc.icon}</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-slate-50">{acc.icon}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium truncate">{acc.name}</div>
              <div className={`font-bold ${acc.balance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                {acc.balance.toLocaleString()}
              </div>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full" style={{ width: '100%', backgroundColor: acc.color }}></div>
            </div>
          </div>
        )) : (
          <div
            className="text-xs text-slate-400 p-2 italic w-full text-center bg-slate-100/50 rounded-lg py-4 border border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => openAddModal(defaultType)}
          >
            Chạm để thêm {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto relative">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Thống kê tài chính</h2>

      {/* Payment Accounts */}
      {renderAccountList(paymentAccounts, "Tài khoản thanh toán", <Wallet size={14} />, AccountType.BANK)}

      {/* Funds */}
      {renderAccountList(fundAccounts, "Quỹ & Tiết kiệm", <PiggyBank size={14} />, AccountType.FUND)}

      <div className="bg-white rounded-lg p-3 mb-6 flex justify-between items-center shadow-sm border border-slate-100">
        <div className="text-xs text-slate-500 font-medium">Tổng tài sản ròng</div>
        <div className="font-bold text-slate-800 text-lg">{totalBalance.toLocaleString()} <span className="text-xs font-normal">VNĐ</span></div>
      </div>

      {/* Monthly Summary - Clickable */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => openTransactionList('INCOME')}
          className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-left hover:bg-emerald-100 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <TrendingDown size={16} />
              <span className="text-xs font-bold uppercase">Thu nhập</span>
            </div>
            <ChevronRight size={14} className="text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-700">{totalIncome.toLocaleString()}</div>
        </button>
        <button
          onClick={() => openTransactionList('EXPENSE')}
          className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-left hover:bg-rose-100 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase">Chi tiêu</span>
            </div>
            <ChevronRight size={14} className="text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-700">{totalSpent.toLocaleString()}</div>
          <div className="text-[10px] text-rose-400 mt-1">{percentageUsed}% hạn mức</div>
        </button>
      </div>

      {/* AI Insight */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-500" />
          <h3 className="text-sm font-bold text-slate-700">Nhận xét của AI</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed italic">
          {loadingInsight ? "Đang phân tích dữ liệu..." : `"${insight}"`}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Phân bổ chi tiêu</h3>
          {expenseTransactions.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Chưa có chi tiêu nào</div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Xu hướng chi tiêu</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value.toLocaleString(), 'Chi']}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Add Account Modal Overlay */}
      {showAddAccModal && (
        <div className="absolute inset-0 z-20 bg-white p-6 animate-in slide-in-from-bottom-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Thêm {newAccType === AccountType.FUND ? 'Quỹ' : 'Tài Khoản'}</h3>
            <button onClick={() => setShowAddAccModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Tên gọi</label>
              <input
                type="text"
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                placeholder={newAccType === AccountType.FUND ? "VD: Quỹ du lịch, Tiết kiệm..." : "VD: Ví chính, Vietcombank..."}
                autoFocus
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Loại</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: AccountType.CASH, label: 'Tiền mặt', icon: '💵' },
                  { type: AccountType.BANK, label: 'Ngân hàng', icon: '🏦' },
                  { type: AccountType.E_WALLET, label: 'Ví điện tử', icon: '📱' },
                  { type: AccountType.FUND, label: 'Quỹ tiết kiệm', icon: '🐷' },
                  { type: AccountType.CREDIT, label: 'Tín dụng', icon: '💳' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setNewAccType(item.type)}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${newAccType === item.type
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200'
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
                value={newAccBalance}
                onChange={(e) => setNewAccBalance(e.target.value)}
                placeholder="0"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={!newAccName}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-8 disabled:bg-slate-300 transition-transform active:scale-95"
            >
              Tạo Ngay
            </button>
          </div>
        </div>
      )}

      {/* Transaction List Modal */}
      {showTransactionList && (
        <TransactionListModal
          type={transactionListType}
          transactions={transactions}
          accounts={accounts}
          onClose={() => setShowTransactionList(false)}
          onUpdateTransaction={(id, data) => {
            onUpdateTransaction?.(id, data);
          }}
          onDeleteTransaction={(tx) => {
            if (confirm(`Xóa giao dịch "${tx.category}" - ${tx.amount.toLocaleString()} đ?`)) {
              onDeleteTransaction?.(tx);
            }
          }}
        />
      )}
    </div>
  );
};

export default StatsTab;