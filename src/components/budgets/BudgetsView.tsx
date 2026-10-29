import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types/finance';
import {
  calculateBudgetUtilization,
  formatCurrency,
  paiseToRupees,
  rupeesToPaise,
} from '../../utils/finance';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

const AVAILABLE_BUDGET_CATEGORIES = [
  'TOTAL',
  'Food & Mess',
  'Chai & Snacks',
  'Hostel & Rent',
  'Books & Academics',
  'Travel & Commute',
  'Recharge & Tech',
  'Entertainment & Outings',
  'Shopping',
  'Health & Personal',
  'Other',
];

export const BudgetsView: React.FC = () => {
  const {
    profile,
    transactions,
    budgets,
    setBudget,
    deleteBudget,
    selectedMonth,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('TOTAL');
  const [limitRupees, setLimitRupees] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter current month transactions
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(selectedMonth)
  );

  // Separate Total budget vs Category budgets for this month
  const currentMonthBudgets = budgets.filter((b) => b.month === selectedMonth);
  const totalBudget = currentMonthBudgets.find((b) => b.category === 'TOTAL');
  const categoryBudgets = currentMonthBudgets.filter((b) => b.category !== 'TOTAL');

  // Overall calculations
  const totalSpentPaise = monthExpenses.reduce((acc, t) => acc + t.amountPaise, 0);
  const totalLimitPaise = totalBudget ? totalBudget.limitPaise : 0;
  const overallMetrics = calculateBudgetUtilization(totalSpentPaise, totalLimitPaise);

  const handleOpenModal = (budgetToEdit?: Budget) => {
    if (budgetToEdit) {
      setEditingBudget(budgetToEdit);
      setCategory(budgetToEdit.category);
      setLimitRupees(String(paiseToRupees(budgetToEdit.limitPaise)));
    } else {
      setEditingBudget(null);
      setCategory('Food & Mess');
      setLimitRupees('3000');
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(limitRupees);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a positive budget amount.');
      return;
    }

    setBudget({
      id: editingBudget?.id,
      userId: profile.id,
      category,
      limitPaise: rupeesToPaise(parsed),
      month: selectedMonth,
      alertThresholds: [70, 90, 100],
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
            Smart Monthly Budgets
          </h1>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            Set sensible spending caps for {selectedMonth} with automated 70%, 90%, and 100% threshold alerts
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/25 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Main Overall Monthly Budget Card */}
      <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#221C24] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F5F6FC]">Total Monthly Budget</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#221C24] text-[#A5ABC0]">
                  {selectedMonth}
                </span>
              </div>
              <p className="text-xs text-[#A5ABC0]">Overall ceiling across all categories combined</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (totalBudget) {
                  handleOpenModal(totalBudget);
                } else {
                  setEditingBudget(null);
                  setCategory('TOTAL');
                  setLimitRupees('10000');
                  setIsModalOpen(true);
                }
              }}
              className="px-3 py-1.5 bg-[#221C24] hover:bg-[#322936] text-xs font-semibold text-[#EF4444] rounded-lg transition-colors"
            >
              {totalBudget ? 'Edit Total Limit' : '+ Set Overall Budget'}
            </button>
          </div>
        </div>

        {totalBudget ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-xs text-[#A5ABC0]">Spent so far</span>
                <div className="text-2xl font-black text-[#F5F6FC]">
                  {formatCurrency(totalSpentPaise, profile.currency)}{' '}
                  <span className="text-xs text-[#A5ABC0] font-normal">
                    of {formatCurrency(totalBudget.limitPaise, profile.currency)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#A5ABC0]">
                  {overallMetrics.isOverBudget ? 'Budget Exceeded By' : 'Remaining Room'}
                </span>
                <div
                  className={`text-xl font-bold ${
                    overallMetrics.isOverBudget ? 'text-[#FF5C5C]' : 'text-[#50B99A]'
                  }`}
                >
                  {formatCurrency(Math.abs(overallMetrics.remainingPaise), profile.currency)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#221C24] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallMetrics.percentage >= 100
                    ? 'bg-[#FF5C5C]'
                    : overallMetrics.percentage >= 90
                    ? 'bg-[#F4B860]'
                    : 'bg-[#50B99A]'
                }`}
                style={{ width: `${Math.min(100, overallMetrics.percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#A5ABC0]">
              <span>0%</span>
              <span className="font-semibold text-[#F5F6FC]">
                {overallMetrics.percentage}% Utilized
              </span>
              <span>100% Limit</span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-[#A5ABC0] text-xs">
            No overall monthly budget set for {selectedMonth}. Set one to track your aggregate monthly ceiling.
          </div>
        )}
      </div>

      {/* Category Specific Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F5F6FC]">Category Budgets</h2>
          <span className="text-xs text-[#A5ABC0]">{categoryBudgets.length} Active Targets</span>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#161217] border border-[#322936] text-center text-[#A5ABC0] space-y-3">
            <Tag className="w-8 h-8 mx-auto text-[#322936]" />
            <h3 className="text-sm font-bold text-[#F5F6FC]">No Category Budgets Yet</h3>
            <p className="text-xs max-w-sm mx-auto">
              Setting category budgets for Food, Chai & Snacks, and Outings helps you spot leaks before they drain your monthly allowance.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl"
            >
              + Create Category Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((b) => {
              const catSpentPaise = monthExpenses
                .filter((t) => t.category === b.category)
                .reduce((acc, t) => acc + t.amountPaise, 0);

              const metrics = calculateBudgetUtilization(catSpentPaise, b.limitPaise);

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#F5F6FC]">{b.category}</h3>
                      <span className="text-[10px] text-[#A5ABC0]">
                        Limit: {formatCurrency(b.limitPaise, profile.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(b)}
                        aria-label={`Edit ${b.category} budget`}
                        className="p-1 rounded text-[#A5ABC0] hover:text-[#F5F6FC] hover:bg-[#221C24]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(b.id)}
                        aria-label={`Delete ${b.category} budget`}
                        className="p-1 rounded text-[#A5ABC0] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/15"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Spend vs Limit */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A5ABC0]">
                        Spent: {formatCurrency(catSpentPaise, profile.currency)}
                      </span>
                      <span
                        className={`font-bold ${
                          metrics.isOverBudget
                            ? 'text-[#FF5C5C]'
                            : metrics.percentage >= 90
                            ? 'text-[#F4B860]'
                            : 'text-[#50B99A]'
                        }`}
                      >
                        {metrics.percentage}%
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-2 rounded-full bg-[#221C24] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          metrics.percentage >= 100
                            ? 'bg-[#FF5C5C]'
                            : metrics.percentage >= 90
                            ? 'bg-[#F4B860]'
                            : 'bg-[#EF4444]'
                        }`}
                        style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-right">
                      {metrics.isOverBudget ? (
                        <span className="text-[#FF5C5C] font-semibold">
                          Over by {formatCurrency(Math.abs(metrics.remainingPaise), profile.currency)}
                        </span>
                      ) : (
                        <span className="text-[#A5ABC0]">
                          {formatCurrency(metrics.remainingPaise, profile.currency)} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Non-judgmental Student Practical Financial Advice */}
      <div className="p-5 rounded-2xl bg-[#221C24]/40 border border-[#322936] text-xs text-[#A5ABC0] space-y-2">
        <h4 className="font-bold text-[#F5F6FC] flex items-center gap-2">
          <span>💡 Practical Student Budgeting Tips</span>
        </h4>
        <p className="leading-relaxed">
          College budgets work best when you budget for guilt-free fun rather than total restriction. Allocate at least 10–15% for campus socials, canteen chai, and weekend outings so you don't feel deprived and blow your budget late in the month.
        </p>
      </div>

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget Limit' : 'Set Category Budget'}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#FF5C5C]/15 border border-[#FF5C5C]/30 rounded-xl text-xs text-[#FF5C5C]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Category *</label>
            <select
              value={category}
              disabled={!!editingBudget}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              {AVAILABLE_BUDGET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'TOTAL' ? 'TOTAL (Overall Monthly Budget)' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Monthly Budget Limit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={limitRupees}
                onChange={(e) => setLimitRupees(e.target.value)}
                placeholder="e.g. 3000"
                className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm font-semibold text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221C24]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#A5ABC0] hover:text-[#F5F6FC] bg-[#221C24] hover:bg-[#322936] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-xl shadow-lg shadow-[#EF4444]/25"
            >
              Save Budget
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteBudget(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Budget Limit?"
        message="This will remove the spending cap and alerts for this category in the current month."
        confirmLabel="Remove Budget"
        isDestructive={true}
      />
    </div>
  );
};
