import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { DashboardFilters } from '../../../components/plant-operations/FilterSection';
import { useCcrMaterialUsage } from '../../../hooks/useCcrMaterialUsage';
import { useMoistureData } from '../../../hooks/useMoistureData';
import { formatNumber } from '../../../utils/formatters';

interface ProductionCapacityTableProps {
  filters: DashboardFilters;
  plantUnit: string;
}

const ProductionCapacityTable: React.FC<ProductionCapacityTableProps> = ({
  filters,
  plantUnit,
}) => {
  const { getDataForUnitAndDate, loading: capacityLoading } = useCcrMaterialUsage();
  const { data: moistureData, loading: moistureLoading } = useMoistureData(filters, plantUnit);
  const [totalProduction, setTotalProduction] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!filters.date || !plantUnit) return;

      const data = await getDataForUnitAndDate(filters.date, plantUnit, filters.plantCategory);

      // Sum total_production from all shifts
      const total = data.reduce((sum, item) => sum + (item.total_production || 0), 0);
      setTotalProduction(total);
    };

    fetchData();
  }, [filters.date, plantUnit, filters.plantCategory, getDataForUnitAndDate]);

  // Calculate average total moisture
  const averageMoisture = useMemo(() => {
    if (!moistureData || moistureData.length === 0) return 0;

    const validData = moistureData.filter((d) => d.total !== null && !isNaN(d.total));
    if (validData.length === 0) return 0;

    const sum = validData.reduce((acc, curr) => acc + (curr.total || 0), 0);
    return sum / validData.length;
  }, [moistureData]);

  // Calculate Dry Production
  const dryProduction = useMemo(() => {
    if (totalProduction === null) return null;
    return totalProduction - (averageMoisture * totalProduction) / 100;
  }, [totalProduction, averageMoisture]);

  const isLoading = capacityLoading || moistureLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full mb-8"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200/50 bg-gradient-to-r from-ubuntu-aubergine to-ubuntu-midAubergine flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white font-display">
              Kapasitas (Capacity) - {plantUnit}
            </h3>
            <p className="text-sm text-ubuntu-warmGrey mt-2">
              Total Produksi Semen ({filters.date})
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-ubuntu-orange rounded-full text-xs font-medium border border-white/20">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>Auto-Sync Active</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3"
                  >
                    Parameter
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3"
                  >
                    Wet (Ton)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3"
                  >
                    Dry (Ton)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    Total Produksi Semen
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ubuntu-orange">
                    {isLoading ? (
                      <span className="inline-block w-20 h-5 bg-slate-200 animate-pulse rounded"></span>
                    ) : totalProduction !== null ? (
                      formatNumber(totalProduction)
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ubuntu-darkAubergine">
                    {isLoading ? (
                      <span className="inline-block w-20 h-5 bg-slate-200 animate-pulse rounded"></span>
                    ) : dryProduction !== null ? (
                      formatNumber(dryProduction)
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductionCapacityTable;
