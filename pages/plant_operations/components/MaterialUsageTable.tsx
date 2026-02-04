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
    { key: 'clinker', label: 'CLINKER' },
    { key: 'gypsum', label: 'GYPSUM' },
    { key: 'limestone', label: 'LIMESTONE' },
    { key: 'trass', label: 'TRASS' },
    { key: 'fly_ash', label: 'FLY ASH' },
    { key: 'fine_trass', label: 'FINE TRASS' },
    { key: 'ckd', label: 'CKD' },
    { key: 'total_production', label: 'TOTAL PROD' },
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
    <div className="bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-[#F9F9F9]">
        <h3 className="text-sm font-bold text-[#E95420] flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-[#772953] rounded-full"></div>
          {t.material_usage || 'MATERIAL USAGE'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm table-auto border-collapse">
          <thead>
            <tr className="bg-[#772953] text-white">
              <th className="px-3 py-3 text-left font-bold border-r border-white/20 align-middle text-xs uppercase">
                SHIFT
              </th>
              {materialColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-center font-bold border-r border-white/20 align-middle text-xs uppercase"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedMaterialUsageData.length > 0 ? (
              sortedMaterialUsageData.map((row, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-orange-50/50 transition-colors border-b border-slate-100 last:border-0`}
                >
                  <td className="px-3 py-3 font-bold text-slate-800 border-r border-slate-200 align-middle text-xs">
                    {row.shift}
                  </td>
                  {materialColumns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-3 text-center text-slate-700 border-r border-slate-200 align-middle font-medium text-xs whitespace-nowrap"
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
                  className="px-6 py-8 text-center text-slate-500 font-medium italic"
                >
                  No material usage data available
                </td>
              </tr>
            )}
          </tbody>
          {sortedMaterialUsageData.length > 0 && (
            <tfoot className="bg-[#F2F2F2] border-t-2 border-slate-300">
              <tr>
                <td className="px-3 py-3 text-xs font-bold text-[#E95420] border-r border-slate-300 uppercase">
                  Total
                </td>
                {materialColumns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-3 text-xs font-bold text-[#E95420] border-r border-slate-300 text-center whitespace-nowrap"
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
