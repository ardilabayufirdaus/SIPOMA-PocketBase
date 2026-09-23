import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { User } from '../../types';

interface DashboardHeaderProps {
  user: User | null;
  t: Record<string, string>;
  language?: 'en' | 'id';
  onlineUsersCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  t,
  language = 'id',
  onlineUsersCount = 0,
}) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting(t.greeting_morning || (language === 'en' ? 'Good Morning' : 'Selamat Pagi'));
    } else if (hour < 15) {
      setGreeting(t.greeting_afternoon || (language === 'en' ? 'Good Afternoon' : 'Selamat Siang'));
    } else if (hour < 18) {
      setGreeting(t.greeting_evening || (language === 'en' ? 'Good Evening' : 'Selamat Sore'));
    } else {
      setGreeting(t.greeting_night || (language === 'en' ? 'Good Night' : 'Selamat Malam'));
    }
  }, [language, t]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 md:gap-4 py-1 relative z-20">
      <div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {greeting},{' '}
              <span className="text-primary-600 dark:text-primary-400">
                {user?.name || user?.full_name || user?.username || 'Engineer'}
              </span>
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 dark:bg-slate-700 text-white shadow-xs">
              {user?.role || t.guest_role || (language === 'en' ? 'Guest' : 'Tamu')}
            </span>
          </div>
          <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t.dashboard_welcome_message ||
              (language === 'en'
                ? 'OPERATIONAL SYSTEM • READY FOR PRODUCTION'
                : 'SISTEM OPERASIONAL • SIAP UNTUK PRODUKSI')}
          </p>
        </motion.div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Date Display Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Online Users Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider tabular-nums">
            {onlineUsersCount} {t.users_online || 'Online'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
