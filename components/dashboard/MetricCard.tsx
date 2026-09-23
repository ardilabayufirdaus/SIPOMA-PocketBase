import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
  vectorIllustration?: React.ReactNode;
  delay?: number;
  onClick?: () => void;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  status = 'neutral',
  icon,
  vectorIllustration,
  delay = 0,
  onClick,
  trend,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'danger':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-cyan-600 dark:text-cyan-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-100/50 dark:bg-emerald-500/15';
      case 'warning':
        return 'bg-amber-100/50 dark:bg-amber-500/15';
      case 'danger':
        return 'bg-rose-100/50 dark:bg-rose-500/15';
      default:
        return 'bg-cyan-100/50 dark:bg-cyan-500/15';
    }
  };

  const getAccentBarColor = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-rose-500';
      default:
        return 'bg-cyan-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-white dark:bg-slate-900 
        border border-slate-200/90 dark:border-slate-800
        shadow-2xs hover:shadow-md transition-all duration-300
        group
        ${onClick ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Top Accent on Hover */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${getAccentBarColor()} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
      ></div>

      <div className="p-3.5 sm:p-4 relative z-10 flex flex-col justify-between h-full">
        {/* Top Row: Icon/Illustration + Trend Badge */}
        <div className="flex justify-between items-start mb-2.5">
          {vectorIllustration ? (
            <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center p-0.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform duration-300">
              {vectorIllustration}
            </div>
          ) : icon ? (
            <div
              className={`p-2.5 rounded-xl ${getStatusBg()} ${getStatusColor()} transition-colors border border-transparent group-hover:border-current`}
            >
              {icon}
            </div>
          ) : null}

          {trend && (
            <span
              className={`
              text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider tabular-nums
              ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }
            `}
            >
              {trend.value}
            </span>
          )}
        </div>

        {/* Title and Value (HTML Heading Semantics + Tabular Nums) */}
        <div>
          <h2
            className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-0.5 truncate"
            title={title}
          >
            {title}
          </h2>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {value}
            </span>
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span
              className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate block"
              title={subtitle}
            >
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
