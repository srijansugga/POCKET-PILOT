import React from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency, paiseToRupees } from '../../utils/finance';

interface SpendingTrendChartProps {
  transactions: Transaction[];
  currency?: string;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  transactions,
  currency = 'INR',
}) => {
  // Aggregate transactions by week of the month (Weeks 1 to 4/5)
  const weeks = [
    { label: 'Week 1 (1-7)', spentPaise: 0, count: 0 },
    { label: 'Week 2 (8-14)', spentPaise: 0, count: 0 },
    { label: 'Week 3 (15-21)', spentPaise: 0, count: 0 },
    { label: 'Week 4 (22-28)', spentPaise: 0, count: 0 },
    { label: 'Week 5 (29+)', spentPaise: 0, count: 0 },
  ];

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const day = parseInt(t.date.split('-')[2] || '1', 10);
      if (day <= 7) {
        weeks[0].spentPaise += t.amountPaise;
        weeks[0].count += 1;
      } else if (day <= 14) {
        weeks[1].spentPaise += t.amountPaise;
        weeks[1].count += 1;
      } else if (day <= 21) {
        weeks[2].spentPaise += t.amountPaise;
        weeks[2].count += 1;
      } else if (day <= 28) {
        weeks[3].spentPaise += t.amountPaise;
        weeks[3].count += 1;
      } else {
        weeks[4].spentPaise += t.amountPaise;
        weeks[4].count += 1;
      }
    });

  const maxSpentPaise = Math.max(...weeks.map((w) => w.spentPaise), 100000); // at least ₹1,000 for scale

  return (
    <div className="w-full">
      <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-1">
        {weeks.map((w) => {
          const heightPercent = Math.max(8, Math.round((w.spentPaise / maxSpentPaise) * 100));
          return (
            <div key={w.label} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#221C24] text-[#F5F6FC] text-[10px] font-semibold py-1 px-2 rounded border border-[#3E3044] whitespace-nowrap z-10 shadow-lg">
                {formatCurrency(w.spentPaise, currency)} ({w.count} txns)
              </div>

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-[#221C24] rounded-t-md relative overflow-hidden flex items-end justify-center transition-all duration-300 group-hover:bg-[#2A212E] h-full">
                <div
                  className="w-full bg-gradient-to-t from-[#EF4444] to-[#F87171] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Week label */}
              <span className="text-[10px] text-[#A5ABC0] mt-2 text-center group-hover:text-[#F5F6FC] transition-colors">
                {w.label.split(' ')[0]} {w.label.split(' ')[1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
