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
  const [systemStatus, setSystemStatus] = useState<'operational' | 'issues'>('operational');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {greeting},{' '}
              {(user?.name || user?.full_name || user?.username || 'Engineer').split(' ')[0]}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
              {user?.role || 'Guest'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {t.dashboard_welcome_message || 'Here is your daily production overview'}
          </p>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Status Ticker */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${systemStatus === 'operational' ? 'bg-emerald-400' : 'bg-red-400'}`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${systemStatus === 'operational' ? 'bg-emerald-500' : 'bg-red-500'}`}
            ></span>
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            System Operational
          </span>
        </div>

        {/* Online Users */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
          <svg
            className="w-4 h-4 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {onlineUsersCount} Online
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
