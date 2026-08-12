import React from 'react';
import { Page } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KPISection from '../components/dashboard/KPISection';
import OperationsOverview from '../components/dashboard/OperationsOverview';
import QuickActions from '../components/dashboard/QuickActions';
import AiOperationalReview from '../components/dashboard/AiOperationalReview';
import { ProductionMaterialMixChart } from '../components/dashboard/ProductionMaterialMixChart';
import { SiloOccupancyWidget } from '../components/dashboard/SiloOccupancyWidget';
import { DowntimeParetoWidget } from '../components/dashboard/DowntimeParetoWidget';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMainDashboardChartsData } from '../hooks/useMainDashboardChartsData';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePresenceTracker } from '../hooks/usePresenceTracker';

interface MainDashboardPageProps {
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
}

const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ t, onNavigate }) => {
  const { metrics, unitStatuses, topDowntimes, isLoading: isDashboardLoading } = useDashboardData();
  const {
    materialUsage,
    downtimePareto,
    siloData,
    loading: isChartsLoading,
  } = useMainDashboardChartsData();

  const { currentUser } = useCurrentUser();
  const { onlineUsers } = usePresenceTracker();
  const onlineUsersCount = onlineUsers.length;

  const isLoading = isDashboardLoading && isChartsLoading;

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
    <div className="relative flex flex-col min-h-full text-slate-800 dark:text-slate-100 font-sans bg-slate-50 dark:bg-slate-950 pb-20 md:pb-6 p-4 md:p-6 transition-colors duration-300">
      {/* Subtle Ambient Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-30 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-secondary-700/10 rounded-full blur-[140px]"></div>
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

        {/* Charts Row 1: Production Material Mix & Silo Occupancy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-7 h-[360px]">
            <ProductionMaterialMixChart data={materialUsage} t={t} />
          </div>
          <div className="lg:col-span-5 h-[360px]">
            <SiloOccupancyWidget data={siloData} t={t} />
          </div>
        </div>

        {/* Main Operations & Downtime Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column: Downtime Pareto Chart */}
          <div className="lg:col-span-7 h-[380px]">
            <DowntimeParetoWidget data={downtimePareto} t={t} />
          </div>

          {/* Right Column: Operations Overview & Quick Actions */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">
            <div className="flex-1">
              <OperationsOverview
                unitStatuses={unitStatuses}
                topDowntimes={topDowntimes}
                onNavigate={onNavigate}
                t={t}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
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
