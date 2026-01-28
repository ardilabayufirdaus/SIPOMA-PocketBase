import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Page } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KPISection from '../components/dashboard/KPISection';
import OperationsOverview from '../components/dashboard/OperationsOverview';
import QuickActions from '../components/dashboard/QuickActions';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { pb } from '../utils/pocketbase-simple';

import { usePresenceTracker } from '../hooks/usePresenceTracker';

interface MainDashboardPageProps {
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
}

const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ t, onNavigate }) => {
  const { metrics, unitStatuses, topDowntimes, isLoading } = useDashboardData();
  const { currentUser } = useCurrentUser();

  // Use centralized presence tracker for real-time online users
  const { onlineUsers } = usePresenceTracker();
  const onlineUsersCount = onlineUsers.length > 0 ? onlineUsers.length : 1;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-6 h-full">
        <div className="h-16 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
        <div className="flex-1 bg-slate-200 dark:bg-slate-700/50 rounded-2xl p-6"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen max-h-screen overflow-hidden text-slate-900 dark:text-slate-100 font-sans bg-slate-50 dark:bg-slate-900">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[80px] animate-bounce duration-[10s]"></div>
      </div>

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 z-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px]"></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col p-3 lg:p-5 gap-3 lg:gap-5 overflow-hidden max-w-[1920px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex-shrink-0">
          <DashboardHeader user={currentUser} t={t} onlineUsersCount={onlineUsersCount} />
        </div>

        {/* KPI Section */}
        <div className="flex-shrink-0">
          <KPISection metrics={metrics} t={t} />
        </div>

        {/* Main Content - Grid Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5 overflow-hidden">
          {/* Left Column: Operations Overview (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
            <OperationsOverview
              unitStatuses={unitStatuses}
              topDowntimes={topDowntimes}
              onNavigate={onNavigate}
              t={t}
            />
          </div>

          {/* Right Column: Quick Actions & Widgets (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full overflow-hidden gap-3 lg:gap-5">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t.dashboard_quick_actions || 'Quick Actions'}
                </h3>
              </div>
              <QuickActions onNavigate={onNavigate} t={t} />
            </div>

            {/* System Health Widget */}
            <div className="flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 flex flex-col shadow-sm relative group overflow-hidden">
              {/* Internal Glow */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  System Status
                </h4>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-4 relative z-10">
                {/* Fake CPU Meter */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">CPU Load</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      12%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1.5 rounded-full"
                      style={{ width: '12%' }}
                    ></div>
                  </div>
                </div>

                {/* Fake Memory Meter */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">Memory</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      45%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-pink-500 h-1.5 rounded-full"
                      style={{ width: '45%' }}
                    ></div>
                  </div>
                </div>

                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 text-center">
                    Database Sync Latency:{' '}
                    <span className="font-mono text-slate-600 dark:text-slate-300">24ms</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboardPage;
