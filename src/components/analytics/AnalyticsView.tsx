import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  CreditCard,
  PieChart,
  Calendar,
  Sparkles,
  Zap,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrency,
  calculateCategoryBreakdown,
  paiseToRupees,
} from '../../utils/finance';
import { CategoryDonutChart } from '../charts/CategoryDonutChart';
import { SpendingTrendChart } from '../charts/SpendingTrendChart';

export const AnalyticsView: React.FC = () => {
  const { profile, transactions, selectedMonth, setSelectedMonth, dailyPlan } = useFinance();

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const totalExpensePaise = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amountPaise, 0),
    [monthTransactions]
  );

  const totalIncomePaise = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amountPaise, 0),
    [monthTransactions]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(monthTransactions, 'expense'),
    [monthTransactions]
  );

  // Payment method breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map.set(t.paymentMethod, (map.get(t.paymentMethod) || 0) + t.amountPaise);
      });

    return Array.from(map.entries())
      .map(([method, paise]) => ({
        method: method.toUpperCase(),
        paise,
        percentage: totalExpensePaise > 0 ? Math.round((paise / totalExpensePaise) * 100) : 0,
      }))
      .sort((a, b) => b.paise - a.paise);
  }, [monthTransactions, totalExpensePaise]);

  // Average daily spending velocity
  const daysInMonthRecorded = Math.max(
    1,
    new Set(monthTransactions.map((t) => t.date)).size
  );
  const avgDailyBurnPaise = Math.round(totalExpensePaise / daysInMonthRecorded);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
            Financial Analytics & Velocity
          </h1>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            Understand spending patterns, UPI dependency, and burn rate for {selectedMonth}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#161217] border border-[#322936] rounded-xl px-3 py-1.5 text-xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#EF4444]" />
          <span className="text-[#F5F6FC] font-semibold">{selectedMonth}</span>
        </div>
      </div>

      {/* Top Velocity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Daily Burn Rate</span>
            <div className="p-1.5 rounded-lg bg-[#EF4444]/20 text-[#EF4444]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#F5F6FC] mt-3">
            {formatCurrency(avgDailyBurnPaise, profile.currency)} / day
          </div>
          <p className="text-[11px] text-[#A5ABC0] mt-1">
            Across {daysInMonthRecorded} active transaction days
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Safe Daily Target</span>
            <div className="p-1.5 rounded-lg bg-[#50B99A]/20 text-[#50B99A]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#50B99A] mt-3">
            {formatCurrency(dailyPlan.dailyAllowancePaise, profile.currency)} / day
          </div>
          <p className="text-[11px] text-[#A5ABC0] mt-1">
            Allowed for remaining {dailyPlan.remainingDays} days
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABC0]">Cash Flow Delta</span>
            <div
              className={`p-1.5 rounded-lg ${
                totalIncomePaise >= totalExpensePaise
                  ? 'bg-[#50B99A]/20 text-[#50B99A]'
                  : 'bg-[#FF5C5C]/20 text-[#FF5C5C]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black mt-3 ${
              totalIncomePaise >= totalExpensePaise ? 'text-[#50B99A]' : 'text-[#FF5C5C]'
            }`}
          >
            {totalIncomePaise >= totalExpensePaise ? '+' : '-'}
            {formatCurrency(Math.abs(totalIncomePaise - totalExpensePaise), profile.currency)}
          </div>
          <p className="text-[11px] text-[#A5ABC0] mt-1">
            Net savings retained this month
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#F5F6FC]">Category Distribution</h2>
              <p className="text-[11px] text-[#A5ABC0]">Full breakdown of monthly expenditure</p>
            </div>
          </div>
          <CategoryDonutChart
            categories={categoryBreakdown}
            totalPaise={totalExpensePaise}
            currency={profile.currency}
          />
        </div>

        <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#F5F6FC] mb-1">Weekly Spend Trend</h2>
            <p className="text-[11px] text-[#A5ABC0]">Expenditure rhythm across 4 weeks of the month</p>
          </div>
          <SpendingTrendChart
            transactions={monthTransactions}
            currency={profile.currency}
          />
        </div>
      </div>

      {/* Payment Channel Breakdown & Ranking Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channels */}
        <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#F5F6FC]">Payment Channels</h3>
            <p className="text-[11px] text-[#A5ABC0]">How you pay for campus & personal items</p>
          </div>

          <div className="space-y-3">
            {paymentMethodBreakdown.map((pm) => (
              <div key={pm.method} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F6FC] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#EF4444]" />
                    {pm.method}
                  </span>
                  <span className="text-[#A5ABC0]">
                    {formatCurrency(pm.paise, profile.currency)} ({pm.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#221C24] overflow-hidden">
                  <div
                    className="h-full bg-[#EF4444] rounded-full"
                    style={{ width: `${pm.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Ranking Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#F5F6FC]">Category Ranking</h3>
            <p className="text-[11px] text-[#A5ABC0]">Highest to lowest expense areas</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#221C24] text-[#A5ABC0]">
                  <th className="pb-2 font-semibold">Category</th>
                  <th className="pb-2 font-semibold text-center">Transactions</th>
                  <th className="pb-2 font-semibold text-right">Total Spent</th>
                  <th className="pb-2 font-semibold text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#221C24]">
                {categoryBreakdown.map((cat, idx) => (
                  <tr key={cat.category} className="hover:bg-[#221C24]/40 transition-colors">
                    <td className="py-2.5 font-medium text-[#F5F6FC] flex items-center gap-2">
                      <span className="text-[10px] text-[#EF4444] font-bold">#{idx + 1}</span>
                      <span>{cat.category}</span>
                    </td>
                    <td className="py-2.5 text-center text-[#A5ABC0]">{cat.count} txns</td>
                    <td className="py-2.5 text-right font-bold text-[#F5F6FC]">
                      {formatCurrency(cat.totalPaise, profile.currency)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#EF4444]">
                      {cat.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
