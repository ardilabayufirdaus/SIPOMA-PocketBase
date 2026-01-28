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
    <div className="grid grid-cols-2 gap-3 h-full content-start">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className={`
            relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl 
            bg-white/60 dark:bg-slate-800/60 backdrop-blur-md
            border border-white/50 dark:border-slate-700/50
            hover:border-indigo-300 dark:hover:border-indigo-500/50
            shadow-sm hover:shadow-xl transition-all duration-300 text-center group h-auto min-h-[90px] overflow-hidden
          `}
        >
          {/* Hover Gradient Background */}
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${action.color.includes('amber') ? 'from-amber-500/10 to-orange-500/5' : action.color.includes('orange') ? 'from-orange-500/10 to-red-500/5' : action.color.includes('emerald') ? 'from-emerald-500/10 to-teal-500/5' : 'from-blue-500/10 to-indigo-500/5'}`}
          ></div>

          <div
            className={`relative z-10 p-2.5 rounded-xl ${action.color} transition-colors ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 duration-300`}
          >
            {action.icon}
          </div>
          <div className="relative z-10">
            <span className="block font-bold text-slate-700 dark:text-slate-200 text-xs leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {action.label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
