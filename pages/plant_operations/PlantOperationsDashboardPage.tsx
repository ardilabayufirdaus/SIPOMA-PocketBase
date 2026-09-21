import React, { useState, useCallback } from 'react';
import { formatDate } from '../../utils/dateUtils';
import OeeDashboardSection, {
  OeeTabType,
} from '../../components/plant_operations/OeeDashboardSection';
import DerivativeOeeDashboardSection from '../../components/plant_operations/DerivativeOeeDashboardSection';
import { usePlantOperationsDataOptimizer } from '../../hooks/usePlantOperationsDataOptimizer';
import PredictiveMaintenance from '../../components/monitoring/PredictiveMaintenance';
import { useServerStats } from '../../hooks/useServerStats';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import {
  Server,
  Zap,
  Thermometer,
  Activity,
  Calendar,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface PlantOperationsDashboardPageProps {
  t: Record<string, string>;
  section?: 'CM' | 'RKC' | 'Derivative';
}

type DashboardTab = 'oee' | 'downtime' | 'trends' | 'predictive';

const PlantOperationsDashboardPage: React.FC<PlantOperationsDashboardPageProps> = ({
  section = 'CM',
}) => {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<DashboardTab>('oee');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { clearQueryCache } = usePlantOperationsDataOptimizer();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearQueryCache();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [clearQueryCache]);

  const tabs: {
    id: DashboardTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'oee', label: 'OEE & Unit Performance', icon: TrendingUp },
    { id: 'downtime', label: 'Downtime & Keandalan', icon: Clock },
    { id: 'trends', label: 'Tren & Kualitas', icon: BarChart3 },
    { id: 'predictive', label: 'Predictive AI & Asset Health', icon: Zap },
  ];

  return (
    <div className="w-full space-y-5 sm:space-y-6 font-sans">
      {/* TOP HERO HEADER BANNER - Sesuai 20 Aturan Wajib UI/UX */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Title & Badge Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  {section} Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {section} Operations Dashboard
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Monitoring terpadu efektivitas peralatan (OEE), distribusi downtime 24 jam, tren
                keandalan unit, dan AI predictive asset health
              </p>
            </div>
          </div>

          {/* Header Right Controls: Date Picker & Refresh Button */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            {/* Compact Date Picker */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl shadow-inner focus-within:ring-2 focus-within:ring-primary-500">
              <Calendar className="w-4 h-4 text-primary-300 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider leading-none">
                  Tanggal Observasi
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white border-0 p-0 focus:ring-0 cursor-pointer outline-none [color-scheme:dark]"
                  aria-label="Pilih Tanggal Observasi"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl border border-white/15 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none ${
                isRefreshing ? 'opacity-70 cursor-wait' : ''
              }`}
              title="Sinkronisasi & Perbarui Data"
              aria-label="Sinkronisasi & Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* SERVER HEALTH MINI MONITORING STRIP */}
      <ServerHealthHeader />

      {/* SEGMENTED TAB CONTROLLER */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all min-h-[36px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN DASHBOARD CONTENT (TAB ROUTING) */}
      <main className="space-y-6">
        {/* Tabs 1-3: OEE, Downtime, Trends */}
        {activeTab !== 'predictive' && (
          <section>
            {section === 'Derivative' ? (
              <DerivativeOeeDashboardSection
                date={selectedDate}
                selectedUnit="all"
                activeTab={activeTab as OeeTabType}
              />
            ) : (
              <OeeDashboardSection
                date={selectedDate}
                selectedUnit="all"
                activeTab={activeTab as OeeTabType}
              />
            )}
          </section>
        )}

        {/* Tab 4: Predictive AI & Asset Health */}
        {activeTab === 'predictive' && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                  Intelligent Asset Health & Predictive Maintenance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Analisis anomali operasional berbasis AI, estimasi keausan dini komponen, dan
                  rekomendasi mitigasi preventif
                </p>
              </div>
            </div>

            <PredictiveMaintenance
              plantUnit={
                section === 'CM'
                  ? 'all'
                  : section === 'Derivative'
                    ? 'DEV-1 (Slurry Prep)'
                    : 'RKC Unit'
              }
            />
          </section>
        )}
      </main>
    </div>
  );
};

const ServerHealthHeader: React.FC = () => {
  const { stats } = useServerStats();

  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
      {/* Left: Core Engine Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <Server className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">
            System Engine
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
            {stats.status}
          </span>
        </div>
      </div>

      {/* Right: Metrics Strip */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Load */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            Load
          </span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {stats.load.split(' ')[0]}
          </span>
          <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(parseFloat(stats.load) * 10, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            Memory
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            Active
          </span>
        </div>

        {/* Temperature */}
        {stats.temp && (
          <div className="flex items-center gap-1.5">
            <Thermometer
              className={`w-3.5 h-3.5 ${parseFloat(stats.temp) > 70 ? 'text-rose-500' : 'text-slate-400'}`}
            />
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {stats.temp}
            </span>
          </div>
        )}

        {/* Status Connection Indicator */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div
            className={`w-2 h-2 rounded-full ${stats.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Engine Connected
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlantOperationsDashboardPage;
