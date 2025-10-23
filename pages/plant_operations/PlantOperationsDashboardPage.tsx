import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3Icon, TrendingUpIcon, ClockIcon } from 'lucide-react';
import FilterSection, { DashboardFilters } from '../../components/plant-operations/FilterSection';
import KPICards from '../../components/plant-operations/KPICards';
import DataVisualization from '../../components/plant-operations/DataVisualization';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { CcrDowntimeData } from '../../types';
import { supabase } from '../../utils/pocketbaseClient';

interface PlantOperationsDashboardPageProps {
  t: Record<string, string>;
}

interface RunningHoursData {
  date: string;
  plant_unit: string;
  total_running_hours: number;
}

// Helper function to generate filter based on date range
const generateDateFilter = (filters: DashboardFilters, parameterIds: string[]): string => {
  // Base filter for parameter IDs
  let filter = `parameter_id ?~ "${parameterIds.join('|')}"`;

  // Apply date filter to reduce data transfer
  if (filters.timeRange === 'daily') {
    filter += ` && date = "${filters.date}"`;
  } else if (filters.timeRange === 'monthly') {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    filter += ` && date >= "${startDateStr}" && date <= "${endDateStr}"`;
  }

  return filter;
};

const PlantOperationsDashboardPage: React.FC<PlantOperationsDashboardPageProps> = ({ t: _t }) => {
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();
  const { loading: downtimeLoading, getAllDowntime } = useCcrDowntimeData();

  const [downtimeData, setDowntimeData] = useState<CcrDowntimeData[]>([]);
  const [runningHoursData, setRunningHoursData] = useState<RunningHoursData[]>([]);
  const [loadingRunningHours, setLoadingRunningHours] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    plantCategory: '',
    plantUnit: '',
    timeRange: 'daily',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    date: new Date().toISOString().split('T')[0],
  });

  // Load downtime data on mount
  useEffect(() => {
    const loadDowntimeData = async () => {
      const data = await getAllDowntime();
      setDowntimeData(data);
    };
    loadDowntimeData();
  }, [getAllDowntime]);

  // Memoized running hours parameter data
  const runningHoursParameters = useMemo(
    () => [
      { id: '1b42e1be-7639-491f-a311-e122d945c42f', unit: 'Cement Mill 420' },
      { id: 'ffeb7485-94b9-49e8-817c-9d3e4a5f3320', unit: 'Cement Mill 320' },
      { id: '6cf46af5-bf07-4df7-9ba6-6aa9b679f87b', unit: 'Cement Mill 220' },
      { id: 'f6de08cb-7f63-4135-aa94-4eaca2947b12', unit: 'Cement Mill 419' },
      { id: 'ad3c23b2-3f4f-4e90-8e2a-c32eb37f78fc', unit: 'Cement Mill 552' },
      { id: 'a9998b7c-fbac-4089-9fce-8bd31d93c86d', unit: 'Cement Mill 553' },
    ],
    []
  );

  // Load running hours data with optimized pagination and error handling
  useEffect(() => {
    const loadRunningHoursData = async () => {
      setLoadingRunningHours(true);
      try {
        // Get parameter IDs
        const parameterIds = runningHoursParameters.map((p) => p.id);

        // Construct optimized filter for parameter_ids
        const filter = generateDateFilter(filters, parameterIds);

        // Use optimized pagination to avoid network issues
        const allFooterData: Array<{
          date: string;
          plant_unit: string | null;
          total: number | null;
          parameter_id: string;
        }> = [];
        const batchSize = 100; // Reduced batch size for stability
        let page = 1;
        let hasMoreData = true;

        while (hasMoreData) {
          try {
            const result = await supabase.collection('ccr_footer_data').getList(page, batchSize, {
              filter: filter,
              fields: 'date,plant_unit,total,parameter_id',
            });

            if (result.items && result.items.length > 0) {
              allFooterData.push(...(result.items as unknown as typeof allFooterData));
              page++;

              // Check if we have more data
              hasMoreData = result.items.length === batchSize;

              // Small delay between batches to prevent network overload
              if (hasMoreData) {
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            } else {
              hasMoreData = false;
            }
          } catch (batchError) {
            // Check if it's a network error
            const isNetworkError =
              batchError instanceof TypeError ||
              (batchError instanceof Error &&
                (batchError.message.includes('network') ||
                  batchError.message.includes('ERR_NETWORK') ||
                  batchError.message.includes('fetch')));

            if (isNetworkError) {
              // Retry once with longer delay for network errors
              await new Promise((resolve) => setTimeout(resolve, 500));
              try {
                const retryResult = await supabase
                  .collection('ccr_footer_data')
                  .getList(page, batchSize, {
                    filter: filter,
                    fields: 'date,plant_unit,total,parameter_id',
                  });
                if (retryResult.items && retryResult.items.length > 0) {
                  allFooterData.push(...(retryResult.items as unknown as typeof allFooterData));
                  page++;
                  hasMoreData = retryResult.items.length === batchSize;
                  continue;
                }
              } catch {
                // Retry failed - stop loading
              }
            }

            // Stop loading more data if we encounter persistent errors
            hasMoreData = false;
          }
        }

        const footerData = allFooterData;
        const footerError = !footerData || footerData.length === 0;

        if (footerError) {
          setRunningHoursData([]);
          return;
        }

        const formattedData: RunningHoursData[] = (
          footerData as unknown as Array<{
            date: string;
            plant_unit: string | null;
            total: number | null;
            parameter_id: string;
          }>
        ).map((item) => {
          // Find the parameter to get the correct unit name
          const param = runningHoursParameters.find((p) => p.id === item.parameter_id);
          return {
            date: item.date,
            plant_unit: param?.unit || item.plant_unit || 'CCR',
            total_running_hours: item.total || 0,
          };
        });

        setRunningHoursData(formattedData);
      } catch (error) {
        // Check if it's a network error
        const isNetworkError =
          error instanceof TypeError ||
          (error instanceof Error &&
            (error.message.includes('network') ||
              error.message.includes('ERR_NETWORK') ||
              error.message.includes('fetch')));

        if (isNetworkError) {
          // Network error detected - data may be incomplete
        }

        setRunningHoursData([]);
      } finally {
        setLoadingRunningHours(false);
      }
    };

    loadRunningHoursData();
  }, [filters, runningHoursParameters]);

  // Calculate availability data
  const availabilityData = useMemo(() => {
    const groupedData: Record<
      string,
      { unit: string; category: string; runningHours: number; downtimeHours: number }
    > = {};

    // Initialize all allowed units with 0 values
    const allowedUnits = [
      'Cement Mill 220',
      'Cement Mill 320',
      'Cement Mill 419',
      'Cement Mill 420',
      'Cement Mill 552',
      'Cement Mill 553',
    ];
    allowedUnits.forEach((unit) => {
      const plantUnit = plantUnits.find((pu) => pu.unit === unit);
      groupedData[unit] = {
        unit: unit,
        category: plantUnit?.category || 'Unknown',
        runningHours: 0,
        downtimeHours: 0,
      };
    });

    // First, aggregate running hours data
    runningHoursData.forEach((record) => {
      const key = `${record.plant_unit}`;
      if (groupedData[key]) {
        if (filters.timeRange === 'daily') {
          // For daily, use running hours for selected date
          if (record.date === filters.date) {
            groupedData[key].runningHours = record.total_running_hours;
          }
        } else {
          // For monthly, accumulate running hours for the selected month
          const recordDate = new Date(record.date);
          if (
            recordDate.getMonth() + 1 === filters.month &&
            recordDate.getFullYear() === filters.year
          ) {
            groupedData[key].runningHours += record.total_running_hours;
          }
        }
      }
    });

    // Then, aggregate downtime data
    downtimeData.forEach((record: CcrDowntimeData) => {
      const key = `${record.unit}`;
      if (groupedData[key]) {
        // Calculate downtime hours from start_time and end_time
        const startTime = new Date(`1970-01-01T${record.start_time}:00`);
        const endTime = new Date(`1970-01-01T${record.end_time}:00`);
        const downtimeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        if (filters.timeRange === 'daily') {
          // For daily, check if downtime is for selected date
          if (record.date === filters.date) {
            groupedData[key].downtimeHours += downtimeHours;
          }
        } else {
          // For monthly, accumulate downtime for the selected month
          const recordDate = new Date(record.date);
          if (
            recordDate.getMonth() + 1 === filters.month &&
            recordDate.getFullYear() === filters.year
          ) {
            groupedData[key].downtimeHours += downtimeHours;
          }
        }
      }
    });

    return Object.values(groupedData);
  }, [runningHoursData, downtimeData, plantUnits, filters]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    return availabilityData.filter((item) => {
      // If plant category is selected, filter by category
      if (filters.plantCategory && item.category !== filters.plantCategory) return false;

      // If plant unit is selected, filter by unit
      if (filters.plantUnit && item.unit !== filters.plantUnit) return false;

      // If no plant category is selected (All Categories), only show specific units
      if (!filters.plantCategory) {
        const allowedUnits = [
          'Cement Mill 220',
          'Cement Mill 320',
          'Cement Mill 419',
          'Cement Mill 420',
          'Cement Mill 552',
          'Cement Mill 553',
        ];
        return allowedUnits.includes(item.unit);
      }

      return true;
    });
  }, [availabilityData, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalUnits = filteredData.length;
    const avgAvailability =
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => {
            const totalHours =
              filters.timeRange === 'daily'
                ? 24
                : new Date(filters.year, filters.month + 1, 0).getDate() * 24;
            if (totalHours === 0) return sum;
            const availability = ((item.runningHours - item.downtimeHours) / totalHours) * 100;
            return sum + availability;
          }, 0) / filteredData.length
        : 0;

    const safeAvgAvailability = isNaN(avgAvailability) ? 0 : avgAvailability;

    const totalDowntime = filteredData.reduce((sum, item) => sum + (item.downtimeHours || 0), 0);
    const totalRunningHours = filteredData.reduce((sum, item) => sum + (item.runningHours || 0), 0);

    return [
      {
        id: 'total-units',
        title: 'Total Units',
        value: totalUnits,
        unit: '',
        trend: { value: 0, isPositive: true },
        icon: <BarChart3Icon className="w-5 h-5" />,
        status: 'normal' as const,
        target: undefined,
      },
      {
        id: 'avg-availability',
        title: 'Average Availability',
        value: Math.round(safeAvgAvailability),
        unit: '%',
        trend: { value: 2.5, isPositive: true },
        icon: <TrendingUpIcon className="w-5 h-5" />,
        status: 'normal' as const,
        target: 95,
      },
      {
        id: 'total-running-hours',
        title: 'Total Running Hours',
        value: Math.round(isNaN(totalRunningHours) ? 0 : totalRunningHours),
        unit: 'hours',
        trend: { value: 1.2, isPositive: true },
        icon: <ClockIcon className="w-5 h-5" />,
        status: 'normal' as const,
        target: undefined,
      },
      {
        id: 'total-downtime',
        title: 'Total Downtime',
        value: Math.round(isNaN(totalDowntime) ? 0 : totalDowntime),
        unit: 'hours',
        trend: { value: -5.2, isPositive: false },
        icon: <ClockIcon className="w-5 h-5" />,
        status: totalDowntime > 10 ? ('critical' as const) : ('normal' as const),
        target: undefined,
      },
    ];
  }, [filteredData, filters]);

  // Memoize filter change handler to prevent unnecessary re-renders
  const handleFilterChange = useCallback((key: keyof DashboardFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Memoize filter reset handler to prevent unnecessary re-renders
  const handleResetFilters = useCallback(() => {
    setFilters({
      plantCategory: '',
      plantUnit: '',
      timeRange: 'daily',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      date: new Date().toISOString().split('T')[0],
    });
  }, []);

  if (plantUnitsLoading || downtimeLoading || loadingRunningHours) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <BarChart3Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Plant Operations Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor plant availability and performance metrics
          </p>
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                filters.timeRange === 'daily'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}
            >
              {filters.timeRange === 'daily' ? 'Data Harian' : 'Data Bulanan'}
            </span>
          </div>
        </div>
      </motion.div>

      <FilterSection
        filters={filters}
        plantUnits={plantUnits}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={false}
      />

      <KPICards kpis={kpis} isLoading={false} />

      <DataVisualization
        riskData={[]} // Placeholder
        ccrDataLength={filteredData.length}
        siloCapacitiesLength={0} // Placeholder
        availabilityData={filteredData}
        timeRange={filters.timeRange}
        month={filters.month}
        year={filters.year}
        date={filters.date}
      />
    </div>
  );
};

export default PlantOperationsDashboardPage;

