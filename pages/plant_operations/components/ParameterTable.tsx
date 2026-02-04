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
    <div className="bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-[#F9F9F9]">
        <h3 className="text-sm font-bold text-[#E95420] flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-[#772953] rounded-full"></div>
          {t.parameter_data}
        </h3>
      </div>

      <div className="w-full">
        <table className="w-full text-sm table-auto border-collapse">
          <thead>
            {/* Grouped Headers */}
            <tr className="bg-[#772953] text-white">
              <th
                rowSpan={2}
                className="px-1 py-1 font-bold border-r border-white/20 sticky left-0 bg-[#772953] z-10 w-8 align-middle text-sm"
              >
                <div
                  className="flex items-center justify-center w-full"
                  style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                >
                  {t.hour}
                </div>
              </th>
              <th
                rowSpan={2}
                className="px-1 py-1 font-bold border-r border-white/20 w-8 align-middle text-sm"
              >
                <div
                  className="flex items-center justify-center w-full"
                  style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                >
                  {t.shift}
                </div>
              </th>
              {groupedHeaders.map((group) => (
                <th
                  key={group.category}
                  colSpan={group.parameters.length}
                  className="px-1 py-1 text-center font-bold border-r border-white/20 last:border-r-0 align-middle text-sm uppercase tracking-wide"
                >
                  {group.category}
                </th>
              ))}
            </tr>
            {/* Parameter Headers */}
            <tr className="bg-[#8A3B66] text-white">
              {allParams.map((param) => (
                <th
                  key={param.id}
                  className="px-1 py-1 text-center font-semibold border-r border-white/20 last:border-r-0 w-12 align-middle text-xs"
                >
                  <div className="leading-tight break-words">{param.parameter}</div>
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
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                } hover:bg-orange-50/50 transition-colors`}
              >
                <td className="px-2 py-2 text-center font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-inherit z-10 align-middle">
                  {row.hour}
                </td>
                <td className="px-1 py-2 text-slate-800 border-r border-slate-200 align-middle font-medium">
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
                      className="px-1 py-2 text-center text-slate-700 border-r border-slate-200 last:border-r-0 align-middle font-medium text-xs whitespace-nowrap"
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
                  className="bg-[#F2F2F2] font-semibold border-t-2 border-slate-300"
                >
                  {statName === t.average ||
                  statName === t.min ||
                  statName === t.max ||
                  statName === 'Counter Total' ? (
                    <>
                      <td
                        colSpan={2}
                        className="px-1 py-2 text-center text-[#772953] border-r border-slate-300 sticky left-0 bg-[#F2F2F2] z-10 align-middle font-bold text-xs uppercase"
                      >
                        {statName}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-1 py-2 text-center text-[#772953] border-r border-slate-300 sticky left-0 bg-[#F2F2F2] z-10 align-middle font-bold text-xs">
                        {statName}
                      </td>
                      <td className="px-1 py-2 text-center text-[#772953] border-r border-slate-300 align-middle font-bold text-xs">
                        -
                      </td>
                    </>
                  )}
                  {allParams.map((param) => {
                    const value = statValues[param.id] || '-';
                    return (
                      <td
                        key={param.id}
                        className="px-1 py-2 text-center text-[#772953] border-r border-slate-300 last:border-r-0 align-middle font-bold text-xs whitespace-nowrap"
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
