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
    <div className="relative flex flex-col min-h-full text-[#333333] dark:text-slate-100 font-sans bg-[#F7F7F7] dark:bg-slate-950 pb-20 md:pb-0">
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
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6">
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
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[11px] font-bold text-[#808080] dark:text-slate-500 uppercase tracking-widest">
                  {t.dashboard_quick_actions || 'Akses Cepat'}
                </h3>
              </div>
              <QuickActions onNavigate={onNavigate} t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboardPage;
