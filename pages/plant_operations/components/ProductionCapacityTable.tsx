import React, { useEffect, useState, useMemo } from 'react';
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
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 shadow-2xs">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                Kapasitas (Capacity) - {plantUnit}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Produksi Semen ({filters.date})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auto-Sync Active</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs max-w-4xl">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-700 dark:bg-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider w-1/3"
                  >
                    Parameter
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider w-1/3"
                  >
                    Wet (Ton)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider w-1/3"
                  >
                    Dry (Ton)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Total Produksi Semen
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                    {isLoading ? (
                      <span className="inline-block w-20 h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></span>
                    ) : totalProduction !== null ? (
                      formatNumber(totalProduction)
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono font-bold text-secondary-900 dark:text-slate-100">
                    {isLoading ? (
                      <span className="inline-block w-20 h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></span>
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
    </div>
  );
};

export default ProductionCapacityTable;
