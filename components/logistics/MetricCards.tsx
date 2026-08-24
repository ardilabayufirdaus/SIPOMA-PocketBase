import React, { useState } from 'react';
import ArrowPathRoundedSquareIcon from '../../components/icons/ArrowPathRoundedSquareIcon';
import ChartBarSquareIcon from '../../components/icons/ChartBarSquareIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import TruckIcon from '../../components/icons/TruckIcon';
import BuildingLibraryIcon from '../../components/icons/BuildingLibraryIcon';
import ArchiveBoxXMarkIcon from '../../components/icons/ArchiveBoxXMarkIcon';
import ScaleIcon from '../../components/icons/ScaleIcon';
import { InteractiveCardModal, BreakdownData } from '../InteractiveCardModal';

export interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'good' | 'warning' | 'critical' | 'neutral';
  breakdownData?: BreakdownData;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend = 'neutral',
  breakdownData,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (breakdownData) {
      setIsModalOpen(true);
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'good':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  const getTrendBorder = () => {
    switch (trend) {
      case 'good':
        return 'border-l-4 border-emerald-500';
      case 'warning':
        return 'border-l-4 border-amber-500';
      case 'critical':
        return 'border-l-4 border-red-500';
      default:
        return '';
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3 transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 ${getTrendBorder()} ${
          isInteractive
            ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transform hover:scale-[1.02]'
            : ''
        }`}
        tabIndex={isInteractive ? 0 : -1}
        aria-label={title + (unit ? ` (${unit})` : '')}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className={`p-2.5 rounded-xl flex items-center justify-center ${getTrendColor()}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate"
              title={title}
            >
              {title}
            </p>
            <div className="flex items-center space-x-1">
              {trend !== 'neutral' && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    trend === 'good'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : trend === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                  }`}
                  title={
                    trend === 'good'
                      ? 'Optimal'
                      : trend === 'warning'
                        ? 'Attention'
                        : 'Action Required'
                  }
                >
                  {trend === 'good' ? '✓' : trend === 'warning' ? '!' : '⚠'}
                </span>
              )}
              {isInteractive && (
                <div className="text-slate-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <p
              className="text-lg font-bold text-slate-900 dark:text-white"
              aria-label={
                typeof value === 'string' || typeof value === 'number'
                  ? String(value)
                  : JSON.stringify(value)
              }
            >
              {typeof value === 'string' || typeof value === 'number'
                ? String(value)
                : '[Invalid Value]'}
            </p>
            {unit && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{unit}</p>
            )}
          </div>
        </div>
      </div>

      {breakdownData && (
        <InteractiveCardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={breakdownData}
        />
      )}
    </>
  );
};
