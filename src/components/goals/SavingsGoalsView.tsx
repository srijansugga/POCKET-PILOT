import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Coins,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsGoal, GoalPriority } from '../../types/finance';
import {
  calculateSavingsGoalMetrics,
  formatCurrency,
  paiseToRupees,
  rupeesToPaise,
} from '../../utils/finance';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SavingsGoalsView: React.FC = () => {
  const {
    profile,
    goals,
    dailyPlan,
    addSavingsGoal,
    editSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Contribute Funds Modal
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmountRupees, setDepositAmountRupees] = useState('');
  const [depositError, setDepositError] = useState<string | null>(null);

  // Goal Form Fields
  const [name, setName] = useState('');
  const [targetRupees, setTargetRupees] = useState('');
  const [currentRupees, setCurrentRupees] = useState('0');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<GoalPriority>('high');
  const [monthlyContributionRupees, setMonthlyContributionRupees] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAddModal = (goalToEdit?: SavingsGoal) => {
    if (goalToEdit) {
      setEditingGoal(goalToEdit);
      setName(goalToEdit.name);
      setTargetRupees(String(paiseToRupees(goalToEdit.targetPaise)));
      setCurrentRupees(String(paiseToRupees(goalToEdit.currentPaise)));
      setTargetDate(goalToEdit.targetDate);
      setPriority(goalToEdit.priority);
      setMonthlyContributionRupees(
        goalToEdit.monthlyContributionPaise
          ? String(paiseToRupees(goalToEdit.monthlyContributionPaise))
          : ''
      );
      setNotes(goalToEdit.notes || '');
    } else {
      setEditingGoal(null);
      setName('');
      setTargetRupees('3500');
      setCurrentRupees('0');
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      setTargetDate(d.toISOString().split('T')[0]);
      setPriority('high');
      setMonthlyContributionRupees('');
      setNotes('');
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetVal = parseFloat(targetRupees);
    if (isNaN(targetVal) || targetVal <= 0) {
      setFormError('Please enter a valid target amount.');
      return;
    }

    const currentVal = parseFloat(currentRupees) || 0;
    if (currentVal < 0) {
      setFormError('Current saved amount cannot be negative.');
      return;
    }

    if (!name.trim()) {
      setFormError('Goal name is required.');
      return;
    }

    const monthlyPaise = monthlyContributionRupees.trim()
      ? rupeesToPaise(parseFloat(monthlyContributionRupees))
      : undefined;

    if (editingGoal) {
      editSavingsGoal(editingGoal.id, {
        name: name.trim(),
        targetPaise: rupeesToPaise(targetVal),
        currentPaise: rupeesToPaise(currentVal),
        targetDate,
        priority,
        monthlyContributionPaise: monthlyPaise,
        notes: notes.trim() || undefined,
      });
    } else {
      addSavingsGoal({
        userId: profile.id,
        name: name.trim(),
        targetPaise: rupeesToPaise(targetVal),
        currentPaise: rupeesToPaise(currentVal),
        targetDate,
        priority,
        monthlyContributionPaise: monthlyPaise,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);

    const amount = parseFloat(depositAmountRupees);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Please enter a positive contribution amount.');
      return;
    }

    const paise = rupeesToPaise(amount);
    if (paise > (profile.currentBalancePaise || 0)) {
      setDepositError(
        `Insufficient available bank balance (${formatCurrency(
          profile.currentBalancePaise || 0,
          profile.currency
        )} available).`
      );
      return;
    }

    if (depositGoal) {
      contributeToGoal(depositGoal.id, paise);
      setDepositGoal(null);
      setDepositAmountRupees('');
    }
  };

  // Check if total monthly planned contributions exceed spendable funds
  const totalMonthlyCommitment = goals.reduce(
    (acc, g) => acc + (g.monthlyContributionPaise || 0),
    0
  );
  const hasCommitmentConflict =
    dailyPlan.spendableFundsPaise < totalMonthlyCommitment &&
    totalMonthlyCommitment > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
            Savings Goals & Targets
          </h1>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            Turn semester ambitions into realistic weekly savings milestones
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/25 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Conflict Warning if goals exceed spendable funds */}
      {hasCommitmentConflict && (
        <div className="p-4 rounded-xl bg-[#F4B860]/15 border border-[#F4B860]/30 flex items-start gap-3 text-xs text-[#FFD085]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#F5F6FC]">Budget Reality Check: </strong>
            Your total planned savings contributions ({formatCurrency(totalMonthlyCommitment, profile.currency)}) exceed your current net spendable funds ({formatCurrency(dailyPlan.spendableFundsPaise, profile.currency)}). Consider adjusting target dates or prioritizing one high-impact goal at a time.
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#161217] border border-[#322936] text-[#A5ABC0] space-y-3">
            <Target className="w-12 h-12 mx-auto text-[#322936]" />
            <h3 className="text-base font-bold text-[#F5F6FC]">No Goals Configured</h3>
            <p className="text-xs max-w-sm mx-auto">
              Whether it's an end-sem trip with hostel batchmates, a new tablet for notes, or an emergency stash, start small with ₹500/month.
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Goal
            </button>
          </div>
        ) : (
          goals.map((g) => {
            const metrics = calculateSavingsGoalMetrics(g);
            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Priority ribbon & header */}
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        g.priority === 'high'
                          ? 'bg-[#FF5C5C]/20 text-[#FF5C5C]'
                          : g.priority === 'medium'
                          ? 'bg-[#F4B860]/20 text-[#F4B860]'
                          : 'bg-[#50B99A]/20 text-[#50B99A]'
                      }`}
                    >
                      {g.priority} priority
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(g)}
                        aria-label={`Edit ${g.name}`}
                        className="p-1 rounded text-[#A5ABC0] hover:text-[#F5F6FC] hover:bg-[#221C24]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(g.id)}
                        aria-label={`Delete ${g.name}`}
                        className="p-1 rounded text-[#A5ABC0] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/15"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#F5F6FC] mt-2 truncate">{g.name}</h3>
                  {g.notes && (
                    <p className="text-[11px] text-[#A5ABC0] mt-0.5 line-clamp-1">"{g.notes}"</p>
                  )}
                </div>

                {/* Progress bar & Saved vs Target */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-[#A5ABC0]">Saved so far</span>
                      <div className="text-lg font-black text-[#50B99A]">
                        {formatCurrency(g.currentPaise, profile.currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#A5ABC0]">Target</span>
                      <div className="text-sm font-bold text-[#F5F6FC]">
                        {formatCurrency(g.targetPaise, profile.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress */}
                  <div className="w-full h-2.5 rounded-full bg-[#221C24] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#EF4444] to-[#50B99A] rounded-full transition-all duration-500"
                      style={{ width: `${metrics.progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#A5ABC0]">
                    <span>{metrics.progressPercentage}% Complete</span>
                    {metrics.isCompleted ? (
                      <span className="text-[#50B99A] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Achieved!
                      </span>
                    ) : (
                      <span>Need {formatCurrency(metrics.remainingNeededPaise, profile.currency)}</span>
                    )}
                  </div>
                </div>

                {/* Calculation Milestones: Weekly / Monthly needed */}
                {!metrics.isCompleted && (
                  <div className="p-3 rounded-xl bg-[#0C0A0D] border border-[#221C24] grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#A5ABC0] block">Save Weekly</span>
                      <strong className="text-[#EF4444]">
                        {formatCurrency(metrics.requiredWeeklyPaise, profile.currency)}/wk
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A5ABC0] block">Save Monthly</span>
                      <strong className="text-[#FB7185]">
                        {formatCurrency(metrics.requiredMonthlyPaise, profile.currency)}/mo
                      </strong>
                    </div>
                  </div>
                )}

                {/* Bottom Deposit action */}
                <div className="pt-2 border-t border-[#221C24] flex items-center justify-between">
                  <span className="text-[10px] text-[#A5ABC0] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#EF4444]" />
                    {metrics.daysRemaining} days remaining
                  </span>

                  {!metrics.isCompleted && (
                    <button
                      onClick={() => {
                        setDepositGoal(g);
                        setDepositAmountRupees('500');
                        setDepositError(null);
                      }}
                      className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#FB7185] text-xs font-bold rounded-lg border border-[#EF4444]/30 transition-all flex items-center gap-1"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Deposit Funds</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Realistic Student Guidance Notice */}
      <div className="p-4 rounded-xl bg-[#1D2235]/40 border border-[#252B45] text-xs text-[#A5ABC0] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#50B99A] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Non-speculative Guidance:</strong> PocketPilot calculations are based solely on budgeting and safe cash flow allocation. We never offer speculative investment tips, crypto projections, or guaranteed monetary returns.
        </p>
      </div>

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#FF5C5C]/15 border border-[#FF5C5C]/30 rounded-xl text-xs text-[#FF5C5C]">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Goal Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Noise Smartwatch, Goa Trip, Coding Course"
              className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Target Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={targetRupees}
                  onChange={(e) => setTargetRupees(e.target.value)}
                  placeholder="3500"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm font-semibold text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Already Saved (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={currentRupees}
                  onChange={(e) => setCurrentRupees(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Notes or Motivation (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needed for mid-term projects, Shared room trip"
              className="w-full px-4 py-2 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
            />
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
              Save Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit / Contribute Funds Modal */}
      <Modal
        isOpen={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        title={`Deposit into "${depositGoal?.name}"`}
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          {depositError && (
            <div className="p-3 bg-[#FF5C5C]/15 border border-[#FF5C5C]/30 rounded-xl text-xs text-[#FF5C5C]">
              {depositError}
            </div>
          )}

          <p className="text-xs text-[#A5ABC0]">
            Transferring funds into this goal will deduct the amount from your available bank balance ({formatCurrency(profile.currentBalancePaise || 0, profile.currency)}) and record a savings deposit.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Deposit Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={depositAmountRupees}
                onChange={(e) => setDepositAmountRupees(e.target.value)}
                placeholder="500"
                className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm font-semibold text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221C24]">
            <button
              type="button"
              onClick={() => setDepositGoal(null)}
              className="px-4 py-2 text-xs font-semibold text-[#A5ABC0] hover:text-[#F5F6FC] bg-[#221C24] hover:bg-[#322936] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#50B99A] hover:bg-[#439C82] rounded-xl shadow-lg shadow-[#50B99A]/25"
            >
              Confirm Deposit
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
            deleteSavingsGoal(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Savings Goal?"
        message="This will delete the goal target from your dashboard. Funds already saved remain in your bank balance records."
        confirmLabel="Delete Goal"
        isDestructive={true}
      />
    </div>
  );
};
