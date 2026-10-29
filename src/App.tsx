import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { MoneyCoachView } from './components/coach/MoneyCoachView';
import { SavingsGoalsView } from './components/goals/SavingsGoalsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { RecurringView } from './components/recurring/RecurringView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

function MainApp() {
  const { profile } = useFinance();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check query params for ?autostart=1 or ?tab=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    const tabParam = params.get('tab') as NavTab | null;

    if (tabParam && ['dashboard', 'transactions', 'budgets', 'coach', 'goals', 'analytics', 'recurring', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (!profile.onboardingCompleted && autostart !== '1') {
      setShowOnboarding(true);
    }
  }, [profile.onboardingCompleted]);

  return (
    <div className="min-h-screen bg-[#0C0A0D] text-[#F5F6FC] flex flex-col md:flex-row font-sans selection:bg-[#EF4444]/30 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
      />

      {/* Mobile Top and Bottom Nav */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenAddTransaction={() => setIsAddTxOpen(true)}
          />
        )}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'coach' && <MoneyCoachView />}
        {activeTab === 'goals' && <SavingsGoalsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'recurring' && <RecurringView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Add Transaction Modal */}
      <TransactionFormModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
      />

      {/* Multi-Step Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
