import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringExpense,
  DailyPlannerResult,
  BudgetAlert,
} from '../types/finance';
import {
  createInitialDemoData,
  getDemoCurrentMonth,
} from '../data/mockData';
import {
  calculateDailySpendingPlan,
  evaluateBudgetAlerts,
  rupeesToPaise,
} from '../utils/finance';

interface FinanceContextType {
  profile: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringExpense[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  dailyPlan: DailyPlannerResult;
  budgetAlerts: BudgetAlert[];
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  editTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => void;
  deleteBudget: (id: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => SavingsGoal;
  editSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (id: string, amountPaise: number) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => void;
  editRecurringExpense: (id: string, expense: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  toggleRecurringActive: (id: string) => void;
  recordRecurringAsPaid: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const STORAGE_KEY = 'pocketpilot_financial_data_v2';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getDemoCurrentMonth());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Load initial data
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile && parsed.transactions) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
    return createInitialDemoData();
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [data]);

  // Derived state: calculate authoritative daily plan
  const dailyPlan = useMemo(() => {
    const nextDate = data.userProfile.nextAllowanceDate || new Date().toISOString().split('T')[0];
    const upcomingExpensesPaise = data.recurringExpenses
      .filter((r: RecurringExpense) => r.active && r.nextDueDate <= nextDate)
      .reduce((acc: number, r: RecurringExpense) => acc + r.amountPaise, 0);

    const plannedSavingsPaise = data.savingsGoals.reduce(
      (acc: number, g: SavingsGoal) => acc + (g.monthlyContributionPaise || 0),
      0
    );

    return calculateDailySpendingPlan(
      data.userProfile.currentBalancePaise || 0,
      upcomingExpensesPaise,
      plannedSavingsPaise,
      nextDate
    );
  }, [data.userProfile, data.recurringExpenses, data.savingsGoals]);

  // Derived state: evaluate alerts for selected month
  const budgetAlerts = useMemo(() => {
    return evaluateBudgetAlerts(data.budgets, data.transactions, selectedMonth);
  }, [data.budgets, data.transactions, selectedMonth]);

  // Actions
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    setData((prev: any) => {
      // Adjust current bank balance accordingly
      const balanceDelta = txData.type === 'income' ? txData.amountPaise : -txData.amountPaise;
      const updatedBalance = Math.max(0, (prev.userProfile.currentBalancePaise || 0) + balanceDelta);

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        userProfile: {
          ...prev.userProfile,
          currentBalancePaise: updatedBalance,
        },
      };
    });

    return newTx;
  };

  const editTransaction = (id: string, updated: Partial<Transaction>) => {
    setData((prev: any) => {
      const oldTx = prev.transactions.find((t: Transaction) => t.id === id);
      if (!oldTx) return prev;

      // Calculate balance adjustment
      let balanceAdjustment = 0;
      if (updated.amountPaise !== undefined || updated.type !== undefined) {
        const oldContribution = oldTx.type === 'income' ? oldTx.amountPaise : -oldTx.amountPaise;
        const newType = updated.type || oldTx.type;
        const newAmount = updated.amountPaise !== undefined ? updated.amountPaise : oldTx.amountPaise;
        const newContribution = newType === 'income' ? newAmount : -newAmount;
        balanceAdjustment = newContribution - oldContribution;
      }

      return {
        ...prev,
        transactions: prev.transactions.map((t: Transaction) =>
          t.id === id ? { ...t, ...updated } : t
        ),
        userProfile: {
          ...prev.userProfile,
          currentBalancePaise: Math.max(0, (prev.userProfile.currentBalancePaise || 0) + balanceAdjustment),
        },
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setData((prev: any) => {
      const target = prev.transactions.find((t: Transaction) => t.id === id);
      const balanceAdjustment = target
        ? target.type === 'income'
          ? -target.amountPaise
          : target.amountPaise
        : 0;

      return {
        ...prev,
        transactions: prev.transactions.filter((t: Transaction) => t.id !== id),
        userProfile: {
          ...prev.userProfile,
          currentBalancePaise: Math.max(0, (prev.userProfile.currentBalancePaise || 0) + balanceAdjustment),
        },
      };
    });
  };

  const setBudget = (budgetData: Omit<Budget, 'id'> & { id?: string }) => {
    setData((prev: any) => {
      const existingIndex = prev.budgets.findIndex(
        (b: Budget) => b.category === budgetData.category && b.month === budgetData.month
      );

      if (existingIndex >= 0) {
        const updated = [...prev.budgets];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...budgetData,
        };
        return { ...prev, budgets: updated };
      }

      const newBudget: Budget = {
        ...budgetData,
        id: budgetData.id || `b-${Date.now()}`,
        alertThresholds: budgetData.alertThresholds || [70, 90, 100],
      };

      return {
        ...prev,
        budgets: [...prev.budgets, newBudget],
      };
    });
  };

  const deleteBudget = (id: string) => {
    setData((prev: any) => ({
      ...prev,
      budgets: prev.budgets.filter((b: Budget) => b.id !== id),
    }));
  };

  const addSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'createdAt'>): SavingsGoal => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      createdAt: Date.now(),
    };

    setData((prev: any) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));

    return newGoal;
  };

  const editSavingsGoal = (id: string, goalData: Partial<SavingsGoal>) => {
    setData((prev: any) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g: SavingsGoal) =>
        g.id === id ? { ...g, ...goalData } : g
      ),
    }));
  };

  const deleteSavingsGoal = (id: string) => {
    setData((prev: any) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g: SavingsGoal) => g.id !== id),
    }));
  };

  const contributeToGoal = (id: string, amountPaise: number) => {
    setData((prev: any) => {
      const goal = prev.savingsGoals.find((g: SavingsGoal) => g.id === id);
      if (!goal) return prev;

      const newCurrent = goal.currentPaise + amountPaise;
      const updatedGoals = prev.savingsGoals.map((g: SavingsGoal) =>
        g.id === id ? { ...g, currentPaise: newCurrent } : g
      );

      // Deduct from available funds and record as savings transaction
      const updatedBalance = Math.max(0, (prev.userProfile.currentBalancePaise || 0) - amountPaise);

      const savingsTx: Transaction = {
        id: `tx-save-${Date.now()}`,
        userId: prev.userProfile.id,
        amountPaise,
        currency: prev.userProfile.currency || 'INR',
        type: 'expense',
        category: 'Savings Deposit',
        merchant: `Goal: ${goal.name}`,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'upi',
        source: 'manual',
        note: `Contributed to ${goal.name}`,
        createdAt: Date.now(),
      };

      return {
        ...prev,
        savingsGoals: updatedGoals,
        transactions: [savingsTx, ...prev.transactions],
        userProfile: {
          ...prev.userProfile,
          currentBalancePaise: updatedBalance,
        },
      };
    });
  };

  const addRecurringExpense = (expenseData: Omit<RecurringExpense, 'id'>) => {
    const newExpense: RecurringExpense = {
      ...expenseData,
      id: `rec-${Date.now()}`,
    };
    setData((prev: any) => ({
      ...prev,
      recurringExpenses: [...prev.recurringExpenses, newExpense],
    }));
  };

  const editRecurringExpense = (id: string, expenseData: Partial<RecurringExpense>) => {
    setData((prev: any) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((r: RecurringExpense) =>
        r.id === id ? { ...r, ...expenseData } : r
      ),
    }));
  };

  const deleteRecurringExpense = (id: string) => {
    setData((prev: any) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter((r: RecurringExpense) => r.id !== id),
    }));
  };

  const toggleRecurringActive = (id: string) => {
    setData((prev: any) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((r: RecurringExpense) =>
        r.id === id ? { ...r, active: !r.active } : r
      ),
    }));
  };

  const recordRecurringAsPaid = (id: string) => {
    const item = data.recurringExpenses.find((r: RecurringExpense) => r.id === id);
    if (!item) return;

    addTransaction({
      userId: data.userProfile.id,
      amountPaise: item.amountPaise,
      currency: data.userProfile.currency || 'INR',
      type: 'expense',
      category: item.category,
      merchant: item.title,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: item.paymentMethod || 'upi',
      source: 'recurring',
      note: `Recurring payment for ${item.title}`,
    });
  };

  const updateProfile = (profileData: Partial<UserProfile>) => {
    setData((prev: any) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        ...profileData,
      },
    }));
  };

  const resetToDemoData = () => {
    const demo = createInitialDemoData();
    setData(demo);
    setIsDemoMode(true);
    setSelectedMonth(getDemoCurrentMonth());
  };

  const clearAllData = () => {
    const emptyState = {
      userProfile: {
        id: `user-${Date.now()}`,
        displayName: '',
        currency: 'INR',
        monthlyAllowancePaise: 0,
        allowanceFrequency: 'monthly' as const,
        nextAllowanceDate: new Date().toISOString().split('T')[0],
        currentBalancePaise: 0,
        essentialExpensesPaise: 0,
        onboardingCompleted: false,
        isDemoUser: false,
      },
      transactions: [],
      budgets: [],
      savingsGoals: [],
      recurringExpenses: [],
    };
    setData(emptyState);
    setIsDemoMode(false);
  };

  const exportDataJSON = (): string => {
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.userProfile && Array.isArray(parsed.transactions)) {
        setData(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid import JSON:', e);
    }
    return false;
  };

  return (
    <FinanceContext.Provider
      value={{
        profile: data.userProfile,
        transactions: data.transactions,
        budgets: data.budgets,
        goals: data.savingsGoals,
        recurring: data.recurringExpenses,
        selectedMonth,
        setSelectedMonth,
        dailyPlan,
        budgetAlerts,
        isDemoMode,
        setIsDemoMode,
        addTransaction,
        editTransaction,
        deleteTransaction,
        setBudget,
        deleteBudget,
        addSavingsGoal,
        editSavingsGoal,
        deleteSavingsGoal,
        contributeToGoal,
        addRecurringExpense,
        editRecurringExpense,
        deleteRecurringExpense,
        toggleRecurringActive,
        recordRecurringAsPaid,
        updateProfile,
        resetToDemoData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
