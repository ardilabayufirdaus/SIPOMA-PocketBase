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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Plant Operations Dashboard (Optimized)
        </h1>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              disabled={isLoading}
            />
          </div>

          {/* Plant unit selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Plant Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Optimization controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Performance Optimization Controls
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toggleQueryCaching(!isCachingEnabled)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isCachingEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            Query Cache: {isCachingEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => toggleBatching(!isBatchingEnabled)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isBatchingEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            Batch Loading: {isBatchingEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => clearQueryCache()}
            className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium transition-colors"
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
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Parameter Data</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {parameterData.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Records loaded</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Silo Data</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{siloData.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Records loaded</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Downtime Data</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {downtimeData.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Records loaded</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Information Data
          </h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {informationData.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Records loaded</p>
        </div>
      </div>

      {/* Parameter Data Table */}
      {parameterData.length > 0 && !isLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Parameter Data
          </h2>
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Showing 10 of {parameterData.length} records
            </p>
          )}
        </div>
      )}

      {/* Performance metrics */}
      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Data Optimization Status:
            </span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                isCachingEnabled && isBatchingEnabled
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : isCachingEnabled || isBatchingEnabled
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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
            <span className="font-medium text-slate-700 dark:text-slate-300">Query Caching:</span>
            <span className={`ml-2 ${isCachingEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {isCachingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Batch Loading:</span>
            <span className={`ml-2 ${isBatchingEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {isBatchingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
