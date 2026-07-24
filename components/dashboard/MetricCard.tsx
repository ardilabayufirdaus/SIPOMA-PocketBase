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
        relative overflow-hidden rounded-2xl 
        bg-white dark:bg-slate-900 
        border border-slate-200/80 dark:border-slate-800
        shadow-sm hover:shadow-md transition-all duration-200
        group
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Electric Cobalt Top Accent on Hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-2.5 rounded-xl ${getStatusBg()} ${getStatusColor()} transition-colors border border-transparent group-hover:border-current`}
          >
            {icon}
          </div>
          {trend && (
            <span
              className={`
              text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
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

        <div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
              {value}
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
            {title}
          </p>
        </div>

        {subtitle && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
