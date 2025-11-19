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
    <div className="bg-gradient-to-br from-lime-50 via-white to-green-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-lime-200/50 mt-4">
      <div className="p-3 border-b-2 border-lime-300/50 bg-gradient-to-r from-lime-500/10 via-green-500/10 to-emerald-500/10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-lime-500 to-green-500 rounded-full"></div>
          {t.silo_stock_report_title || 'Silo Stock Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm table-auto">
          <thead>
            {/* Main Header */}
            <tr className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 text-white">
              <th
                rowSpan={2}
                className="px-3 py-3 text-left font-bold border-r-2 border-white/30 sticky left-0 bg-inherit z-10 min-w-32 align-middle"
              >
                {t.silo_name || 'Silo Name'}
              </th>
              <th
                colSpan={3}
                className="px-3 py-3 text-center font-semibold border-r-2 border-white/30 align-middle"
              >
                {t.shift_1 || 'Shift 1'}
              </th>
              <th
                colSpan={3}
                className="px-3 py-3 text-center font-semibold border-r-2 border-white/30 align-middle"
              >
                {t.shift_2 || 'Shift 2'}
              </th>
              <th colSpan={3} className="px-3 py-3 text-center font-semibold align-middle">
                {t.shift_3 || 'Shift 3'}
              </th>
            </tr>
            {/* Sub Header */}
            <tr className="bg-gradient-to-r from-lime-300 via-green-300 to-emerald-300 text-white">
              {['shift1', 'shift2', 'shift3'].map((shiftKey) => (
                <React.Fragment key={shiftKey}>
                  <th className="px-3 py-2 text-center font-medium border-r-2 border-white/30 align-middle">
                    <div className="leading-tight">{t.empty_space || 'Empty Space'}</div>
                  </th>
                  <th className="px-3 py-2 text-center font-medium border-r-2 border-white/30 align-middle">
                    <div className="leading-tight">{t.content || 'Content'}</div>
                  </th>
                  <th className="px-3 py-2 text-center font-medium border-r-2 border-white/30 last:border-r-0 align-middle">
                    <div className="leading-tight">{t.percentage || '%'}</div>
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
                  index % 2 === 0
                    ? 'bg-gradient-to-r from-white to-lime-50/30'
                    : 'bg-gradient-to-r from-green-50/50 to-emerald-50/30'
                }`}
              >
                <td className="px-3 py-3 font-medium text-slate-900 border-r-2 border-lime-200/50 sticky left-0 bg-inherit z-10 align-middle">
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
                      <td className="px-3 py-3 text-center text-slate-800 border-r-2 border-lime-200/50 align-middle font-medium">
                        {formatNumberIndonesian(shiftData?.emptySpace) || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-800 border-r-2 border-lime-200/50 align-middle font-medium">
                        {formatNumberIndonesian(content) || '-'}
                      </td>
                      <td
                        className={`px-3 py-3 text-center text-slate-800 align-middle font-medium ${
                          shiftIndex === 2 ? '' : 'border-r-2 border-lime-200/50'
                        }`}
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
