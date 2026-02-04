import React from 'react';
import { CcrDowntimeData } from '../../../types';
import { calculateDuration, formatDuration } from '../../../utils/formatters';

interface DowntimeTableProps {
  downtimeData: CcrDowntimeData[];
  t: Record<string, string>;
}

export const DowntimeTable: React.FC<DowntimeTableProps> = ({ downtimeData, t }) => {
  return (
    <div className="bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-[#F9F9F9]">
        <h3 className="text-sm font-bold text-[#E95420] flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-[#772953] rounded-full"></div>
          {t.downtime_report_title || 'Downtime Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="bg-[#AEA79F] text-white">
              <th className="px-3 py-3 text-left font-semibold border-r border-white/20 align-middle">
                {t.start_time || 'Start Time'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r border-white/20 align-middle">
                {t.end_time || 'End Time'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r border-white/20 align-middle">
                {t.duration || 'Duration'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r border-white/20 align-middle">
                {t.pic || 'PIC'}
              </th>
              <th className="px-3 py-3 text-left font-semibold border-r border-white/20 align-middle min-w-[180px]">
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
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-orange-50/50 transition-colors border-b border-slate-100 last:border-b-0`}
                  >
                    <td className="px-3 py-3 text-slate-800 border-r border-slate-200 align-middle font-medium">
                      {downtime.start_time}
                    </td>
                    <td className="px-3 py-3 text-slate-800 border-r border-slate-200 align-middle font-medium">
                      {downtime.end_time}
                    </td>
                    <td className="px-3 py-3 text-slate-800 border-r border-slate-200 align-middle font-medium">
                      {durationText}
                    </td>
                    <td className="px-3 py-3 text-slate-800 border-r border-slate-200 align-middle font-medium">
                      {downtime.pic}
                    </td>
                    <td className="px-3 py-3 text-slate-800 max-w-xs border-r border-slate-200 align-middle font-medium min-w-[180px]">
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
              <tr className="bg-slate-50">
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500 italic font-medium">
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
