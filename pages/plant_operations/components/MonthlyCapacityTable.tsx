import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardFilters } from '../../../components/plant-operations/FilterSection';
import { useProductionCapacity } from '../../../hooks/useProductionCapacity';
import { formatNumber } from '../../../utils/formatters';

interface MonthlyCapacityTableProps {
  filters: DashboardFilters;
  plantUnit: string;
}

interface DailyCapacity {
  id: string;
  date: string;
  wet: number;
  dry: number;
  moisture: number;
}

const MonthlyCapacityTable: React.FC<MonthlyCapacityTableProps> = ({ filters, plantUnit }) => {
  const { getMonthlyCapacity } = useProductionCapacity();
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full mb-8"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-bold text-slate-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Monthly Capacity Report - {plantUnit}
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Periode:{' '}
            {new Date(filters.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-sm font-medium text-emerald-600 mb-1">Total Wet Production</p>
              <p className="text-2xl font-bold text-emerald-700">
                {loading ? '...' : formatNumber(totalWet)} Ton
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-600 mb-1">Total Dry Production</p>
              <p className="text-2xl font-bold text-blue-700">
                {loading ? '...' : formatNumber(totalDry)} Ton
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-sm font-medium text-amber-600 mb-1">Avg Moisture</p>
              <p className="text-2xl font-bold text-amber-700">
                {loading ? '...' : avgMoisture.toFixed(2)} %
              </p>
            </div>
          </div>

          <div className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Moisture (%)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Wet (Ton)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Dry (Ton)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Loading data...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-red-500 font-medium">
                        {error}
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No data available for this month.
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {new Date(row.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">
                          {row.moisture?.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                          {formatNumber(row.wet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
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
    </motion.div>
  );
};

export default MonthlyCapacityTable;
