import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
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
        return 'text-indigo-600 dark:text-indigo-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-100/50 dark:bg-emerald-500/20';
      case 'warning':
        return 'bg-amber-100/50 dark:bg-amber-500/20';
      case 'danger':
        return 'bg-rose-100/50 dark:bg-rose-500/20';
      default:
        return 'bg-indigo-100/50 dark:bg-indigo-500/20';
    }
  };

  const getGradientBorder = () => {
    switch (status) {
      case 'success':
        return 'group-hover:border-emerald-200 dark:group-hover:border-emerald-800';
      case 'warning':
        return 'group-hover:border-amber-200 dark:group-hover:border-amber-800';
      case 'danger':
        return 'group-hover:border-rose-200 dark:group-hover:border-rose-800';
      default:
        return 'group-hover:border-indigo-200 dark:group-hover:border-indigo-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        relative overflow-hidden rounded-lg 
        bg-white dark:bg-slate-900 
        border border-slate-200 dark:border-slate-800
        shadow-sm hover:shadow-md transition-all duration-200
        group
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Ubuntu Orange Top Accent on Hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#E95420] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-2 rounded ${getStatusBg()} ${getStatusColor()} transition-colors border border-transparent group-hover:border-current`}
          >
            {icon}
          </div>
          {trend && (
            <span
              className={`
              text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest
              ${
                trend.isPositive
                  ? 'bg-emerald-50 text-[#38B000] dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-50 text-[#EF2D56] dark:bg-rose-900/30 dark:text-rose-400'
              }
            `}
            >
              {trend.value}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-bold text-[#333333] dark:text-white mb-1 tracking-tight">
              {value}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-[#808080] dark:text-slate-500 tracking-widest uppercase">
            {title}
          </p>
        </div>

        {subtitle && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-[#AEA79F] dark:text-slate-500 font-bold uppercase tracking-tight">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
