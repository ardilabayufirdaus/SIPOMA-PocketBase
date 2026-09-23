import React, { useState } from 'react';
import { SiloOccupancyData, SiloItem } from '../../hooks/useMainDashboardChartsData';
import { SiloVectorItem } from './SiloVectorItem';
import { Layers, List, Cylinder } from 'lucide-react';

interface SiloOccupancyWidgetProps {
  data: SiloOccupancyData;
  t?: Record<string, string>;
  language?: 'en' | 'id';
}

export const SiloOccupancyWidget: React.FC<SiloOccupancyWidgetProps> = ({
  data,
  t = {},
  language = 'id',
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'vector' | 'list'>('vector');

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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-2.5 flex-shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 animate-pulse"></span>
            {t.silo_occupancy_title ||
              (language === 'en' ? 'Cement Silo Stock Levels' : 'Level Stok Silo Semen')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.silo_occupancy_sub ||
              (language === 'en'
                ? 'Capacity & stock availability across all Silos'
                : 'Kapasitas & ketersediaan stok di seluruh Silo')}
          </p>
        </div>

        {/* Controls: Unit Filter + View Mode Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Unit Filter */}
          <select
            value={selectedUnit}
            aria-label={
              t.silo_filter_unit || (language === 'en' ? 'Filter Silo Unit' : 'Filter Unit Silo')
            }
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[30px] transition-colors"
          >
            <option value="all">
              {t.silo_all_units || (language === 'en' ? 'All Units' : 'Semua Unit')}
            </option>
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode('vector')}
              aria-pressed={viewMode === 'vector'}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                viewMode === 'vector'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={
                t.silo_view_vector ||
                (language === 'en' ? 'Silo Vector View' : 'Tampilan Vektor Silo')
              }
              aria-label={
                t.silo_view_vector ||
                (language === 'en' ? 'Silo Vector View' : 'Tampilan Vektor Silo')
              }
            >
              <Cylinder className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-all focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={
                t.silo_view_list || (language === 'en' ? 'Silo List View' : 'Tampilan List Silo')
              }
              aria-label={
                t.silo_view_list || (language === 'en' ? 'Silo List View' : 'Tampilan List Silo')
              }
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white rounded-xl p-2.5 sm:p-3 mb-2.5 flex items-center justify-between shadow-xs flex-shrink-0">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
            {t.silo_total_occupancy ||
              (language === 'en' ? 'Total Occupancy Rate' : 'Tingkat Keterisian Total')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">
              {data.overallOccupancyPercent}%
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300 font-medium tabular-nums">
              ({data.totalContent.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} /{' '}
              {data.totalCapacity.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
              {t.unit_tons || (language === 'en' ? 'Tons' : 'Ton')})
            </span>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
          <svg className="w-10 h-10 sm:w-11 sm:h-11 transform -rotate-90">
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              strokeWidth="3.5"
              className="text-slate-700"
              fill="transparent"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeDasharray={113}
              strokeDashoffset={113 - (113 * Math.min(100, data.overallOccupancyPercent)) / 100}
              className="text-cyan-400 transition-all duration-700 ease-out"
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
      </div>

      {/* Dynamic Content: Vector View OR List View */}
      <div className="flex-1 min-h-0 flex flex-col justify-center">
        {viewMode === 'vector' ? (
          /* ================= VECTOR VIEW ================= */
          <div className="h-full w-full flex items-center overflow-x-auto overflow-y-hidden gap-2.5 pb-1 custom-scrollbar scroll-smooth">
            {filteredSilos.map((silo: SiloItem) => (
              <SiloVectorItem key={silo.id} silo={silo} t={t} language={language} />
            ))}

            {filteredSilos.length === 0 && (
              <div className="w-full text-center py-8 text-xs text-slate-400 italic">
                {t.silo_no_data ||
                  (language === 'en'
                    ? 'No silo data for this unit'
                    : 'Tidak ada data silo untuk unit ini')}
              </div>
            )}
          </div>
        ) : (
          /* ================= LIST VIEW ================= */
          <div className="h-full overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredSilos.map((silo: SiloItem) => {
              const colorClass = getStatusColor(silo.occupancyPercent);
              return (
                <div
                  key={silo.id}
                  className="p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors"
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

                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>
                      {t.silo_stock || (language === 'en' ? 'Stock:' : 'Stok:')}{' '}
                      {silo.currentContent.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                      {t.unit_tons || (language === 'en' ? 'Tons' : 'Ton')}
                    </span>
                    <span>
                      {t.silo_capacity || (language === 'en' ? 'Capacity:' : 'Kapasitas:')}{' '}
                      {silo.capacity.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                      {t.unit_tons || (language === 'en' ? 'Tons' : 'Ton')}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredSilos.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                {t.silo_no_data ||
                  (language === 'en'
                    ? 'No silo data for this unit'
                    : 'Tidak ada data silo untuk unit ini')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
