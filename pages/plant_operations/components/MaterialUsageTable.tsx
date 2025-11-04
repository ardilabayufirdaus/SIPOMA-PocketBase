import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-xl overflow-hidden border border-blue-200/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
          {t.material_usage || 'Material Usage'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-[6px] min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 to-cyan-100">
              <th className="px-1 py-1 text-left font-bold text-slate-800 border-r border-blue-200 align-middle text-[6px]">
                Shift
              </th>
              {materialColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-1 py-1 text-left font-bold text-slate-800 border-r border-blue-200 align-middle text-[6px]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-200">
            {sortedMaterialUsageData.length > 0 ? (
              sortedMaterialUsageData.map((row, index) => (
                <motion.tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-white/80' : 'bg-blue-50/50'
                  } hover:bg-gradient-to-r hover:from-blue-100/70 hover:to-cyan-100/70 transition-all duration-200`}
                  whileHover={{ scale: 1.005 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <td className="px-1 py-1 font-semibold text-slate-900 border-r border-blue-200 align-middle text-[6px]">
                    {row.shift}
                  </td>
                  {materialColumns.map((col) => (
                    <td
                      key={col.key}
                      className="px-1 py-1 text-slate-800 border-r border-blue-200 align-middle text-[6px]"
                    >
                      {row[col.key as keyof MaterialUsageData] !== undefined
                        ? formatNumberIndonesian(row[col.key as keyof MaterialUsageData] as number)
                        : '-'}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={materialColumns.length + 1}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No material usage data available
                </td>
              </tr>
            )}
          </tbody>
          {sortedMaterialUsageData.length > 0 && (
            <tfoot className="bg-blue-100">
              <tr>
                <td className="px-1 py-1 text-[6px] font-semibold text-slate-900 border-r border-blue-200">
                  Total
                </td>
                {materialColumns.map((col) => (
                  <td
                    key={col.key}
                    className="px-1 py-1 text-[6px] font-semibold text-slate-900 border-r border-blue-200"
                  >
                    {totals[col.key] > 0 ? formatNumberIndonesian(totals[col.key]) : '-'}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </motion.div>
  );
};
