import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Transaction, TransactionType, PaymentMethod, TransactionSource } from '../../types/finance';
import { paiseToRupees, rupeesToPaise } from '../../utils/finance';
import { useFinance } from '../../context/FinanceContext';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

const EXPENSE_CATEGORIES = [
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

const INCOME_CATEGORIES = [
  'Allowance / Pocket Money',
  'Scholarship / Stipend',
  'Part-time / Freelance',
  'Gifts & Rewards',
  'Other Income',
];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { profile, addTransaction, editTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [source, setSource] = useState<TransactionSource>('manual');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountRupees(String(paiseToRupees(initialData.amountPaise)));
      setCategory(initialData.category);
      setMerchant(initialData.merchant);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setSource(initialData.source);
      setNote(initialData.note || '');
    } else {
      setType('expense');
      setAmountRupees('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('upi');
      setSource('manual');
      setNote('');
    }
    setError(null);
  }, [initialData, isOpen]);

  // When type toggles, adjust default category if needed
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    } else {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amountRupees);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!merchant.trim()) {
      setError('Merchant or description is required.');
      return;
    }

    if (!date) {
      setError('Please select a valid transaction date.');
      return;
    }

    const paise = rupeesToPaise(parsedAmount);

    if (initialData) {
      editTransaction(initialData.id, {
        amountPaise: paise,
        type,
        category,
        merchant: merchant.trim(),
        date,
        paymentMethod,
        source,
        note: note.trim() || undefined,
      });
    } else {
      addTransaction({
        userId: profile.id,
        amountPaise: paise,
        currency: profile.currency || 'INR',
        type,
        category,
        merchant: merchant.trim(),
        date,
        paymentMethod,
        source,
        note: note.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Record Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FF5C5C]/15 border border-[#FF5C5C]/30 rounded-xl text-xs text-[#FF5C5C]">
            {error}
          </div>
        )}

        {/* Type Selector Tabs (Income vs Expense) */}
        <div>
          <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0C0A0D] border border-[#221C24] rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-[#221C24] text-[#FF5C5C] shadow-sm border border-[#322936]'
                  : 'text-[#A5ABC0] hover:text-[#F5F6FC]'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-[#221C24] text-[#50B99A] shadow-sm border border-[#322936]'
                  : 'text-[#A5ABC0] hover:text-[#F5F6FC]'
              }`}
            >
              Income (+)
            </button>
          </div>
        </div>

        {/* Amount in Rupees */}
        <div>
          <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
            Amount (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-[#A5ABC0]">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              placeholder="e.g. 150.00"
              className="w-full pl-8 pr-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm font-semibold text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            />
          </div>
          <span className="text-[10px] text-[#A5ABC0] mt-1 block">
            Stored in exact integer paise for accounting precision.
          </span>
        </div>

        {/* Merchant / Description */}
        <div>
          <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
            Merchant / Description *
          </label>
          <input
            type="text"
            required
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Tapri Chai, Hostel Mess, Jio Recharge, Swiggy"
            className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
          />
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            />
          </div>
        </div>

        {/* Payment Method & Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash in Wallet</option>
              <option value="card">Debit / Credit Card</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Hostel / Campus Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Entry Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as TransactionSource)}
              className="w-full px-3 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              <option value="manual">Manual Entry</option>
              <option value="receipt">Bill / Receipt</option>
              <option value="recurring">Recurring Bill</option>
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
            Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Split with Rohan, Exam material for mid-terms"
            className="w-full px-4 py-2 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#221C24]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A5ABC0] hover:text-[#F5F6FC] bg-[#221C24] hover:bg-[#322936] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:opacity-95 rounded-xl shadow-lg shadow-[#EF4444]/25 transition-all"
          >
            {initialData ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
