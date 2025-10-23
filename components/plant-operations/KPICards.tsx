import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface DashboardKPI {
  id: string;
  title: string;
  value: number | string;
  unit: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  status: 'normal' | 'warning' | 'critical';
  target?: number;
}

interface KPICardsProps {
  kpis: DashboardKPI[];
  isLoading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">{kpi.icon}</div>
            <div
              className={`flex items-center gap-1 text-sm ${
                kpi.trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {kpi.trend.isPositive ? (
                <TrendingUpIcon className="w-4 h-4" />
              ) : (
                <TrendingDownIcon className="w-4 h-4" />
              )}
              {kpi.trend.value}%
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{kpi.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {kpi.value}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{kpi.unit}</span>
            </div>
            {kpi.target && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Target: {kpi.target} {kpi.unit}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default KPICards;


