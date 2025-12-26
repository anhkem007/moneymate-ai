import React, { useState, useEffect } from 'react';
import BottomNav from './components/Layout/BottomNav';
import ChatTab from './components/ChatTab';
import StatsTab from './components/StatsTab';
import AddTab from './components/AddTab';
import SettingsTab from './components/SettingsTab';
import CategoriesTab from './components/CategoriesTab';
import { Tab } from './types';
import {
  useDatabase,
  useAccounts,
  useCategories,
  useTransactions,
  useSettings,
  useChatMessages
} from './services/database';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
    <div className="text-center text-white">
      <div className="text-5xl mb-4 animate-bounce">💰</div>
      <h1 className="text-2xl font-bold mb-2">MoneyMate AI</h1>
      <p className="text-emerald-100">Đang tải dữ liệu...</p>
      <div className="mt-4 flex justify-center space-x-1">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);

  // Database hooks
  const { isReady: dbReady, error: dbError } = useDatabase();
  const {
    accounts,
    loading: accountsLoading,
    createAccount,
    refresh: refreshAccounts
  } = useAccounts();

  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    updateCategory,
    refresh: refreshCategories
  } = useCategories();

  const {
    transactions,
    stats,
    loading: transactionsLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: refreshTransactions
  } = useTransactions();

  const {
    settings,
    loading: settingsLoading,
    updateSetting,
    updateSettings
  } = useSettings();

  const {
    messages,
    loading: messagesLoading,
    addMessage,
    clearHistory
  } = useChatMessages();

  // Check if still loading
  const isLoading = !dbReady || accountsLoading || categoriesLoading || transactionsLoading || settingsLoading;

  // Error handling
  if (dbError) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50">
        <div className="text-center text-red-600 p-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Lỗi khởi tạo database</h1>
          <p className="text-sm">{dbError.message}</p>
        </div>
      </div>
    );
  }

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Convert database types to app types for compatibility
  const appAccounts = accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    type: acc.type as any,
    balance: acc.balance,
    icon: acc.icon || '💰',
    color: acc.color || '#10b981'
  }));

  const appCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || '📦',
    color: cat.color || '#64748b',
    type: (cat.type === 'INCOME' ? 'INCOME' : 'EXPENSE') as any,
    parentId: cat.parentId,
    budgetLimit: undefined
  }));

  const appTransactions = transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    category: categories.find(c => c.id === t.categoryId)?.name || 'Khác',
    categoryId: t.categoryId,
    date: t.transactionDate,
    note: t.note || '',
    type: t.type as any,
    accountId: t.accountId
  }));

  const appSettings = {
    persona: (settings.persona || 'friendly') as any,
    monthlyLimit: settings.monthlyLimit || 15000000,
    currency: settings.currency || 'VNĐ'
  };

  const appMessages = messages.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'model',
    text: m.content
  }));

  // Handlers
  const handleAddTransaction = async (t: any) => {
    try {
      await createTransaction({
        amount: t.amount,
        type: t.type,
        note: t.note || '',
        transactionDate: t.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        accountId: t.accountId,
        categoryId: t.categoryId || 'other_expense'
      });
      await refreshAccounts();

      if (activeTab === Tab.ADD) {
        setActiveTab(Tab.STATS);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleUpdateTransaction = async (id: string, t: any) => {
    try {
      await updateTransaction(id, {
        amount: t.amount,
        type: t.type,
        note: t.note || '',
        transactionDate: t.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        accountId: t.accountId,
        categoryId: t.categoryId || 'other_expense'
      });
      await refreshAccounts();
      // Không đóng modal - để TransactionListModal tự quản lý
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  const handleDeleteTransaction = async (tx: any) => {
    try {
      await deleteTransaction(tx.id);
      await refreshAccounts();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleAddAccount = async (acc: any) => {
    try {
      await createAccount({
        name: acc.name,
        type: acc.type,
        balance: acc.balance || 0,
        icon: acc.icon,
        color: acc.color
      });
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleAddCategory = async (cat: any) => {
    try {
      await createCategory({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        parentId: cat.parentId
      });
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleUpdateCategory = async (updatedCat: any) => {
    try {
      await updateCategory(updatedCat.id, {
        name: updatedCat.name,
        icon: updatedCat.icon,
        color: updatedCat.color,
        parentId: updatedCat.parentId
      });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleUpdateSettings = async (s: any) => {
    try {
      await updateSettings(s);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleAddMessage = async (role: 'user' | 'model', content: string) => {
    try {
      await addMessage({ role, content });
    } catch (error) {
      console.error('Failed to add message:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CHAT:
        return (
          <ChatTab
            messages={appMessages}
            setMessages={() => { }}
            settings={appSettings}
            transactions={appTransactions}
            accounts={appAccounts}
            categories={appCategories}
            onAddTransaction={handleAddTransaction}
            onAddMessage={handleAddMessage}
          />
        );
      case Tab.STATS:
        return (
          <StatsTab
            transactions={appTransactions}
            accounts={appAccounts}
            settings={appSettings}
            onAddAccount={handleAddAccount}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case Tab.ADD:
        return (
          <AddTab
            accounts={appAccounts}
            categories={appCategories}
            onAdd={handleAddTransaction}
            onUpdate={handleUpdateTransaction}
            onClose={() => setActiveTab(Tab.STATS)}
            onAddAccount={handleAddAccount}
          />
        );
      case Tab.CATEGORIES:
        return (
          <CategoriesTab
            categories={appCategories as any}
            transactions={appTransactions}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
          />
        );
      case Tab.SETTINGS:
        return (
          <SettingsTab
            settings={appSettings}
            accounts={appAccounts}
            categories={appCategories as any}
            onUpdateCategory={handleUpdateCategory}
            onUpdateSettings={handleUpdateSettings}
            onAddAccount={handleAddAccount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-slate-100 flex items-center justify-center">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden pt-safe sm:rounded-xl sm:h-[90vh] sm:pt-0">
        <main className="flex-1 min-h-0 overflow-hidden">
          {renderContent()}
        </main>
        <div className="shrink-0">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
};

export default App;
