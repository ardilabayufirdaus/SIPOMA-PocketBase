import React from 'react';
import { CcrDowntimeData } from '../../types';
import { TimeInput24h } from '../../pages/plant_operations/components/TimeInput24h';

interface CcrDowntimeDataTableProps {
  t: Record<string, string>;
  loading: boolean;
  downtimeData: CcrDowntimeData[];
  handleDowntimeChange: (
    downtimeId: string,
    field: 'start_time' | 'end_time' | 'problem' | 'action',
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
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
          {t.ccr_downtime_data_entry_title}
        </h3>
        <button
          onClick={handleAddDowntime}
          aria-label={t.add_downtime || 'Tambah Downtime'}
          className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center justify-center gap-1.5"
        >
          <span>+</span>
          <span>{t.add_downtime}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          Loading downtime data...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 text-xs">
            <thead className="bg-slate-800 dark:bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700">
                  {t.start_time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700">
                  {t.end_time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700">
                  {t.duration}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700">
                  {t.reason}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700">
                  {t.action}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {downtimeData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-500 dark:text-slate-400 font-medium"
                  >
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
                    <tr key={downtime.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-slate-200 dark:border-slate-800 min-w-[130px]">
                        <TimeInput24h
                          value={formatTimeValue(downtime.start_time)}
                          onChange={(val) => {
                            const parsed = parseTimeValue(val);
                            handleDowntimeChange(downtime.id, 'start_time', parsed);
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-slate-200 dark:border-slate-800 min-w-[130px]">
                        <TimeInput24h
                          value={formatTimeValue(downtime.end_time)}
                          onChange={(val) => {
                            const parsed = parseTimeValue(val);
                            handleDowntimeChange(downtime.id, 'end_time', parsed);
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 font-mono">
                        <div className="flex items-center">
                          <span className="font-bold">{durationHours.toFixed(2)} jam</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={downtime.problem}
                          onChange={(e) =>
                            handleDowntimeChange(downtime.id, 'problem', e.target.value)
                          }
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                          placeholder={t.enter_reason}
                          aria-label={`Problem for downtime ${index + 1}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={downtime.action || ''}
                          onChange={(e) =>
                            handleDowntimeChange(downtime.id, 'action', e.target.value)
                          }
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                          placeholder={t.enter_action || 'Enter action'}
                          aria-label={`Action for downtime ${index + 1}`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleDeleteDowntime(downtime.id)}
                          className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">{t.total_downtime}:</span>
            <span className="text-sm font-bold text-slate-900">
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
