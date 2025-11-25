import React from 'react';
import { motion } from 'framer-motion';
import { DashboardFilters } from '../../../components/plant-operations/FilterSection';
import { useMoistureData } from '../../../hooks/useMoistureData';
import MoistureChart from './MoistureChart';

interface MoistureContentTableProps {
  filters: DashboardFilters;
  plantUnit: string;
}

const MoistureContentTable: React.FC<MoistureContentTableProps> = ({ filters, plantUnit }) => {
  const { data: moistureData, loading, error } = useMoistureData(filters, plantUnit);

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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8"
      >
        <div className="text-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"
          ></motion.div>
          <p className="text-slate-700 text-lg">Loading real-time moisture data...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-50/90 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/50 p-8"
      >
        <div className="text-center py-16">
          <p className="text-red-600 text-lg font-medium">Error loading moisture data: {error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="min-h-[600px]"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden h-full">
            <div className="px-8 py-6 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-bold text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                % Moisture Content - {plantUnit}
              </h3>
              <p className="text-sm text-slate-600 mt-2">Real-time data for {filters.date}</p>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Hour
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Gypsum (%)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Trass (%)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Limestone (%)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      % Total Moisture
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-200/50">
                  {filteredMoistureData.map((row, index) => (
                    <motion.tr
                      key={row.hour}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.hour}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {formatValue(row.gypsum)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {formatValue(row.trass)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {formatValue(row.limestone)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600 bg-blue-50/50 rounded-lg mx-2">
                        {formatValue(row.total)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-blue-100 to-purple-100 border-t-2 border-slate-300">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">Average</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatValue(averages.gypsum)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatValue(averages.trass)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatValue(averages.limestone)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600 bg-blue-200/50 rounded-lg mx-2">
                      {formatValue(averages.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200/50">
              <p className="text-xs text-slate-600 font-medium">
                Formula: (Set Feeder × H2O) ÷ 100
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chart Section */}
        {filteredMoistureData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="min-h-[600px]"
          >
            <MoistureChart
              data={filteredMoistureData}
              title={`Moisture Content Trends - ${plantUnit} (${filters.date})`}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MoistureContentTable;


