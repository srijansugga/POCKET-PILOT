import React, { useState } from 'react';
import { formatCurrency } from '../../utils/finance';

interface CategoryItem {
  category: string;
  totalPaise: number;
  percentage: number;
  count: number;
}

interface CategoryDonutChartProps {
  categories: CategoryItem[];
  totalPaise: number;
  currency?: string;
}

const CATEGORY_COLORS = [
  '#EF4444', // Red (Accent)
  '#F43F5E', // Rose
  '#50B99A', // Mint Green
  '#F4B860', // Amber
  '#FB7185', // Soft Rose Pink
  '#E11D48', // Crimson
  '#FF6B8B', // Coral Pink
  '#FF9F43', // Warm Amber
  '#6BCB77', // Lime
  '#7A82A6', // Gray
];

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  totalPaise,
  currency = 'INR',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!categories || categories.length === 0 || totalPaise === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-[#A5ABC0]">
        <div className="w-24 h-24 rounded-full border border-dashed border-[#322936] flex items-center justify-center mb-3">
          <span className="text-xs">No data</span>
        </div>
        <p className="text-xs">No expense transactions recorded in this period.</p>
      </div>
    );
  }

  // Pre-calculate SVG donut segments
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = categories.map((cat, idx) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += (cat.percentage / 100) * circumference;
    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
      color,
      index: idx,
    };
  });

  const activeCategory = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Donut SVG */}
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#221C24"
            strokeWidth={strokeWidth}
          />
          {/* Slices */}
          {segments.map((seg) => (
            <circle
              key={seg.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIndex === seg.index ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              opacity={hoveredIndex === null || hoveredIndex === seg.index ? 1 : 0.4}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {activeCategory ? (
            <>
              <span className="text-[11px] text-[#A5ABC0] truncate max-w-[120px]">
                {activeCategory.category}
              </span>
              <span className="text-sm font-bold text-[#F5F6FC]">
                {formatCurrency(activeCategory.totalPaise, currency)}
              </span>
              <span className="text-[10px] text-[#EF4444] font-medium">
                {activeCategory.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#A5ABC0]">Total Spent</span>
              <span className="text-sm font-bold text-[#F5F6FC]">
                {formatCurrency(totalPaise, currency)}
              </span>
              <span className="text-[10px] text-[#A5ABC0]">
                {categories.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Categories Legend */}
      <div className="flex-1 w-full space-y-2">
        {segments.slice(0, 5).map((seg) => (
          <div
            key={seg.category}
            onMouseEnter={() => setHoveredIndex(seg.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between text-xs p-1.5 rounded transition-colors cursor-pointer ${
              hoveredIndex === seg.index ? 'bg-[#221C24]' : 'hover:bg-[#161217]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[#F5F6FC] font-medium truncate">{seg.category}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[#A5ABC0]">{formatCurrency(seg.totalPaise, currency)}</span>
              <span className="text-[#EF4444] font-semibold w-9 text-right">
                {seg.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
