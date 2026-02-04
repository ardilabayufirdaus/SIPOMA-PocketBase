import React from 'react';
import { formatNumberIndonesian } from '../../../utils/formatters';

interface SiloTableProps {
  siloData: Array<{
    master: {
      silo_name: string;
      capacity: number;
    };
    shift1: {
      emptySpace?: number;
      content?: number;
    };
    shift2: {
      emptySpace?: number;
      content?: number;
    };
    shift3: {
      emptySpace?: number;
      content?: number;
    };
  }>;
  t: Record<string, string>;
}

export const SiloTable: React.FC<SiloTableProps> = ({ siloData, t }) => {
  if (!siloData || siloData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-[#F9F9F9]">
        <h3 className="text-sm font-bold text-[#E95420] flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-[#772953] rounded-full"></div>
          {t.silo_stock_report_title || 'SILO STOCK REPORT'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm table-auto border-collapse">
          <thead>
            {/* Main Header */}
            <tr className="bg-[#772953] text-white">
              <th
                rowSpan={2}
                className="px-3 py-3 text-left font-bold border-r border-white/20 sticky left-0 bg-[#772953] z-10 min-w-32 align-middle text-xs uppercase"
              >
                {t.silo_name || 'SILO NAME'}
              </th>
              <th
                colSpan={3}
                className="px-3 py-2 text-center font-bold border-r border-white/20 align-middle text-xs uppercase"
              >
                {t.shift_1 || 'SHIFT 1'}
              </th>
              <th
                colSpan={3}
                className="px-3 py-2 text-center font-bold border-r border-white/20 align-middle text-xs uppercase"
              >
                {t.shift_2 || 'SHIFT 2'}
              </th>
              <th
                colSpan={3}
                className="px-3 py-2 text-center font-bold align-middle text-xs uppercase"
              >
                {t.shift_3 || 'SHIFT 3'}
              </th>
            </tr>
            {/* Sub Header */}
            <tr className="bg-[#8A3B66] text-white">
              {['shift1', 'shift2', 'shift3'].map((shiftKey) => (
                <React.Fragment key={shiftKey}>
                  <th className="px-3 py-2 text-center font-semibold border-r border-white/20 align-middle text-[10px] uppercase">
                    <div className="leading-tight">{t.empty_space || 'EMPTY SPACE'}</div>
                  </th>
                  <th className="px-3 py-2 text-center font-semibold border-r border-white/20 align-middle text-[10px] uppercase">
                    <div className="leading-tight">{t.content || 'CONTENT'}</div>
                  </th>
                  <th className="px-3 py-2 text-center font-semibold border-r border-white/20 last:border-r-0 align-middle text-[10px] uppercase">
                    <div className="leading-tight">%</div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {siloData.map((silo, index) => (
              <tr
                key={silo.master.silo_name}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                } hover:bg-orange-50/50 transition-colors border-b border-slate-100 last:border-0`}
              >
                <td className="px-3 py-3 font-bold text-slate-800 border-r border-slate-200 sticky left-0 bg-inherit z-10 align-middle text-xs">
                  {silo.master.silo_name}
                </td>

                {['shift1', 'shift2', 'shift3'].map((shiftKey, shiftIndex) => {
                  const shiftData = silo[shiftKey as keyof typeof silo] as {
                    emptySpace?: number;
                    content?: number;
                  };
                  const content = shiftData?.content;
                  const capacity = silo.master.capacity;
                  const percentage =
                    capacity > 0 && typeof content === 'number' ? (content / capacity) * 100 : 0;

                  return (
                    <React.Fragment key={shiftKey}>
                      <td className="px-3 py-3 text-center text-slate-700 border-r border-slate-200 align-middle font-medium text-xs">
                        {formatNumberIndonesian(shiftData?.emptySpace) || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-700 border-r border-slate-200 align-middle font-medium text-xs">
                        {formatNumberIndonesian(content) || '-'}
                      </td>
                      <td
                        className={`px-3 py-3 text-center align-middle font-bold text-xs ${
                          shiftIndex === 2 ? '' : 'border-r border-slate-200'
                        } ${percentage > 90 ? 'text-[#E95420]' : 'text-[#772953]'}`}
                      >
                        {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                      </td>
                    </React.Fragment>
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
