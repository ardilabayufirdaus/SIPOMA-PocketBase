import React, { useState, useCallback } from 'react';
import { formatDate } from '../../utils/dateUtils';
import OeeDashboardSection from '../../components/plant_operations/OeeDashboardSection';
import { usePlantOperationsDataOptimizer } from '../../hooks/usePlantOperationsDataOptimizer';
import PredictiveMaintenance from '../../components/monitoring/PredictiveMaintenance';
import { useServerStats } from '../../hooks/useServerStats';
import { Server, Zap, Thermometer, Activity, Calendar, RefreshCw, BarChart3 } from 'lucide-react';

interface PlantOperationsDashboardPageProps {
  t: Record<string, string>;
  section?: 'CM' | 'RKC';
}

const PlantOperationsDashboardPage: React.FC<PlantOperationsDashboardPageProps> = ({
  section = 'CM',
}) => {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const { clearQueryCache } = usePlantOperationsDataOptimizer();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearQueryCache();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [clearQueryCache]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden font-sans pb-20 md:pb-0">
      {/* Main Content */}
      <div className="relative z-10 p-3 md:p-8 max-w-[1600px] mx-auto">
        {/* Server Health Mini Monitoring */}
        <div className="hidden sm:block">
          <ServerHealthHeader />
        </div>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="relative">
            <div className="absolute -left-3 md:-left-4 top-0 w-1 h-full bg-gradient-to-b from-primary-600 to-emerald-600 rounded-full" />
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[.3em] mb-1.5 block ml-3 md:ml-2">
              Plant Operations
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter font-display ml-3 md:ml-0">
              {section} Operations
            </h1>
            <p className="text-slate-500 text-[11px] md:text-sm mt-1 ml-3 md:ml-2 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Real-time Monitoring & Analytics
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-md">
            {/* Date Picker Section */}
            <div
              onClick={() => dateInputRef.current?.showPicker()}
              className="flex items-center gap-3 px-6 py-3.5 group cursor-pointer relative hover:bg-slate-50 transition-all rounded-[1.6rem]"
            >
              <Calendar className="w-5 h-5 text-primary-600" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                  Observation Date
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {formatDate(new Date(selectedDate), 'MM/dd/yyyy')}
                </span>
              </div>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
              />
            </div>

            <div className="w-px h-10 bg-slate-200/50 mx-1" />

            {/* Refresh Section */}
            <button
              onClick={handleRefresh}
              className={`p-4 hover:bg-slate-50 transition-all rounded-[1.6rem] group relative ${isRefreshing ? 'bg-slate-100' : ''}`}
              title="Synchronize Data"
            >
              <RefreshCw
                className={`w-5 h-5 text-slate-500 group-hover:text-primary-600 transition-all duration-300 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`}
              />
            </button>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main>
          {/* OEE Section */}
          <section className="mb-12 md:mb-20">
            <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-10">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-secondary-900 flex items-center justify-center shadow-lg shadow-slate-900/20 flex-shrink-0">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-display">
                  Performance Analytics
                </h2>
                <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary-600/40"
                      />
                    ))}
                  </div>
                  <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                    Core Metrics
                  </span>
                </div>
              </div>
            </div>

            <OeeDashboardSection date={selectedDate} selectedUnit="all" />
          </section>

          {/* Predictive Maintenance Section */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-secondary-900 flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight font-display">
                  Intelligent Asset Health
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-600/40" />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                    AI-Driven Predictive Insights
                  </span>
                </div>
              </div>
            </div>

            <PredictiveMaintenance plantUnit={section === 'CM' ? 'all' : 'RKC Unit'} />
          </section>
        </main>
      </div>
    </div>
  );
};

const ServerHealthHeader: React.FC = () => {
  const { stats } = useServerStats();

  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center gap-6 mb-8 px-6 py-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-slate-700" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          System Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
            Load
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">{stats.load.split(' ')[0]}</span>
            <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600"
                style={{ width: `${Math.min(parseFloat(stats.load) * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
            Memory
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">Active</span>
            <Activity className="w-3 h-3 text-emerald-500" />
          </div>
        </div>

        {stats.temp && (
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
              Temp
            </span>
            <div className="flex items-center gap-1">
              <Thermometer
                className={`w-3 h-3 ${parseFloat(stats.temp) > 70 ? 'text-red-500' : 'text-slate-400'}`}
              />
              <span className="text-xs font-bold text-slate-700">{stats.temp}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-100">
          <div
            className={`w-2 h-2 rounded-full ${stats.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
            Core Engine {stats.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlantOperationsDashboardPage;
