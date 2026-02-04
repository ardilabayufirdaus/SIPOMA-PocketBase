import React, { useState } from 'react';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

import FilterSection, { DashboardFilters } from '../../components/plant-operations/FilterSection';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import MoistureContentTable from './components/MoistureContentTable';
import ProductionCapacityTable from './components/ProductionCapacityTable';
import MonthlyCapacityTable from './components/MonthlyCapacityTable';

interface MonitoringPageProps {
  t: Record<string, string>;
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({ t }) => {
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

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

  const isMonthlyView = filters.viewMode === 'monthly';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="w-full space-y-6">
        {/* Header Section - Ubuntu Theme */}
        <div className="relative overflow-hidden bg-gradient-to-r from-ubuntu-aubergine via-ubuntu-midAubergine to-ubuntu-darkAubergine rounded-2xl shadow-xl border border-ubuntu-warmGrey/20 p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-ubuntu-orange/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-inner">
              <PresentationChartLineIcon className="w-7 h-7 text-ubuntu-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight font-display">
                {t.op_monitoring || 'Monitoring'}
              </h1>
              <p className="text-sm text-ubuntu-warmGrey/90 font-medium mt-0.5">
                {t.monitoring_description ||
                  'Real-time equipment status monitoring with live data insights'}
              </p>
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
          <div className="w-full space-y-8">
            {isMonthlyView ? (
              <MonthlyCapacityTable filters={filters} plantUnit={filters.plantUnit} />
            ) : (
              <>
                <ProductionCapacityTable filters={filters} plantUnit={filters.plantUnit} />
                <MoistureContentTable filters={filters} plantUnit={filters.plantUnit} />
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-slate-200/60 p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-ubuntu-orange to-orange-600 rounded-xl mx-auto mb-5 flex items-center justify-center shadow-lg">
                <PresentationChartLineIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 font-display">
                {t.monitoring_dashboard_title || 'Equipment Monitoring Dashboard'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {t.monitoring_dashboard_description ||
                  'Select a plant unit to view real-time moisture content monitoring data and trends.'}
              </p>
              <div className="bg-slate-50 rounded-lg p-4 inline-block border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t.current_filters || 'Current Filters'}
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Category:</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                      {filters.plantCategory || 'All'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Unit:</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                      {filters.plantUnit || 'None selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Date:</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                      {filters.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">View:</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200 uppercase text-xs">
                      {filters.viewMode || 'DAILY'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;
