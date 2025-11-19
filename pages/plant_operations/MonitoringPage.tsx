import React, { useState } from 'react';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <div className="w-full h-full p-6 overflow-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg"
            >
              <PresentationChartLineIcon className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                {t.op_monitoring || 'Monitoring'}
              </h1>
              <p className="text-slate-700 mt-2 text-lg">
                Real-time equipment status monitoring with live data insights
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <FilterSection
            filters={filters}
            plantUnits={plantUnits || []}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            isLoading={plantUnitsLoading}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filters.plantUnit ? (
            <div className="w-full">
              <MoistureContentTable filters={filters} plantUnit={filters.plantUnit} />
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="text-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center"
                >
                  <PresentationChartLineIcon className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Equipment Monitoring Dashboard
                </h3>
                <p className="text-slate-600 mb-6 text-lg">
                  Select a plant unit to view real-time moisture content monitoring data and trends.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 inline-block">
                  <p className="text-sm font-medium text-slate-700 mb-2">Current Filters:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <p>
                      <span className="font-medium">Plant Category:</span>{' '}
                      {filters.plantCategory || 'All'}
                    </p>
                    <p>
                      <span className="font-medium">Plant Unit:</span>{' '}
                      {filters.plantUnit || 'None selected'}
                    </p>
                    <p className="col-span-2">
                      <span className="font-medium">Date:</span> {filters.date}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MonitoringPage;
