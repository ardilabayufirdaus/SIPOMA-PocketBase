import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCw, BarChart3, History } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import OeeDashboardSection from '../../components/plant_operations/OeeDashboardSection';
import { usePlantOperationsDataOptimizer } from '../../hooks/usePlantOperationsDataOptimizer';

interface PlantOperationsDashboardPageProps {
  t: Record<string, string>;
  section?: 'CM' | 'RKC';
}

const PlantOperationsDashboardPage: React.FC<PlantOperationsDashboardPageProps> = ({
  t,
  section = 'CM',
}) => {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const { clearQueryCache } = usePlantOperationsDataOptimizer();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearQueryCache();
    // Logic inside OeeDashboardSection will re-fetch data because clearQueryCache triggers setDataVersion in some hooks
    // or simply by re-mounting/re-triggering the fetch calls.
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [clearQueryCache]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Background Elements - Ubuntu Style */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-ubuntu-aubergine/5 blur-[120px] rounded-full" />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-ubuntu-orange/5 blur-[120px] rounded-full"
        style={{ animationDelay: '2s' }}
      />

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-ubuntu-orange to-transparent rounded-full" />
            <span className="text-[10px] font-black text-ubuntu-orange uppercase tracking-[0.3em] mb-2 block ml-2">
              Plant Operations
            </span>
            <h1 className="text-5xl font-black text-ubuntu-aubergine tracking-tighter font-display">
              {section} Operations
            </h1>
            <p className="text-ubuntu-warmGrey text-sm mt-2 ml-2 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ubuntu-orange animate-pulse" />
              Real-time Monitoring & Analytics
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 bg-white/60 backdrop-blur-2xl p-1.5 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50"
          >
            {/* Date Picker Section */}
            <div
              onClick={() => dateInputRef.current?.showPicker()}
              className="flex items-center gap-3 px-6 py-3.5 group cursor-pointer relative hover:bg-white/60 transition-all rounded-[1.6rem]"
            >
              <Calendar className="w-5 h-5 text-ubuntu-orange" />
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
              className={`p-4 hover:bg-white/80 transition-all rounded-[1.6rem] group relative ${isRefreshing ? 'bg-white/80' : ''}`}
              title="Synchronize Data"
            >
              <RefreshCw
                className={`w-5 h-5 text-slate-500 group-hover:text-ubuntu-orange transition-all duration-500 ${isRefreshing ? 'animate-spin text-ubuntu-orange' : ''}`}
              />
              {isRefreshing && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-ubuntu-orange rounded-full animate-ping" />
              )}
            </button>
          </motion.div>
        </header>

        {/* Main Dashboard Content */}
        <main>
          {/* OEE Section */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ubuntu-aubergine to-ubuntu-darkAubergine flex items-center justify-center shadow-lg shadow-ubuntu-aubergine/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight font-display">
                  Plant Performance Analytics
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange/40" />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                    Core Efficiency Metrics
                  </span>
                </div>
              </div>
            </div>

            <OeeDashboardSection date={selectedDate} selectedUnit="all" />
          </section>
        </main>
      </div>
    </div>
  );
};

const CardContainer: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50"
  >
    <div className="flex items-center gap-3 mb-6">
      {icon}
      <h3 className="text-lg font-bold text-slate-700">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export default PlantOperationsDashboardPage;
