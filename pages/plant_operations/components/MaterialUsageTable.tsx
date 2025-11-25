import React from 'react';
import { formatNumberIndonesian } from '../../../utils/formatters';

interface MaterialUsageData {
  shift: string;
  clinker?: number;
  gypsum?: number;
  limestone?: number;
  trass?: number;
  fly_ash?: number;
  fine_trass?: number;
  ckd?: number;
  total_production?: number;
}

interface MaterialUsageTableProps {
  materialUsageData: MaterialUsageData[];
  t: Record<string, string>;
}

export const MaterialUsageTable: React.FC<MaterialUsageTableProps> = ({ materialUsageData, t }) => {
  const materialColumns = [
    { key: 'clinker', label: 'Clinker' },
    { key: 'gypsum', label: 'Gypsum' },
    { key: 'limestone', label: 'Limestone' },
    { key: 'trass', label: 'Trass' },
    { key: 'fly_ash', label: 'Fly Ash' },
    { key: 'fine_trass', label: 'Fine Trass' },
    { key: 'ckd', label: 'CKD' },
    { key: 'total_production', label: 'Total Production' },
  ];

  // Sort material usage data in the same order as CCR Material Usage Entry
  // Order: S3C (shift3_cont), S1 (shift1), S2 (shift2), S3 (shift3)
  const shiftOrder = ['S3C', 'S1', 'S2', 'S3'];
  const sortedMaterialUsageData = [...materialUsageData].sort((a, b) => {
    const aIndex = shiftOrder.indexOf(a.shift);
    const bIndex = shiftOrder.indexOf(b.shift);
    return aIndex - bIndex;
  });

  // Calculate totals for each material column
  const totals = materialColumns.reduce(
    (acc, col) => {
      acc[col.key] = materialUsageData.reduce((sum, row) => {
        const value = row[col.key as keyof MaterialUsageData] as number;
        return sum + (value || 0);
      }, 0);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-200/50 mt-4">
      <div className="p-3 border-b-2 border-amber-300/50 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
          {t.material_usage || 'Material Usage'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-white">
              <th className="px-3 py-3 text-left font-bold border-r-2 border-white/30 align-middle">
                Shift
              </th>
              {materialColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-left font-bold border-r-2 border-white/30 align-middle"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-200">
            {sortedMaterialUsageData.length > 0 ? (
              sortedMaterialUsageData.map((row, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0
                      ? 'bg-gradient-to-r from-white to-amber-50/30'
                      : 'bg-gradient-to-r from-orange-50/50 to-blue-50/30'
                  }`}
                >
                  <td className="px-3 py-3 font-semibold text-slate-900 border-r-2 border-amber-200/50 align-middle">
                    {row.shift}
                  </td>
                  {materialColumns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-3 text-slate-800 border-r-2 border-amber-200/50 align-middle font-medium"
                    >
                      {row[col.key as keyof MaterialUsageData] !== undefined
                        ? formatNumberIndonesian(row[col.key as keyof MaterialUsageData] as number)
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={materialColumns.length + 1}
                  className="px-6 py-12 text-center text-slate-500 font-medium"
                >
                  No material usage data available
                </td>
              </tr>
            )}
          </tbody>
          {sortedMaterialUsageData.length > 0 && (
            <tfoot className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-blue-500/20 border-t-2 border-amber-300/50">
              <tr>
                <td className="px-3 py-3 text-base font-semibold text-slate-900 border-r-2 border-amber-200/50">
                  Total
                </td>
                {materialColumns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-3 text-base font-semibold text-slate-900 border-r-2 border-amber-200/50"
                  >
                    {totals[col.key] > 0 ? formatNumberIndonesian(totals[col.key]) : '-'}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};


