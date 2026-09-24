import React, { useEffect, useState } from 'react';
import { DashboardFilters } from '../../../components/plant-operations/FilterSection';
import { useProductionCapacity } from '../../../hooks/useProductionCapacity';
import { useRkcProductionCapacity } from '../../../hooks/useRkcProductionCapacity';
import { formatNumber, formatDate } from '../../../utils/formatters';

interface MonthlyCapacityTableProps {
  filters: DashboardFilters;
  plantUnit: string;
  section?: 'CM' | 'RKC' | 'Derivative';
}

interface DailyCapacity {
  id: string;
  date: string;
  wet: number;
  dry: number;
  moisture: number;
}

const MonthlyCapacityTable: React.FC<MonthlyCapacityTableProps> = ({
  filters,
  plantUnit,
  section = 'CM',
}) => {
  const cmCap = useProductionCapacity();
  const rkcCap = useRkcProductionCapacity();
  const getMonthlyCapacity =
    section === 'RKC' ? rkcCap.getMonthlyCapacity : cmCap.getMonthlyCapacity;
  const [data, setData] = useState<DailyCapacity[]>([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalWet, setTotalWet] = useState(0);
  const [totalDry, setTotalDry] = useState(0);
  const [avgMoisture, setAvgMoisture] = useState(0);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!filters.date || !plantUnit) return;

      const month = filters.date.substring(0, 7); // "2023-12"

      setLoading(true);
      setError(null);
      try {
        const result = await getMonthlyCapacity(month, plantUnit, filters.plantCategory);

        if (result === null) {
          setError('Failed to load data (Network Error)');
          setData([]);
          setTotalWet(0);
          setTotalDry(0);
          setAvgMoisture(0);
          return;
        }

        const typedResult = result as unknown as DailyCapacity[];
        setData(typedResult);

        // Calculate totals
        if (typedResult.length > 0) {
          const wet = typedResult.reduce((sum, item) => sum + (item.wet || 0), 0);
          const dry = typedResult.reduce((sum, item) => sum + (item.dry || 0), 0);
          // Simple average of daily averages is acceptable for high level view
          const moist =
            typedResult.reduce((sum, item) => sum + (item.moisture || 0), 0) / typedResult.length;

          setTotalWet(wet);
          setTotalDry(dry);
          setAvgMoisture(moist);
        } else {
          setTotalWet(0);
          setTotalDry(0);
          setAvgMoisture(0);
        }
      } catch (e) {
        console.error(e);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [filters.date, plantUnit, filters.plantCategory, getMonthlyCapacity]);

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 shadow-2xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                Monthly Capacity Report - {plantUnit}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Periode:{' '}
                {new Date(filters.date).toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-lg p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary-600/10 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110"></div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5 relative z-10">
                Total Wet Production
              </p>
              <p className="text-xl font-bold font-mono text-primary-600 dark:text-primary-400 relative z-10">
                {loading ? '...' : formatNumber(totalWet)}{' '}
                <span className="text-xs font-normal text-slate-400">Ton</span>
              </p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-lg p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-secondary-900/10 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110"></div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5 relative z-10">
                Total Dry Production
              </p>
              <p className="text-xl font-bold font-mono text-secondary-900 dark:text-slate-100 relative z-10">
                {loading ? '...' : formatNumber(totalDry)}{' '}
                <span className="text-xs font-normal text-slate-400">Ton</span>
              </p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-lg p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110"></div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5 relative z-10">
                Avg Moisture
              </p>
              <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 relative z-10">
                {loading ? '...' : avgMoisture.toFixed(2)} %
              </p>
            </div>
          </div>

          <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-700 dark:bg-slate-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right text-[11px] font-bold text-white uppercase tracking-wider"
                    >
                      Moisture (%)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right text-[11px] font-bold text-white uppercase tracking-wider"
                    >
                      Wet (Ton)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right text-[11px] font-bold text-white uppercase tracking-wider"
                    >
                      Dry (Ton)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                        Loading data...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-xs text-rose-500 font-medium"
                      >
                        {error}
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                        No data available for this month.
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr
                        key={row.id}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300 text-right">
                          {row.moisture?.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono font-bold text-primary-600 dark:text-primary-400 text-right">
                          {formatNumber(row.wet)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono font-bold text-secondary-900 dark:text-slate-100 text-right">
                          {formatNumber(row.dry)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCapacityTable;
