import React, { useState, useMemo } from 'react';
import { SiloOccupancyData, SiloItem } from '../../hooks/useMainDashboardChartsData';
import { SiloVectorItem } from './SiloVectorItem';
import { List, Cylinder } from 'lucide-react';

interface SiloOccupancyWidgetProps {
  data: SiloOccupancyData;
  t?: Record<string, string>;
  language?: 'en' | 'id';
}

const getSiloPlantCategory = (silo: SiloItem): string => {
  if (silo.plant_category && silo.plant_category.trim()) {
    return silo.plant_category.trim();
  }
  const u = (silo.unit || '').toLowerCase();
  if (u.includes('220') || u.includes('2/3') || u.includes('unit 2') || u.includes('unit 3'))
    return 'Tonasa 2/3';
  if (u.includes('419') || u.includes('unit 4') || u.includes('tonasa 4')) return 'Tonasa 4';
  if (u.includes('552') || u.includes('553') || u.includes('unit 5') || u.includes('tonasa 5'))
    return 'Tonasa 5';
  return 'Tonasa 2/3';
};

export const SiloOccupancyWidget: React.FC<SiloOccupancyWidgetProps> = ({
  data,
  t = {},
  language = 'id',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'vector' | 'list'>('vector');

  const categoriesOrder = ['Tonasa 2/3', 'Tonasa 4', 'Tonasa 5'];

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500 text-rose-500 border-rose-200 dark:border-rose-800/40';
    if (pct >= 75) return 'bg-amber-500 text-amber-500 border-amber-200 dark:border-amber-800/40';
    if (pct <= 10)
      return 'bg-orange-500 text-orange-500 border-orange-200 dark:border-orange-800/40';
    return 'bg-emerald-500 text-emerald-500 border-emerald-200 dark:border-emerald-800/40';
  };

  // Group silos by plant category
  const categoryGroups = useMemo(() => {
    const map: Record<
      string,
      {
        category: string;
        silos: SiloItem[];
        totalCapacity: number;
        totalContent: number;
        occupancyPercent: number;
      }
    > = {};

    categoriesOrder.forEach((cat) => {
      map[cat] = {
        category: cat,
        silos: [],
        totalCapacity: 0,
        totalContent: 0,
        occupancyPercent: 0,
      };
    });

    data.silos.forEach((silo) => {
      const cat = getSiloPlantCategory(silo);
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          silos: [],
          totalCapacity: 0,
          totalContent: 0,
          occupancyPercent: 0,
        };
      }
      map[cat].silos.push(silo);
      map[cat].totalCapacity += silo.capacity;
      map[cat].totalContent += silo.currentContent;
    });

    Object.keys(map).forEach((cat) => {
      const g = map[cat];
      g.occupancyPercent =
        g.totalCapacity > 0 ? Math.round((g.totalContent / g.totalCapacity) * 1000) / 10 : 0;
    });

    return map;
  }, [data.silos]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    data.silos.forEach((s) => set.add(getSiloPlantCategory(s)));
    return categoriesOrder.filter((cat) => set.has(cat));
  }, [data.silos]);

  const displayedCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return availableCategories.length > 0 ? availableCategories : categoriesOrder;
    }
    return [selectedCategory];
  }, [selectedCategory, availableCategories]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 flex flex-col w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2 flex-shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 animate-pulse"></span>
            {t.silo_occupancy_title ||
              (language === 'en' ? 'Cement Silo Stock Levels' : 'Level Stok Silo Semen')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.silo_occupancy_sub ||
              (language === 'en'
                ? 'Capacity & stock availability separated by Plant Category'
                : 'Kapasitas & ketersediaan stok dipisah berdasarkan Kategori Pabrik')}
          </p>
        </div>

        {/* Controls: Plant Category Filter + View Mode Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            aria-label={language === 'en' ? 'Filter Plant Category' : 'Filter Kategori Pabrik'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[30px] transition-colors"
          >
            <option value="all">
              {language === 'en' ? 'All Plants (Separated)' : 'Semua Kategori (Terpisah)'}
            </option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
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
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white rounded-xl p-3 sm:p-3.5 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Circular Progress Gauge */}
          <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
            <svg className="w-11 h-11 transform -rotate-90">
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
            <span className="absolute text-[10px] font-black text-cyan-400">
              {Math.round(data.overallOccupancyPercent)}%
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
              {t.silo_total_occupancy ||
                (language === 'en'
                  ? 'Total Silo Occupancy (All Plants)'
                  : 'Total Keterisian Seluruh Pabrik')}
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
        </div>

        {/* Quick Plant Category KPI Summary Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {availableCategories.map((catKey) => {
            const g = categoryGroups[catKey];
            if (!g) return null;
            return (
              <div
                key={catKey}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-2 text-xs"
              >
                <span className="font-semibold text-white/90">{catKey}:</span>
                <span className="font-black text-cyan-300">{g.occupancyPercent}%</span>
                <span className="text-[10px] text-white/60">({g.silos.length} Silo)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Grouped Sections for Plant Categories (Option B) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-3.5 sm:gap-4 flex-1">
        {displayedCategories.map((catKey) => {
          const group = categoryGroups[catKey];
          if (!group || group.silos.length === 0) return null;

          // Proportional column sizing based on ACTUAL silo count:
          // Tonasa 2/3 (4 silos): 4 cols out of 10 (40%)
          // Tonasa 4 (3 silos): 3 cols out of 10 (30%)
          // Tonasa 5 (3 silos): 3 cols out of 10 (30%)
          const colSpan =
            selectedCategory !== 'all'
              ? 'lg:col-span-10'
              : catKey === 'Tonasa 2/3'
                ? 'lg:col-span-4'
                : 'lg:col-span-3';

          const gridCols =
            selectedCategory !== 'all'
              ? group.silos.length === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-3'
              : catKey === 'Tonasa 2/3'
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-3';

          const themeStyles =
            catKey === 'Tonasa 5'
              ? {
                  dot: 'bg-emerald-500',
                  badge:
                    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
                  card: 'border-emerald-200/90 dark:border-emerald-900/50',
                }
              : catKey === 'Tonasa 4'
                ? {
                    dot: 'bg-amber-500',
                    badge:
                      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                    card: 'border-amber-200/90 dark:border-amber-900/50',
                  }
                : {
                    dot: 'bg-cyan-500',
                    badge:
                      'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
                    card: 'border-cyan-200/90 dark:border-cyan-900/50',
                  };

          return (
            <div
              key={catKey}
              className={`flex flex-col bg-slate-50/40 dark:bg-slate-900/50 rounded-xl border ${themeStyles.card} shadow-xs overflow-hidden ${colSpan}`}
            >
              {/* Category Header */}
              <div className="px-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${themeStyles.dot} flex-shrink-0 animate-pulse`}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {group.category}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {group.silos.length} Silo
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 text-right">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    {group.occupancyPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    ({group.totalContent.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                    {t.unit_tons_short || 'T'})
                  </span>
                </div>
              </div>

              {/* Category Silos */}
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-center">
                {viewMode === 'vector' ? (
                  <div className={`grid ${gridCols} gap-2 sm:gap-2.5 items-stretch w-full`}>
                    {group.silos.map((silo) => (
                      <SiloVectorItem key={silo.id} silo={silo} t={t} language={language} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.silos.map((silo) => {
                      const colorClass = getStatusColor(silo.occupancyPercent);
                      return (
                        <div
                          key={silo.id}
                          className="p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/50"
                        >
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {silo.silo_name}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({silo.unit})
                              </span>
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              {silo.occupancyPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${colorClass.split(' ')[0]}`}
                              style={{ width: `${silo.occupancyPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>
                              {t.silo_stock || 'Stok:'}{' '}
                              {silo.currentContent.toLocaleString(
                                language === 'en' ? 'en-US' : 'id-ID'
                              )}{' '}
                              {t.unit_tons_short || 'T'}
                            </span>
                            <span>
                              {t.silo_capacity || 'Kapasitas:'}{' '}
                              {silo.capacity.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                              {t.unit_tons_short || 'T'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SiloOccupancyWidget;
