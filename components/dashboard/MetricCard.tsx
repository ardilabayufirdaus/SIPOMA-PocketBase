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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-white/70 dark:bg-slate-800/60 backdrop-blur-md
        border border-white/50 dark:border-slate-700/50
        shadow-sm hover:shadow-xl transition-all duration-300
        group
        ${onClick ? 'cursor-pointer' : ''}
        ${getGradientBorder()}
      `}
      onClick={onClick}
    >
      {/* Decorative Blob */}
      <div
        className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
          status === 'success'
            ? 'bg-emerald-400/20'
            : status === 'warning'
              ? 'bg-amber-400/20'
              : status === 'danger'
                ? 'bg-rose-400/20'
                : 'bg-indigo-400/20'
        }`}
      ></div>

      <div className="p-4 relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div
            className={`p-2.5 rounded-xl ${getStatusBg()} ${getStatusColor()} transition-colors ring-1 ring-black/5 dark:ring-white/10`}
          >
            {icon}
          </div>
          {trend && (
            <span
              className={`
              text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide
              ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              }
            `}
            >
              {trend.value}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-0.5 tracking-tight">
              {value}
            </h3>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </p>
        </div>

        {subtitle && (
          <div className="mt-2 pt-2 border-t border-slate-100/50 dark:border-slate-700/30">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {subtitle}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Highlight Line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r 
        ${
          status === 'success'
            ? 'from-emerald-400/0 via-emerald-500 to-emerald-400/0'
            : status === 'warning'
              ? 'from-amber-400/0 via-amber-500 to-amber-400/0'
              : status === 'danger'
                ? 'from-rose-400/0 via-rose-500 to-rose-400/0'
                : 'from-indigo-400/0 via-indigo-500 to-indigo-400/0'
        } 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
    </motion.div>
  );
};

export default MetricCard;
