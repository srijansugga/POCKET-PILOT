import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Wallet,
  IndianRupee,
  Target,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { rupeesToPaise } from '../../utils/finance';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, addSavingsGoal, resetToDemoData } = useFinance();
  const [step, setStep] = useState(1);

  // Form states
  const [name, setName] = useState(profile.displayName || '');
  const [college, setCollege] = useState(profile.collegeName || '');
  const [allowance, setAllowance] = useState(
    profile.monthlyAllowancePaise ? String(profile.monthlyAllowancePaise / 100) : '10000'
  );
  const [currentBalance, setCurrentBalance] = useState(
    profile.currentBalancePaise ? String(profile.currentBalancePaise / 100) : '3500'
  );
  const [frequency, setFrequency] = useState<'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [essentialExpenses, setEssentialExpenses] = useState('3000');
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('INR');

  if (!isOpen) return null;

  const handleComplete = () => {
    updateProfile({
      displayName: name.trim() || 'Student',
      collegeName: college.trim() || 'University',
      monthlyAllowancePaise: rupeesToPaise(Number(allowance) || 10000),
      currentBalancePaise: rupeesToPaise(Number(currentBalance) || 3500),
      allowanceFrequency: frequency,
      nextAllowanceDate: nextDate,
      essentialExpensesPaise: rupeesToPaise(Number(essentialExpenses) || 3000),
      currency,
      onboardingCompleted: true,
      isDemoUser: false,
    });

    if (goalName.trim() && Number(goalAmount) > 0) {
      addSavingsGoal({
        userId: profile.id,
        name: goalName.trim(),
        targetPaise: rupeesToPaise(Number(goalAmount)),
        currentPaise: 0,
        targetDate: goalDate,
        priority: 'high',
        monthlyContributionPaise: rupeesToPaise(Math.round(Number(goalAmount) / 3)),
        notes: 'Created during onboarding',
      });
    }

    onClose();
  };

  const handleUseDemo = () => {
    resetToDemoData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#161217] border border-[#322936] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#221C24] via-[#1A161E] to-[#221C24] p-6 border-b border-[#322936]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F6FC]">Welcome to PocketPilot AI</h2>
                <p className="text-xs text-[#A5ABC0]">Your personal finance copilot for college</p>
              </div>
            </div>

            {/* Quick Demo Mode for judges */}
            <button
              onClick={handleUseDemo}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#EF4444]/15 text-[#FB7185] border border-[#EF4444]/30 hover:bg-[#EF4444]/25 font-semibold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Judge Demo Data
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between gap-2 mt-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-[#EF4444]'
                    : s < step
                    ? 'bg-[#50B99A]'
                    : 'bg-[#322936]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#F5F6FC]">Tell us about yourself</h3>
                <p className="text-xs text-[#A5ABC0] mt-0.5">
                  We customize allowances and expense categories for your student lifestyle.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                  Your Name or Nickname *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav, Ananya"
                  className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                  College / University & Campus (Optional)
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. IIT Delhi, BITS Pilani, Delhi University"
                  className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                  Preferred Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                >
                  <option value="INR">INR (₹) — Indian Rupee (Default)</option>
                  <option value="USD">USD ($) — US Dollar</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#F5F6FC]">Pocket Money & Allowance</h3>
                <p className="text-xs text-[#A5ABC0] mt-0.5">
                  How much money do you receive from parents, internships, or stipends?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                    Monthly Allowance (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={allowance}
                      onChange={(e) => setAllowance(e.target.value)}
                      placeholder="10000"
                      className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                    Current Bank / UPI Balance (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(e.target.value)}
                      placeholder="3500"
                      className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                  >
                    <option value="monthly">Monthly (e.g. 1st of month)</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                    Next Allowance Date *
                  </label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#F5F6FC]">Essential Fixed Costs</h3>
                <p className="text-xs text-[#A5ABC0] mt-0.5">
                  Estimated monthly must-haves: mess fees, hostel rent, mobile recharges, laundry.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                  Monthly Essential Expenses (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={essentialExpenses}
                    onChange={(e) => setEssentialExpenses(e.target.value)}
                    placeholder="3000"
                    className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
                <p className="text-[11px] text-[#A5ABC0] mt-1.5">
                  PocketPilot will deduct this automatically when computing your safe daily spendable allowance.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#221C24] border border-[#322936] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#50B99A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#A5ABC0] leading-relaxed">
                  <span className="font-semibold text-[#F5F6FC]">Privacy Guarantee: </span>
                  We will never ask for your bank passwords, UPI PINs, account numbers, or card CVVs. All data is securely handled for your personal guidance only.
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#F5F6FC]">Set Your First Savings Goal</h3>
                <p className="text-xs text-[#A5ABC0] mt-0.5">
                  What are you saving up for this semester? (Optional — you can skip)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Noise Smartwatch, Goa Trip, Mechanical Keyboard"
                  className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                    Target Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="3500"
                      className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-[#0C0A0D] border-t border-[#221C24] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-[#A5ABC0] hover:text-[#F5F6FC] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <button
              onClick={handleUseDemo}
              className="text-xs text-[#A5ABC0] hover:text-[#EF4444] underline"
            >
              Skip & Use Demo Data
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#EF4444]/20"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#EF4444]/25 hover:opacity-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Launch PocketPilot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
