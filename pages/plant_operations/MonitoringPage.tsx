import React, { useState } from 'react';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

import FilterSection, { DashboardFilters } from '../../components/plant-operations/FilterSection';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useRkcPlantUnits } from '../../hooks/useRkcPlantUnits';
import MoistureContentTable from './components/MoistureContentTable';
import ProductionCapacityTable from './components/ProductionCapacityTable';
import MonthlyCapacityTable from './components/MonthlyCapacityTable';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface MonitoringPageProps {
  t: Record<string, string>;
  section?: 'CM' | 'RKC' | 'Derivative';
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({ t, section = 'CM' }) => {
  const cmUnits = usePlantUnits();
  const rkcUnits = useRkcPlantUnits();
  const plantUnits = section === 'RKC' ? rkcUnits.records : cmUnits.records;
  const plantUnitsLoading = section === 'RKC' ? rkcUnits.loading : cmUnits.loading;

  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState<DashboardFilters>({
    plantCategory: '',
    plantUnit: '',
    date: today,
    searchQuery: '',
    viewMode: 'daily', // Default to daily
  });

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({
      plantCategory: '',
      plantUnit: '',
      date: today,
      searchQuery: '',
      viewMode: 'daily',
    });
  };

  const handleSelectFirstUnit = () => {
    if (plantUnits && plantUnits.length > 0) {
      setFilters((prev) => ({
        ...prev,
        plantCategory: plantUnits[0].category,
        plantUnit: plantUnits[0].unit,
      }));
    }
  };

  const isMonthlyView = filters.viewMode === 'monthly';

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <PresentationChartLineIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  {section === 'RKC' ? 'RKC Plant Operations' : 'CM Plant Operations'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  Equipment Monitoring
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t.op_monitoring || 'Equipment Monitoring'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                {t.monitoring_description ||
                  'Real-time equipment capacity and moisture content monitoring with live insights'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xs">
            <RealtimeIndicator
              isConnected={true}
              lastUpdate={new Date()}
              className="text-xs text-slate-300 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterSection
        filters={filters}
        plantUnits={plantUnits || []}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={plantUnitsLoading}
      />

      {/* Content */}
      {filters.plantUnit ? (
        <div className="w-full space-y-4 sm:space-y-5">
          {isMonthlyView ? (
            <MonthlyCapacityTable
              filters={filters}
              plantUnit={filters.plantUnit}
              section={section}
            />
          ) : (
            <>
              <ProductionCapacityTable
                filters={filters}
                plantUnit={filters.plantUnit}
                section={section}
              />
              <MoistureContentTable
                filters={filters}
                plantUnit={filters.plantUnit}
                section={section}
              />
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="text-center py-6 max-w-lg mx-auto">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/50 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-xs">
              <PresentationChartLineIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 font-display">
              {t.monitoring_dashboard_title || 'Equipment Monitoring Dashboard'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {t.monitoring_dashboard_description ||
                'Select a plant unit from the filter controls above or click the button below to view monitoring data and trend analysis.'}
            </p>

            <div className="mb-5">
              <EnhancedButton
                variant="primary"
                size="sm"
                onClick={handleSelectFirstUnit}
                disabled={!plantUnits || plantUnits.length === 0}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all min-h-[36px]"
                ariaLabel="Select Default Unit"
              >
                Pilih Unit Default ({plantUnits?.[0]?.unit || 'Memuat...'})
              </EnhancedButton>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3.5 inline-block border border-slate-200 dark:border-slate-700/80 w-full text-left sm:text-center">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t.current_filters || 'Current Filters'}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Category:
                  </span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs">
                    {filters.plantCategory || 'All'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Unit:</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    {filters.plantUnit || 'None selected'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Date:</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs">
                    {filters.date}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">View:</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 uppercase font-mono text-[10px] font-bold">
                    {filters.viewMode || 'DAILY'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;
