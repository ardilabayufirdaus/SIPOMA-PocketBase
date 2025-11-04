import React, { useState } from 'react';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';
import FilterSection, { DashboardFilters } from '../../components/plant-operations/FilterSection';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import MoistureContentTable from './components/MoistureContentTable';

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
    });
  };

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <div className="h-full p-6 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-500/20 rounded-xl">
              <PresentationChartLineIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {t.op_monitoring || 'Monitoring'}
              </h1>
              <p className="text-slate-600 mt-1">Real-time equipment status monitoring</p>
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

        {/* Moisture Content Table */}
        {filters.plantUnit && (
          <div className="mt-6">
            <MoistureContentTable filters={filters} plantUnit={filters.plantUnit} />
          </div>
        )}

        {/* Placeholder when no unit selected */}
        {!filters.plantUnit && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-center py-12">
              <PresentationChartLineIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Equipment Monitoring Dashboard
              </h3>
              <p className="text-slate-600 mb-4">
                Select a plant unit to view moisture content monitoring data.
              </p>
              <div className="text-sm text-slate-500">
                <p>Current Filters:</p>
                <p>Plant Category: {filters.plantCategory || 'All'}</p>
                <p>Plant Unit: {filters.plantUnit || 'None selected'}</p>
                <p>Date: {filters.date}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;
