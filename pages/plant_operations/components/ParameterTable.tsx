import React from 'react';
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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t.parameter_data}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-xs min-w-max">
          <thead>
            {/* Grouped Headers */}
            <tr className="bg-slate-50 dark:bg-slate-700">
              <th className="px-1 py-1 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 sticky left-0 bg-slate-50 dark:bg-slate-700 z-10 min-w-10 align-middle">
                {t.hour}
              </th>
              <th className="px-1 py-1 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 min-w-16 align-middle">
                {t.shift}
              </th>
              {groupedHeaders.map((group) => (
                <th
                  key={group.category}
                  colSpan={group.parameters.length}
                  className="px-1 py-1 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 last:border-r-0 align-middle"
                >
                  {group.category}
                </th>
              ))}
            </tr>
            {/* Parameter Headers */}
            <tr className="bg-slate-100 dark:bg-slate-600">
              <th className="px-1 py-1 text-left font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 sticky left-0 bg-slate-100 dark:bg-slate-600 z-10">
                {/* Hour header already above */}
              </th>
              <th className="px-1 py-1 text-left font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600">
                {/* Shift header already above */}
              </th>
              {allParams.map((param) => (
                <th
                  key={param.id}
                  className="px-1 py-1 text-center font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 last:border-r-0 min-w-16 align-middle"
                >
                  <div className="text-xs leading-tight">{param.parameter}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Data Rows */}
            {rows.map((row, rowIndex) => (
              <tr
                key={row.hour}
                className={`${
                  rowIndex % 2 === 0
                    ? 'bg-white dark:bg-slate-800'
                    : 'bg-slate-50 dark:bg-slate-700'
                } hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors`}
              >
                <td className="px-1 py-1 text-center font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-600 sticky left-0 bg-inherit z-10 align-middle">
                  {row.hour}
                </td>
                <td className="px-1 py-1 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle">
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
                      className="px-1 py-1 text-center text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 last:border-r-0 align-middle"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Footer Statistics */}
            {Object.entries(footer).map(([statName, statValues]) => (
              <tr key={statName} className="bg-slate-200 dark:bg-slate-600 font-semibold">
                <td className="px-1 py-1 text-center text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 sticky left-0 bg-inherit z-10 align-middle">
                  {statName}
                </td>
                <td className="px-1 py-1 text-center text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle">
                  -
                </td>
                {allParams.map((param) => {
                  const value = statValues[param.id] || '-';
                  return (
                    <td
                      key={param.id}
                      className="px-1 py-1 text-center text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 last:border-r-0 align-middle"
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
    </div>
  );
};
