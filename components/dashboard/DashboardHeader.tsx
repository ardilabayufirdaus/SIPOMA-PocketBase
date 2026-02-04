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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 py-2 relative z-20">
      <div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#333333] dark:text-white">
              {greeting},{' '}
              <span className="text-[#E95420]">
                {user?.name || user?.full_name || user?.username || 'Engineer'}
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#772953] text-white">
              {user?.role || 'Guest'}
            </span>
          </div>
          <p className="text-[11px] text-[#808080] dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 pl-0.5">
            {t.dashboard_welcome_message || 'SYSTEMS OPERATIONAL • READY FOR PRODUCTION'}
          </p>
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display - Clean Ubuntu Style */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
          <svg
            className="w-3.5 h-3.5 text-[#E95420]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>

        {/* Online Users - Ubuntu Style Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-[#F7F7F7] dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
          <div className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38B000]"></span>
          </div>
          <span className="text-[11px] font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest">
            {onlineUsersCount} Online
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
