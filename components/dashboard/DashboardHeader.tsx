import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface DashboardHeaderProps {
  user: User | null;
  t: Record<string, string>;
  onlineUsersCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, t, onlineUsersCount = 1 }) => {
  const [greeting, setGreeting] = useState('');
  // const [systemStatus, setSystemStatus] = useState<'operational' | 'issues'>('operational'); // Simplified: removed redundant state if not used dynamically

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 py-1 relative z-20">
      <div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-3xl font-black tracking-tighter text-slate-800 dark:text-white">
              {greeting},{' '}
              <span className="text-indigo-600 dark:text-indigo-400">
                {(user?.name || user?.full_name || user?.username || 'Engineer').split(' ')[0]}
              </span>
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30">
              {user?.role || 'Guest'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            {t.dashboard_welcome_message || 'SYSTEMS OPERATIONAL • READY FOR PRODUCTION'}
          </p>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Display - Frosted */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm">
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        {/* Online Users - Enhanced Glow */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 dark:bg-indigo-900/40 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
          </div>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {onlineUsersCount} Online
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
