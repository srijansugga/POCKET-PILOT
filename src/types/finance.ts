export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'upi' | 'cash' | 'card' | 'netbanking' | 'wallet';

export type TransactionSource = 'manual' | 'receipt' | 'recurring';

export type ExpenseCategory =
  | 'Food & Mess'
  | 'Chai & Snacks'
  | 'Hostel & Rent'
  | 'Books & Academics'
  | 'Travel & Commute'
  | 'Recharge & Tech'
  | 'Entertainment & Outings'
  | 'Shopping'
  | 'Health & Personal'
  | 'Other';

export type IncomeCategory =
  | 'Allowance / Pocket Money'
  | 'Scholarship / Stipend'
  | 'Part-time / Freelance'
  | 'Gifts & Rewards'
  | 'Other Income';

export interface Transaction {
  id: string;
  userId: string;
  amountPaise: number; // Stored in integer paise (₹1.00 = 100 paise)
  currency: string; // Defaults to 'INR'
  type: TransactionType;
  category: string;
  merchant: string;
  date: string; // ISO format YYYY-MM-DD
  note?: string;
  paymentMethod: PaymentMethod;
  source: TransactionSource;
  createdAt: number;
}

export interface Budget {
  id: string;
  userId: string;
  category: string; // 'TOTAL' or specific category
  limitPaise: number;
  month: string; // YYYY-MM
  alertThresholds: number[]; // e.g. [70, 90, 100]
}

export type GoalPriority = 'high' | 'medium' | 'low';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetPaise: number;
  currentPaise: number;
  targetDate: string; // YYYY-MM-DD
  priority: GoalPriority;
  monthlyContributionPaise?: number;
  categoryIcon?: string;
  notes?: string;
  createdAt: number;
}

export type RecurringFrequency = 'monthly' | 'weekly' | 'quarterly' | 'annual';

export interface RecurringExpense {
  id: string;
  userId: string;
  title: string;
  amountPaise: number;
  category: string;
  frequency: RecurringFrequency;
  nextDueDate: string; // YYYY-MM-DD
  active: boolean;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  collegeName?: string;
  currency: string; // 'INR'
  monthlyAllowancePaise: number;
  allowanceFrequency: 'monthly' | 'biweekly' | 'weekly';
  nextAllowanceDate: string; // YYYY-MM-DD
  currentBalancePaise: number; // Actual spendable bank/wallet balance
  essentialExpensesPaise: number;
  onboardingCompleted: boolean;
  isDemoUser?: boolean;
}

export interface DailyPlannerResult {
  availableFundsPaise: number;
  upcomingNecessaryExpensesPaise: number;
  plannedSavingsPaise: number;
  spendableFundsPaise: number;
  remainingDays: number;
  dailyAllowancePaise: number;
  isShortfall: boolean;
  shortfallPaise: number;
  recommendation: string;
}

export interface BudgetAlert {
  budgetId: string;
  category: string;
  threshold: number; // 70, 90, or 100
  spentPaise: number;
  limitPaise: number;
  percentage: number;
  message: string;
}
