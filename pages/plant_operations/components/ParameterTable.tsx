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
    <div className="bg-gradient-to-br from-emerald-50 via-white to-cyan-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-emerald-200/50 mt-4">
      <div className="p-3 border-b-2 border-emerald-300/50 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
          {t.parameter_data}
        </h3>
      </div>

      <div className="w-full">
        <table className="w-full text-sm table-auto border-collapse">
          <thead>
            {/* Grouped Headers */}
            <tr className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 text-white">
              <th
                rowSpan={2}
                className="px-1 py-2 text-left font-bold border-r-2 border-white/30 sticky left-0 bg-inherit z-10 w-8 align-middle text-sm transform -rotate-90"
              >
                {t.hour}
              </th>
              <th
                rowSpan={2}
                className="px-1 py-2 text-left font-bold border-r-2 border-white/30 w-10 align-middle text-sm"
              >
                {t.shift}
              </th>
              {groupedHeaders.map((group) => (
                <th
                  key={group.category}
                  colSpan={group.parameters.length}
                  className="px-1 py-2 text-center font-bold border-r-2 border-white/30 last:border-r-0 align-middle text-sm"
                >
                  {group.category}
                </th>
              ))}
            </tr>
            {/* Parameter Headers */}
            <tr className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 text-white">
              {allParams.map((param) => (
                <th
                  key={param.id}
                  className="px-1 py-1 text-center font-semibold border-r-2 border-white/30 last:border-r-0 w-12 align-middle text-sm"
                >
                  <div className="leading-tight break-words text-sm">{param.parameter}</div>
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
                    ? 'bg-gradient-to-r from-white to-emerald-50/30'
                    : 'bg-gradient-to-r from-cyan-50/50 to-blue-50/30'
                }`}
              >
                <td className="px-2 py-2 text-center font-semibold text-slate-900 border-r-2 border-emerald-200/50 sticky left-0 bg-inherit z-10 align-middle">
                  {row.hour}
                </td>
                <td className="px-1 py-2 text-slate-800 border-r-2 border-emerald-200/50 align-middle font-medium">
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
                      className="px-1 py-2 text-center text-slate-800 border-r-2 border-emerald-200/50 last:border-r-0 align-middle font-medium"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Footer Statistics */}
            {Object.entries(footer)
              .filter(([statName]) => statName !== 'Counter Total')
              .map(([statName, statValues]) => (
                <tr
                  key={statName}
                  className="bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 font-semibold border-t-2 border-emerald-300/50"
                >
                  {statName === t.average ||
                  statName === t.min ||
                  statName === t.max ||
                  statName === 'Counter Total' ? (
                    <>
                      <td
                        colSpan={2}
                        className="px-1 py-2 text-center text-slate-800 border-r-2 border-emerald-200/50 sticky left-0 bg-inherit z-10 align-middle font-bold"
                      >
                        {statName}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-1 py-2 text-center text-slate-800 border-r-2 border-emerald-200/50 sticky left-0 bg-inherit z-10 align-middle font-bold">
                        {statName}
                      </td>
                      <td className="px-1 py-2 text-center text-slate-800 border-r-2 border-emerald-200/50 align-middle font-bold">
                        -
                      </td>
                    </>
                  )}
                  {allParams.map((param) => {
                    const value = statValues[param.id] || '-';
                    return (
                      <td
                        key={param.id}
                        className="px-1 py-2 text-center text-slate-800 border-r-2 border-emerald-200/50 last:border-r-0 align-middle font-bold"
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


