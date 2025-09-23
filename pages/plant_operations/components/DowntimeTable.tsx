import React from 'react';
import { CcrDowntimeData } from '../../../types';
import { calculateDuration, formatDuration } from '../../../utils/formatters';

interface DowntimeTableProps {
  downtimeData: CcrDowntimeData[];
  t: Record<string, string>;
}

export const DowntimeTable: React.FC<DowntimeTableProps> = ({ downtimeData, t }) => {
  if (!downtimeData || downtimeData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mt-6">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t.downtime_report_title || 'Downtime Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-xs min-w-max">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-600">
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                {t.start_time || 'Start Time'}
              </th>
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                {t.end_time || 'End Time'}
              </th>
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                {t.duration || 'Duration'}
              </th>
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                {t.pic || 'PIC'}
              </th>
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200">
                {t.problem || 'Problem'}
              </th>
            </tr>
          </thead>
          <tbody>
            {downtimeData.map((downtime, index) => {
              const { hours, minutes } = calculateDuration(downtime.start_time, downtime.end_time);
              const durationText = formatDuration(hours, minutes);

              return (
                <tr
                  key={`${downtime.start_time}-${downtime.end_time}-${index}`}
                  className={`${
                    index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700'
                  } hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors`}
                >
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                    {downtime.start_time}
                  </td>
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                    {downtime.end_time}
                  </td>
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                    {durationText}
                  </td>
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                    {downtime.pic}
                  </td>
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-200 max-w-xs">
                    <div className="truncate" title={downtime.problem}>
                      {downtime.problem}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
