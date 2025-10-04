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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mt-6">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t.silo_stock_report_title || 'Silo Stock Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-xs min-w-max">
          <thead>
            {/* Main Header */}
            <tr className="bg-slate-50 dark:bg-slate-700">
              <th
                rowSpan={2}
                className="px-1 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 sticky left-0 bg-slate-50 dark:bg-slate-700 z-10 min-w-24 align-middle"
              >
                {t.silo_name || 'Silo Name'}
              </th>
              <th
                colSpan={3}
                className="px-1 py-2 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle"
              >
                {t.shift_1 || 'Shift 1'}
              </th>
              <th
                colSpan={3}
                className="px-1 py-2 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle"
              >
                {t.shift_2 || 'Shift 2'}
              </th>
              <th
                colSpan={3}
                className="px-1 py-2 text-center font-semibold text-slate-800 dark:text-slate-200 align-middle"
              >
                {t.shift_3 || 'Shift 3'}
              </th>
            </tr>
            {/* Sub Header */}
            <tr className="bg-slate-100 dark:bg-slate-600">
              {['shift1', 'shift2', 'shift3'].map((shiftKey) => (
                <React.Fragment key={shiftKey}>
                  <th className="px-1 py-2 text-center font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 align-middle">
                    <div className="text-xs leading-tight">{t.empty_space || 'Empty Space'}</div>
                  </th>
                  <th className="px-1 py-2 text-center font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 align-middle">
                    <div className="text-xs leading-tight">{t.content || 'Content'}</div>
                  </th>
                  <th className="px-1 py-2 text-center font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 last:border-r-0 align-middle">
                    <div className="text-xs leading-tight">{t.percentage || '%'}</div>
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
                  index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700'
                } hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors`}
              >
                <td className="px-1 py-2 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-600 sticky left-0 bg-inherit z-10 align-middle">
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
                      <td className="px-1 py-2 text-center text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle">
                        {formatNumberIndonesian(shiftData?.emptySpace) || '-'}
                      </td>
                      <td className="px-1 py-2 text-center text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle">
                        {formatNumberIndonesian(content) || '-'}
                      </td>
                      <td
                        className={`px-1 py-2 text-center text-slate-800 dark:text-slate-200 align-middle ${
                          shiftIndex === 2 ? '' : 'border-r border-slate-200 dark:border-slate-600'
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
