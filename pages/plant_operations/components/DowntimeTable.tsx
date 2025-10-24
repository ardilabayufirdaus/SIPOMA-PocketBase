import React from 'react';
import { motion } from 'framer-motion';
import { CcrDowntimeData } from '../../../types';
import { calculateDuration, formatDuration } from '../../../utils/formatters';

interface DowntimeTableProps {
  downtimeData: CcrDowntimeData[];
  t: Record<string, string>;
}

export const DowntimeTable: React.FC<DowntimeTableProps> = ({ downtimeData, t }) => {
  return (
    <motion.div
      className="bg-gradient-to-br from-white to-red-50/30 dark:from-slate-800 dark:to-red-900/10 rounded-xl shadow-xl overflow-hidden border border-red-200/50 dark:border-red-800/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-red-200/50 dark:border-red-700/50 bg-gradient-to-r from-red-500/10 to-pink-500/10">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
          {t.downtime_report_title || 'Downtime Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-[8px] min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30">
              <th className="px-2 py-3.5 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                {t.start_time || 'Start Time'}
              </th>
              <th className="px-2 py-3.5 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                {t.end_time || 'End Time'}
              </th>
              <th className="px-2 py-3.5 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                {t.duration || 'Duration'}
              </th>
              <th className="px-2 py-3.5 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                {t.pic || 'PIC'}
              </th>
              <th className="px-2 py-3.5 text-left font-semibold text-slate-800 dark:text-slate-200 align-middle text-[8px]">
                {t.problem || 'Problem'}
              </th>
            </tr>
          </thead>
          <tbody>
            {downtimeData && downtimeData.length > 0 ? (
              downtimeData.map((downtime, index) => {
                const { hours, minutes } = calculateDuration(
                  downtime.start_time,
                  downtime.end_time
                );
                const durationText = formatDuration(hours, minutes);

                return (
                  <tr
                    key={`${downtime.start_time}-${downtime.end_time}-${index}`}
                    className={`${
                      index % 2 === 0
                        ? 'bg-white dark:bg-slate-800'
                        : 'bg-slate-50 dark:bg-slate-700'
                    } hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors`}
                  >
                    <td className="px-2 py-3.5 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                      {downtime.start_time}
                    </td>
                    <td className="px-2 py-3.5 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                      {downtime.end_time}
                    </td>
                    <td className="px-2 py-3.5 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                      {durationText}
                    </td>
                    <td className="px-2 py-3.5 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle text-[8px]">
                      {downtime.pic}
                    </td>
                    <td className="px-2 py-3.5 text-slate-800 dark:text-slate-200 max-w-xs align-middle text-[8px]">
                      <div className="truncate" title={downtime.problem}>
                        {downtime.problem}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-slate-50 dark:bg-slate-700">
                <td
                  colSpan={5}
                  className="px-2 py-4 text-center text-slate-600 dark:text-slate-400 italic text-[8px]"
                >
                  {t.no_downtime_recorded || 'Tidak ada downtime tercatat'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
