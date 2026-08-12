import React, { useState } from 'react';
import DowntimeParetoChart from '../plant_operations/DowntimeParetoChart';
import { DowntimeParetoItem } from '../../hooks/useMainDashboardChartsData';

interface DowntimeParetoWidgetProps {
  data: DowntimeParetoItem[];
  t?: Record<string, string>;
}

export const DowntimeParetoWidget: React.FC<DowntimeParetoWidgetProps> = ({ data, t = {} }) => {
  const [type, setType] = useState<'duration' | 'frequency'>('duration');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {t.chart_pareto_title || 'Analisis Pareto Downtime'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.chart_pareto_sub || 'Analisis kontribusi penyebab terhentinya pabrik'}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setType('duration')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              type === 'duration'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Durasi (Menit)
          </button>
          <button
            onClick={() => setType('frequency')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              type === 'frequency'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Frekuensi
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-[260px] w-full relative">
        {data && data.length > 0 ? (
          <DowntimeParetoChart data={data} type={type} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
            Belum ada data downtime untuk periode ini
          </div>
        )}
      </div>
    </div>
  );
};
