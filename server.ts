import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import {
  calculateDailySpendingPlan,
  calculateBudgetUtilization,
  calculateCategoryBreakdown,
  formatCurrency,
  paiseToRupees,
  rupeesToPaise,
} from './src/utils/finance.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'undefined' && apiKey.length > 10) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Tool declarations for Gemini
const proposeBudgetChangeDeclaration: FunctionDeclaration = {
  name: 'proposeBudgetChange',
  description: 'Propose a modification or new budget limit for a specific category or total monthly budget. Requires user confirmation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: "The expense category (e.g., 'Food & Mess', 'Chai & Snacks', 'TOTAL')",
      },
      newLimitRupees: {
        type: Type.NUMBER,
        description: 'Proposed new monthly budget limit in Indian Rupees (e.g., 4000)',
      },
      reason: {
        type: Type.STRING,
        description: 'Plain explanation of why this budget adjustment is recommended',
      },
    },
    required: ['category', 'newLimitRupees', 'reason'],
  },
};

const createSavingsGoalDeclaration: FunctionDeclaration = {
  name: 'createSavingsGoal',
  description: 'Propose creating a new savings goal for the student. Requires user confirmation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the goal (e.g. Noise Smartwatch, Laptop Upgrade, End-Sem Trip)',
      },
      targetRupees: {
        type: Type.NUMBER,
        description: 'Target amount in Indian Rupees',
      },
      targetDate: {
        type: Type.STRING,
        description: 'Target completion date in YYYY-MM-DD format',
      },
      monthlyContributionRupees: {
        type: Type.NUMBER,
        description: 'Recommended monthly contribution in Rupees',
      },
      priority: {
        type: Type.STRING,
        description: 'Priority level: high, medium, or low',
      },
      reason: {
        type: Type.STRING,
        description: 'Brief reason or motivation for this goal',
      },
    },
    required: ['name', 'targetRupees', 'targetDate', 'reason'],
  },
};

const calculateDailyAllowanceDeclaration: FunctionDeclaration = {
  name: 'calculateDailyAllowance',
  description: 'Recalculate safe daily spendable allowance with hypothetical adjustment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      adjustmentRupees: {
        type: Type.NUMBER,
        description: 'Additional spend or saving in Rupees',
      },
    },
    required: ['adjustmentRupees'],
  },
};

// API: AI Money Coach endpoint
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { message, conversationHistory = [], context } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Step 2 & 3: Authoritative financial calculations in application code
    const profile = context?.profile || {};
    const transactions = context?.transactions || [];
    const budgets = context?.budgets || [];
    const goals = context?.goals || [];
    const recurring = context?.recurring || [];

    const availableFundsPaise = profile.currentBalancePaise || 0;
    const monthlyAllowancePaise = profile.monthlyAllowancePaise || 0;
    const nextAllowanceDate = profile.nextAllowanceDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // Calculate upcoming active recurring expenses before next allowance
    const upcomingExpensesPaise = recurring
      .filter((r: any) => r.active && r.nextDueDate <= nextAllowanceDate)
      .reduce((acc: number, r: any) => acc + (r.amountPaise || 0), 0);

    // Calculate planned monthly savings commitment
    const plannedSavingsPaise = goals.reduce(
      (acc: number, g: any) => acc + (g.monthlyContributionPaise || 0),
      0
    );

    // Compute authoritative daily plan
    const dailyPlan = calculateDailySpendingPlan(
      availableFundsPaise,
      upcomingExpensesPaise,
      plannedSavingsPaise,
      nextAllowanceDate
    );

    // Compute category breakdown
    const categoryBreakdown = calculateCategoryBreakdown(transactions, 'expense');
    const totalExpensesPaise = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc: number, t: any) => acc + t.amountPaise, 0);
    const totalIncomePaise = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((acc: number, t: any) => acc + t.amountPaise, 0);

    const verifiedFinancialSummary = {
      user: profile.displayName || 'Student',
      college: profile.collegeName || 'College',
      monthlyAllowance: formatCurrency(monthlyAllowancePaise),
      actualAvailableBankFunds: formatCurrency(availableFundsPaise),
      upcomingCommittedBills: formatCurrency(upcomingExpensesPaise),
      plannedSavingsContribution: formatCurrency(plannedSavingsPaise),
      netSpendableFunds: formatCurrency(dailyPlan.spendableFundsPaise),
      daysUntilNextAllowance: dailyPlan.remainingDays,
      dailySafeSpendingAllowance: formatCurrency(dailyPlan.dailyAllowancePaise),
      isShortfall: dailyPlan.isShortfall,
      shortfallAmount: formatCurrency(dailyPlan.shortfallPaise),
      totalExpenseRecorded: formatCurrency(totalExpensesPaise),
      totalIncomeRecorded: formatCurrency(totalIncomePaise),
      topSpendingCategories: categoryBreakdown.slice(0, 5).map((c) => ({
        category: c.category,
        spent: formatCurrency(c.totalPaise),
        percentage: `${c.percentage}%`,
        transactionsCount: c.count,
      })),
      activeBudgets: budgets.map((b: any) => {
        const spent = transactions
          .filter((t: any) => t.type === 'expense' && (b.category === 'TOTAL' || t.category === b.category))
          .reduce((acc: number, t: any) => acc + t.amountPaise, 0);
        const { percentage, status } = calculateBudgetUtilization(spent, b.limitPaise);
        return {
          category: b.category,
          limit: formatCurrency(b.limitPaise),
          spent: formatCurrency(spent),
          utilization: `${percentage}%`,
          status,
        };
      }),
      savingsGoals: goals.map((g: any) => ({
        name: g.name,
        target: formatCurrency(g.targetPaise),
        saved: formatCurrency(g.currentPaise),
        targetDate: g.targetDate,
        priority: g.priority,
      })),
    };

    const systemPrompt = `You are PocketPilot AI, an empathetic, sharp, and highly practical financial copilot built specifically for Indian college students.
Key Principles:
1. Strict Financial Accuracy: Use ONLY the verified financial calculations provided below. Never make up transactions or numbers.
2. Differentiate clearly between "Actual Available Bank Funds" (₹${paiseToRupees(availableFundsPaise)}) and "Budget Limit". A budget is not a bank balance!
3. Indian Student Context: Understand college life in India — hostel mess, tapri chai & Maggi, mobile data packs (Jio/Airtel), photocopies & exam materials, auto-rickshaw/metro rides, Swiggy/Zomato late-night splits, and pocket money from parents.
4. If the user asks whether they can afford an expense, calculate if it fits into their Daily Safe Allowance (${formatCurrency(dailyPlan.dailyAllowancePaise)}/day) or if it triggers a shortfall.
5. If the user wants to adjust budgets or save for a new gadget/trip, call the appropriate tool ('proposeBudgetChange' or 'createSavingsGoal') so the user can review and explicitly confirm. Never change data silently.
6. Tone: Friendly, encouraging, student-savvy, clear, and non-judgmental.

VERIFIED AUTHORITATIVE USER FINANCIAL STATE:
${JSON.stringify(verifiedFinancialSummary, null, 2)}
`;

    // If Gemini client is not initialized or API call fails, use deterministic intelligent fallback
    if (!aiClient) {
      const fallbackReply = generateRuleBasedResponse(message, verifiedFinancialSummary, dailyPlan);
      res.json(fallbackReply);
      return;
    }

    // Call Gemini 3.8 Flash
    const formattedHistory = (conversationHistory || []).slice(-6).map((item: any) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.text }],
    }));

    let response: any = null;
    try {
      const generatePromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...formattedHistory,
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          tools: [
            {
              functionDeclarations: [
                proposeBudgetChangeDeclaration,
                createSavingsGoalDeclaration,
                calculateDailyAllowanceDeclaration,
              ],
            },
          ],
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 6000)
      );

      response = await Promise.race([generatePromise, timeoutPromise]);
    } catch (apiErr) {
      console.warn('Gemini API call failed or timed out, using verified intelligent fallback:', apiErr);
      const fallbackReply = generateRuleBasedResponse(message, verifiedFinancialSummary, dailyPlan);
      res.json(fallbackReply);
      return;
    }

    let reply = response.text || '';
    let proposedAction: any = null;

    // Check if Gemini invoked a tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'proposeBudgetChange') {
        const args: any = call.args;
        proposedAction = {
          type: 'PROPOSE_BUDGET_CHANGE',
          data: {
            category: args.category,
            newLimitPaise: rupeesToPaise(Number(args.newLimitRupees)),
            newLimitRupees: Number(args.newLimitRupees),
            reason: args.reason,
          },
          explanation: `Would you like me to set your ${args.category} monthly budget to ${formatCurrency(rupeesToPaise(Number(args.newLimitRupees)))}?`,
        };
        if (!reply) {
          reply = `I recommend adjusting your **${args.category}** budget to **${formatCurrency(rupeesToPaise(Number(args.newLimitRupees)))}**. ${args.reason}. Please confirm below to apply this update.`;
        }
      } else if (call.name === 'createSavingsGoal') {
        const args: any = call.args;
        proposedAction = {
          type: 'CREATE_SAVINGS_GOAL',
          data: {
            name: args.name,
            targetPaise: rupeesToPaise(Number(args.targetRupees)),
            targetRupees: Number(args.targetRupees),
            targetDate: args.targetDate,
            priority: args.priority || 'medium',
            monthlyContributionPaise: args.monthlyContributionRupees ? rupeesToPaise(Number(args.monthlyContributionRupees)) : undefined,
            reason: args.reason,
          },
          explanation: `Would you like to create a new goal: "${args.name}" targeting ${formatCurrency(rupeesToPaise(Number(args.targetRupees)))}?`,
        };
        if (!reply) {
          reply = `Let's set up a goal for **${args.name}**! Aiming for **${formatCurrency(rupeesToPaise(Number(args.targetRupees)))}** by ${args.targetDate}. Review the details below and confirm to add it to your goals.`;
        }
      }
    }

    if (!reply && !proposedAction) {
      reply = `Based on your current balance of ${verifiedFinancialSummary.actualAvailableBankFunds}, your safe daily spendable allowance is ${verifiedFinancialSummary.dailySafeSpendingAllowance} for the next ${dailyPlan.remainingDays} days.`;
    }

    res.json({
      reply,
      proposedAction,
      authoritativeSummary: verifiedFinancialSummary,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/coach:', err);
    // Graceful fallback with authoritative deterministic calculations
    res.status(200).json({
      reply: 'I analyzed your finances using PocketPilot calculations: You have a safe daily allowance calculated from your available funds. Keep an eye on upcoming essential bills before your next pocket money deposit.',
      error: err.message,
    });
  }
});

// Endpoint: Validate and execute confirmed action
app.post('/api/ai/execute-action', (req, res) => {
  const { actionType, data } = req.body;

  if (!actionType || !data) {
    res.status(400).json({ success: false, error: 'Invalid action payload' });
    return;
  }

  // Validate server-side invariants
  if (actionType === 'PROPOSE_BUDGET_CHANGE') {
    if (!data.category || typeof data.newLimitPaise !== 'number' || data.newLimitPaise <= 0) {
      res.status(400).json({ success: false, error: 'Budget limit must be a positive number' });
      return;
    }
    res.json({
      success: true,
      actionType,
      message: `Successfully verified and applied ${data.category} budget of ${formatCurrency(data.newLimitPaise)}.`,
      updatedData: data,
    });
    return;
  }

  if (actionType === 'CREATE_SAVINGS_GOAL') {
    if (!data.name || typeof data.targetPaise !== 'number' || data.targetPaise <= 0 || !data.targetDate) {
      res.status(400).json({ success: false, error: 'Invalid savings goal parameters' });
      return;
    }
    res.json({
      success: true,
      actionType,
      message: `Savings goal "${data.name}" validated and created successfully.`,
      updatedData: data,
    });
    return;
  }

  res.status(400).json({ success: false, error: 'Unsupported action type' });
});

// Fallback deterministic AI responses for offline or unconfigured keys
function generateRuleBasedResponse(message: string, summary: any, plan: any) {
  const lower = message.toLowerCase();

  if (lower.includes('where') && (lower.includes('money') || lower.includes('spent') || lower.includes('go'))) {
    const topCat = summary.topSpendingCategories[0];
    return {
      reply: `Most of your money this month went toward **${topCat?.category || 'Food & Mess'}**, totaling **${topCat?.spent || '₹0'}** (${topCat?.percentage || '0%'} of all expenses across ${topCat?.transactionsCount || 0} transactions). Your top 3 categories are:\n\n` +
        summary.topSpendingCategories.slice(0, 3).map((c: any, i: number) => `${i + 1}. **${c.category}**: ${c.spent} (${c.percentage})`).join('\n') +
        `\n\nTo balance this, keep your daily spending under **${summary.dailySafeSpendingAllowance}**.`,
    };
  }

  if (lower.includes('daily') || lower.includes('spend per day') || lower.includes('how much can i spend')) {
    if (plan.isShortfall) {
      return {
        reply: `⚠️ **Deficit Notice**: You currently have a projected funding shortfall of **${summary.shortfallAmount}** before your next allowance in ${plan.remainingDays} days. Because your committed expenses exceed your current balance, your recommended daily discretionary allowance is **₹0**. Focus only on pre-paid mess meals until next allowance!`,
      };
    }
    return {
      reply: `Your calculated **Daily Safe Spending Allowance is ${summary.dailySafeSpendingAllowance}** for the next **${plan.remainingDays} days** (until ${summary.user}'s next allowance).\n\n**Calculation Details:**\n• Bank / UPI Balance: ${summary.actualAvailableBankFunds}\n• Less Upcoming Bills: -${summary.upcomingCommittedBills}\n• Less Planned Savings: -${summary.plannedSavingsContribution}\n• **Net Spendable Funds**: ${summary.netSpendableFunds}\n• ${summary.netSpendableFunds} ÷ ${plan.remainingDays} days = **${summary.dailySafeSpendingAllowance}/day**.`,
    };
  }

  if (lower.includes('save') && (lower.includes('1000') || lower.includes('1,000') || lower.includes('goal'))) {
    return {
      reply: `Yes, you can save ₹1,000! With **${plan.remainingDays} days** left until your allowance and **${summary.netSpendableFunds}** in net spendable funds, setting aside ₹1,000 leaves you with ${formatCurrency(plan.spendableFundsPaise - 100000)} spendable, giving you a daily allowance of **${formatCurrency(Math.floor((plan.spendableFundsPaise - 100000) / plan.remainingDays))}/day**. Would you like me to create this savings goal for you?`,
      proposedAction: {
        type: 'CREATE_SAVINGS_GOAL',
        data: {
          name: 'Quick ₹1,000 Stash',
          targetPaise: 100000,
          targetRupees: 1000,
          targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          priority: 'high',
          reason: 'Quick student savings buffer before next allowance',
        },
        explanation: 'Create a savings goal of ₹1,000 targeting completion before next allowance.',
      },
    };
  }

  if (lower.includes('budget') && (lower.includes('suggest') || lower.includes('weekly') || lower.includes('reduce'))) {
    return {
      reply: `Looking at your spending habits, reducing discretionary cafe/canteen visits by ₹200/week saves **₹800/month**! That alone covers your Jio recharge and a movie ticket. I can propose adjusting your Chai & Snacks budget to ₹600/month.`,
      proposedAction: {
        type: 'PROPOSE_BUDGET_CHANGE',
        data: {
          category: 'Chai & Snacks',
          newLimitPaise: rupeesToPaise(600),
          newLimitRupees: 600,
          reason: 'Optimize snack runs to free up ₹200/week for your smartwatch savings goal',
        },
        explanation: 'Reduce Chai & Snacks monthly budget from ₹800 to ₹600.',
      },
    };
  }

  return {
    reply: `Hello ${summary.user}! Based on your current balance of **${summary.actualAvailableBankFunds}**, your net spendable funds are **${summary.netSpendableFunds}** across the next **${plan.remainingDays} days**, giving you a daily allowance of **${summary.dailySafeSpendingAllowance}**.\n\nYou have recorded **${summary.totalExpenseRecorded}** in total expenses and saved **${summary.totalIncomeRecorded}** in total income so far. Feel free to ask me to analyze specific categories, simulate cutbacks, or set savings goals!`,
  };
}

// In development, mount Vite middlewares; in production, serve built dist files
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PocketPilot AI Server listening on http://0.0.0.0:${PORT}`);
});
