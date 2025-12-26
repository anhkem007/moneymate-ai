
import React from 'react';
import { Home, BarChart2, PlusCircle, Settings, Layers } from 'lucide-react';
import { Tab } from '../../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: Tab.CHAT, icon: Home, label: 'Chat' },
    { id: Tab.STATS, icon: BarChart2, label: 'Thống kê' },
    { id: Tab.ADD, icon: PlusCircle, label: 'Thêm' },
    { id: Tab.CATEGORIES, icon: Layers, label: 'Danh mục' },
    { id: Tab.SETTINGS, icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <div className="bg-white border-t border-slate-200 pb-safe pt-2 px-2 shadow-lg">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] transition-colors duration-200 ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <item.icon
                size={isActive ? 26 : 22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`mb-1 transition-all ${isActive ? '-translate-y-1' : ''}`}
              />
              <span className={`text-[9px] font-medium uppercase tracking-tighter ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
