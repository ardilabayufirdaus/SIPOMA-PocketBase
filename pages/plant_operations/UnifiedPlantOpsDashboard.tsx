import { useEffect, useState } from 'react';
import { usePlantOperationsDataOptimizer } from '../../hooks/usePlantOperationsDataOptimizer';
import { formatDate } from '../../utils/dateUtils';
import DataTable from '../../components/DataTable';

/**
 * Unified Plant Operations Dashboard that demonstrates the optimized data loading
 * with the usePlantOperationsDataOptimizer hook
 */
export default function UnifiedPlantOpsDashboard() {
  // States
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [parameterData, setParameterData] = useState<any[]>([]);
  const [siloData, setSiloData] = useState<any[]>([]);
  const [downtimeData, setDowntimeData] = useState<any[]>([]);
  const [informationData, setInformationData] = useState<any[]>([]);

  // Use the optimizer hook
  const {
    loadAllPlantOperationsData,
    isCachingEnabled,
    isBatchingEnabled,
    toggleQueryCaching,
    toggleBatching,
    clearQueryCache,
  } = usePlantOperationsDataOptimizer();

  // Function to load all data at once
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const result = await loadAllPlantOperationsData(selectedDate, selectedUnit);

      // Set all data from the optimized batch loading
      setParameterData(result.parameterData || []);
      setSiloData(result.siloData || []);
      setDowntimeData(result.downtimeData || []);
      setInformationData(result.informationData || []);

      console.log('Data loaded successfully');
    } catch (error: any) {
      console.error('Error loading plant operations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data initially and when date/unit changes
  useEffect(() => {
    loadAllData();
  }, [selectedDate, selectedUnit]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Plant Operations Dashboard (Optimized)
        </h1>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <div className="relative group/date">
              <div className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono text-sm min-w-[130px] flex items-center justify-between pointer-events-none">
                <span>{selectedDate ? formatDate(selectedDate) : '--/--/----'}</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Plant unit selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plant Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
              disabled={isLoading}
            >
              <option value="all">All Units</option>
              <option value="ccr1">CCR 1</option>
              <option value="ccr2">CCR 2</option>
              <option value="ccr3">CCR 3</option>
              <option value="ccr4">CCR 4</option>
              <option value="ccr5">CCR 5</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={loadAllData}
            disabled={isLoading}
            aria-label="Refresh Data"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[44px]"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Optimization controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Performance Optimization Controls
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => toggleQueryCaching(!isCachingEnabled)}
            aria-label={`Toggle Query Cache (${isCachingEnabled ? 'ON' : 'OFF'})`}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isCachingEnabled
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Query Cache: {isCachingEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => toggleBatching(!isBatchingEnabled)}
            aria-label={`Toggle Batch Loading (${isBatchingEnabled ? 'ON' : 'OFF'})`}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isBatchingEnabled
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Batch Loading: {isBatchingEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => clearQueryCache()}
            aria-label="Clear Cache"
            className="min-h-[44px] px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Data summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Parameter Data</h3>
          <p className="text-2xl font-bold text-slate-900">{parameterData.length}</p>
          <p className="text-xs text-slate-500">Records loaded</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Silo Data</h3>
          <p className="text-2xl font-bold text-slate-900">{siloData.length}</p>
          <p className="text-xs text-slate-500">Records loaded</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Downtime Data</h3>
          <p className="text-2xl font-bold text-slate-900">{downtimeData.length}</p>
          <p className="text-xs text-slate-500">Records loaded</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Information Data</h3>
          <p className="text-2xl font-bold text-slate-900">{informationData.length}</p>
          <p className="text-xs text-slate-500">Records loaded</p>
        </div>
      </div>

      {/* Parameter Data Table */}
      {parameterData.length > 0 && !isLoading && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Parameter Data</h2>
          <DataTable
            rows={parameterData.slice(0, 10)}
            columns={[
              { field: 'id', headerName: 'ID', width: 70 },
              { field: 'date', headerName: 'Date', width: 120 },
              { field: 'plant_unit', headerName: 'Plant Unit', width: 120 },
              { field: 'parameter_id', headerName: 'Parameter ID', width: 120 },
              { field: 'created', headerName: 'Created', width: 180 },
            ]}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disablePagination={true}
          />
          {parameterData.length > 10 && (
            <p className="text-sm text-slate-500 mt-2">
              Showing 10 of {parameterData.length} records
            </p>
          )}
        </div>
      )}

      {/* Performance metrics */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-slate-700">Data Optimization Status:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                isCachingEnabled && isBatchingEnabled
                  ? 'bg-green-100 text-green-800'
                  : isCachingEnabled || isBatchingEnabled
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
              }`}
            >
              {isCachingEnabled && isBatchingEnabled
                ? 'Fully Optimized'
                : isCachingEnabled || isBatchingEnabled
                  ? 'Partially Optimized'
                  : 'Not Optimized'}
            </span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Query Caching:</span>
            <span className={`ml-2 ${isCachingEnabled ? 'text-green-600' : 'text-blue-600'}`}>
              {isCachingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Batch Loading:</span>
            <span className={`ml-2 ${isBatchingEnabled ? 'text-green-600' : 'text-blue-600'}`}>
              {isBatchingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
