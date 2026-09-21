import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, CheckCircle, BarChart3, Info } from 'lucide-react';
import { formatOeeValue } from '../../utils/oeeUtils';

interface OeeMetricCardProps {
  label: string;
  value: number; // Current/Main value
  subMetrics: {
    availability: number;
    performance: number;
    quality: number;
  };
  unitName: string;
  isMain?: boolean;
  comparisons?: {
    monthly: number;
    mtd: number;
    ytd: number;
  };
}

const OeeMetricCard: React.FC<OeeMetricCardProps> = ({
  label,
  value,
  subMetrics,
  unitName,
  isMain = false,
  comparisons,
}) => {
  // Color mapping based on value - refined for premium theme
  const getStatusInfo = (val: number) => {
    if (val >= 85)
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        gradient: 'from-emerald-500 to-teal-400',
        glow: 'shadow-emerald-200/50',
      };
    if (val >= 65)
      return {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        gradient: 'from-amber-400 to-orange-400',
        glow: 'shadow-amber-200/50',
      };
    return {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      gradient: 'from-rose-600 to-pink-500',
      glow: 'shadow-rose-200/50',
    };
  };

  const st = getStatusInfo(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all ${isMain ? 'col-span-1' : ''}`}
    >
      {/* Decorative Subtle Glow */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${st.gradient} opacity-[0.07] blur-[50px] rounded-full pointer-events-none`}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${st.gradient} flex items-center justify-center shadow-md ${st.glow}`}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              {unitName}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              {label}
            </p>
          </div>
        </div>
        <div
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500"
          title="Equipment Effectiveness Index"
        >
          <Info className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Main OEE Gauge - Refined Precision Ring */}
        <div className="relative w-40 h-40 group">
          <svg className="w-full h-full transform -rotate-90">
            {/* Track */}
            <circle
              cx="80"
              cy="80"
              r="68"
              fill="transparent"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="12"
            />
            {/* Progress */}
            <motion.circle
              cx="80"
              cy="80"
              r="68"
              fill="transparent"
              stroke={`url(#grad-${unitName})`}
              strokeWidth="12"
              strokeDasharray={427}
              initial={{ strokeDashoffset: 427 }}
              animate={{ strokeDashoffset: 427 - (427 * value) / 100 }}
              transition={{ duration: 1.2, ease: 'circOut' }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={`grad-${unitName}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor={value >= 85 ? '#10b981' : value >= 65 ? '#f59e0b' : '#ef4444'}
                />
                <stop
                  offset="100%"
                  stopColor={value >= 85 ? '#059669' : value >= 65 ? '#d97706' : '#dc2626'}
                />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight font-mono ${st.text}`}
            >
              {formatOeeValue(value)}
            </motion.span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-0.5">
              Efficiency %
            </span>
          </div>
        </div>

        {/* Sub-metrics Breakdown */}
        <div className="w-full space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <SubMetricRow
            label="Availability"
            value={subMetrics.availability}
            icon={<Zap className="w-3.5 h-3.5 text-blue-500" />}
            color="bg-blue-500"
          />
          <SubMetricRow
            label="Performance"
            value={subMetrics.performance}
            icon={<BarChart3 className="w-3.5 h-3.5 text-amber-500" />}
            color="bg-amber-500"
          />
          <SubMetricRow
            label="Quality"
            value={subMetrics.quality}
            icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
            color="bg-emerald-500"
          />
        </div>
      </div>

      {/* Comparisons Section - Polished Chips */}
      {comparisons && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-1">
          <ComparisonChip label="Monthly" value={comparisons.monthly} />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
          <ComparisonChip label="MTD" value={comparisons.mtd} />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
          <ComparisonChip label="YTD" value={comparisons.ytd} />
        </div>
      )}
    </motion.div>
  );
};

const ComparisonChip: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">
      {label}
    </span>
    <div
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tabular-nums ${
        value >= 85
          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
          : value >= 65
            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
      }`}
    >
      {formatOeeValue(value)}
    </div>
  </div>
);

const SubMetricRow: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs px-0.5">
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
        {icon}
        {label}
      </div>
      <span className="text-slate-900 dark:text-slate-100 font-bold tabular-nums font-mono text-xs">
        {formatOeeValue(value)}
      </span>
    </div>
    <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

export default OeeMetricCard;
