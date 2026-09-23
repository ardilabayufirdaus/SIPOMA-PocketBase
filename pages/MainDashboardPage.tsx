import React from 'react';
import { Page } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KPISection from '../components/dashboard/KPISection';
import OperationsOverview from '../components/dashboard/OperationsOverview';
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

const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ language, t, onNavigate }) => {
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
      <div className="relative flex flex-col min-h-full font-sans bg-slate-50/50 dark:bg-slate-950 pb-16 md:pb-6 p-3.5 sm:p-4 md:p-5 lg:p-6 animate-pulse">
        <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 lg:gap-5 max-w-[1700px] mx-auto w-full">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center py-1">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </div>
            <div className="flex gap-2.5">
              <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>

          {/* 4 KPI Metric Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  <div className="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-24 h-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  <div className="w-32 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Banner Skeleton */}
          <div className="h-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg hidden sm:block"></div>
              <div className="w-24 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </div>

          {/* Row 1: Charts (h-[355px]) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5">
            <div className="lg:col-span-7 h-[355px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 flex flex-col">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg"></div>
            </div>
            <div className="lg:col-span-5 h-[355px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 flex flex-col">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg"></div>
            </div>
          </div>

          {/* Row 2: Operations (h-[385px]) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5">
            <div className="lg:col-span-7 h-[385px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 flex flex-col">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg"></div>
            </div>
            <div className="lg:col-span-5 h-[385px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 flex flex-col">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-full text-slate-800 dark:text-slate-100 font-sans bg-slate-50/50 dark:bg-slate-950 pb-16 md:pb-6 p-3.5 sm:p-4 md:p-5 lg:p-6 transition-colors duration-300">
      {/* Subtle Ambient Background Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-30 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col gap-3.5 sm:gap-4 lg:gap-5 max-w-[1700px] mx-auto w-full">
        {/* 1. Header Section */}
        <div className="flex-shrink-0">
          <DashboardHeader
            user={currentUser}
            t={t}
            language={language}
            onlineUsersCount={onlineUsersCount}
          />
        </div>

        {/* 2. KPI Section (4 Vector Metric Cards) */}
        <div className="flex-shrink-0">
          <KPISection metrics={metrics} t={t} language={language} />
        </div>

        {/* 3. AI Operational Review Section */}
        <div className="flex-shrink-0">
          <AiOperationalReview t={t} language={language} />
        </div>

        {/* 4. Charts Row: Production Material Mix & Silo Occupancy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5">
          <div className="lg:col-span-7 h-[355px]">
            <ProductionMaterialMixChart data={materialUsage} t={t} language={language} />
          </div>
          <div className="lg:col-span-5 h-[355px]">
            <SiloOccupancyWidget data={siloData} t={t} language={language} />
          </div>
        </div>

        {/* 5. Operations & Downtime Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5">
          {/* Left Column: Downtime Pareto Chart */}
          <div className="lg:col-span-7 h-[385px]">
            <DowntimeParetoWidget data={downtimePareto} t={t} language={language} />
          </div>

          {/* Right Column: Operations Overview */}
          <div className="lg:col-span-5 h-[385px]">
            <OperationsOverview
              unitStatuses={unitStatuses}
              topDowntimes={topDowntimes}
              onNavigate={onNavigate}
              t={t}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboardPage;
