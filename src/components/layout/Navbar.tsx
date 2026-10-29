import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Bot,
  PieChart,
  Menu,
  X,
  Target,
  BarChart3,
  Repeat,
  Settings,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useFinance } from '../../context/FinanceContext';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddTransaction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isDemoMode, resetToDemoData } = useFinance();

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#161217] border-b border-[#241D27] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#B91C1C] flex items-center justify-center text-white font-black text-sm">
            P
          </div>
          <div>
            <span className="font-bold text-sm text-[#F5F6FC]">PocketPilot AI</span>
            <span className="block text-[9px] text-[#A5ABC0] -mt-0.5">Your money copilot</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && (
            <button
              onClick={resetToDemoData}
              title="Reset Demo Data"
              className="p-1.5 rounded-lg bg-[#EF4444]/15 text-[#FB7185] text-xs flex items-center gap-1 border border-[#EF4444]/30"
              aria-label="Reset demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenAddTransaction}
            className="p-2 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shadow-md shadow-[#EF4444]/25"
            aria-label="Add transaction"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 rounded-xl text-[#A5ABC0] hover:text-[#F5F6FC] hover:bg-[#221C24]"
            aria-label="Open navigation menu"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (When hamburger clicked) */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm pt-14"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="bg-[#161217] border-b border-[#322936] p-4 space-y-2 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'dashboard' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => handleTabClick('transactions')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'transactions' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <Receipt className="w-4 h-4" /> Transactions
            </button>
            <button
              onClick={() => handleTabClick('budgets')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'budgets' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <PieChart className="w-4 h-4" /> Smart Budgets
            </button>
            <button
              onClick={() => handleTabClick('coach')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'coach' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <Bot className="w-4 h-4" /> AI Money Coach
            </button>
            <button
              onClick={() => handleTabClick('goals')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'goals' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <Target className="w-4 h-4" /> Savings Goals
            </button>
            <button
              onClick={() => handleTabClick('analytics')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'analytics' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            <button
              onClick={() => handleTabClick('recurring')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'recurring' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <Repeat className="w-4 h-4" /> Recurring Bills
            </button>
            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold ${
                activeTab === 'settings' ? 'bg-[#221C24] text-[#EF4444]' : 'text-[#A5ABC0]'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings & Privacy
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#161217] border-t border-[#241D27] flex items-center justify-around py-2 px-1">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-[#EF4444]' : 'text-[#A5ABC0]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'transactions' ? 'text-[#EF4444]' : 'text-[#A5ABC0]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Spends</span>
        </button>
        <button
          onClick={() => onSelectTab('coach')}
          className={`flex flex-col items-center gap-1 p-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'coach' ? 'text-[#EF4444]' : 'text-[#A5ABC0]'
          }`}
        >
          <div className="relative">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
          </div>
          <span>AI Coach</span>
        </button>
        <button
          onClick={() => onSelectTab('budgets')}
          className={`flex flex-col items-center gap-1 p-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'budgets' ? 'text-[#EF4444]' : 'text-[#A5ABC0]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Budgets</span>
        </button>
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 text-[10px] font-medium text-[#A5ABC0]"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
