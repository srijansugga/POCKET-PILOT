import React from 'react';
import {
  Wallet,
  Calendar,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  ShieldAlert,
  Clock,
  Target,
  Bot,
  CreditCard,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, calculateCategoryBreakdown } from '../../utils/finance';
import { CategoryDonutChart } from '../charts/CategoryDonutChart';
import { SpendingTrendChart } from '../charts/SpendingTrendChart';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddTransaction,
}) => {
  const {
    profile,
    transactions,
    budgets,
    goals,
    recurring,
    selectedMonth,
    setSelectedMonth,
    dailyPlan,
    budgetAlerts,
    isDemoMode,
  } = useFinance();

  // Filter transactions for currently selected month (e.g. '2026-10')
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));

  const totalExpensePaise = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountPaise, 0);

  const totalIncomePaise = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountPaise, 0);

  // Overall budget
  const totalBudget = budgets.find((b) => b.category === 'TOTAL' && b.month === selectedMonth);
  const totalBudgetLimitPaise = totalBudget ? totalBudget.limitPaise : 0;
  const remainingBudgetPaise = totalBudgetLimitPaise - totalExpensePaise;
  const budgetUtilization = totalBudgetLimitPaise > 0
    ? Math.round((totalExpensePaise / totalBudgetLimitPaise) * 100)
    : 0;

  // Category breakdown for donut
  const categoryBreakdown = calculateCategoryBreakdown(monthTransactions, 'expense');

  // Upcoming recurring expenses due soon
  const upcomingBills = recurring
    .filter((r) => r.active)
    .slice(0, 3);

  // Top 3 Savings Goals
  const topGoals = goals.slice(0, 3);

  // Available months options (last 3 months + current)
  const currentMonthDate = new Date();
  const monthOptions: string[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    monthOptions.push(`${yyyy}-${mm}`);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Month Selector & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
              Hey, {profile.displayName || 'Student'}! 👋
            </h1>
            {isDemoMode && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#FB7185] border border-[#EF4444]/30">
                Demo Account
              </span>
            )}
          </div>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            {profile.collegeName ? `${profile.collegeName} • ` : ''}
            Next pocket money expected in{' '}
            <span className="font-semibold text-[#EF4444]">
              {dailyPlan.remainingDays} days
            </span>{' '}
            ({profile.nextAllowanceDate || 'Upcoming'})
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#161217] border border-[#322936] rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#EF4444]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#F5F6FC] font-semibold focus:outline-none cursor-pointer"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m} className="bg-[#161217]">
                  {m} (Overview)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenAddTransaction}
            className="px-3.5 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Spend</span>
          </button>
        </div>
      </div>

      {/* Critical Budget vs Actual Funds Notice */}
      <div className="p-3 bg-[#221C24]/60 border border-[#322936] rounded-xl flex items-center justify-between text-xs text-[#A5ABC0]">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>
            <strong className="text-[#F5F6FC]">Financial Rule:</strong> Budget Remaining is a planned spending ceiling, while Available Spendable Funds is your actual cash in hand after deducting committed bills and goals.
          </span>
        </div>
      </div>

      {/* Top 4 Key Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Spending Allowance (Section H) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161217] to-[#251A22] border border-[#322936] shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Daily Safe Spend</span>
            <div className={`p-1.5 rounded-lg ${dailyPlan.isShortfall ? 'bg-[#FF5C5C]/20 text-[#FF5C5C]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#F5F6FC] tracking-tight">
              {dailyPlan.isShortfall
                ? '₹0 / day'
                : `${formatCurrency(dailyPlan.dailyAllowancePaise, profile.currency)} / day`}
            </div>
            <div className="text-[11px] mt-1">
              {dailyPlan.isShortfall ? (
                <span className="text-[#FF5C5C] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Shortfall of {formatCurrency(dailyPlan.shortfallPaise)}
                </span>
              ) : (
                <span className="text-[#50B99A] font-medium">
                  Across next {dailyPlan.remainingDays} days
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Available Spendable Funds */}
        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Net Spendable Funds</span>
            <div className="p-1.5 rounded-lg bg-[#50B99A]/20 text-[#50B99A]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${dailyPlan.spendableFundsPaise < 0 ? 'text-[#FF5C5C]' : 'text-[#F5F6FC]'}`}>
              {formatCurrency(dailyPlan.spendableFundsPaise, profile.currency)}
            </div>
            <p className="text-[11px] text-[#A5ABC0] mt-1">
              From {formatCurrency(profile.currentBalancePaise || 0, profile.currency)} bank balance
            </p>
          </div>
        </div>

        {/* 3. Budget Utilization & Remaining Budget */}
        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Monthly Budget</span>
            <div className="p-1.5 rounded-lg bg-[#F4B860]/20 text-[#F4B860]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#F5F6FC] tracking-tight">
              {totalBudgetLimitPaise > 0
                ? `${budgetUtilization}% used`
                : 'No Limit'}
            </div>
            <div className="text-[11px] mt-1 flex items-center justify-between">
              <span className={remainingBudgetPaise < 0 ? 'text-[#FF5C5C] font-semibold' : 'text-[#A5ABC0]'}>
                {remainingBudgetPaise < 0 ? 'Exceeded by ' : 'Remaining: '}
                {formatCurrency(Math.abs(remainingBudgetPaise), profile.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Total Spent vs Income This Month */}
        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Total Spends (Month)</span>
            <div className="p-1.5 rounded-lg bg-[#EF4444]/20 text-[#EF4444]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#F5F6FC] tracking-tight">
              {formatCurrency(totalExpensePaise, profile.currency)}
            </div>
            <p className="text-[11px] text-[#50B99A] mt-1 font-medium">
              +{formatCurrency(totalIncomePaise, profile.currency)} income recorded
            </p>
          </div>
        </div>
      </div>

      {/* Active Budget Alerts if any */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map((alert) => (
            <div
              key={alert.budgetId}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                alert.threshold === 100
                  ? 'bg-[#FF5C5C]/15 border-[#FF5C5C]/30 text-[#FF8585]'
                  : 'bg-[#F4B860]/15 border-[#F4B860]/30 text-[#FFD085]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{alert.message}</span>
              </div>
              <button
                onClick={() => onNavigate('budgets')}
                className="font-bold underline text-[11px] hover:opacity-80"
              >
                Adjust Limit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Copilot Quick Guidance Pill */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#221C24] via-[#2A1F26] to-[#221C24] border border-[#EF4444]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EF4444]/25 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shrink-0 mt-0.5">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F6FC]">PocketPilot AI Guidance</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EF4444] text-white font-semibold">
                Live Copilot
              </span>
            </div>
            <p className="text-xs text-[#A5ABC0] mt-1 max-w-2xl leading-relaxed">
              {dailyPlan.recommendation}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('coach')}
          className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-[#EF4444]/25"
        >
          <span>Chat with AI Coach</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Analytics Row: Category Donut & Weekly Cadence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#F5F6FC]">Spending by Category</h2>
              <p className="text-[11px] text-[#A5ABC0]">Where your pocket money went this month</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-[#EF4444] hover:underline font-semibold"
            >
              Full Analytics →
            </button>
          </div>
          <CategoryDonutChart
            categories={categoryBreakdown}
            totalPaise={totalExpensePaise}
            currency={profile.currency}
          />
        </div>

        {/* Weekly Cadence */}
        <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#F5F6FC]">Weekly Spending Cadence</h2>
              <span className="text-xs text-[#50B99A] font-semibold">Current Month</span>
            </div>
            <p className="text-[11px] text-[#A5ABC0]">
              Track spending spikes across weeks to avoid running out before month-end
            </p>
          </div>
          <SpendingTrendChart
            transactions={monthTransactions}
            currency={profile.currency}
          />
        </div>
      </div>

      {/* Two Column Section: Recent Transactions & Upcoming Bills / Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols on large screen) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#241D27] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F5F6FC]">Recent Activity</h2>
              <p className="text-[11px] text-[#A5ABC0]">Latest verified expenses and allowances</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-[#EF4444] hover:underline font-semibold"
            >
              View All ({transactions.length}) →
            </button>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="py-12 text-center text-[#A5ABC0] space-y-3">
              <Receipt className="w-10 h-10 mx-auto text-[#322936]" />
              <p className="text-xs">No transactions recorded for {selectedMonth} yet.</p>
              <button
                onClick={onOpenAddTransaction}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Record First Transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#241D27]">
              {monthTransactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="py-3 flex items-center justify-between hover:bg-[#221C24]/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        t.type === 'income'
                          ? 'bg-[#50B99A]/15 text-[#50B99A]'
                          : 'bg-[#FF5C5C]/15 text-[#FF5C5C]'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#F5F6FC] truncate">
                        {t.merchant}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#A5ABC0]">
                        <span className="px-1.5 py-0.5 rounded bg-[#221C24] text-[#EF4444]">
                          {t.category}
                        </span>
                        <span>•</span>
                        <span>{t.date}</span>
                        <span>•</span>
                        <span className="uppercase">{t.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        t.type === 'income' ? 'text-[#50B99A]' : 'text-[#F5F6FC]'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amountPaise, profile.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Recurring Bills & Goals Progress */}
        <div className="space-y-6">
          {/* Upcoming Bills */}
          <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#241D27] pb-2">
              <h3 className="text-xs font-bold text-[#F5F6FC]">Upcoming Planned Bills</h3>
              <button
                onClick={() => onNavigate('recurring')}
                className="text-[11px] text-[#EF4444] hover:underline"
              >
                Manage →
              </button>
            </div>
            {upcomingBills.length === 0 ? (
              <p className="text-xs text-[#A5ABC0] py-4 text-center">No upcoming bills due soon.</p>
            ) : (
              <div className="space-y-2">
                {upcomingBills.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0C0A0D] border border-[#241D27] text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#F5F6FC] block">{b.title}</span>
                      <span className="text-[10px] text-[#A5ABC0]">Due: {b.nextDueDate}</span>
                    </div>
                    <span className="font-bold text-[#F4B860]">
                      {formatCurrency(b.amountPaise, profile.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Savings Goals Widget */}
          <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#241D27] pb-2">
              <h3 className="text-xs font-bold text-[#F5F6FC]">Savings Goals</h3>
              <button
                onClick={() => onNavigate('goals')}
                className="text-[11px] text-[#EF4444] hover:underline"
              >
                All Goals →
              </button>
            </div>
            {topGoals.length === 0 ? (
              <p className="text-xs text-[#A5ABC0] py-4 text-center">No savings goals yet.</p>
            ) : (
              <div className="space-y-3">
                {topGoals.map((g) => {
                  const percent = Math.min(
                    100,
                    Math.round((g.currentPaise / g.targetPaise) * 100)
                  );
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#F5F6FC] truncate max-w-[130px]">
                          {g.name}
                        </span>
                        <span className="text-[11px] text-[#A5ABC0]">
                          {formatCurrency(g.currentPaise, profile.currency)} /{' '}
                          {formatCurrency(g.targetPaise, profile.currency)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#221C24] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#EF4444] to-[#50B99A] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
