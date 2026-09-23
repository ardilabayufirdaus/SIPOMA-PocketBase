import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Flame, PlusCircle, Database } from 'lucide-react';
import { Page } from '../../types';

interface QuickActionsProps {
  onNavigate: (page: Page, subPage?: string) => void;
  t?: Record<string, string>;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      label: 'Entri Downtime CM',
      description: 'Pencatatan stop mesin',
      icon: <Wrench className="w-4 h-4" />,
      accentColor:
        'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500/50',
      onClick: () => onNavigate('operations', 'op_ccr_data_entry'),
    },
    {
      label: 'Entri Data RKC',
      description: 'Parameter tanur harian',
      icon: <Flame className="w-4 h-4" />,
      accentColor:
        'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-200 dark:border-orange-800/60',
      hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-500/50',
      onClick: () => onNavigate('rkc_operations', 'op_ccr_data_entry'),
    },
    {
      label: 'Proyek Baru',
      description: 'Inisiasi proposal baru',
      icon: <PlusCircle className="w-4 h-4" />,
      accentColor:
        'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/60',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500/50',
      onClick: () => onNavigate('projects', 'proj_list'),
    },
    {
      label: 'Master Database',
      description: 'Kelola data referensi',
      icon: <Database className="w-4 h-4" />,
      accentColor:
        'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-200 dark:border-cyan-800/60',
      hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500/50',
      onClick: () => onNavigate('database'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 h-full content-start">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + index * 0.04 }}
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className={`
            relative flex items-center gap-2.5 p-2.5 rounded-xl
            bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800
            ${action.hoverBorder}
            shadow-2xs hover:shadow-xs transition-all duration-200 text-left group
            focus-visible:ring-2 focus-visible:ring-primary-500 outline-hidden select-none
          `}
        >
          {/* Accent Icon Badge */}
          <div
            className={`p-2 rounded-lg border ${action.accentColor} flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}
          >
            {action.icon}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-snug truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {action.label}
            </span>
            <span className="block text-[9.5px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate">
              {action.description}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
