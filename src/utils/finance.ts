import {
  DailyPlannerResult,
  SavingsGoal,
  Transaction,
  Budget,
  BudgetAlert,
} from '../types/finance';

/**
 * Converts integer paise to currency decimal number.
 * e.g. 1500000 paise -> 15000.00
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Converts decimal currency to integer paise safely avoiding IEEE 754 precision issues.
 * e.g. 150.50 -> 15050
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Formats integer paise into a localized currency string.
 * Indian numbering system (Lakhs, Crores) used for INR: ₹1,50,000.
 */
export function formatCurrency(
  paise: number,
  currency: string = 'INR',
  includeDecimals: boolean = false
): string {
  const amount = paiseToRupees(paise);
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    });
    const formatted = formatter.format(absAmount);
    return isNegative ? `-${formatted}` : formatted;
  } catch {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${isNegative ? '-' : ''}${symbol}${absAmount.toLocaleString()}`;
  }
}

/**
 * Calculates days remaining until a target date.
 * Returns at least 1 day if target is today or past, to prevent divide-by-zero.
 */
export function calculateDaysUntil(
  targetDateStr: string,
  currentDateStr?: string
): number {
  const current = currentDateStr ? new Date(currentDateStr) : new Date();
  const target = new Date(targetDateStr);

  // Normalize to start of day
  const curTime = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const targetTime = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  const diffMs = targetTime - curTime;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
}

/**
 * Core Daily Spending Planner (Section H)
 * Inputs:
 * - availableFunds: actual cash/bank balance
 * - upcomingNecessaryExpenses: committed expenses (mess fee, rent, recharges) due before next allowance
 * - plannedSavings: savings target contributions scheduled before next allowance
 * - daysUntilNextAllowance: days until next pocket money
 *
 * Formula:
 * Spendable funds = available funds - upcoming necessary expenses - planned savings.
 * Daily spending estimate = spendable funds / remaining days.
 * If spendable funds are negative, report shortfall clearly.
 */
export function calculateDailySpendingPlan(
  availableFundsPaise: number,
  upcomingExpensesPaise: number,
  plannedSavingsPaise: number,
  nextAllowanceDateStr: string,
  currentDateStr?: string
): DailyPlannerResult {
  const spendableFundsPaise =
    availableFundsPaise - upcomingExpensesPaise - plannedSavingsPaise;
  const remainingDays = calculateDaysUntil(nextAllowanceDateStr, currentDateStr);

  const isShortfall = spendableFundsPaise < 0;
  const shortfallPaise = isShortfall ? Math.abs(spendableFundsPaise) : 0;

  let dailyAllowancePaise = 0;
  let recommendation = '';

  if (isShortfall) {
    dailyAllowancePaise = 0;
    recommendation = `You have a funding deficit of ${formatCurrency(
      shortfallPaise
    )} before your next allowance in ${remainingDays} days. Prioritize critical bills and pause discretionary spending.`;
  } else {
    dailyAllowancePaise = Math.floor(spendableFundsPaise / remainingDays);
    if (dailyAllowancePaise < 10000) {
      // Under ₹100/day
      recommendation = `Tight budget! You have ${formatCurrency(
        dailyAllowancePaise
      )}/day for the next ${remainingDays} days. Stick to campus mess and essential transit.`;
    } else if (dailyAllowancePaise < 35000) {
      // ₹100 - ₹350/day
      recommendation = `Balanced budget: ${formatCurrency(
        dailyAllowancePaise
      )}/day. Safe for chai, canteen lunches, and moderate day-to-day spending.`;
    } else {
      recommendation = `Comfortable buffer: ${formatCurrency(
        dailyAllowancePaise
      )}/day over the next ${remainingDays} days. Great opportunity to boost savings goals!`;
    }
  }

  return {
    availableFundsPaise,
    upcomingNecessaryExpensesPaise: upcomingExpensesPaise,
    plannedSavingsPaise,
    spendableFundsPaise,
    remainingDays,
    dailyAllowancePaise,
    isShortfall,
    shortfallPaise,
    recommendation,
  };
}

/**
 * Calculates budget utilization and checks thresholds (70%, 90%, 100%).
 * Prevents division by zero.
 */
export function calculateBudgetUtilization(
  spentPaise: number,
  limitPaise: number
): {
  percentage: number;
  remainingPaise: number;
  isOverBudget: boolean;
  status: 'safe' | 'warning_70' | 'warning_90' | 'exceeded_100';
} {
  if (limitPaise <= 0) {
    return {
      percentage: 0,
      remainingPaise: -spentPaise,
      isOverBudget: spentPaise > 0,
      status: spentPaise > 0 ? 'exceeded_100' : 'safe',
    };
  }

  const percentage = Math.round((spentPaise / limitPaise) * 100);
  const remainingPaise = limitPaise - spentPaise;
  const isOverBudget = spentPaise > limitPaise;

  let status: 'safe' | 'warning_70' | 'warning_90' | 'exceeded_100' = 'safe';
  if (percentage >= 100) {
    status = 'exceeded_100';
  } else if (percentage >= 90) {
    status = 'warning_90';
  } else if (percentage >= 70) {
    status = 'warning_70';
  }

  return {
    percentage,
    remainingPaise,
    isOverBudget,
    status,
  };
}

/**
 * Checks all active budgets for alerts against user transactions for a given month.
 */
export function evaluateBudgetAlerts(
  budgets: Budget[],
  transactions: Transaction[],
  monthStr: string // YYYY-MM
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const monthTransactions = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(monthStr)
  );

  for (const budget of budgets) {
    if (budget.month !== monthStr) continue;

    let spentPaise = 0;
    if (budget.category === 'TOTAL') {
      spentPaise = monthTransactions.reduce((acc, t) => acc + t.amountPaise, 0);
    } else {
      spentPaise = monthTransactions
        .filter((t) => t.category === budget.category)
        .reduce((acc, t) => acc + t.amountPaise, 0);
    }

    const { percentage, status } = calculateBudgetUtilization(
      spentPaise,
      budget.limitPaise
    );

    if (status === 'exceeded_100') {
      alerts.push({
        budgetId: budget.id,
        category: budget.category,
        threshold: 100,
        spentPaise,
        limitPaise: budget.limitPaise,
        percentage,
        message: `${budget.category} budget exceeded! Spent ${formatCurrency(
          spentPaise
        )} of ${formatCurrency(budget.limitPaise)} (${percentage}%).`,
      });
    } else if (status === 'warning_90') {
      alerts.push({
        budgetId: budget.id,
        category: budget.category,
        threshold: 90,
        spentPaise,
        limitPaise: budget.limitPaise,
        percentage,
        message: `${budget.category} has reached ${percentage}% of budget (${formatCurrency(
          spentPaise
        )} / ${formatCurrency(budget.limitPaise)}).`,
      });
    } else if (status === 'warning_70') {
      alerts.push({
        budgetId: budget.id,
        category: budget.category,
        threshold: 70,
        spentPaise,
        limitPaise: budget.limitPaise,
        percentage,
        message: `${budget.category} is at ${percentage}% of budget limit.`,
      });
    }
  }

  return alerts;
}

/**
 * Calculates metrics for savings goals:
 * - Amount remaining needed
 * - Progress percentage (capped at 100)
 * - Required monthly and weekly contributions
 */
export function calculateSavingsGoalMetrics(
  goal: SavingsGoal,
  currentDateStr?: string
): {
  remainingNeededPaise: number;
  progressPercentage: number;
  daysRemaining: number;
  weeksRemaining: number;
  monthsRemaining: number;
  requiredMonthlyPaise: number;
  requiredWeeklyPaise: number;
  isCompleted: boolean;
} {
  const remainingNeededPaise = Math.max(0, goal.targetPaise - goal.currentPaise);
  const progressPercentage =
    goal.targetPaise > 0
      ? Math.min(100, Math.round((goal.currentPaise / goal.targetPaise) * 100))
      : 100;

  const daysRemaining = calculateDaysUntil(goal.targetDate, currentDateStr);
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4));

  const requiredMonthlyPaise = Math.ceil(remainingNeededPaise / monthsRemaining);
  const requiredWeeklyPaise = Math.ceil(remainingNeededPaise / weeksRemaining);

  return {
    remainingNeededPaise,
    progressPercentage,
    daysRemaining,
    weeksRemaining,
    monthsRemaining,
    requiredMonthlyPaise,
    requiredWeeklyPaise,
    isCompleted: goal.currentPaise >= goal.targetPaise,
  };
}

/**
 * Aggregates transactions by category.
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  type: 'income' | 'expense' = 'expense'
): { category: string; totalPaise: number; count: number; percentage: number }[] {
  const filtered = transactions.filter((t) => t.type === type);
  const grandTotal = filtered.reduce((acc, t) => acc + t.amountPaise, 0);

  const map = new Map<string, { totalPaise: number; count: number }>();
  for (const t of filtered) {
    const existing = map.get(t.category) || { totalPaise: 0, count: 0 };
    map.set(t.category, {
      totalPaise: existing.totalPaise + t.amountPaise,
      count: existing.count + 1,
    });
  }

  const result: {
    category: string;
    totalPaise: number;
    count: number;
    percentage: number;
  }[] = [];

  map.forEach((val, cat) => {
    result.push({
      category: cat,
      totalPaise: val.totalPaise,
      count: val.count,
      percentage: grandTotal > 0 ? Math.round((val.totalPaise / grandTotal) * 100) : 0,
    });
  });

  return result.sort((a, b) => b.totalPaise - a.totalPaise);
}
