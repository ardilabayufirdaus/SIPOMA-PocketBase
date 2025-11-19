import React from 'react';
import { CcrDowntimeData } from '../../../types';
import { calculateDuration, formatDuration } from '../../../utils/formatters';

interface DowntimeTableProps {
  downtimeData: CcrDowntimeData[];
  t: Record<string, string>;
}

export const DowntimeTable: React.FC<DowntimeTableProps> = ({ downtimeData, t }) => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-rose-200/50 mt-4">
      <div className="p-3 border-b-2 border-rose-300/50 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"></div>
          {t.downtime_report_title || 'Downtime Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 text-white">
              <th className="px-3 py-3 text-left font-semibold border-r-2 border-white/30 align-middle">
                {t.start_time || 'Start Time'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r-2 border-white/30 align-middle">
                {t.end_time || 'End Time'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r-2 border-white/30 align-middle">
                {t.duration || 'Duration'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r-2 border-white/30 align-middle">
                {t.pic || 'PIC'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r-2 border-white/30 align-middle min-w-[180px]">
                {t.problem || 'Problem'}
              </th>
              <th className="px-3 py-3 text-left font-semibold align-middle min-w-[180px]">
                {t.action || 'Action'}
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
                        ? 'bg-gradient-to-r from-white to-rose-50/30'
                        : 'bg-gradient-to-r from-pink-50/50 to-purple-50/30'
                    }`}
                  >
                    <td className="px-3 py-3 text-slate-800 border-r-2 border-rose-200/50 align-middle font-medium">
                      {downtime.start_time}
                    </td>
                    <td className="px-3 py-3 text-slate-800 border-r-2 border-rose-200/50 align-middle font-medium">
                      {downtime.end_time}
                    </td>
                    <td className="px-3 py-3 text-slate-800 border-r-2 border-rose-200/50 align-middle font-medium">
                      {durationText}
                    </td>
                    <td className="px-3 py-3 text-slate-800 border-r-2 border-rose-200/50 align-middle font-medium">
                      {downtime.pic}
                    </td>
                    <td className="px-3 py-3 text-slate-800 max-w-xs border-r-2 border-rose-200/50 align-middle font-medium min-w-[180px]">
                      <div className="break-words" title={downtime.problem}>
                        {downtime.problem}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-800 max-w-xs align-middle font-medium min-w-[180px]">
                      <div className="break-words" title={downtime.action}>
                        {downtime.action || '-'}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-gradient-to-r from-rose-50/50 to-pink-50/50">
                <td colSpan={6} className="px-3 py-4 text-center text-slate-600 italic font-medium">
                  {t.no_downtime_recorded || 'Tidak ada downtime tercatat'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
