import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  Receipt,
  FileSpreadsheet,
  Download,
  Calendar,
  CreditCard,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType, PaymentMethod } from '../../types/finance';
import { formatCurrency, paiseToRupees } from '../../utils/finance';
import { TransactionFormModal } from './TransactionFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TransactionsView: React.FC = () => {
  const { profile, transactions, deleteTransaction } = useFinance();

  // Search, Filter and Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique categories for filter dropdown
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtering & Sorting
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search term in merchant or note
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          t.merchant.toLowerCase().includes(term) ||
          (t.note && t.note.toLowerCase().includes(term)) ||
          t.category.toLowerCase().includes(term);

        if (!matchesSearch) return false;

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

        // Method filter
        if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.amountPaise - a.amountPaise;
        }
        if (sortBy === 'amount_asc') {
          return a.amountPaise - b.amountPaise;
        }
        return 0;
      });
  }, [transactions, searchTerm, typeFilter, categoryFilter, methodFilter, sortBy]);

  // Aggregated totals of filtered results
  const filteredExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountPaise, 0);

  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountPaise, 0);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteTransaction(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & New Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
            Transactions & Spends
          </h1>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            Log, filter, and audit every single pocket rupee with integer precision
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Summary Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#161217] border border-[#322936] flex items-center justify-between">
          <span className="text-xs text-[#A5ABC0]">Showing Records</span>
          <span className="text-sm font-bold text-[#F5F6FC]">
            {filteredTransactions.length} of {transactions.length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161217] border border-[#322936] flex items-center justify-between">
          <span className="text-xs text-[#A5ABC0]">Total Filtered Spends</span>
          <span className="text-sm font-bold text-[#FF5C5C]">
            -{formatCurrency(filteredExpenses, profile.currency)}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161217] border border-[#322936] flex items-center justify-between">
          <span className="text-xs text-[#A5ABC0]">Total Filtered Income</span>
          <span className="text-sm font-bold text-[#50B99A]">
            +{formatCurrency(filteredIncome, profile.currency)}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#A5ABC0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by merchant, food stall, note, or category..."
              className="w-full pl-9 pr-4 py-2 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] placeholder-[#555C75] focus:outline-none focus:border-[#EF4444]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-[#0C0A0D] p-1 border border-[#322936] rounded-xl shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-[#221C24] text-[#F5F6FC] shadow-sm'
                  : 'text-[#A5ABC0] hover:text-[#F5F6FC]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'expense'
                  ? 'bg-[#FF5C5C]/20 text-[#FF5C5C] shadow-sm'
                  : 'text-[#A5ABC0] hover:text-[#FF5C5C]'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'income'
                  ? 'bg-[#50B99A]/20 text-[#50B99A] shadow-sm'
                  : 'text-[#A5ABC0] hover:text-[#50B99A]'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Secondary Filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#241D27]">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-[#EF4444]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0C0A0D] border border-[#322936] rounded-lg px-2.5 py-1 text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-1.5 text-xs">
            <CreditCard className="w-3.5 h-3.5 text-[#EF4444]" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#0C0A0D] border border-[#322936] rounded-lg px-2.5 py-1 text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI (GPay / Paytm / PhonePe)</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#EF4444]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0C0A0D] border border-[#322936] rounded-lg px-2.5 py-1 text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: Highest First</option>
              <option value="amount_asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="bg-[#161217] border border-[#322936] rounded-2xl shadow-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-[#A5ABC0] space-y-3">
            <Receipt className="w-12 h-12 mx-auto text-[#322936]" />
            <h3 className="text-sm font-semibold text-[#F5F6FC]">No transactions match filters</h3>
            <p className="text-xs max-w-sm mx-auto">
              Try adjusting your search query, selecting 'All Categories', or recording a new expense.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#221C24]">
            {filteredTransactions.map((t) => (
              <div
                key={t.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#221C24]/50 transition-colors group"
              >
                {/* Left: icon & details */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      t.type === 'income'
                        ? 'bg-[#50B99A]/15 text-[#50B99A] border border-[#50B99A]/25'
                        : 'bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/25'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#F5F6FC]">{t.merchant}</span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#221C24] text-[#EF4444]">
                        {t.paymentMethod}
                      </span>
                      {t.source === 'recurring' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F4B860]/20 text-[#F4B860] font-medium">
                          Auto-bill
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#A5ABC0] mt-0.5">
                      <span className="text-[#FB7185] font-medium">{t.category}</span>
                      <span>•</span>
                      <span>{t.date}</span>
                      {t.note && (
                        <>
                          <span>•</span>
                          <span className="italic text-[#878D9F] truncate max-w-[200px]">
                            "{t.note}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-14 sm:pl-0">
                  <span
                    className={`text-sm font-extrabold ${
                      t.type === 'income' ? 'text-[#50B99A]' : 'text-[#F5F6FC]'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amountPaise, profile.currency)}
                  </span>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(t)}
                      aria-label={`Edit ${t.merchant}`}
                      className="p-1.5 rounded-lg text-[#A5ABC0] hover:text-[#F5F6FC] hover:bg-[#221C24] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      aria-label={`Delete ${t.merchant}`}
                      className="p-1.5 rounded-lg text-[#A5ABC0] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/15 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        initialData={editingTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record? This will adjust your calculated bank balance and monthly category statistics."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
