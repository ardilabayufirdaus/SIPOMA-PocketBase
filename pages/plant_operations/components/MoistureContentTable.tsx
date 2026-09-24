import React from 'react';
import { DashboardFilters } from '../../../components/plant-operations/FilterSection';
import { useMoistureData } from '../../../hooks/useMoistureData';
import MoistureChart from './MoistureChart';

interface MoistureContentTableProps {
  filters: DashboardFilters;
  plantUnit: string;
  section?: 'CM' | 'RKC' | 'Derivative';
}

const MoistureContentTable: React.FC<MoistureContentTableProps> = ({
  filters,
  plantUnit,
  section = 'CM',
}) => {
  const { data: moistureData, loading, error } = useMoistureData(filters, plantUnit, section);

  const formatValue = (value: number | null): string => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  // Filter data to show only rows with data
  const filteredMoistureData = React.useMemo(() => {
    return moistureData.filter(
      (row) =>
        row.gypsum !== null || row.trass !== null || row.limestone !== null || row.total !== null
    );
  }, [moistureData]);

  // Calculate averages based on filtered data
  const averages = React.useMemo(() => {
    if (filteredMoistureData.length === 0)
      return { gypsum: null, trass: null, limestone: null, total: null };

    const validGypsum = filteredMoistureData
      .map((d) => d.gypsum)
      .filter((v) => v !== null && !isNaN(v));
    const validTrass = filteredMoistureData
      .map((d) => d.trass)
      .filter((v) => v !== null && !isNaN(v));
    const validLimestone = filteredMoistureData
      .map((d) => d.limestone)
      .filter((v) => v !== null && !isNaN(v));
    const validTotal = filteredMoistureData
      .map((d) => d.total)
      .filter((v) => v !== null && !isNaN(v));

    return {
      gypsum:
        validGypsum.length > 0
          ? validGypsum.reduce((sum, val) => sum + val, 0) / validGypsum.length
          : null,
      trass:
        validTrass.length > 0
          ? validTrass.reduce((sum, val) => sum + val, 0) / validTrass.length
          : null,
      limestone:
        validLimestone.length > 0
          ? validLimestone.reduce((sum, val) => sum + val, 0) / validLimestone.length
          : null,
      total:
        validTotal.length > 0
          ? validTotal.reduce((sum, val) => sum + val, 0) / validTotal.length
          : null,
    };
  }, [filteredMoistureData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="text-center py-10">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">
            Loading real-time moisture data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl shadow-xs border border-rose-200 dark:border-rose-800/60 p-6 sm:p-8">
        <div className="text-center py-8">
          <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">
            Error loading moisture data: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Table Section */}
        <div className="min-h-[480px]">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center shadow-2xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                    % Moisture Content - {plantUnit}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time data for {filters.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[440px] flex-1">
              <table className="w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-700 dark:bg-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">
                      Hour
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">
                      Gypsum (%)
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">
                      Trass (%)
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">
                      Limestone (%)
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider">
                      % Total Moisture
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMoistureData.map((row) => (
                    <tr
                      key={row.hour}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {row.hour}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {formatValue(row.gypsum)}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {formatValue(row.trass)}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {formatValue(row.limestone)}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50/60 dark:bg-primary-950/30">
                        {formatValue(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                      Average
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      {formatValue(averages.gypsum)}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      {formatValue(averages.trass)}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      {formatValue(averages.limestone)}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-100/70 dark:bg-primary-950/60">
                      {formatValue(averages.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Formula: (Set Feeder × H2O) ÷ 100
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        {filteredMoistureData.length > 0 && (
          <div className="min-h-[480px]">
            <MoistureChart
              data={filteredMoistureData}
              title={`Moisture Content Trends - ${plantUnit} (${filters.date})`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MoistureContentTable;
