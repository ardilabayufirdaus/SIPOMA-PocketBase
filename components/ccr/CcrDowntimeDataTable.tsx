import React from 'react';
import { CcrDowntimeData } from '../../types';

interface CcrDowntimeDataTableProps {
  t: Record<string, string>;
  loading: boolean;
  downtimeData: CcrDowntimeData[];
  handleDowntimeChange: (
    downtimeId: string,
    field: 'start_time' | 'end_time' | 'problem',
    value: string
  ) => void;
  handleAddDowntime: () => void;
  handleDeleteDowntime: (downtimeId: string) => void;
  formatTimeValue: (value: string) => string;
  parseTimeValue: (value: string) => string;
}

const CcrDowntimeDataTable: React.FC<CcrDowntimeDataTableProps> = ({
  t,
  loading,
  downtimeData,
  handleDowntimeChange,
  handleAddDowntime,
  handleDeleteDowntime,
  formatTimeValue,
  parseTimeValue,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow space-y-3">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 truncate">
          {t.ccr_downtime_data_entry_title}
        </h3>
        <button
          onClick={handleAddDowntime}
          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
        >
          + {t.add_downtime}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">
          Loading downtime data...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r">
                  {t.start_time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r">
                  {t.end_time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r">
                  {t.duration}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r">
                  {t.reason}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {downtimeData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">
                    {t.no_downtime_data}
                  </td>
                </tr>
              ) : (
                downtimeData.map((downtime, index) => {
                  const startTime = new Date(downtime.start_time);
                  const endTime = new Date(downtime.end_time);
                  const duration = endTime.getTime() - startTime.getTime();
                  const durationHours = duration / (1000 * 60 * 60);

                  return (
                    <tr key={downtime.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r">
                        <input
                          type="time"
                          value={formatTimeValue(downtime.start_time)}
                          onChange={(e) => {
                            const parsed = parseTimeValue(e.target.value);
                            handleDowntimeChange(downtime.id, 'start_time', parsed);
                          }}
                          className="w-full px-1 py-1 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs transition-all duration-200 hover:border-slate-400"
                          aria-label={`Start time for downtime ${index + 1}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r">
                        <input
                          type="time"
                          value={formatTimeValue(downtime.end_time)}
                          onChange={(e) => {
                            const parsed = parseTimeValue(e.target.value);
                            handleDowntimeChange(downtime.id, 'end_time', parsed);
                          }}
                          className="w-full px-1 py-1 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs transition-all duration-200 hover:border-slate-400"
                          aria-label={`End time for downtime ${index + 1}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r">
                        <div className="flex items-center">
                          <span className="font-medium">{durationHours.toFixed(2)} jam</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r">
                        <input
                          type="text"
                          value={downtime.problem}
                          onChange={(e) =>
                            handleDowntimeChange(downtime.id, 'problem', e.target.value)
                          }
                          className="w-full px-1 py-1 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs transition-all duration-200 hover:border-slate-400"
                          placeholder={t.enter_reason}
                          aria-label={`Problem for downtime ${index + 1}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleDeleteDowntime(downtime.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                          aria-label={`Delete downtime ${index + 1}`}
                        >
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {downtimeData.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t.total_downtime}:
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {downtimeData
                .reduce((total, downtime) => {
                  const startTime = new Date(downtime.start_time);
                  const endTime = new Date(downtime.end_time);
                  const duration = endTime.getTime() - startTime.getTime();
                  return total + duration / (1000 * 60 * 60);
                }, 0)
                .toFixed(2)}{' '}
              jam
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CcrDowntimeDataTable);
