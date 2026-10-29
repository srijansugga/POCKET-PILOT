import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  ShieldCheck,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  Receipt,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { RecurringExpense, RecurringFrequency, PaymentMethod } from '../../types/finance';
import { formatCurrency, paiseToRupees, rupeesToPaise } from '../../utils/finance';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

const RECURRING_CATEGORIES = [
  'Food & Mess',
  'Hostel & Rent',
  'Recharge & Tech',
  'Entertainment & Outings',
  'Travel & Commute',
  'Books & Academics',
  'Other',
];

export const RecurringView: React.FC = () => {
  const {
    profile,
    recurring,
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringActive,
    recordRecurringAsPaid,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paidNotification, setPaidNotification] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState(RECURRING_CATEGORIES[0]);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalMonthlyCommittedPaise = recurring
    .filter((r) => r.active)
    .reduce((acc, r) => acc + r.amountPaise, 0);

  const handleOpenModal = (expenseToEdit?: RecurringExpense) => {
    if (expenseToEdit) {
      setEditingExpense(expenseToEdit);
      setTitle(expenseToEdit.title);
      setAmountRupees(String(paiseToRupees(expenseToEdit.amountPaise)));
      setCategory(expenseToEdit.category);
      setFrequency(expenseToEdit.frequency);
      setNextDueDate(expenseToEdit.nextDueDate);
      setPaymentMethod(expenseToEdit.paymentMethod || 'upi');
      setNotes(expenseToEdit.notes || '');
    } else {
      setEditingExpense(null);
      setTitle('');
      setAmountRupees('399');
      setCategory(RECURRING_CATEGORIES[0]);
      setFrequency('monthly');
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setNextDueDate(d.toISOString().split('T')[0]);
      setPaymentMethod('upi');
      setNotes('');
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amountRupees);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a positive amount.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (editingExpense) {
      editRecurringExpense(editingExpense.id, {
        title: title.trim(),
        amountPaise: rupeesToPaise(parsed),
        category,
        frequency,
        nextDueDate,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    } else {
      addRecurringExpense({
        userId: profile.id,
        title: title.trim(),
        amountPaise: rupeesToPaise(parsed),
        category,
        frequency,
        nextDueDate,
        active: true,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleMarkPaid = (r: RecurringExpense) => {
    recordRecurringAsPaid(r.id);
    setPaidNotification(`Recorded payment of ${formatCurrency(r.amountPaise, profile.currency)} for "${r.title}".`);
    setTimeout(() => setPaidNotification(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
            Recurring Bills & Subscriptions
          </h1>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            Track committed payments: mess fees, data packs, hostel bills, and OTT student discounts
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/25 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Bill</span>
        </button>
      </div>

      {paidNotification && (
        <div className="p-3.5 rounded-xl bg-[#50B99A]/15 border border-[#50B99A]/30 text-xs text-[#50B99A] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{paidNotification}</span>
        </div>
      )}

      {/* Committed Monthly Total Strip */}
      <div className="p-5 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#A5ABC0] font-medium">Total Monthly Committed Burden</span>
          <div className="text-2xl font-black text-[#F4B860] mt-1">
            {formatCurrency(totalMonthlyCommittedPaise, profile.currency)} / month
          </div>
          <p className="text-[11px] text-[#A5ABC0] mt-0.5">
            Automatically deducted when computing your daily spendable allowance
          </p>
        </div>

        <div className="text-xs text-[#A5ABC0] bg-[#0C0A0D] border border-[#221C24] p-3 rounded-xl max-w-sm">
          <span className="font-semibold text-[#F5F6FC] block mb-0.5">No Silent Duplicate Charges:</span>
          Upcoming recurring expenses are shown as projected commitments. We never automatically create duplicate transactions without your confirmation.
        </div>
      </div>

      {/* Recurring Items List */}
      <div className="space-y-3">
        {recurring.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#161217] border border-[#322936] text-[#A5ABC0] space-y-3">
            <Repeat className="w-12 h-12 mx-auto text-[#322936]" />
            <h3 className="text-base font-bold text-[#F5F6FC]">No Recurring Expenses Tracked</h3>
            <p className="text-xs max-w-sm mx-auto">
              Add your monthly hostel mess, mobile recharges, or laundry so your daily allowance accurately reflects committed bills.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl"
            >
              + Add First Recurring Bill
            </button>
          </div>
        ) : (
          recurring.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                r.active
                  ? 'bg-[#161217] border-[#322936] shadow-md'
                  : 'bg-[#161217]/50 border-[#221C24] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => toggleRecurringActive(r.id)}
                  title={r.active ? 'Pause subscription' : 'Activate subscription'}
                  className="text-[#EF4444] hover:opacity-80 transition-opacity"
                  aria-label={r.active ? `Pause ${r.title}` : `Activate ${r.title}`}
                >
                  {r.active ? (
                    <ToggleRight className="w-7 h-7 text-[#50B99A]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-[#A5ABC0]" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F5F6FC]">{r.title}</span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#221C24] text-[#EF4444]">
                      {r.frequency}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#221C24] text-[#A5ABC0]">
                      {r.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#A5ABC0] mt-0.5">
                    <span>Due: {r.nextDueDate}</span>
                    {r.paymentMethod && (
                      <>
                        <span>•</span>
                        <span className="uppercase">{r.paymentMethod}</span>
                      </>
                    )}
                    {r.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate max-w-[150px]">"{r.notes}"</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0">
                <span className="text-sm font-extrabold text-[#F5F6FC]">
                  {formatCurrency(r.amountPaise, profile.currency)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkPaid(r)}
                    className="px-3 py-1.5 bg-[#50B99A]/20 hover:bg-[#50B99A]/30 text-[#50B99A] text-xs font-bold rounded-lg border border-[#50B99A]/30 transition-all flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Record as Paid</span>
                  </button>

                  <button
                    onClick={() => handleOpenModal(r)}
                    aria-label={`Edit ${r.title}`}
                    className="p-1.5 rounded-lg text-[#A5ABC0] hover:text-[#F5F6FC] hover:bg-[#221C24]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingId(r.id)}
                    aria-label={`Delete ${r.title}`}
                    className="p-1.5 rounded-lg text-[#A5ABC0] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/15"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Recurring Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#FF5C5C]/15 border border-[#FF5C5C]/30 rounded-xl text-xs text-[#FF5C5C]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Title / Bill *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Jio 5G Recharge, Hostel Mess, Spotify Student"
              className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-[#A5ABC0]">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="399"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm font-semibold text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              >
                {RECURRING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="quarterly">Quarterly (3 Months)</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Next Due Date *</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Jio 84-day recharge, Mess paid at warden counter"
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
              Save Recurring Bill
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
            deleteRecurringExpense(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Recurring Expense?"
        message="This will remove the committed recurring bill from your projections."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
