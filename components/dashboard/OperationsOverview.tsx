import React, { useState, useMemo } from 'react';
import { UnitStatus } from '../../hooks/useDashboardData';
import { Page } from '../../types';
import { CementBallMillVector, RotaryKilnVector, VerticalRollerMillVector } from './vectors';

interface OperationsOverviewProps {
  unitStatuses: UnitStatus[];
  topDowntimes: { unit: string; issue: string; isRkc: boolean }[];
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
  language?: 'en' | 'id';
}

const getUnitCategory = (unit: UnitStatus): string => {
  if (unit.category && unit.category.trim()) return unit.category.trim();
  const u = unit.unit.toLowerCase();
  if (u.includes('220') || u.includes('320') || u.includes('2/3')) return 'Tonasa 2/3';
  if (
    u.includes('419') ||
    u.includes('420') ||
    u.includes('411') ||
    u.includes('412') ||
    u.includes('416') ||
    u.includes('unit 4')
  )
    return 'Tonasa 4';
  if (
    u.includes('552') ||
    u.includes('553') ||
    u.includes('532') ||
    u.includes('543') ||
    u.includes('unit 5')
  )
    return 'Tonasa 5';
  return 'Tonasa 4';
};

const getCategoryTheme = (category: string) => {
  if (category === 'Tonasa 5') {
    return {
      dot: 'bg-emerald-500',
      badge:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      border: 'border-emerald-200/90 dark:border-emerald-900/50',
      headerBg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
    };
  }
  if (category === 'Tonasa 4') {
    return {
      dot: 'bg-amber-500',
      badge:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      border: 'border-amber-200/90 dark:border-amber-900/50',
      headerBg: 'bg-amber-50/60 dark:bg-amber-950/30',
    };
  }
  return {
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    border: 'border-cyan-200/90 dark:border-cyan-900/50',
    headerBg: 'bg-cyan-50/60 dark:bg-cyan-950/30',
  };
};

const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  unitStatuses,
  topDowntimes,
  onNavigate,
  t,
  language = 'id',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categoriesOrder = ['Tonasa 2/3', 'Tonasa 4', 'Tonasa 5'];

  const cmUnits = useMemo(() => unitStatuses.filter((u) => !u.isRkc), [unitStatuses]);
  const rkcUnits = useMemo(() => unitStatuses.filter((u) => u.isRkc), [unitStatuses]);

  // Group CM units by plant category
  const cmGrouped = useMemo(() => {
    const map: Record<string, UnitStatus[]> = {};
    cmUnits.forEach((unit) => {
      const cat = getUnitCategory(unit);
      if (!map[cat]) map[cat] = [];
      map[cat].push(unit);
    });
    return map;
  }, [cmUnits]);

  // Group RKC units by plant category
  const rkcGrouped = useMemo(() => {
    const map: Record<string, UnitStatus[]> = {};
    rkcUnits.forEach((unit) => {
      const cat = getUnitCategory(unit);
      if (!map[cat]) map[cat] = [];
      map[cat].push(unit);
    });
    return map;
  }, [rkcUnits]);

  const cmCategories = useMemo(() => {
    if (selectedCategory !== 'all') return [selectedCategory];
    return categoriesOrder.filter((cat) => cmGrouped[cat] && cmGrouped[cat].length > 0);
  }, [selectedCategory, cmGrouped]);

  const rkcCategories = useMemo(() => {
    if (selectedCategory !== 'all') return [selectedCategory];
    return categoriesOrder.filter((cat) => rkcGrouped[cat] && rkcGrouped[cat].length > 0);
  }, [selectedCategory, rkcGrouped]);

  const filteredDowntimes = useMemo(() => {
    if (selectedCategory === 'all') return topDowntimes;
    return topDowntimes.filter((dt) => {
      const matchedUnit = unitStatuses.find((u) => u.unit === dt.unit);
      if (!matchedUnit) return true;
      return getUnitCategory(matchedUnit) === selectedCategory;
    });
  }, [topDowntimes, selectedCategory, unitStatuses]);

  const renderUnitVector = (unit: UnitStatus, type: 'cm' | 'rkc') => {
    const unitNameLower = unit.unit.toLowerCase();

    if (type === 'cm') {
      if (
        unitNameLower.includes('552') ||
        unitNameLower.includes('553') ||
        unitNameLower.includes('vrm')
      ) {
        return <VerticalRollerMillVector status={unit.status} className="w-full h-11" />;
      }
      return <CementBallMillVector status={unit.status} className="w-full h-11" />;
    }

    if (
      unitNameLower.includes('raw mill') ||
      unitNameLower.includes('rm ') ||
      unitNameLower.includes('vrm')
    ) {
      return <VerticalRollerMillVector status={unit.status} className="w-full h-11" />;
    }
    return <RotaryKilnVector status={unit.status} className="w-full h-11" />;
  };

  const UnitVectorCard: React.FC<{ unit: UnitStatus; type: 'cm' | 'rkc' }> = ({ unit, type }) => {
    const isRunning = unit.status === 'running';

    return (
      <div
        className={`
          group relative p-2.5 rounded-xl text-xs font-semibold border flex flex-col justify-between transition-all duration-300 h-full min-w-0
          ${
            isRunning
              ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm'
              : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 hover:shadow-sm'
          }
        `}
        title={`${unit.unit}: ${unit.issue || (isRunning ? t.unit_running_normal || (language === 'en' ? 'Normal Operation' : 'Operasional Normal') : t.unit_stopped || (language === 'en' ? 'Shutdown Detected' : 'Pemberhentian Terdeteksi'))}`}
      >
        {/* Card Header: Unit Name & Status Badge */}
        <div className="flex justify-between items-center w-full mb-1 gap-1">
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
            {unit.unit}
          </span>
          <span
            className={`
              inline-flex items-center gap-1 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0
              ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
              }`}
            />
            {isRunning ? t.unit_status_run || 'RUN' : t.unit_status_stop || 'STOP'}
          </span>
        </div>

        {/* Central Vector Illustration */}
        <div className="w-full my-1 flex items-center justify-center">
          {renderUnitVector(unit, type)}
        </div>

        {/* Footer: Issue or Running Status */}
        <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 w-full text-[9px]">
          {!isRunning ? (
            <p className="text-rose-600 dark:text-rose-400 font-semibold truncate leading-tight">
              {unit.issue ||
                t.unit_stopped ||
                (language === 'en' ? 'Shutdown Detected' : 'Pemberhentian Terdeteksi')}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 font-medium truncate leading-tight">
              {t.unit_running_normal ||
                (language === 'en' ? 'Normal Operation' : 'Operasional Normal')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-3 sm:gap-3.5">
      {/* Top Controls Header */}
      <div className="flex flex-wrap justify-between items-center px-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
            {language === 'en' ? 'Plant Operations Overview' : 'Ikhtisar Operasional Pabrik'}
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            ({unitStatuses.length} Total Units • Separated by Plant Category)
          </span>
        </div>

        {/* Plant Category Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            aria-label={language === 'en' ? 'Filter Plant Category' : 'Filter Kategori Pabrik'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[30px] transition-colors"
          >
            <option value="all">
              {language === 'en' ? 'All Plants (Separated)' : 'Semua Kategori (Terpisah)'}
            </option>
            {categoriesOrder.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Section: Unit Statuses (CM & RKC) Grouped by Plant Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        {/* CM Operations Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow h-full">
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/50 flex-shrink-0">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse flex-shrink-0"></span>{' '}
              {t.unit_cm_title || 'CM Operations'}
              <span className="text-[10px] font-semibold text-slate-400 font-normal">
                ({cmUnits.length} Units • 3 Plants)
              </span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('operations', 'op_dashboard')}
              className="min-h-[26px] px-2.5 py-0.5 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-tight flex-shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none transition-colors"
            >
              {t.unit_view_all || (language === 'en' ? 'VIEW ALL' : 'LIHAT SEMUA')}
            </button>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-between gap-3">
            {cmCategories.map((cat) => {
              const catUnits = cmGrouped[cat] || [];
              if (catUnits.length === 0) return null;
              const theme = getCategoryTheme(cat);
              const runningCount = catUnits.filter((u) => u.status === 'running').length;

              return (
                <div
                  key={cat}
                  className={`rounded-xl border ${theme.border} bg-slate-50/40 dark:bg-slate-900/40 overflow-hidden shadow-2xs flex-1 flex flex-col justify-between`}
                >
                  {/* Category Sub-Header */}
                  <div
                    className={`px-3 py-1.5 ${theme.headerBg} border-b ${theme.border} flex items-center justify-between flex-shrink-0`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`} />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {cat}
                      </span>
                    </div>
                    <span className="text-[9.5px] px-2 py-0.2 rounded-full font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                      {runningCount}/{catUnits.length} RUN
                    </span>
                  </div>

                  {/* Unit Cards Grid: exactly 2 units per plant in CM, so 2 equal columns */}
                  <div className="p-2.5 flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch">
                      {catUnits.map((unit) => (
                        <UnitVectorCard key={unit.id} unit={unit} type="cm" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {cmCategories.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                {t.unit_no_units || 'No units found'}
              </p>
            )}
          </div>
        </div>

        {/* RKC Operations Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow h-full">
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/50 flex-shrink-0">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></span>{' '}
              {t.unit_rkc_title || 'RKC Operations'}
              <span className="text-[10px] font-semibold text-slate-400 font-normal">
                ({rkcUnits.length} Units • 2 Plants)
              </span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('rkc_operations', 'op_dashboard')}
              className="min-h-[26px] px-2.5 py-0.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none transition-colors"
            >
              {t.unit_view_all || (language === 'en' ? 'VIEW ALL' : 'LIHAT SEMUA')}
            </button>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-between gap-3">
            {rkcCategories.map((cat) => {
              const catUnits = rkcGrouped[cat] || [];
              if (catUnits.length === 0) return null;
              const theme = getCategoryTheme(cat);
              const runningCount = catUnits.filter((u) => u.status === 'running').length;
              // Tonasa 4 has 3 units -> grid-cols-3. Tonasa 5 has 2 units -> grid-cols-2.
              const gridCols =
                catUnits.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';

              return (
                <div
                  key={cat}
                  className={`rounded-xl border ${theme.border} bg-slate-50/40 dark:bg-slate-900/40 overflow-hidden shadow-2xs flex-1 flex flex-col justify-between`}
                >
                  {/* Category Sub-Header */}
                  <div
                    className={`px-3 py-1.5 ${theme.headerBg} border-b ${theme.border} flex items-center justify-between flex-shrink-0`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`} />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {cat}
                      </span>
                    </div>
                    <span className="text-[9.5px] px-2 py-0.2 rounded-full font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                      {runningCount}/{catUnits.length} RUN
                    </span>
                  </div>

                  {/* Unit Cards Grid */}
                  <div className="p-2.5 flex-1 flex flex-col justify-center">
                    <div className={`grid ${gridCols} gap-2.5 items-stretch`}>
                      {catUnits.map((unit) => (
                        <UnitVectorCard key={unit.id} unit={unit} type="rkc" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {rkcCategories.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                {t.unit_no_units || 'No units found'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Alerts List (Live Feed Downtime) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              {t.unit_latest_issues ||
                (language === 'en' ? 'Latest Issues (Downtime)' : 'Isu Terkini (Downtime)')}
            </h3>
          </div>
          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {t.unit_live_feed || 'Live Feed'}
          </span>
        </div>

        <div className="p-2 sm:p-2.5 max-h-[160px] overflow-y-auto custom-scrollbar">
          {filteredDowntimes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredDowntimes.map((downtime, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div
                    className={`w-1 h-7 rounded-full flex-shrink-0 ${downtime.isRkc ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                        {downtime.unit}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase flex-shrink-0 ml-2">
                        {t.unit_today || (language === 'en' ? 'Today' : 'Hari Ini')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate font-medium">
                      {downtime.issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-3 text-slate-400 gap-2">
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-[11px] font-semibold">
                {t.unit_no_active_issues ||
                  (language === 'en'
                    ? 'No active downtime issues across all units.'
                    : 'Tidak ada isu downtime aktif di seluruh unit.')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
