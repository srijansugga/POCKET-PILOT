import test from 'node:test';
import assert from 'node:assert/strict';
import {
  paiseToRupees,
  rupeesToPaise,
  formatCurrency,
  calculateDaysUntil,
  calculateDailySpendingPlan,
  calculateBudgetUtilization,
  calculateSavingsGoalMetrics,
  calculateCategoryBreakdown,
} from './finance';
import { SavingsGoal, Transaction } from '../types/finance';

test('paiseToRupees and rupeesToPaise accurately convert currency values', () => {
  assert.equal(paiseToRupees(150000), 1500);
  assert.equal(paiseToRupees(25050), 250.5);
  assert.equal(rupeesToPaise(1500), 150000);
  assert.equal(rupeesToPaise(250.5), 25050);
  assert.equal(rupeesToPaise(0.99), 99);
});

test('formatCurrency outputs expected formatted strings for INR', () => {
  const result = formatCurrency(1500000, 'INR');
  assert.match(result, /15,000/);
});

test('calculateDaysUntil returns positive integer even for past dates or today', () => {
  const days = calculateDaysUntil('2026-11-05', '2026-10-29');
  assert.equal(days, 7);

  const sameDay = calculateDaysUntil('2026-10-29', '2026-10-29');
  assert.equal(sameDay, 1); // Minimum 1 day to prevent divide by zero
});

test('calculateDailySpendingPlan handles normal positive spendable funds', () => {
  // Available: ₹10,000 (1000000 paise)
  // Upcoming essential bills: ₹2,000 (200000 paise)
  // Planned savings: ₹1,000 (100000 paise)
  // Spendable = 10000 - 2000 - 1000 = ₹7,000 (700000 paise)
  // 7 days until allowance: 7000 / 7 = ₹1,000/day (100000 paise/day)
  const plan = calculateDailySpendingPlan(
    1000000,
    200000,
    100000,
    '2026-11-05',
    '2026-10-29'
  );

  assert.equal(plan.spendableFundsPaise, 700000);
  assert.equal(plan.remainingDays, 7);
  assert.equal(plan.dailyAllowancePaise, 100000);
  assert.equal(plan.isShortfall, false);
  assert.equal(plan.shortfallPaise, 0);
});

test('calculateDailySpendingPlan detects shortfall when expenses exceed funds', () => {
  // Available: ₹2,000
  // Upcoming essential: ₹3,000
  // Planned savings: ₹1,000
  // Spendable = 2000 - 3000 - 1000 = -₹2,000 (deficit)
  const plan = calculateDailySpendingPlan(
    200000,
    300000,
    100000,
    '2026-11-05',
    '2026-10-29'
  );

  assert.equal(plan.isShortfall, true);
  assert.equal(plan.shortfallPaise, 200000);
  assert.equal(plan.dailyAllowancePaise, 0); // Never show negative allowance as daily spending
  assert.match(plan.recommendation, /funding deficit/i);
});

test('calculateBudgetUtilization handles zero budgets safely without NaN', () => {
  const zeroBudget = calculateBudgetUtilization(5000, 0);
  assert.equal(zeroBudget.percentage, 0);
  assert.equal(zeroBudget.isOverBudget, true);

  const normalBudget = calculateBudgetUtilization(75000, 100000);
  assert.equal(normalBudget.percentage, 75);
  assert.equal(normalBudget.status, 'warning_70');
  assert.equal(normalBudget.remainingPaise, 25000);

  const exceeded = calculateBudgetUtilization(110000, 100000);
  assert.equal(exceeded.percentage, 110);
  assert.equal(exceeded.status, 'exceeded_100');
  assert.equal(exceeded.isOverBudget, true);
});

test('calculateSavingsGoalMetrics computes progress and required contributions', () => {
  const goal: SavingsGoal = {
    id: 'goal-1',
    userId: 'u1',
    name: 'Noise Smartwatch',
    targetPaise: 400000, // ₹4,000
    currentPaise: 100000, // ₹1,000
    targetDate: '2026-11-28', // 30 days ahead
    priority: 'high',
    createdAt: Date.now(),
  };

  const metrics = calculateSavingsGoalMetrics(goal, '2026-10-29');
  assert.equal(metrics.progressPercentage, 25);
  assert.equal(metrics.remainingNeededPaise, 300000);
  assert.equal(metrics.isCompleted, false);
  assert.ok(metrics.requiredMonthlyPaise > 0);
});

test('calculateCategoryBreakdown groups transactions and calculates percentages', () => {
  const transactions: Transaction[] = [
    {
      id: 't1',
      userId: 'u1',
      amountPaise: 50000, // ₹500
      currency: 'INR',
      type: 'expense',
      category: 'Food & Mess',
      merchant: 'Hostel Mess',
      date: '2026-10-25',
      paymentMethod: 'upi',
      source: 'manual',
      createdAt: 1,
    },
    {
      id: 't2',
      userId: 'u1',
      amountPaise: 150000, // ₹1,500
      currency: 'INR',
      type: 'expense',
      category: 'Books & Academics',
      merchant: 'College Bookstore',
      date: '2026-10-26',
      paymentMethod: 'upi',
      source: 'manual',
      createdAt: 2,
    },
  ];

  const breakdown = calculateCategoryBreakdown(transactions, 'expense');
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].category, 'Books & Academics');
  assert.equal(breakdown[0].percentage, 75);
  assert.equal(breakdown[1].category, 'Food & Mess');
  assert.equal(breakdown[1].percentage, 25);
});
