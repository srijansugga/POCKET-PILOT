import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, rupeesToPaise } from '../../utils/finance';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  proposedAction?: {
    type: 'PROPOSE_BUDGET_CHANGE' | 'CREATE_SAVINGS_GOAL';
    data: any;
    explanation: string;
    confirmed?: boolean;
    declined?: boolean;
  };
  authoritativeSummary?: any;
  timestamp: number;
}

const SAMPLE_PROMPT_PILLS = [
  'Where did most of my money go this month?',
  'How much can I spend per day?',
  'Can I save ₹1,000 before my next allowance?',
  'What happens if I reduce café spending by ₹200 a week?',
  'Suggest a realistic weekly budget',
  'Compare my spending with last month',
];

export const MoneyCoachView: React.FC = () => {
  const {
    profile,
    transactions,
    budgets,
    goals,
    recurring,
    dailyPlan,
    setBudget,
    addSavingsGoal,
    selectedMonth,
  } = useFinance();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${profile.displayName || 'there'}! I'm your PocketPilot AI Money Coach. I use your verified student financial records to help you stretch your pocket money, plan daily expenses, and achieve savings goals without running out of cash before the month ends.\n\nHow can I help you today?`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Build minimum relevant authoritative context
      const contextPayload = {
        profile,
        transactions: transactions.slice(0, 30), // minimum relevant recent records
        budgets,
        goals,
        recurring,
      };

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          context: contextPayload,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.reply || "I've analyzed your financial situation.",
        proposedAction: data.proposedAction || undefined,
        authoritativeSummary: data.authoritativeSummary || undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI Coach request error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `Based on your verified numbers: You have ${formatCurrency(
            dailyPlan.spendableFundsPaise,
            profile.currency
          )} in net spendable funds across the next ${
            dailyPlan.remainingDays
          } days, giving you a safe daily allowance of ${formatCurrency(
            dailyPlan.dailyAllowancePaise,
            profile.currency
          )}/day.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, action: NonNullable<ChatMessage['proposedAction']>) => {
    try {
      // Step 8: Validate confirmed action on the server
      const res = await fetch('/api/ai/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: action.type,
          data: action.data,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        alert(result.error || 'Failed to validate action');
        return;
      }

      // Step 9: Report success only after operation succeeds
      if (action.type === 'PROPOSE_BUDGET_CHANGE') {
        setBudget({
          userId: profile.id,
          category: action.data.category,
          limitPaise: action.data.newLimitPaise,
          month: selectedMonth,
          alertThresholds: [70, 90, 100],
        });
      } else if (action.type === 'CREATE_SAVINGS_GOAL') {
        addSavingsGoal({
          userId: profile.id,
          name: action.data.name,
          targetPaise: action.data.targetPaise,
          currentPaise: 0,
          targetDate: action.data.targetDate,
          priority: action.data.priority || 'medium',
          monthlyContributionPaise: action.data.monthlyContributionPaise,
          notes: action.data.reason || 'Created via AI Money Coach',
        });
      }

      // Mark message action as confirmed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.proposedAction
            ? {
                ...m,
                proposedAction: { ...m.proposedAction, confirmed: true },
              }
            : m
        )
      );
    } catch (err) {
      console.error('Error executing confirmed action:', err);
    }
  };

  const handleDeclineAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposedAction
          ? {
              ...m,
              proposedAction: { ...m.proposedAction, declined: true },
            }
          : m
      )
    );
  };

  return (
    <div className="space-y-4 pb-12 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header & Financial Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-[#F5F6FC] tracking-tight flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#EF4444]" />
              Gemini AI Money Coach
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#FB7185] border border-[#EF4444]/30">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-[#A5ABC0] mt-0.5">
            Verified student finance guidance with deterministic application math & structured action proposals
          </p>
        </div>

        {/* Live Context Quick Pill */}
        <div className="flex items-center gap-2 text-xs bg-[#161217] border border-[#322936] rounded-xl px-3 py-1.5 shrink-0">
          <Wallet className="w-3.5 h-3.5 text-[#50B99A]" />
          <span className="text-[#A5ABC0]">
            Balance: <strong className="text-[#F5F6FC]">{formatCurrency(profile.currentBalancePaise || 0, profile.currency)}</strong>
          </span>
          <span className="text-[#322936]">|</span>
          <Clock className="w-3.5 h-3.5 text-[#EF4444]" />
          <span className="text-[#A5ABC0]">
            Safe Daily: <strong className="text-[#EF4444]">{formatCurrency(dailyPlan.dailyAllowancePaise, profile.currency)}/day</strong>
          </span>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        {SAMPLE_PROMPT_PILLS.map((pill) => (
          <button
            key={pill}
            onClick={() => handleSendMessage(pill)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-[#161217] border border-[#322936] hover:border-[#EF4444]/50 text-xs text-[#A5ABC0] hover:text-[#F5F6FC] whitespace-nowrap transition-all shrink-0 hover:bg-[#221C24]"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-[#161217] border border-[#322936] rounded-2xl shadow-xl overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-[#2A212E] text-[#EF4444]'
                    : 'bg-gradient-to-br from-[#EF4444] to-[#B91C1C] text-white shadow-md shadow-[#EF4444]/25'
                }`}
              >
                {isUser ? profile.displayName?.charAt(0) || 'U' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`space-y-3 max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#EF4444] text-white rounded-tr-none shadow-md shadow-[#EF4444]/20'
                      : 'bg-[#221C24] text-[#F5F6FC] border border-[#322936] rounded-tl-none shadow-md'
                  }`}
                >
                  {m.text}
                </div>

                {/* Proposed Action Card (Requires explicit user confirmation) */}
                {m.proposedAction && (
                  <div className="p-4 rounded-xl bg-[#0C0A0D] border border-[#EF4444]/40 shadow-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#EF4444]" />
                      <span className="text-xs font-bold text-[#F5F6FC]">
                        AI Proposed Action (Confirmation Required)
                      </span>
                    </div>

                    <p className="text-xs text-[#A5ABC0]">{m.proposedAction.explanation}</p>

                    {m.proposedAction.confirmed ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#50B99A] bg-[#50B99A]/10 border border-[#50B99A]/20 p-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Action confirmed and successfully applied to your saved records!</span>
                      </div>
                    ) : m.proposedAction.declined ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-[#A5ABC0] bg-[#161217] p-2 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        <span>Action declined. No changes were made.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(m.id, m.proposedAction!)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#EF4444]/25 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm & Apply</span>
                        </button>
                        <button
                          onClick={() => handleDeclineAction(m.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#161217] hover:bg-[#221C24] text-[#A5ABC0] hover:text-[#F5F6FC] text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#B91C1C] flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-[#221C24] border border-[#322936] text-xs text-[#A5ABC0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
              <span>Analyzing verified finances with Gemini 3.8 Flash...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-2 bg-[#161217] border border-[#322936] rounded-2xl shadow-lg shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask anything: 'Can I afford ₹800 dinner tonight?', 'Where did my allowance go?'..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-4 py-2 text-xs md:text-sm text-[#F5F6FC] placeholder-[#555C75] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 text-white transition-all shadow-md shadow-[#EF4444]/25 flex items-center justify-center"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
