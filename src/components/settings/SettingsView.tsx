import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  User,
  GraduationCap,
  Wallet,
  IndianRupee,
  Lock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, paiseToRupees, rupeesToPaise } from '../../utils/finance';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { isFirebaseConfigured, signInWithGoogle, logoutUser } from '../../services/firebase';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    resetToDemoData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
    isDemoMode,
  } = useFinance();

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [collegeName, setCollegeName] = useState(profile.collegeName || '');
  const [currency, setCurrency] = useState(profile.currency || 'INR');
  const [allowanceRupees, setAllowanceRupees] = useState(
    String(paiseToRupees(profile.monthlyAllowancePaise || 10000))
  );
  const [balanceRupees, setBalanceRupees] = useState(
    String(paiseToRupees(profile.currentBalancePaise || 3500))
  );
  const [nextDate, setNextDate] = useState(profile.nextAllowanceDate || '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: displayName.trim() || 'Student',
      collegeName: collegeName.trim() || 'University',
      currency,
      monthlyAllowancePaise: rupeesToPaise(parseFloat(allowanceRupees) || 10000),
      currentBalancePaise: rupeesToPaise(parseFloat(balanceRupees) || 0),
      nextAllowanceDate: nextDate,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('Data successfully imported and synced!');
      } else {
        setImportStatus('Error importing file: Invalid PocketPilot JSON format.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight">
          Settings & Privacy
        </h1>
        <p className="text-xs text-[#A5ABC0] mt-0.5">
          Manage allowances, student profile, preferences, and verified data controls
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-[#50B99A]/15 border border-[#50B99A]/30 text-xs text-[#50B99A] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile and financial parameters saved successfully!</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#FB7185] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Student Profile Settings */}
      <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-5">
        <div className="flex items-center gap-3 border-b border-[#221C24] pb-3">
          <User className="w-5 h-5 text-[#EF4444]" />
          <h2 className="text-base font-bold text-[#F5F6FC]">Student Profile & Allowances</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                College / University
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. BITS Pilani, IIT Bombay"
                className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Monthly Allowance (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={allowanceRupees}
                onChange={(e) => setAllowanceRupees(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Current Bank / UPI Balance (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={balanceRupees}
                onChange={(e) => setBalanceRupees(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
                Next Expected Allowance Date
              </label>
              <input
                type="date"
                required
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5ABC0] mb-1.5">
              Preferred Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full md:w-64 px-4 py-2.5 bg-[#0C0A0D] border border-[#322936] rounded-xl text-xs text-[#F5F6FC] focus:outline-none focus:border-[#EF4444]"
            >
              <option value="INR">INR (₹) — Indian Rupee (Default)</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#EF4444]/25 transition-all"
            >
              Update Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Privacy and Security Manifesto */}
      <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-4">
        <div className="flex items-center gap-3 border-b border-[#221C24] pb-3">
          <ShieldCheck className="w-5 h-5 text-[#50B99A]" />
          <h2 className="text-base font-bold text-[#F5F6FC]">Zero Trust Privacy Manifesto</h2>
        </div>

        <div className="space-y-3 text-xs text-[#A5ABC0] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#0C0A0D] border border-[#221C24] flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#50B99A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F5F6FC] block mb-0.5">We Never Ask For Bank Credentials:</strong>
              PocketPilot AI will NEVER prompt you for your netbanking username, netbanking password, UPI PIN, ATM PIN, debit card CVV, or OTPs. All figures are entered or approved exclusively by you.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0C0A0D] border border-[#221C24] flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F5F6FC] block mb-0.5">Authoritative Math Guarantee:</strong>
              AI models can hallucinate numbers. PocketPilot AI guarantees all sums, percentages, spendable funds, and daily allowances are computed with deterministic application code before passing verified figures to Gemini for advice.
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Judge Reset Controls */}
      <div className="p-6 rounded-2xl bg-[#161217] border border-[#322936] shadow-lg space-y-4">
        <div className="flex items-center gap-3 border-b border-[#221C24] pb-3">
          <Settings className="w-5 h-5 text-[#F4B860]" />
          <h2 className="text-base font-bold text-[#F5F6FC]">Data Management & Portability</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-[#221C24] hover:bg-[#322936] text-xs font-semibold text-[#F5F6FC] rounded-xl border border-[#322936] flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#EF4444]" />
            <span>Export Financial Data (JSON)</span>
          </button>

          <label className="px-4 py-2.5 bg-[#221C24] hover:bg-[#322936] text-xs font-semibold text-[#F5F6FC] rounded-xl border border-[#322936] flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-[#50B99A]" />
            <span>Import Data (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={resetToDemoData}
            className="px-4 py-2.5 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#FB7185] text-xs font-semibold rounded-xl border border-[#EF4444]/30 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data (For Judges)</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2.5 bg-[#FF5C5C]/15 hover:bg-[#FF5C5C]/25 text-[#FF5C5C] text-xs font-semibold rounded-xl border border-[#FF5C5C]/30 flex items-center gap-2 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearAllData}
        title="Clear All Financial Records?"
        message="This will wipe all transactions, budgets, recurring bills, and profile data from local storage and start a fresh student onboarding flow."
        confirmLabel="Wipe Everything"
        isDestructive={true}
      />
    </div>
  );
};
