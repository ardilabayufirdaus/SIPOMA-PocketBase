import React from 'react';
import { motion } from 'framer-motion';
import { formatNumberIndonesian } from '../../../utils/formatters';

interface ParameterTableProps {
  groupedHeaders: Array<{
    category: string;
    parameters: Array<{
      id: string;
      parameter: string;
      unit: string;
      data_type: string;
    }>;
  }>;
  rows: Array<{
    hour: number;
    shift: string;
    values: Record<string, string | number>;
  }>;
  footer: Record<string, Record<string, string>>;
  t: Record<string, string>;
}

export const ParameterTable: React.FC<ParameterTableProps> = ({
  groupedHeaders,
  rows,
  footer,
  t,
}) => {
  const allParams = groupedHeaders.flatMap((g) => g.parameters);

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl shadow-xl overflow-hidden border border-orange-200/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-2 border-b border-orange-200/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
          <div className="w-1 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
          {t.parameter_data}
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px] table-fixed min-w-[800px]">
          <thead>
            {/* Grouped Headers */}
            <tr className="bg-gradient-to-r from-orange-100 to-red-100">
              <th
                rowSpan={2}
                className="px-1 py-1 text-left font-bold text-slate-800 border-r border-orange-200 sticky left-0 bg-inherit z-10 w-8 align-middle text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px] transform -rotate-90"
              >
                {t.hour}
              </th>
              <th
                rowSpan={2}
                className="px-1 py-1 text-left font-bold text-slate-800 border-r border-orange-200 w-10 align-middle text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px]"
              >
                {t.shift}
              </th>
              {groupedHeaders.map((group) => (
                <th
                  key={group.category}
                  colSpan={group.parameters.length}
                  className="px-1 py-1 text-center font-bold text-slate-800 border-r border-orange-200 last:border-r-0 align-middle text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px]"
                >
                  {group.category}
                </th>
              ))}
            </tr>
            {/* Parameter Headers */}
            <tr className="bg-gradient-to-r from-orange-50 to-red-50">
              {allParams.map((param) => (
                <th
                  key={param.id}
                  className="px-1 py-1 text-center font-semibold text-slate-700 border-r border-orange-200 last:border-r-0 w-10 align-middle text-[6px] sm:text-[8px] md:text-[10px] lg:text-[11px] xl:text-[12px]"
                >
                  <div className="text-[6px] leading-tight break-words">{param.parameter}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Data Rows */}
            {rows.map((row, rowIndex) => (
              <motion.tr
                key={row.hour}
                className={`${
                  rowIndex % 2 === 0 ? 'bg-white/80' : 'bg-orange-50/50'
                } hover:bg-gradient-to-r hover:from-orange-100/70 hover:to-red-100/70 transition-all duration-200`}
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <td className="px-3 py-3 text-center font-semibold text-slate-900 border-r border-orange-200 sticky left-0 bg-inherit z-10 align-middle text-[8px]">
                  {row.hour}
                </td>
                <td className="px-1 py-1 text-slate-800 border-r border-orange-200 align-middle text-[6px] font-medium">
                  {row.shift}
                </td>
                {allParams.map((param) => {
                  const value = row.values[param.id];
                  const displayValue =
                    typeof value === 'number' && param.data_type === 'NUMBER'
                      ? formatNumberIndonesian(value)
                      : String(value || '-');

                  return (
                    <td
                      key={param.id}
                      className="px-1 py-1 text-center text-slate-700 border-r border-orange-200 last:border-r-0 align-middle font-medium text-[6px]"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </motion.tr>
            ))}

            {/* Footer Statistics */}
            {Object.entries(footer)
              .filter(([statName]) => statName !== 'Counter Total')
              .map(([statName, statValues]) => (
                <tr
                  key={statName}
                  className="bg-gradient-to-r from-orange-200/50 to-red-200/50 font-semibold"
                >
                  {statName === t.average ||
                  statName === t.min ||
                  statName === t.max ||
                  statName === 'Counter Total' ? (
                    <>
                      <td
                        colSpan={2}
                        className="px-1 py-1 text-center text-slate-800 border-r border-orange-200 sticky left-0 bg-inherit z-10 align-middle font-bold text-[6px]"
                      >
                        {statName}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-1 py-1 text-center text-slate-800 border-r border-orange-200 sticky left-0 bg-inherit z-10 align-middle font-bold text-[6px]">
                        {statName}
                      </td>
                      <td className="px-1 py-1 text-center text-slate-800 border-r border-orange-200 align-middle text-[6px] font-bold">
                        -
                      </td>
                    </>
                  )}
                  {allParams.map((param) => {
                    const value = statValues[param.id] || '-';
                    return (
                      <td
                        key={param.id}
                        className="px-1 py-1 text-center text-slate-800 border-r border-orange-200 last:border-r-0 align-middle font-bold text-[6px]"
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
