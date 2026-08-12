import React, { useState } from 'react';
import { SiloOccupancyData, SiloItem } from '../../hooks/useMainDashboardChartsData';

interface SiloOccupancyWidgetProps {
  data: SiloOccupancyData;
  t?: Record<string, string>;
}

export const SiloOccupancyWidget: React.FC<SiloOccupancyWidgetProps> = ({ data, t = {} }) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const availableUnits = Array.from(new Set(data.silos.map((s) => s.unit))).filter(Boolean);

  const filteredSilos =
    selectedUnit === 'all' ? data.silos : data.silos.filter((s) => s.unit === selectedUnit);

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500 text-rose-500 border-rose-200 dark:border-rose-800/40';
    if (pct >= 75) return 'bg-amber-500 text-amber-500 border-amber-200 dark:border-amber-800/40';
    if (pct <= 10)
      return 'bg-orange-500 text-orange-500 border-orange-200 dark:border-orange-800/40';
    return 'bg-emerald-500 text-emerald-500 border-emerald-200 dark:border-emerald-800/40';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            {t.silo_occupancy_title || 'Level Stok Silo Semen'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.silo_occupancy_sub || 'Kapasitas & ketersediaan stok di seluruh Silo'}
          </p>
        </div>

        {/* Unit Filter */}
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 outline-hidden focus:ring-1 focus:ring-cyan-500"
        >
          <option value="all">Semua Unit</option>
          {availableUnits.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Overall Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white rounded-xl p-3.5 mb-3 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
            Total Occupancy Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">
              {data.overallOccupancyPercent}%
            </span>
            <span className="text-xs text-slate-300">
              ({data.totalContent.toLocaleString('id-ID')} /{' '}
              {data.totalCapacity.toLocaleString('id-ID')} Ton)
            </span>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-700"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (125.6 * data.overallOccupancyPercent) / 100}
              className="text-cyan-400 transition-all duration-700"
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
      </div>

      {/* Silos List Grid */}
      <div className="flex-1 min-h-[160px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {filteredSilos.map((silo: SiloItem) => {
          const colorClass = getStatusColor(silo.occupancyPercent);
          return (
            <div
              key={silo.id}
              className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {silo.silo_name}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">({silo.unit})</span>
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {silo.occupancyPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass.split(' ')[0]}`}
                  style={{ width: `${silo.occupancyPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Stok: {silo.currentContent.toLocaleString('id-ID')} Ton</span>
                <span>Kapasitas: {silo.capacity.toLocaleString('id-ID')} Ton</span>
              </div>
            </div>
          );
        })}

        {filteredSilos.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            Tidak ada data silo untuk unit ini
          </div>
        )}
      </div>
    </div>
  );
};
