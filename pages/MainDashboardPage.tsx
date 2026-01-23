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

interface MainDashboardPageProps {
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
}

const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ t, onNavigate }) => {
  const { metrics, unitStatuses, topDowntimes, isLoading } = useDashboardData();
  const { currentUser } = useCurrentUser();
  const [onlineUsersCount, setOnlineUsersCount] = useState(1); // Default to at least 1 (self)

  // Fetch online users count
  useEffect(() => {
    // Initial fetch
    pb.collection('user_online')
      .getList(1, 1, {
        filter: `updated >= "${new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ')}"`, // Active in last 5 mins
      })
      .then((res) => {
        setOnlineUsersCount(res.totalItems || 1);
      })
      .catch(() => {
        // access might be restricted or collection doesn't exist yet, ignore
      });

    // Real-time subscription could go here
    // but for now simple polling or one-time fetch is safer to avoid subscription limits
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 p-4">
        <div className="h-20 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden max-w-[1920px] mx-auto p-2 sm:p-4 gap-4">
      {/* Header Section - Compact */}
      <div className="flex-shrink-0">
        <DashboardHeader user={currentUser} t={t} onlineUsersCount={onlineUsersCount} />
      </div>

      {/* KPI Section - The Pulse */}
      <div className="flex-shrink-0">
        <KPISection metrics={metrics} t={t} />
      </div>

      {/* Operational Overview - Split View (Takes remaining space, scrollable if needed) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <OperationsOverview
          unitStatuses={unitStatuses}
          topDowntimes={topDowntimes}
          onNavigate={onNavigate}
          t={t}
        />
      </div>

      {/* Quick Actions (Pinned to bottom if needed, or just below Ops) */}
      <div className="flex-shrink-0 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {t.dashboard_quick_actions || 'Quick Actions'}
          </h3>
        </div>
        <QuickActions onNavigate={onNavigate} t={t} />
      </div>
    </div>
  );
};

export default MainDashboardPage;
