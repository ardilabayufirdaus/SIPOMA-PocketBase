import React from 'react';
import { DashboardFilters } from '../../../components/plant-operations/FilterSection';
import { useMoistureData } from '../../../hooks/useMoistureData';

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

  // Calculate averages
  const averages = React.useMemo(() => {
    if (moistureData.length === 0)
      return { gypsum: null, trass: null, limestone: null, total: null };

    const validGypsum = moistureData.map((d) => d.gypsum).filter((v) => v !== null && !isNaN(v));
    const validTrass = moistureData.map((d) => d.trass).filter((v) => v !== null && !isNaN(v));
    const validLimestone = moistureData
      .map((d) => d.limestone)
      .filter((v) => v !== null && !isNaN(v));
    const validTotal = moistureData.map((d) => d.total).filter((v) => v !== null && !isNaN(v));

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
  }, [moistureData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading moisture data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading moisture data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">% Moisture Content - {plantUnit}</h3>
        <p className="text-sm text-slate-600 mt-1">Date: {filters.date}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Hour
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Gypsum (%)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Trass (%)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Limestone (%)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                % Total Moisture Content
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {moistureData.map((row) => (
              <tr key={row.hour} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.hour}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatValue(row.gypsum)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatValue(row.trass)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatValue(row.limestone)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  {formatValue(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 border-t-2 border-slate-300">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">Average</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                {formatValue(averages.gypsum)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                {formatValue(averages.trass)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                {formatValue(averages.limestone)}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-primary-600">
                {formatValue(averages.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500">Formula: (Set Feeder × H2O) ÷ 100</p>
      </div>
    </div>
  );
};

export default MoistureContentTable;
