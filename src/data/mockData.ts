import {
  UserProfile,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringExpense,
} from '../types/finance';
import { rupeesToPaise } from '../utils/finance';

export const getDemoNextAllowanceDate = (): string => {
  const now = new Date();
  // 8 days from now
  const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8);
  return nextDate.toISOString().split('T')[0];
};

export const getDemoCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const createInitialDemoData = () => {
  const currentMonth = getDemoCurrentMonth();
  const nextAllowanceDate = getDemoNextAllowanceDate();
  const today = new Date().toISOString().split('T')[0];

  const getDateOffset = (daysAgo: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const userProfile: UserProfile = {
    id: 'demo-user-1',
    displayName: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu.in',
    collegeName: 'BITS Pilani / Delhi Campus',
    currency: 'INR',
    monthlyAllowancePaise: rupeesToPaise(12000), // ₹12,000
    allowanceFrequency: 'monthly',
    nextAllowanceDate: nextAllowanceDate,
    currentBalancePaise: rupeesToPaise(8500), // ₹8,500 in bank/UPI
    essentialExpensesPaise: rupeesToPaise(458), // committed bills due before next allowance
    onboardingCompleted: true,
    isDemoUser: true,
  };

  const transactions: Transaction[] = [
    {
      id: 'demo-tx-1',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(12000),
      currency: 'INR',
      type: 'income',
      category: 'Allowance / Pocket Money',
      merchant: 'Dad (UPI / NetBanking)',
      date: getDateOffset(18),
      paymentMethod: 'upi',
      source: 'manual',
      note: 'Monthly allowance for semester',
      createdAt: Date.now() - 18 * 86400000,
    },
    {
      id: 'demo-tx-2',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(3000),
      currency: 'INR',
      type: 'expense',
      category: 'Food & Mess',
      merchant: 'Campus Mess Committee',
      date: getDateOffset(17),
      paymentMethod: 'upi',
      source: 'recurring',
      note: 'Monthly hostel mess payment',
      createdAt: Date.now() - 17 * 86400000,
    },
    {
      id: 'demo-tx-3',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(399),
      currency: 'INR',
      type: 'expense',
      category: 'Recharge & Tech',
      merchant: 'Jio 5G Prepaid Recharge',
      date: getDateOffset(15),
      paymentMethod: 'upi',
      source: 'recurring',
      note: '84-day student pack monthly share',
      createdAt: Date.now() - 15 * 86400000,
    },
    {
      id: 'demo-tx-4',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(650),
      currency: 'INR',
      type: 'expense',
      category: 'Books & Academics',
      merchant: 'Engineering Books & Photocopy',
      date: getDateOffset(12),
      paymentMethod: 'cash',
      source: 'manual',
      note: 'Algorithm textbooks and lab manuals',
      createdAt: Date.now() - 12 * 86400000,
    },
    {
      id: 'demo-tx-5',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(80),
      currency: 'INR',
      type: 'expense',
      category: 'Chai & Snacks',
      merchant: 'Tapri Chai & Bun Maska',
      date: getDateOffset(9),
      paymentMethod: 'upi',
      source: 'manual',
      note: 'Late night study group tea',
      createdAt: Date.now() - 9 * 86400000,
    },
    {
      id: 'demo-tx-6',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(240),
      currency: 'INR',
      type: 'expense',
      category: 'Travel & Commute',
      merchant: 'Metro Smart Card Recharge',
      date: getDateOffset(6),
      paymentMethod: 'upi',
      source: 'manual',
      note: 'Weekend travel to central library',
      createdAt: Date.now() - 6 * 86400000,
    },
    {
      id: 'demo-tx-7',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(450),
      currency: 'INR',
      type: 'expense',
      category: 'Entertainment & Outings',
      merchant: 'PVR Cinemas (Student Tuesday)',
      date: getDateOffset(4),
      paymentMethod: 'card',
      source: 'manual',
      note: 'Movie with hostel wing mates',
      createdAt: Date.now() - 4 * 86400000,
    },
    {
      id: 'demo-tx-8',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(320),
      currency: 'INR',
      type: 'expense',
      category: 'Food & Mess',
      merchant: 'Swiggy (Midnight Biryani Split)',
      date: getDateOffset(2),
      paymentMethod: 'upi',
      source: 'manual',
      note: 'Exam cramming dinner with Rohan',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'demo-tx-9',
      userId: 'demo-user-1',
      amountPaise: rupeesToPaise(40),
      currency: 'INR',
      type: 'expense',
      category: 'Chai & Snacks',
      merchant: 'Canteen Samosa & Chai',
      date: today,
      paymentMethod: 'upi',
      source: 'manual',
      note: 'Afternoon break between lectures',
      createdAt: Date.now(),
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'b-total',
      userId: 'demo-user-1',
      category: 'TOTAL',
      limitPaise: rupeesToPaise(10000),
      month: currentMonth,
      alertThresholds: [70, 90, 100],
    },
    {
      id: 'b-food',
      userId: 'demo-user-1',
      category: 'Food & Mess',
      limitPaise: rupeesToPaise(4200),
      month: currentMonth,
      alertThresholds: [70, 90, 100],
    },
    {
      id: 'b-chai',
      userId: 'demo-user-1',
      category: 'Chai & Snacks',
      limitPaise: rupeesToPaise(800),
      month: currentMonth,
      alertThresholds: [70, 90, 100],
    },
    {
      id: 'b-books',
      userId: 'demo-user-1',
      category: 'Books & Academics',
      limitPaise: rupeesToPaise(1200),
      month: currentMonth,
      alertThresholds: [70, 90, 100],
    },
    {
      id: 'b-commute',
      userId: 'demo-user-1',
      category: 'Travel & Commute',
      limitPaise: rupeesToPaise(800),
      month: currentMonth,
      alertThresholds: [70, 90, 100],
    },
    {
      id: 'b-entertainment',
      userId: 'demo-user-1',
      category: 'Entertainment & Outings',
      limitPaise: rupeesToPaise(1000),
      month: currentMonth,
      alertThresholds: [70, 90, 100],
    },
  ];

  const targetDate1 = new Date();
  targetDate1.setDate(targetDate1.getDate() + 24);
  const targetDate2 = new Date();
  targetDate2.setDate(targetDate2.getDate() + 75);

  const savingsGoals: SavingsGoal[] = [
    {
      id: 'goal-smartwatch',
      userId: 'demo-user-1',
      name: 'Noise ColorFit Smartwatch',
      targetPaise: rupeesToPaise(3499),
      currentPaise: rupeesToPaise(2100),
      targetDate: targetDate1.toISOString().split('T')[0],
      priority: 'high',
      monthlyContributionPaise: rupeesToPaise(800),
      categoryIcon: 'watch',
      notes: 'For fitness tracking & exam alarms',
      createdAt: Date.now() - 15 * 86400000,
    },
    {
      id: 'goal-goa-trip',
      userId: 'demo-user-1',
      name: 'End-Sem Batch Trip',
      targetPaise: rupeesToPaise(9000),
      currentPaise: rupeesToPaise(3200),
      targetDate: targetDate2.toISOString().split('T')[0],
      priority: 'medium',
      monthlyContributionPaise: rupeesToPaise(1000),
      categoryIcon: 'plane',
      notes: 'Train tickets, shared beach stay with hostel group',
      createdAt: Date.now() - 30 * 86400000,
    },
    {
      id: 'goal-emergency',
      userId: 'demo-user-1',
      name: 'Hostel Emergency Stash',
      targetPaise: rupeesToPaise(5000),
      currentPaise: rupeesToPaise(3500),
      targetDate: targetDate2.toISOString().split('T')[0],
      priority: 'high',
      monthlyContributionPaise: rupeesToPaise(500),
      categoryIcon: 'shield',
      notes: 'For urgent medical or sudden travel needs',
      createdAt: Date.now() - 40 * 86400000,
    },
  ];

  const dueSoonDate = new Date();
  dueSoonDate.setDate(dueSoonDate.getDate() + 5);

  const recurringExpenses: RecurringExpense[] = [
    {
      id: 'rec-mess',
      userId: 'demo-user-1',
      title: 'Hostel Mess Advance',
      amountPaise: rupeesToPaise(3000),
      category: 'Food & Mess',
      frequency: 'monthly',
      nextDueDate: nextAllowanceDate,
      active: true,
      paymentMethod: 'upi',
      notes: 'Paid on the 1st upon allowance deposit',
    },
    {
      id: 'rec-wifi',
      userId: 'demo-user-1',
      title: 'Jio 5G Data Pack',
      amountPaise: rupeesToPaise(399),
      category: 'Recharge & Tech',
      frequency: 'monthly',
      nextDueDate: dueSoonDate.toISOString().split('T')[0],
      active: true,
      paymentMethod: 'upi',
      notes: 'Essential for hostel coursework and video calls',
    },
    {
      id: 'rec-spotify',
      userId: 'demo-user-1',
      title: 'Spotify Premium Student',
      amountPaise: rupeesToPaise(59),
      category: 'Entertainment & Outings',
      frequency: 'monthly',
      nextDueDate: getDateOffset(-12),
      active: true,
      paymentMethod: 'upi',
      notes: 'Verified university email discount',
    },
    {
      id: 'rec-laundry',
      userId: 'demo-user-1',
      title: 'Hostel Dhobi & Ironing',
      amountPaise: rupeesToPaise(400),
      category: 'Other',
      frequency: 'monthly',
      nextDueDate: getDateOffset(-10),
      active: true,
      paymentMethod: 'cash',
      notes: 'Bi-weekly washing service',
    },
  ];

  return {
    userProfile,
    transactions,
    budgets,
    savingsGoals,
    recurringExpenses,
  };
};
