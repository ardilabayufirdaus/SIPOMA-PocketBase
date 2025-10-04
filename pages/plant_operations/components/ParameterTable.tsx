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
      className="bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-orange-900/10 rounded-xl shadow-xl overflow-hidden border border-orange-200/50 dark:border-orange-800/50"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-orange-200/50 dark:border-orange-700/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
          {t.parameter_data}
        </h3>
      </div>

      <div className="max-w-full overflow-hidden">
        <table className="w-full text-xs sm:text-sm table-fixed">
          <thead>
            {/* Grouped Headers */}
            <tr className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
              <th className="px-3 py-3 text-left font-bold text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 sticky left-0 bg-inherit z-10 w-10 align-middle">
                {t.hour}
              </th>
              <th className="px-3 py-3 text-left font-bold text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 w-12 align-middle">
                {t.shift}
              </th>
              {groupedHeaders.map((group) => (
                <th
                  key={group.category}
                  colSpan={group.parameters.length}
                  className="px-3 py-2 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 last:border-r-0 align-middle"
                >
                  {group.category}
                </th>
              ))}
            </tr>
            {/* Parameter Headers */}
            <tr className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 border-r border-orange-200 dark:border-orange-700 sticky left-0 bg-inherit z-10">
                {/* Hour header already above */}
              </th>
              <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 border-r border-orange-200 dark:border-orange-700">
                {/* Shift header already above */}
              </th>
              {allParams.map((param) => (
                <th
                  key={param.id}
                  className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-orange-200 dark:border-orange-700 last:border-r-0 w-12 align-middle"
                >
                  <div className="text-xs leading-tight break-words">{param.parameter}</div>
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
                  rowIndex % 2 === 0
                    ? 'bg-white/80 dark:bg-slate-800/80'
                    : 'bg-orange-50/50 dark:bg-orange-900/10'
                } hover:bg-gradient-to-r hover:from-orange-100/70 hover:to-red-100/70 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-200`}
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <td className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-slate-100 border-r border-orange-200 dark:border-orange-700 sticky left-0 bg-inherit z-10 align-middle">
                  {row.hour}
                </td>
                <td className="px-3 py-3 text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 align-middle text-sm font-medium">
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
                      className="px-3 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-orange-200 dark:border-orange-700 last:border-r-0 align-middle font-medium"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </motion.tr>
            ))}

            {/* Footer Statistics */}
            {Object.entries(footer).map(([statName, statValues]) => (
              <tr
                key={statName}
                className="bg-gradient-to-r from-orange-200/50 to-red-200/50 dark:from-orange-900/40 dark:to-red-900/40 font-semibold"
              >
                <td className="px-3 py-3 text-center text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 sticky left-0 bg-inherit z-10 align-middle font-bold">
                  {statName}
                </td>
                <td className="px-3 py-3 text-center text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 align-middle text-sm font-bold">
                  -
                </td>
                {allParams.map((param) => {
                  const value = statValues[param.id] || '-';
                  return (
                    <td
                      key={param.id}
                      className="px-3 py-3 text-center text-slate-800 dark:text-slate-200 border-r border-orange-200 dark:border-orange-700 last:border-r-0 align-middle font-bold"
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
