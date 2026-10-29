import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Bot,
  Target,
  BarChart3,
  Repeat,
  Settings,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/finance';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'coach'
  | 'goals'
  | 'analytics'
  | 'recurring'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const { profile, isDemoMode, resetToDemoData } = useFinance();

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Smart Budgets', icon: PieChart },
    { id: 'coach', label: 'AI Money Coach', icon: Bot, badge: 'AI' },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'recurring', label: 'Recurring Bills', icon: Repeat },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#161217] border-r border-[#241D27] h-screen sticky top-0 shrink-0 select-none">
      {/* Brand & Tagline */}
      <div className="p-5 border-b border-[#241D27]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#B91C1C] flex items-center justify-center text-white shadow-lg shadow-[#EF4444]/25 font-black text-lg">
            P
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-[#F5F6FC] flex items-center gap-1.5">
              PocketPilot <span className="text-xs px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#FB7185] font-semibold border border-[#EF4444]/30">AI</span>
            </h1>
            <p className="text-[10px] text-[#A5ABC0] font-medium leading-none mt-1">
              Your money. Your goals. Your copilot.
            </p>
          </div>
        </div>

        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenAddTransaction}
          className="w-full mt-4 py-2.5 px-3 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>+ Add Transaction</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#221C24] text-[#F5F6FC] font-semibold shadow-sm border border-[#322936]'
                  : 'text-[#A5ABC0] hover:text-[#F5F6FC] hover:bg-[#221C24]/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#EF4444]' : 'text-[#A5ABC0] group-hover:text-[#F5F6FC]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#FB7185] text-white font-bold tracking-wider">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Demo Status */}
      <div className="p-4 border-t border-[#241D27] space-y-3 bg-[#110D12]">
        {/* Demo Mode Badge for judges */}
        {isDemoMode && (
          <div className="p-2.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#50B99A] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#FB7185]">Demo Mode Active</span>
            </div>
            <button
              onClick={resetToDemoData}
              title="Reset sample data"
              className="text-[#A5ABC0] hover:text-[#F5F6FC] p-1 rounded hover:bg-[#221C24] transition-colors"
              aria-label="Reset demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Student Profile Card */}
        <div
          onClick={() => onSelectTab('settings')}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#221C24] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-[#2A212E] border border-[#3E3044] flex items-center justify-center text-xs font-bold text-[#EF4444] shrink-0">
              {profile.displayName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#F5F6FC] truncate">
                {profile.displayName || 'College Student'}
              </p>
              <p className="text-[10px] text-[#A5ABC0] truncate flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-[#EF4444] shrink-0" />
                {profile.collegeName || 'Student Account'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A5ABC0] group-hover:text-[#F5F6FC] transition-colors shrink-0" />
        </div>
      </div>
    </aside>
  );
};
