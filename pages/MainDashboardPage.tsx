import React from 'react';
import { Page } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KPISection from '../components/dashboard/KPISection';
import OperationsOverview from '../components/dashboard/OperationsOverview';
import QuickActions from '../components/dashboard/QuickActions';
import AiOperationalReview from '../components/dashboard/AiOperationalReview';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCurrentUser } from '../hooks/useCurrentUser';

import { usePresenceTracker } from '../hooks/usePresenceTracker';
import { useSystemHealth } from '../hooks/useSystemHealth';

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
  const onlineUsersCount = onlineUsers.length;

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
    <div className="relative flex flex-col min-h-full text-[#333333] dark:text-slate-100 font-sans bg-[#F7F7F7] dark:bg-slate-950">
      {/* Subtle Ubuntu Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#E95420]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#772953]/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col gap-4 lg:gap-6 max-w-[1700px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex-shrink-0">
          <DashboardHeader user={currentUser} t={t} onlineUsersCount={onlineUsersCount} />
        </div>

        {/* KPI Section */}
        <div className="flex-shrink-0">
          <KPISection metrics={metrics} t={t} />
        </div>

        {/* AI Operational Review Section */}
        <div className="flex-shrink-0">
          <AiOperationalReview t={t} />
        </div>

        {/* Main Content - Grid Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column: Operations Overview */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <OperationsOverview
              unitStatuses={unitStatuses}
              topDowntimes={topDowntimes}
              onNavigate={onNavigate}
              t={t}
            />
          </div>

          {/* Right Column: Quick Actions & Widgets */}
          <div className="lg:col-span-4 flex flex-col h-full gap-4 lg:gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[11px] font-bold text-[#808080] dark:text-slate-500 uppercase tracking-widest">
                  {t.dashboard_quick_actions || 'Akses Cepat'}
                </h3>
              </div>
              <QuickActions onNavigate={onNavigate} t={t} />
            </div>

            {/* System Health Widget */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#E95420]/5 rounded-bl-full pointer-events-none"></div>
              <SystemStatusWidget t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted for cleaner component code
const SystemStatusWidget: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const formatUptime = (seconds: number) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  const { cpuLoad, memoryUsage, uptime, latency, isLive } = useSystemHealth();

  return (
    <>
      <div className="flex items-center justify-between mb-6 relative z-10 w-full">
        <h4 className="text-xs font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest border-l-2 border-[#E95420] pl-2">
          {t.system_status_title || 'Status Sistem'}
        </h4>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
          <span className="relative flex h-2 w-2">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-tight ${
              isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isLive ? t.system_status_online || 'Online' : t.system_status_offline || 'Offline'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5 relative z-10 w-full">
        {/* CPU Meter */}
        <div>
          <div className="flex justify-between mb-1.5 items-end">
            <span className="text-[11px] font-bold text-[#808080] uppercase tracking-wide">
              {t.system_status_cpu || 'CPU Load'}
            </span>
            <span className="text-xs font-black text-[#333333] dark:text-slate-300">
              {cpuLoad}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div
              className={`h-1.5 rounded-full bg-[#E95420] transition-all duration-1000 ease-out`}
              style={{ width: `${cpuLoad}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Meter */}
        <div>
          <div className="flex justify-between mb-1.5 items-end">
            <span className="text-[11px] font-bold text-[#808080] uppercase tracking-wide">
              {t.system_status_memory || 'Memori'}
            </span>
            <span className="text-xs font-black text-[#333333] dark:text-slate-300">
              {memoryUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div
              className={`h-1.5 rounded-full bg-[#772953] transition-all duration-1000 ease-out`}
              style={{ width: `${memoryUsage}%` }}
            ></div>
          </div>
        </div>

        {/* Uptime Display */}
        <div className="flex items-center justify-between p-3 bg-[#F7F7F7] dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold text-[#808080] uppercase">
            {t.system_status_uptime || 'Waktu Aktif'}
          </span>
          <span className="text-xs font-bold text-[#333333] dark:text-white font-mono">
            {formatUptime(uptime)}
          </span>
        </div>

        {/* Latency Display */}
        <div className="flex items-center justify-between p-3 bg-[#F7F7F7] dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold text-[#808080] uppercase">
            {t.system_status_sync || 'Sinkronisasi Basis Data'}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${latency < 100 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}
            ></div>
            <span
              className={`text-xs font-bold font-mono ${
                latency < 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {latency}ms
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainDashboardPage;
