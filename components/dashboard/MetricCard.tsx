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
        return 'text-emerald-500 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-500 dark:text-amber-400';
      case 'danger':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 
        border border-slate-200 dark:border-slate-700 p-5 
        shadow-sm hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>

        {icon && (
          <div className={`p-3 rounded-xl ${getStatusBg()} ${getStatusColor()}`}>{icon}</div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span
              className={`
              text-xs font-semibold px-2 py-0.5 rounded-full
              ${
                trend.isPositive
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }
            `}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</span>
          )}
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl" />
    </motion.div>
  );
};

export default MetricCard;
