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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 backdrop-blur-2xl p-8 shadow-2xl shadow-slate-200/40 transition-shadow hover:shadow-red-500/10 ${isMain ? 'col-span-1' : ''}`}
    >
      {/* Decorative Glow */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${st.gradient} opacity-[0.08] blur-[60px] rounded-full pointer-events-none`}
      />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${st.gradient} flex items-center justify-center shadow-lg ${st.glow}`}
          >
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{unitName}</h3>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              {label}
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ rotate: 15 }}
          className="p-3 rounded-2xl bg-white/60 border border-white/80 shadow-sm cursor-help transition-all hover:bg-white"
        >
          <Info className="w-4 h-4 text-slate-400" />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-10">
        {/* Main OEE Gauge - Refined */}
        <div className="relative w-48 h-48 group">
          <svg className="w-full h-full transform -rotate-90">
            {/* Track */}
            <circle cx="96" cy="96" r="82" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
            {/* Progress */}
            <motion.circle
              cx="96"
              cy="96"
              r="82"
              fill="transparent"
              stroke={`url(#grad-${unitName})`}
              strokeWidth="16"
              strokeDasharray={515}
              initial={{ strokeDashoffset: 515 }}
              animate={{ strokeDashoffset: 515 - (515 * value) / 100 }}
              transition={{ duration: 1.5, ease: 'circOut' }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={`grad-${unitName}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor={value >= 85 ? '#10b981' : value >= 65 ? '#fbbf24' : '#e11d48'}
                />
                <stop
                  offset="100%"
                  stopColor={value >= 85 ? '#2dd4bf' : value >= 65 ? '#f59e0b' : '#fb7185'}
                />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={`text-5xl font-black tabular-nums tracking-tighter ${st.text} dropshadow-sm`}
            >
              {formatOeeValue(value)}
            </motion.span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1">
              Efficiency
            </span>
          </div>
        </div>

        {/* Sub-metrics Breakdown - Horizontal style for premium feel */}
        <div className="w-full grid grid-cols-1 gap-6 bg-white/40 p-5 rounded-[2rem] border border-white/60">
          <SubMetricRow
            label="Availability"
            value={subMetrics.availability}
            icon={<Zap className="w-4 h-4 text-blue-500" />}
            color="bg-blue-500"
          />
          <SubMetricRow
            label="Performance"
            value={subMetrics.performance}
            icon={<BarChart3 className="w-4 h-4 text-orange-500" />}
            color="bg-orange-500"
          />
          <SubMetricRow
            label="Quality"
            value={subMetrics.quality}
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            color="bg-emerald-500"
          />
        </div>
      </div>

      {/* Comparisons Section - Polished Chips */}
      {comparisons && (
        <div className="mt-8 pt-6 border-t border-slate-200/40 flex items-center justify-between px-2">
          <ComparisonChip label="Monthly" value={comparisons.monthly} />
          <div className="w-px h-8 bg-slate-200/40" />
          <ComparisonChip label="MTD" value={comparisons.mtd} />
          <div className="w-px h-8 bg-slate-200/40" />
          <ComparisonChip label="YTD" value={comparisons.ytd} />
        </div>
      )}
    </motion.div>
  );
};

const ComparisonChip: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5">
      {label}
    </span>
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`px-3 py-1 rounded-full text-[11px] font-black border tabular-nums shadow-sm ${
        value >= 85
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
          : value >= 65
            ? 'bg-amber-50 text-amber-600 border-amber-100'
            : 'bg-rose-50 text-rose-600 border-rose-100'
      }`}
    >
      {formatOeeValue(value)}
    </motion.div>
  </div>
);

const SubMetricRow: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs px-1">
      <div className="flex items-center gap-2.5 text-slate-600 font-extrabold uppercase tracking-tight">
        <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">{icon}</div>
        {label}
      </div>
      <span className="text-slate-900 font-black tabular-nums">{formatOeeValue(value)}</span>
    </div>
    <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden border border-white/80 p-[1px]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color} shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
      />
    </div>
  </div>
);

export default OeeMetricCard;
