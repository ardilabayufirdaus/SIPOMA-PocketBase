import React from 'react';
import { motion } from 'framer-motion';
import { Page } from '../../types';

interface QuickActionsProps {
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate, t }) => {
  const actions = [
    {
      label: 'Log CM Downtime',
      description: 'Record maintenance events',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      borderColor: 'border-amber-100 dark:border-amber-800/30',
      onClick: () => onNavigate('operations', 'op_ccr_data_entry'),
    },
    {
      label: 'Log RKC Data',
      description: 'Daily parameter entry',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      borderColor: 'border-orange-100 dark:border-orange-800/30',
      onClick: () => onNavigate('rkc_operations', 'op_ccr_data_entry'),
    },
    {
      label: 'New Project',
      description: 'Initiate new proposal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      borderColor: 'border-emerald-100 dark:border-emerald-800/30',
      onClick: () => onNavigate('projects', 'proj_list'),
    },
    {
      label: 'Database',
      description: 'Manage master data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      borderColor: 'border-blue-100 dark:border-blue-800/30',
      onClick: () => onNavigate('database'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 h-full content-start">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + index * 0.05 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className={`
            relative flex flex-col items-center justify-center gap-3 p-4 rounded-lg 
            bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
            hover:border-[#E95420] dark:hover:border-[#E95420]/50
            shadow-sm hover:shadow-md transition-all duration-200 text-center group h-auto min-h-[110px] overflow-hidden
          `}
        >
          {/* Subtle Indicator */}
          <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-[#E95420] transition-all duration-200"></div>

          <div
            className={`relative z-10 p-2.5 rounded ${action.color.includes('amber') || action.color.includes('orange') ? 'bg-[#E95420] text-white' : 'bg-[#772953] text-white'} transition-transform group-hover:scale-110 duration-200`}
          >
            {action.icon}
          </div>
          <div className="relative z-10">
            <span className="block font-bold text-[#333333] dark:text-slate-200 text-[11px] leading-tight uppercase tracking-wider group-hover:text-[#E95420] transition-colors">
              {action.label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
