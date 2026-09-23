import React, { useState } from 'react';
import DowntimeParetoChart from '../plant_operations/DowntimeParetoChart';
import { DowntimeParetoItem } from '../../hooks/useMainDashboardChartsData';

interface DowntimeParetoWidgetProps {
  data: DowntimeParetoItem[];
  t?: Record<string, string>;
  language?: 'en' | 'id';
}

export const DowntimeParetoWidget: React.FC<DowntimeParetoWidgetProps> = ({
  data,
  t = {},
  language = 'id',
}) => {
  const [type, setType] = useState<'duration' | 'frequency'>('duration');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 flex flex-col h-full overflow-hidden">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-2.5 flex-shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
            {t.chart_pareto_title ||
              (language === 'en' ? 'Downtime Pareto Analysis' : 'Analisis Pareto Downtime')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.chart_pareto_sub ||
              (language === 'en'
                ? 'Operational shutdown causes contribution analysis'
                : 'Analisis kontribusi penyebab terhentinya operasional')}
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0">
          <button
            type="button"
            onClick={() => setType('duration')}
            aria-pressed={type === 'duration'}
            className={`min-h-[28px] sm:min-h-[30px] px-2.5 py-1 text-[10px] font-bold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-500 focus-visible:outline-none ${
              type === 'duration'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.chart_pareto_duration ||
              (language === 'en' ? 'Duration (Minutes)' : 'Durasi (Menit)')}
          </button>
          <button
            type="button"
            onClick={() => setType('frequency')}
            aria-pressed={type === 'frequency'}
            className={`min-h-[28px] sm:min-h-[30px] px-2.5 py-1 text-[10px] font-bold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-500 focus-visible:outline-none ${
              type === 'frequency'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.chart_pareto_frequency || (language === 'en' ? 'Frequency' : 'Frekuensi')}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-[260px] w-full relative">
        {data && data.length > 0 ? (
          <DowntimeParetoChart data={data} type={type} t={t} language={language} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
            {t.chart_pareto_no_data ||
              (language === 'en'
                ? 'No downtime data for this period'
                : 'Belum ada data downtime untuk periode ini')}
          </div>
        )}
      </div>
    </div>
  );
};
